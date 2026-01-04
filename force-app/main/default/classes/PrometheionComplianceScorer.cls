/**
 * Calculates compliance readiness scores with Platform Cache for performance
 * Best Practice: Uses Platform Cache to reduce database queries and improve response times
 * Security: Enforces FLS with WITH SECURITY_ENFORCED, uses secure cache partitioning
 */
public with sharing class PrometheionComplianceScorer {
    private static final String CACHE_PARTITION = 'PrometheionCompliance';
    private static final Integer CACHE_TTL_SECONDS = 300; // 5 minutes
    private static final String CACHE_KEY_SCORE = 'readinessScore';

    @AuraEnabled(cacheable=true)
    public static Decimal calculateReadinessScore() {
        try {
            // Check cache first
            Decimal cachedScore = getCachedScore();
            if (cachedScore != null) {
                System.debug(LoggingLevel.FINE, 'PrometheionComplianceScorer: Returning cached score: ' + cachedScore);
                return cachedScore;
            }

            // Calculate scores
            Decimal accessScore = calculateAccessGovernanceScore();
            Decimal configScore = calculateConfigHealthScore();
            Decimal automationScore = calculateAutomationSafetyScore();
            Decimal evidenceScore = calculateEvidenceScore();

            Decimal totalScore = (accessScore + configScore + automationScore + evidenceScore) / 4;

            // Cache the result
            setCachedScore(totalScore);

            return totalScore;
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Error calculating readiness score: ' + e.getMessage() + '\nStack: ' + e.getStackTraceString());
            throw new AuraHandledException('Error calculating readiness score: ' + e.getMessage());
        }
    }

    /**
     * Get cached score from Platform Cache
     */
    private static Decimal getCachedScore() {
        try {
            Cache.OrgPartition orgPartition = Cache.Org.getPartition(CACHE_PARTITION);
            Object cachedValue = orgPartition.get(CACHE_KEY_SCORE);
            if (cachedValue != null && cachedValue instanceof Decimal) {
                return (Decimal)cachedValue;
            }
        } catch (Cache.Org.OrgCacheException e) {
            // Cache partition might not exist, log and continue
            System.debug(LoggingLevel.WARN, 'PrometheionComplianceScorer: Cache partition not found or not accessible: ' + e.getMessage());
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'PrometheionComplianceScorer: Error reading from cache: ' + e.getMessage());
        }
        return null;
    }

    /**
     * Set score in Platform Cache
     */
    private static void setCachedScore(Decimal score) {
        try {
            Cache.OrgPartition orgPartition = Cache.Org.getPartition(CACHE_PARTITION);
            orgPartition.put(CACHE_KEY_SCORE, score, CACHE_TTL_SECONDS);
            System.debug(LoggingLevel.FINE, 'PrometheionComplianceScorer: Cached score: ' + score);
        } catch (Cache.Org.OrgCacheException e) {
            // Cache partition might not exist, log and continue without caching
            System.debug(LoggingLevel.WARN, 'PrometheionComplianceScorer: Cache partition not found, score not cached: ' + e.getMessage());
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'PrometheionComplianceScorer: Error writing to cache: ' + e.getMessage());
        }
    }

    /**
     * Clear cached score (useful for testing or when data changes)
     */
    public static void clearCache() {
        try {
            Cache.OrgPartition orgPartition = Cache.Org.getPartition(CACHE_PARTITION);
            orgPartition.remove(CACHE_KEY_SCORE);
            System.debug(LoggingLevel.INFO, 'PrometheionComplianceScorer: Cache cleared');
        } catch (Exception e) {
            System.debug(LoggingLevel.WARN, 'PrometheionComplianceScorer: Error clearing cache: ' + e.getMessage());
        }
    }

    private static Decimal calculateAccessGovernanceScore() {
        // Use aggregate query for better performance
        List<AggregateResult> results = [
            SELECT COUNT(Id) total, COUNT(Description) documented
            FROM PermissionSet
            WHERE IsCustom = true
            WITH SECURITY_ENFORCED
        ];

        if (results.isEmpty()) return 50.0;

        Integer total = (Integer)results[0].get('total');
        Integer documented = (Integer)results[0].get('documented');

        if (total == 0) return 50.0;
        return (Decimal.valueOf(documented) / Decimal.valueOf(total)) * 100;
    }

    private static Decimal calculateConfigHealthScore() {
        // Use aggregate query for better performance
        Integer totalFlows = [SELECT COUNT() FROM FlowDefinitionView WHERE IsActive = true WITH SECURITY_ENFORCED];

        if (totalFlows == 0) return 75.0;

        // Simplified scoring: return baseline score for active flows
        return 75.0;
    }

    private static Decimal calculateAutomationSafetyScore() {
        // Use aggregate query for better performance
        List<AggregateResult> results = [
            SELECT COUNT(Id) total
            FROM ApexTrigger
            WHERE Status = 'Active'
            WITH SECURITY_ENFORCED
        ];

        // ApexTrigger doesn't have a Description field, so we'll use a simplified scoring
        // Return a baseline score based on trigger count (more triggers = more automation = good)

        if (results.isEmpty()) return 50.0;

        Integer total = (Integer)results[0].get('total');

        if (total == 0) return 50.0;
        // Simplified scoring: having triggers is good, so return a baseline score
        return 75.0; // Baseline score for having automation
    }

    private static Decimal calculateEvidenceScore() {
        // Check if we have recent compliance graph entries with optimized query
        // Big Objects require explicit date calculation, not date functions
        Datetime dateThreshold = Datetime.now().addDays(-30);
        List<Prometheion_Compliance_Graph__b> recentEntries = [
            SELECT Id
            FROM Prometheion_Compliance_Graph__b
            WHERE Timestamp__c >= :dateThreshold
            WITH SECURITY_ENFORCED
            ORDER BY Timestamp__c DESC
            LIMIT 1
        ];

        return recentEntries.isEmpty() ? 0.0 : 90.0;
    }
}
