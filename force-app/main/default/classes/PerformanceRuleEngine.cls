/**
 * Performance rule evaluation engine with improved error handling and validation
 * Best Practice: Validates inputs, extracts helper methods, improves error reporting
 * Security: Input validation, safe parsing, structured error handling
 */
public with sharing class PerformanceRuleEngine {
    public class EvalResult {
        @AuraEnabled
        public Boolean warning;
        @AuraEnabled
        public Boolean critical;
        @AuraEnabled
        public String message;
        @AuraEnabled
        public Integer eventsPublished;
        @AuraEnabled
        public Integer eventsFailed;
    }

    private static final Integer DEFAULT_CPU_WARN = 8000;
    private static final Integer DEFAULT_CPU_CRIT = 9000;
    private static final Integer DEFAULT_HEAP_WARN = 4500;
    private static final Integer DEFAULT_HEAP_CRIT = 5000;
    private static final Integer DEFAULT_SOQL_WARN = 90;
    private static final Integer DEFAULT_SOQL_CRIT = 100;
    private static final Integer DEFAULT_DML_WARN = 140;
    private static final Integer DEFAULT_DML_CRIT = 150;

    @AuraEnabled
    public static EvalResult evaluateAndPublish(
        LimitMetrics.GovernorStats stats,
        String contextRecordId
    ) {
        EvalResult out = new EvalResult();
        out.warning = false;
        out.critical = false;
        out.eventsPublished = 0;
        out.eventsFailed = 0;

        try {
            // Validate inputs
            if (stats == null) {
                throw new IllegalArgumentException('GovernorStats cannot be null');
            }

            // Get thresholds with safe parsing
            Thresholds thresholds = getThresholds();

            List<Performance_Alert__e> eventsToPublish = new List<Performance_Alert__e>();

            // Check all thresholds using helper method
            checkThreshold('CPU', stats.cpuMs, thresholds.cpuWarn, thresholds.cpuCrit, contextRecordId, out, eventsToPublish);
            checkThreshold('HEAP', stats.heapKb, thresholds.heapWarn, thresholds.heapCrit, contextRecordId, out, eventsToPublish);
            checkThreshold('SOQL', stats.soql, thresholds.soqlWarn, thresholds.soqlCrit, contextRecordId, out, eventsToPublish);
            checkThreshold('DML', stats.dml, thresholds.dmlWarn, thresholds.dmlCrit, contextRecordId, out, eventsToPublish);

            // Bulk publish all events at once
            if (!eventsToPublish.isEmpty()) {
                PublishResult publishResult = publishEvents(eventsToPublish);
                out.eventsPublished = publishResult.published;
                out.eventsFailed = publishResult.failed;

                if (publishResult.failed > 0) {
                    out.message = 'Evaluated stats. Published ' + publishResult.published + ' alerts, ' + publishResult.failed + ' failed.';
                } else {
                    out.message = 'Evaluated stats. Published ' + publishResult.published + ' alerts successfully.';
                }
            } else {
                out.message = 'Evaluated current governor stats against thresholds. No alerts triggered.';
            }

            return out;
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'PerformanceRuleEngine: Error in evaluateAndPublish. Error: ' + e.getMessage() + ', Stack: ' + e.getStackTraceString());
            out.message = 'Error evaluating performance: ' + e.getMessage();
            return out;
        }
    }

    /**
     * Get thresholds with safe parsing and validation
     */
    private static Thresholds getThresholds() {
        Thresholds t = new Thresholds();
        CCX_Settings__c s = null;
        try {
            s = CCX_Settings__c.getInstance();
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'CCX_Settings__c not accessible or not configured: ' + e.getMessage());
        }

        if (s != null) {
            t.cpuWarn = safeParseInteger(s.CPU_Warn__c, DEFAULT_CPU_WARN);
            t.cpuCrit = safeParseInteger(s.CPU_Crit__c, DEFAULT_CPU_CRIT);
            t.heapWarn = safeParseInteger(s.Heap_Warn__c, DEFAULT_HEAP_WARN);
            t.heapCrit = safeParseInteger(s.Heap_Crit__c, DEFAULT_HEAP_CRIT);
            t.soqlWarn = safeParseInteger(s.SOQL_Warn__c, DEFAULT_SOQL_WARN);
            t.soqlCrit = safeParseInteger(s.SOQL_Crit__c, DEFAULT_SOQL_CRIT);
            t.dmlWarn = safeParseInteger(s.DML_Warn__c, DEFAULT_DML_WARN);
            t.dmlCrit = safeParseInteger(s.DML_Crit__c, DEFAULT_DML_CRIT);
        } else {
            // Use defaults
            t.cpuWarn = DEFAULT_CPU_WARN;
            t.cpuCrit = DEFAULT_CPU_CRIT;
            t.heapWarn = DEFAULT_HEAP_WARN;
            t.heapCrit = DEFAULT_HEAP_CRIT;
            t.soqlWarn = DEFAULT_SOQL_WARN;
            t.soqlCrit = DEFAULT_SOQL_CRIT;
            t.dmlWarn = DEFAULT_DML_WARN;
            t.dmlCrit = DEFAULT_DML_CRIT;
        }

        // Validate thresholds are reasonable
        validateThresholds(t);

        return t;
    }

    /**
     * Safely parse integer with default fallback
     */
    private static Integer safeParseInteger(Decimal value, Integer defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        try {
            Integer intValue = Integer.valueOf(value);
            // Guard against negative or unreasonably large values
            if (intValue < 0 || intValue > 100000) {
                System.debug(LoggingLevel.WARN, 'PerformanceRuleEngine: Threshold value out of range: ' + intValue + ', using default: ' + defaultValue);
                return defaultValue;
            }
            return intValue;
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'PerformanceRuleEngine: Failed to parse threshold value: ' + value + ', using default: ' + defaultValue);
            return defaultValue;
        }
    }

    /**
     * Validate thresholds are in reasonable ranges
     */
    private static void validateThresholds(Thresholds t) {
        // Ensure warn < crit for all metrics
        if (t.cpuWarn >= t.cpuCrit) {
            System.debug(LoggingLevel.WARN, 'PerformanceRuleEngine: CPU warn threshold >= crit, adjusting');
            t.cpuWarn = t.cpuCrit - 1000;
        }
        if (t.heapWarn >= t.heapCrit) {
            System.debug(LoggingLevel.WARN, 'PerformanceRuleEngine: Heap warn threshold >= crit, adjusting');
            t.heapWarn = t.heapCrit - 500;
        }
        if (t.soqlWarn >= t.soqlCrit) {
            System.debug(LoggingLevel.WARN, 'PerformanceRuleEngine: SOQL warn threshold >= crit, adjusting');
            t.soqlWarn = t.soqlCrit - 10;
        }
        if (t.dmlWarn >= t.dmlCrit) {
            System.debug(LoggingLevel.WARN, 'PerformanceRuleEngine: DML warn threshold >= crit, adjusting');
            t.dmlWarn = t.dmlCrit - 10;
        }
    }

    /**
     * Check threshold and create alert event if needed
     * Extracted helper method to reduce duplication
     */
    private static void checkThreshold(
        String metric,
        Decimal value,
        Integer warnThreshold,
        Integer critThreshold,
        String contextRecordId,
        EvalResult result,
        List<Performance_Alert__e> events
    ) {
        if (value == null) {
            System.debug(LoggingLevel.WARN, 'PerformanceRuleEngine: Null value for metric: ' + metric);
            return;
        }

        // Create alert event using helper method
        Performance_Alert__e alert = createAlertEvent(metric, value, warnThreshold, critThreshold, contextRecordId);

        if (alert != null) {
            events.add(alert);
            if (value >= critThreshold) {
                result.critical = true;
            } else if (value >= warnThreshold) {
                result.warning = true;
            }
        }
    }

    /**
     * Create alert event using builder pattern to reduce duplication
     */
    private static Performance_Alert__e createAlertEvent(
        String metric,
        Decimal value,
        Integer warnThreshold,
        Integer critThreshold,
        String contextRecordId
    ) {
        if (value >= critThreshold) {
            return new Performance_Alert__e(
                Metric__c = metric,
                Value__c = value,
                Threshold__c = critThreshold,
                Context_Record__c = contextRecordId,
                Stack__c = metric + ' critical threshold exceeded: ' + value + ' >= ' + critThreshold
            );
        } else if (value >= warnThreshold) {
            return new Performance_Alert__e(
                Metric__c = metric,
                Value__c = value,
                Threshold__c = warnThreshold,
                Context_Record__c = contextRecordId,
                Stack__c = metric + ' warning threshold exceeded: ' + value + ' >= ' + warnThreshold
            );
        }
        return null;
    }

    /**
     * Publish events with improved error handling
     */
    private static PublishResult publishEvents(List<Performance_Alert__e> events) {
        PublishResult result = new PublishResult();
        result.published = 0;
        result.failed = 0;

        if (events == null || events.isEmpty()) {
            return result;
        }

        try {
            List<Database.SaveResult> results = EventBus.publish(events);

            for (Integer i = 0; i < results.size(); i++) {
                Database.SaveResult sr = results[i];
                if (sr.isSuccess()) {
                    result.published++;
                } else {
                    result.failed++;
                    String errorMsg = 'Failed to publish Performance_Alert__e for metric: ' +
                                     events[i].Metric__c + ', Errors: ';
                    for (Database.Error err : sr.getErrors()) {
                        errorMsg += err.getMessage() + ' ';
                    }
                    System.debug(LoggingLevel.ERROR, 'PerformanceRuleEngine: ' + errorMsg);
                }
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'PerformanceRuleEngine: Exception publishing events: ' + e.getMessage() + ', Stack: ' + e.getStackTraceString());
            result.failed = events.size();
        }

        return result;
    }

    /**
     * Helper class for thresholds
     */
    private class Thresholds {
        Integer cpuWarn;
        Integer cpuCrit;
        Integer heapWarn;
        Integer heapCrit;
        Integer soqlWarn;
        Integer soqlCrit;
        Integer dmlWarn;
        Integer dmlCrit;
    }

    /**
     * Helper class for publish results
     */
    private class PublishResult {
        Integer published;
        Integer failed;
    }
}
