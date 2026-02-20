/**
 * Service layer that orchestrates compliance scans across registered framework
 * modules. Acts as the integration bridge between the Compliance Command Center
 * (WS-CC) and Team 1's Orchestration Engine ({@link ComplianceServiceFactory},
 * {@link IComplianceModule}, {@link IRiskScoringService}).
 *
 * Supports triggering full or framework-specific scans, tracking scan progress,
 * aggregating results into {@link Compliance_Score__c} records, and surfacing
 * orchestration status to the Command Center UI.
 *
 * @author Elaro Team
 * @since v1.0.0 (Spring '26)
 * @group Command Center
 * @see ComplianceServiceFactory
 * @see IComplianceModule
 * @see CommandCenterController
 * @see ComplianceContextEngine
 */
public inherited sharing class OrchestrationService {

    // ═══════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════

    /** Maximum frameworks to scan in a single synchronous transaction. */
    @TestVisible
    private static final Integer MAX_SYNC_FRAMEWORKS = 5;

    /** Scan status values. */
    public static final String STATUS_PENDING = 'PENDING';
    public static final String STATUS_IN_PROGRESS = 'IN_PROGRESS';
    public static final String STATUS_COMPLETED = 'COMPLETED';
    public static final String STATUS_FAILED = 'FAILED';
    public static final String STATUS_PARTIAL = 'PARTIAL';

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC METHODS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Triggers an orchestrated compliance scan across all supported frameworks.
     * For small framework sets (up to {@code MAX_SYNC_FRAMEWORKS}), the scan
     * runs synchronously. For larger sets, a Queueable job is enqueued.
     *
     * @return ScanResult containing the scan job ID, status, and per-framework results
     * @throws OrchestrationException if the scan cannot be started
     */
    public ScanResult triggerFullScan() {
        Set<String> frameworks = ComplianceServiceFactory.getSupportedFrameworks();
        return triggerScan(new List<String>(frameworks));
    }

    /**
     * Triggers an orchestrated compliance scan for a specific list of frameworks.
     *
     * @param frameworks List of framework codes to scan (e.g., ['SOC2', 'HIPAA'])
     * @return ScanResult containing the scan job ID, status, and per-framework results
     * @throws OrchestrationException if frameworks list is empty or contains unsupported entries
     */
    public ScanResult triggerScan(List<String> frameworks) {
        if (frameworks == null || frameworks.isEmpty()) {
            throw new OrchestrationException('At least one framework must be specified for scanning.');
        }

        // Validate all frameworks
        for (String fw : frameworks) {
            if (!ComplianceServiceFactory.isFrameworkSupported(fw)) {
                throw new OrchestrationException(
                    'Unsupported framework: ' + fw + '. Use ComplianceServiceFactory.getSupportedFrameworks() for valid options.');
            }
        }

        ScanResult result = new ScanResult();
        result.scanId = generateScanId();
        result.requestedFrameworks = frameworks;
        result.startedAt = Datetime.now();

        if (frameworks.size() <= MAX_SYNC_FRAMEWORKS) {
            // Run synchronously
            result = executeScanSync(result, frameworks);
        } else {
            // Enqueue for async processing
            result.status = STATUS_IN_PROGRESS;
            result.isAsync = true;
            if (!Test.isRunningTest()) {
                System.enqueueJob(new OrchestrationScanQueueable(result.scanId, frameworks));
            } else {
                // Run synchronously in tests
                result = executeScanSync(result, frameworks);
            }
        }

        return result;
    }

    /**
     * Retrieves the current status and results of a previously triggered scan.
     * Queries the most recent {@link Compliance_Score__c} record to determine
     * whether orchestration results are available.
     *
     * @param scanId The scan identifier returned by {@code triggerScan}
     * @return ScanProgress with status, completion percentage, and per-framework details
     */
    public ScanProgress getScanProgress(String scanId) {
        ScanProgress progress = new ScanProgress();
        progress.scanId = scanId;

        // Query the latest Compliance_Score__c for overall status
        List<Compliance_Score__c> recentScores = [
            SELECT Id, Risk_Score__c, Framework_Scores__c, Calculated_At__c
            FROM Compliance_Score__c
            WITH USER_MODE
            ORDER BY Calculated_At__c DESC
            LIMIT 1
        ];

        if (!recentScores.isEmpty()) {
            Compliance_Score__c latest = recentScores[0];
            progress.status = STATUS_COMPLETED;
            progress.completedAt = latest.Calculated_At__c;
            progress.overallRiskScore = latest.Risk_Score__c;
            progress.completionPercentage = 100;

            // Parse framework scores
            if (latest.Framework_Scores__c != null) {
                try {
                    Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(
                        latest.Framework_Scores__c
                    );
                    progress.frameworkStatuses = new Map<String, String>();
                    for (String fw : parsed.keySet()) {
                        progress.frameworkStatuses.put(fw, STATUS_COMPLETED);
                    }
                } catch (Exception e) {
                    ElaroLogger.warn('OrchestrationService.getScanProgress: Failed to parse Framework_Scores__c: ' + e.getMessage());
                }
            }
        } else {
            progress.status = STATUS_PENDING;
            progress.completionPercentage = 0;
        }

        return progress;
    }

    /**
     * Runs a single-framework scan and returns the module-level result.
     * Used for targeted re-scans from the Command Center when a user wants
     * to refresh a specific framework's compliance posture.
     *
     * @param framework The framework code to scan
     * @return FrameworkScanResult with score, gap count, and control details
     * @throws OrchestrationException if framework is unsupported or scan fails
     */
    public FrameworkScanResult scanSingleFramework(String framework) {
        if (String.isBlank(framework)) {
            throw new OrchestrationException('Framework code is required.');
        }
        if (!ComplianceServiceFactory.isFrameworkSupported(framework)) {
            throw new OrchestrationException('Unsupported framework: ' + framework);
        }

        FrameworkScanResult fsr = new FrameworkScanResult();
        fsr.framework = framework;
        fsr.scannedAt = Datetime.now();

        try {
            IRiskScoringService service = ComplianceServiceFactory.getService(framework);
            fsr.complianceScore = service.getComplianceScore();

            List<ComplianceServiceBase.Violation> violations = service.getViolations();
            fsr.violationCount = violations != null ? violations.size() : 0;

            // Count active gaps
            fsr.activeGapCount = [
                SELECT COUNT()
                FROM Compliance_Gap__c
                WHERE Framework__c = :framework
                AND Status__c NOT IN ('VERIFIED', 'ACCEPTED_RISK')
                WITH USER_MODE
            ];

            fsr.status = STATUS_COMPLETED;
            fsr.rating = ElaroConstants.getRatingFromScore(fsr.complianceScore);

        } catch (Exception e) {
            fsr.status = STATUS_FAILED;
            fsr.errorMessage = e.getMessage();
            ElaroLogger.error('OrchestrationService.scanSingleFramework: ' + framework + ' scan failed: ' + e.getMessage());
        }

        return fsr;
    }

    /**
     * Returns the last orchestration run timestamp from the most recent
     * {@link Compliance_Score__c} record.
     *
     * @return Datetime of the last scan, or null if no scans have been recorded
     */
    public Datetime getLastScanTimestamp() {
        List<Compliance_Score__c> scores = [
            SELECT Calculated_At__c
            FROM Compliance_Score__c
            WITH USER_MODE
            ORDER BY Calculated_At__c DESC
            LIMIT 1
        ];
        return scores.isEmpty() ? null : scores[0].Calculated_At__c;
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Executes the scan synchronously across specified frameworks.
     */
    @TestVisible
    private ScanResult executeScanSync(ScanResult result, List<String> frameworks) {
        result.status = STATUS_IN_PROGRESS;
        result.frameworkResults = new List<FrameworkScanResult>();

        Map<String, Object> frameworkScores = new Map<String, Object>();
        Decimal totalScore = 0;
        Integer scoredFrameworks = 0;
        Integer failedCount = 0;

        for (String fw : frameworks) {
            FrameworkScanResult fsr = scanSingleFramework(fw);
            result.frameworkResults.add(fsr);

            if (fsr.status == STATUS_COMPLETED && fsr.complianceScore != null) {
                frameworkScores.put(fw, fsr.complianceScore.intValue());
                totalScore += fsr.complianceScore;
                scoredFrameworks++;
            } else {
                failedCount++;
            }
        }

        // Calculate overall risk score (inverted: high compliance = low risk)
        Decimal averageScore = scoredFrameworks > 0 ? totalScore / scoredFrameworks : 0;
        Decimal riskScore = scoredFrameworks > 0
            ? ((100 - averageScore) / 10).setScale(1, RoundingMode.HALF_UP)
            : ElaroConstants.DEFAULT_RISK_SCORE;

        // Persist aggregated score
        persistScanResults(frameworkScores, riskScore);

        result.completedAt = Datetime.now();
        result.overallRiskScore = riskScore;
        result.overallComplianceScore = averageScore.intValue();

        if (failedCount == 0) {
            result.status = STATUS_COMPLETED;
        } else if (failedCount < frameworks.size()) {
            result.status = STATUS_PARTIAL;
        } else {
            result.status = STATUS_FAILED;
        }

        return result;
    }

    /**
     * Persists aggregated scan results as a new Compliance_Score__c record.
     */
    private void persistScanResults(Map<String, Object> frameworkScores, Decimal riskScore) {
        try {
            Compliance_Score__c scoreRecord = new Compliance_Score__c(
                Org_ID__c = UserInfo.getOrganizationId(),
                Entity_Type__c = 'Organization',
                Entity_Id__c = UserInfo.getOrganizationId(),
                Risk_Score__c = riskScore,
                Framework_Scores__c = JSON.serialize(frameworkScores),
                Calculated_At__c = Datetime.now()
            );
            insert as user scoreRecord;
        } catch (Exception e) {
            ElaroLogger.error('OrchestrationService.persistScanResults: Failed to save scan results: ' + e.getMessage());
        }
    }

    /**
     * Generates a unique scan identifier.
     */
    private String generateScanId() {
        return 'SCAN-' + String.valueOf(Datetime.now().getTime())
            + '-' + String.valueOf(Math.abs(Crypto.getRandomInteger())).left(6);
    }

    // ═══════════════════════════════════════════════════════════════
    // QUEUEABLE INNER CLASS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Queueable implementation for asynchronous multi-framework scans.
     * Used when the number of frameworks exceeds {@code MAX_SYNC_FRAMEWORKS}.
     *
     * @see OrchestrationService
     */
    public class OrchestrationScanQueueable implements Queueable {
        private String scanId;
        private List<String> frameworks;

        /**
         * Constructs a new queueable scan job.
         *
         * @param scanId The unique scan identifier
         * @param frameworks The frameworks to scan
         */
        public OrchestrationScanQueueable(String scanId, List<String> frameworks) {
            this.scanId = scanId;
            this.frameworks = frameworks;
        }

        /**
         * Executes the orchestrated scan asynchronously.
         *
         * @param context The Queueable context
         */
        public void execute(QueueableContext context) {
            try {
                OrchestrationService service = new OrchestrationService();
                ScanResult result = new ScanResult();
                result.scanId = this.scanId;
                result.requestedFrameworks = this.frameworks;
                result.startedAt = Datetime.now();

                service.executeScanSync(result, this.frameworks);

                ElaroLogger.info('OrchestrationScanQueueable: Scan ' + scanId + ' completed with status ' + result.status);
            } catch (Exception e) {
                ElaroLogger.error('OrchestrationScanQueueable: Scan ' + scanId + ' failed: ' + e.getMessage());
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // INNER DTOs
    // ═══════════════════════════════════════════════════════════════

    /**
     * Result of a full orchestrated scan across one or more frameworks.
     */
    public class ScanResult {
        /** Unique identifier for the scan. */
        @AuraEnabled public String scanId;
        /** Current scan status (PENDING, IN_PROGRESS, COMPLETED, FAILED, PARTIAL). */
        @AuraEnabled public String status;
        /** List of frameworks that were requested for scanning. */
        @AuraEnabled public List<String> requestedFrameworks;
        /** Per-framework scan results. */
        @AuraEnabled public List<FrameworkScanResult> frameworkResults;
        /** When the scan was started. */
        @AuraEnabled public Datetime startedAt;
        /** When the scan completed. */
        @AuraEnabled public Datetime completedAt;
        /** Overall risk score (0-10, lower is better). */
        @AuraEnabled public Decimal overallRiskScore;
        /** Overall compliance score (0-100, higher is better). */
        @AuraEnabled public Integer overallComplianceScore;
        /** Whether the scan was executed asynchronously. */
        @AuraEnabled public Boolean isAsync;

        /**
         * Constructs a new ScanResult with default values.
         */
        public ScanResult() {
            this.status = STATUS_PENDING;
            this.frameworkResults = new List<FrameworkScanResult>();
            this.isAsync = false;
            this.overallComplianceScore = 0;
        }
    }

    /**
     * Result of a single-framework scan.
     */
    public class FrameworkScanResult {
        /** The framework code (e.g., SOC2, HIPAA). */
        @AuraEnabled public String framework;
        /** Scan status for this framework. */
        @AuraEnabled public String status;
        /** Compliance score (0-100). */
        @AuraEnabled public Decimal complianceScore;
        /** Number of violations found. */
        @AuraEnabled public Integer violationCount;
        /** Number of active (non-verified/accepted) gaps. */
        @AuraEnabled public Integer activeGapCount;
        /** Compliance rating derived from score. */
        @AuraEnabled public String rating;
        /** When this framework was scanned. */
        @AuraEnabled public Datetime scannedAt;
        /** Error message if scan failed. */
        @AuraEnabled public String errorMessage;

        /**
         * Constructs a new FrameworkScanResult with default values.
         */
        public FrameworkScanResult() {
            this.violationCount = 0;
            this.activeGapCount = 0;
        }
    }

    /**
     * Progress tracker for an in-flight or completed scan.
     */
    public class ScanProgress {
        /** The scan identifier. */
        @AuraEnabled public String scanId;
        /** Current status. */
        @AuraEnabled public String status;
        /** Percentage of frameworks scanned (0-100). */
        @AuraEnabled public Integer completionPercentage;
        /** When the scan completed (null if still in progress). */
        @AuraEnabled public Datetime completedAt;
        /** Overall risk score from the completed scan. */
        @AuraEnabled public Decimal overallRiskScore;
        /** Per-framework status map. */
        @AuraEnabled public Map<String, String> frameworkStatuses;

        /**
         * Constructs a new ScanProgress with default values.
         */
        public ScanProgress() {
            this.completionPercentage = 0;
            this.frameworkStatuses = new Map<String, String>();
        }
    }

    /**
     * Exception class for orchestration errors.
     */
    public class OrchestrationException extends Exception {}
}
