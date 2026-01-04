/**
 * Governor limit metrics with remaining limits and max values
 * Best Practice: Provides complete limit information for monitoring and headroom calculation
 * Security: Read-only access, no DML operations
 */
public with sharing class LimitMetrics {
    public class GovernorStats {
        @AuraEnabled public Integer cpuMs;
        @AuraEnabled public Integer soql;
        @AuraEnabled public Integer dml;
        @AuraEnabled public Integer heapKb;

        // Remaining limits (headroom)
        @AuraEnabled public Integer cpuMsRemaining;
        @AuraEnabled public Integer soqlRemaining;
        @AuraEnabled public Integer dmlRemaining;
        @AuraEnabled public Integer heapKbRemaining;

        // Maximum limits
        @AuraEnabled public Integer cpuMsMax;
        @AuraEnabled public Integer soqlMax;
        @AuraEnabled public Integer dmlMax;
        @AuraEnabled public Integer heapKbMax;

        // Percentage used
        @AuraEnabled public Decimal cpuPercentUsed;
        @AuraEnabled public Decimal soqlPercentUsed;
        @AuraEnabled public Decimal dmlPercentUsed;
        @AuraEnabled public Decimal heapPercentUsed;
    }

    // Standard Salesforce governor limits
    private static final Integer CPU_MAX_MS = 10000;
    private static final Integer SOQL_MAX = 100;
    private static final Integer DML_MAX = 150;
    private static final Integer HEAP_MAX_KB = 6000; // 6MB for synchronous, 12MB for async

    @AuraEnabled(cacheable=true)
    public static GovernorStats fetchGovernorStats() {
        GovernorStats g = new GovernorStats();

        // Current usage
        g.cpuMs = Limits.getCpuTime();
        g.soql = Limits.getQueries();
        g.dml = Limits.getDmlStatements();
        g.heapKb = Math.round(Limits.getHeapSize() / 1024.0);

        // Maximum limits
        g.cpuMsMax = CPU_MAX_MS;
        g.soqlMax = SOQL_MAX;
        g.dmlMax = DML_MAX;
        // Heap limit varies by context, use conservative estimate
        g.heapKbMax = HEAP_MAX_KB;

        // Remaining limits (headroom)
        g.cpuMsRemaining = Math.max(0, g.cpuMsMax - g.cpuMs);
        g.soqlRemaining = Math.max(0, g.soqlMax - g.soql);
        g.dmlRemaining = Math.max(0, g.dmlMax - g.dml);
        g.heapKbRemaining = Math.max(0, g.heapKbMax - g.heapKb);

        // Percentage used
        g.cpuPercentUsed = g.cpuMsMax > 0 ? (g.cpuMs / Decimal.valueOf(g.cpuMsMax)) * 100 : 0;
        g.soqlPercentUsed = g.soqlMax > 0 ? (g.soql / Decimal.valueOf(g.soqlMax)) * 100 : 0;
        g.dmlPercentUsed = g.dmlMax > 0 ? (g.dml / Decimal.valueOf(g.dmlMax)) * 100 : 0;
        g.heapPercentUsed = g.heapKbMax > 0 ? (g.heapKb / Decimal.valueOf(g.heapKbMax)) * 100 : 0;

        return g;
    }
}
