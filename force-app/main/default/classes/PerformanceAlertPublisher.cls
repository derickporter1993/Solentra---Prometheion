/**
 * Performance Alert Publisher with improved error handling
 * Best Practice: Validates inputs, provides detailed error messages, structured logging
 * Security: Input validation, secure error handling
 */
public with sharing class PerformanceAlertPublisher {
    @AuraEnabled
    public static void publish(String metric, Decimal value, Decimal threshold, String contextRecordId, String stack) {
        try {
            // Validate inputs
            if (String.isBlank(metric)) {
                throw new IllegalArgumentException('Metric cannot be blank');
            }
            if (value == null) {
                throw new IllegalArgumentException('Value cannot be null');
            }
            if (threshold == null) {
                throw new IllegalArgumentException('Threshold cannot be null');
            }

            // Truncate stack trace if too long (Platform Event field limits)
            String safeStack = String.isNotBlank(stack) && stack.length() > 32768
                ? stack.substring(0, 32765) + '...'
                : stack;

            Performance_Alert__e evt = new Performance_Alert__e(
                Metric__c = metric,
                Value__c = value,
                Threshold__c = threshold,
                Context_Record__c = contextRecordId,
                Stack__c = safeStack
            );

            Database.SaveResult sr = EventBus.publish(evt);
            if (!sr.isSuccess()) {
                String errorMsg = 'Failed to publish Performance_Alert__e for metric: ' + metric;
                for (Database.Error err : sr.getErrors()) {
                    errorMsg += '. Error: ' + err.getMessage() + ' (' + err.getStatusCode() + ')';
                }
                System.debug(LoggingLevel.ERROR, 'PerformanceAlertPublisher: ' + errorMsg);
                throw new AuraHandledException(errorMsg);
            }
        } catch (IllegalArgumentException e) {
            System.debug(LoggingLevel.ERROR, 'PerformanceAlertPublisher: Validation error: ' + e.getMessage());
            throw new AuraHandledException('Invalid input: ' + e.getMessage());
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'PerformanceAlertPublisher: Unexpected error: ' + e.getMessage() + ', Stack: ' + e.getStackTraceString());
            throw new AuraHandledException('Failed to publish alert: ' + e.getMessage());
        }
    }
}
