/**
 * SOC2IncidentResponseService
 *
 * Handles SOC2 CC7.x incident management controls.
 * Manages security incident lifecycle, escalation, and reporting.
 *
 * @author Prometheion
 * @version 1.0
 */
public with sharing class SOC2IncidentResponseService extends ComplianceServiceBase implements IBreachNotificationService {

    // Incident SLA thresholds (in hours)
    private static final Integer CRITICAL_RESPONSE_SLA = 1;
    private static final Integer HIGH_RESPONSE_SLA = 4;
    private static final Integer MEDIUM_RESPONSE_SLA = 24;
    private static final Integer LOW_RESPONSE_SLA = 72;

    /**
     * Get framework name
     */
    public override String getFrameworkName() {
        return 'SOC2';
    }

    /**
     * Get framework score multiplier
     */
    protected override Decimal getFrameworkMultiplier() {
        return 1.0;
    }

    /**
     * Evaluate SOC2 incident response controls
     */
    protected override List<ComplianceServiceBase.InternalViolation> evaluateControls() {
        List<ComplianceServiceBase.InternalViolation> violations = new List<ComplianceServiceBase.InternalViolation>();

        // Convert from standalone Violation to InternalViolation
        violations.addAll(evaluateIncidentDetection());
        violations.addAll(evaluateIncidentResponse());
        violations.addAll(evaluateIncidentRecovery());

        return violations;
    }

    // ========== IBreachNotificationService Implementation ==========

    /**
     * Assess a potential breach incident
     */
    public BreachNotificationTypes.BreachAssessment assessBreach(BreachNotificationTypes.BreachAssessmentRequest request) {
        BreachNotificationTypes.BreachAssessment assessment = new BreachNotificationTypes.BreachAssessment();

        // Calculate risk score
        Decimal riskScore = calculateBreachRiskScore(request);

        // Determine severity
        String severity;
        if (riskScore >= 9.0) {
            severity = 'Critical';
        } else if (riskScore >= 7.0) {
            severity = 'High';
        } else if (riskScore >= 5.0) {
            severity = 'Medium';
        } else {
            severity = 'Low';
        }

        // Create incident record (using HIPAA_Breach__c as SOC2 incident object)
        HIPAA_Breach__c incident = new HIPAA_Breach__c(
            Breach_Type__c = request.incidentType,
            Description__c = request.description,
            Risk_Level__c = severity,
            Status__c = 'Open',
            Discovery_Date__c = request.discoveryDate != null ? Date.valueOf(request.discoveryDate.date()) : Date.today(),
            Records_Affected__c = request.recordsAffected
        );

        if (Schema.sObjectType.HIPAA_Breach__c.isCreateable()) {
            insert incident;
        }

        // Populate assessment
        assessment.breachId = incident.Id;
        assessment.riskLevel = severity;
        assessment.riskScore = riskScore;
        assessment.framework = 'SOC2';

        // Determine notification requirements
        assessment.notificationRequired = riskScore >= 7.0;
        assessment.notificationTypes = new List<String>();
        if (assessment.notificationRequired) {
            assessment.notificationTypes.add('INTERNAL_STAKEHOLDERS');
            if (riskScore >= 9.0) {
                assessment.notificationTypes.add('MANAGEMENT');
                assessment.notificationTypes.add('AUDITOR');
            }
        }

        // Set deadline based on severity
        Integer responseDays = severity == 'Critical' ? 1 : severity == 'High' ? 3 : 7;
        assessment.notificationDeadline = DateTime.now().addDays(responseDays);

        // Generate analysis
        assessment.analysis = generateBreachAnalysis(request, riskScore);

        // Mitigation steps
        assessment.mitigationSteps = generateMitigationSteps(request.incidentType);

        logAuditEntry('BREACH_ASSESSED', 'Assessed breach incident with risk score ' + riskScore, incident.Id);

        return assessment;
    }

    /**
     * Create breach notification
     */
    public Id createNotification(Id breachId, String notificationType) {
        // For SOC2, we log the notification as evidence
        HIPAA_Breach__c incident = [
            SELECT Id, Name, Breach_Type__c, Risk_Level__c
            FROM HIPAA_Breach__c
            WHERE Id = :breachId
            WITH SECURITY_ENFORCED
        ];

        String evidenceData = JSON.serialize(new Map<String, Object>{
            'incidentId' => breachId,
            'incidentName' => incident.Name,
            'notificationType' => notificationType,
            'notificationDate' => DateTime.now(),
            'notifiedBy' => UserInfo.getUserId()
        });

        return createEvidence('INCIDENT_NOTIFICATION',
            notificationType + ' notification sent for incident ' + incident.Name,
            evidenceData, 'SOC2-CC7.3');
    }

    /**
     * Get notification deadline
     */
    public DateTime getNotificationDeadline(Id breachId) {
        HIPAA_Breach__c incident = [
            SELECT Discovery_Date__c, Risk_Level__c
            FROM HIPAA_Breach__c
            WHERE Id = :breachId
            WITH SECURITY_ENFORCED
        ];

        Integer responseDays;
        if (incident.Risk_Level__c == 'Critical') {
            responseDays = 1;
        } else if (incident.Risk_Level__c == 'High') {
            responseDays = 3;
        } else {
            responseDays = 7;
        }

        return DateTime.newInstance(incident.Discovery_Date__c.addDays(responseDays), Time.newInstance(0, 0, 0, 0));
    }

    /**
     * Get notification status
     */
    public BreachNotificationTypes.NotificationStatus getNotificationStatus(Id breachId) {
        BreachNotificationTypes.NotificationStatus status = new BreachNotificationTypes.NotificationStatus();
        status.breachId = breachId;

        HIPAA_Breach__c incident = [
            SELECT Id, Discovery_Date__c, Risk_Level__c, Status__c
            FROM HIPAA_Breach__c
            WHERE Id = :breachId
            WITH SECURITY_ENFORCED
        ];

        status.deadline = getNotificationDeadline(breachId);
        status.deadlineMet = incident.Status__c == 'Closed'
            ? (DateTime.now() <= status.deadline)
            : (DateTime.now() <= status.deadline);

        // Check for notification evidence
        List<Compliance_Evidence__c> notifications = [
            SELECT Evidence_Type__c, Evidence_Date__c, Description__c
            FROM Compliance_Evidence__c
            WHERE Framework__c = 'SOC2'
            AND Evidence_Type__c = 'INCIDENT_NOTIFICATION'
            WITH SECURITY_ENFORCED
        ];
        
        // Filter by breachId in Description__c in Apex (can't filter LongTextArea in SOQL)
        for (Integer i = notifications.size() - 1; i >= 0; i--) {
            if (notifications[i].Description__c == null || !notifications[i].Description__c.contains(breachId)) {
                notifications.remove(i);
            }
        }

        status.regulatorNotified = false;
        status.individualsNotified = false;
        status.mediaNotified = false;

        for (Compliance_Evidence__c ev : notifications) {
            if (ev.Description__c.contains('MANAGEMENT') || ev.Description__c.contains('AUDITOR')) {
                status.regulatorNotified = true;
                status.regulatorNotificationDate = ev.Evidence_Date__c;
            }
            if (ev.Description__c.contains('INTERNAL_STAKEHOLDERS')) {
                status.individualsNotified = true;
                status.individualsNotificationDate = ev.Evidence_Date__c;
            }
        }

        status.overallStatus = incident.Status__c;

        return status;
    }

    /**
     * Generate breach report
     */
    public Id generateBreachReport(Id breachId) {
        HIPAA_Breach__c incident = [
            SELECT Id, Name, Breach_Type__c, Description__c, Risk_Level__c, Status__c,
                   Discovery_Date__c, Records_Affected__c
            FROM HIPAA_Breach__c
            WHERE Id = :breachId
            WITH SECURITY_ENFORCED
        ];

        String report = generateIncidentReportContent(incident);

        ContentVersion cv = new ContentVersion(
            Title = 'Incident_Report_' + incident.Name,
            PathOnClient = 'Incident_Report_' + incident.Name + '.md',
            VersionData = Blob.valueOf(report),
            Origin = 'H'
        );
        PrometheionSecurityUtils.validateCRUDAccess('ContentVersion', PrometheionSecurityUtils.DmlOperation.DML_INSERT);
        insert cv;

        cv = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id WITH SECURITY_ENFORCED];

        logAuditEntry('REPORT_GENERATED', 'Generated incident report for ' + incident.Name, cv.ContentDocumentId);

        return cv.ContentDocumentId;
    }

    /**
     * Get open breaches
     */
    public List<BreachNotificationTypes.BreachSummary> getOpenBreaches() {
        List<BreachNotificationTypes.BreachSummary> summaries = new List<BreachNotificationTypes.BreachSummary>();

        List<HIPAA_Breach__c> incidents = [
            SELECT Id, Name, Breach_Type__c, Risk_Level__c, Status__c,
                   Discovery_Date__c, Records_Affected__c
            FROM HIPAA_Breach__c
            WHERE Status__c NOT IN ('RESOLVED', 'CLOSED')
            WITH SECURITY_ENFORCED
            ORDER BY Risk_Level__c, Discovery_Date__c DESC
        ];

        for (HIPAA_Breach__c inc : incidents) {
            BreachNotificationTypes.BreachSummary summary = new BreachNotificationTypes.BreachSummary();
            summary.breachId = inc.Id;
            summary.incidentType = inc.Breach_Type__c;
            summary.severity = inc.Risk_Level__c;
            summary.recordsAffected = inc.Records_Affected__c != null ? inc.Records_Affected__c.intValue() : 0;
            summary.discoveryDate = DateTime.newInstance(inc.Discovery_Date__c, Time.newInstance(0, 0, 0, 0));
            summary.notificationDeadline = getNotificationDeadline(inc.Id);
            summary.status = inc.Status__c;
            summary.framework = 'SOC2';
            summary.riskScore = getSeverityRiskScore(inc.Risk_Level__c);
            summaries.add(summary);
        }

        return summaries;
    }

    /**
     * Get breach metrics
     */
    public BreachNotificationTypes.BreachMetrics getBreachMetrics(Integer daysBack) {
        BreachNotificationTypes.BreachMetrics metrics = new BreachNotificationTypes.BreachMetrics();

        Date cutoffDate = Date.today().addDays(-daysBack);

        List<HIPAA_Breach__c> incidents = [
            SELECT Id, Risk_Level__c, Breach_Type__c, Status__c,
                   Discovery_Date__c, Records_Affected__c
            FROM HIPAA_Breach__c
            WHERE Discovery_Date__c >= :cutoffDate
            WITH SECURITY_ENFORCED
        ];

        metrics.totalBreaches = incidents.size();
        metrics.openBreaches = 0;
        metrics.closedBreaches = 0;
        metrics.deadlinesMet = 0;
        metrics.deadlinesMissed = 0;
        metrics.totalRecordsAffected = 0;
        metrics.breachesBySeverity = new Map<String, Integer>();
        metrics.breachesByType = new Map<String, Integer>();

        Decimal totalResolutionDays = 0;
        Integer resolvedCount = 0;

        for (HIPAA_Breach__c inc : incidents) {
            // Status counts
            if (inc.Status__c == 'Closed') {
                metrics.closedBreaches++;

                // Calculate resolution time (using Status__c as proxy for resolution)
                if (inc.Discovery_Date__c != null) {
                    // Approximate resolution time based on discovery date
                    totalResolutionDays += 7; // Default estimate
                    resolvedCount++;

                    // Check deadline
                    DateTime deadline = getNotificationDeadline(inc.Id);
                    if (DateTime.now() <= deadline) {
                        metrics.deadlinesMet++;
                    } else {
                        metrics.deadlinesMissed++;
                    }
                }
            } else {
                metrics.openBreaches++;
            }

            // Affected records
            if (inc.Records_Affected__c != null) {
                metrics.totalRecordsAffected += inc.Records_Affected__c.intValue();
            }

            // By severity
            String severity = inc.Risk_Level__c != null ? inc.Risk_Level__c : 'UNKNOWN';
            if (!metrics.breachesBySeverity.containsKey(severity)) {
                metrics.breachesBySeverity.put(severity, 0);
            }
            metrics.breachesBySeverity.put(severity, metrics.breachesBySeverity.get(severity) + 1);

            // By type
            String incType = inc.Breach_Type__c != null ? inc.Breach_Type__c : 'UNKNOWN';
            if (!metrics.breachesByType.containsKey(incType)) {
                metrics.breachesByType.put(incType, 0);
            }
            metrics.breachesByType.put(incType, metrics.breachesByType.get(incType) + 1);
        }

        metrics.averageResolutionDays = resolvedCount > 0 ?
            (totalResolutionDays / resolvedCount).setScale(2) : 0;

        return metrics;
    }

    // ========== Static Public Methods ==========

    /**
     * Create a new security incident
     * @param request Incident request details
     * @return Created incident Id
     */
    @AuraEnabled
    public static Id createIncident(IncidentRequest request) {
        SOC2IncidentResponseService service = new SOC2IncidentResponseService();

        BreachNotificationTypes.BreachAssessmentRequest assessmentReq = new BreachNotificationTypes.BreachAssessmentRequest();
        assessmentReq.incidentType = request.incidentType;
        assessmentReq.description = request.description;
        assessmentReq.recordsAffected = request.recordsAffected;
        assessmentReq.discoveryDate = DateTime.now();

        BreachNotificationTypes.BreachAssessment assessment = service.assessBreach(assessmentReq);
        return assessment.breachId;
    }

    /**
     * Escalate an incident
     */
    @AuraEnabled
    public static void escalateIncident(Id incidentId, String reason) {
        HIPAA_Breach__c incident = [
            SELECT Id, Risk_Level__c, Status__c
            FROM HIPAA_Breach__c
            WHERE Id = :incidentId
            WITH SECURITY_ENFORCED
        ];

        // Escalate severity
        if (incident.Risk_Level__c == 'LOW') {
            incident.Risk_Level__c = 'MEDIUM';
        } else if (incident.Risk_Level__c == 'MEDIUM') {
            incident.Risk_Level__c = 'HIGH';
        } else if (incident.Risk_Level__c == 'HIGH') {
            incident.Risk_Level__c = 'CRITICAL';
        }

        update incident;

        SOC2IncidentResponseService service = new SOC2IncidentResponseService();
        service.logAuditEntry('INCIDENT_ESCALATED', 'Escalated incident to ' + incident.Risk_Level__c + '. Reason: ' + reason, incidentId);
    }

    /**
     * Resolve an incident
     */
    @AuraEnabled
    public static void resolveIncident(Id incidentId, String resolution) {
        HIPAA_Breach__c incident = [
            SELECT Id, Status__c
            FROM HIPAA_Breach__c
            WHERE Id = :incidentId
            WITH SECURITY_ENFORCED
        ];

        incident.Status__c = 'Closed';
        // Note: Resolution__c and Resolved_Date__c fields don't exist on HIPAA_Breach__c
        // Resolution details should be stored in Description__c or a custom field

        update incident;

        SOC2IncidentResponseService service = new SOC2IncidentResponseService();
        service.logAuditEntry('INCIDENT_RESOLVED', 'Resolved incident: ' + resolution, incidentId);
    }

    /**
     * Get open incidents by severity
     */
    @AuraEnabled(cacheable=false)
    public static List<HIPAA_Breach__c> getOpenIncidents(String severity) {
        String query = 'SELECT Id, Name, Breach_Type__c, Risk_Level__c, Status__c, ' +
                       'Discovery_Date__c, Records_Affected__c, Description__c ' +
                       'FROM HIPAA_Breach__c ' +
                       'WHERE Status__c NOT IN (\'RESOLVED\', \'CLOSED\') ';

        if (String.isNotBlank(severity)) {
            query += 'AND Risk_Level__c = :severity ';
        }

        query += 'WITH SECURITY_ENFORCED ORDER BY Risk_Level__c, Discovery_Date__c DESC LIMIT 200';

        return Database.query(query);
    }

    /**
     * Get incident metrics
     */
    @AuraEnabled(cacheable=false)
    public static IncidentMetrics getIncidentMetrics(Integer daysBack) {
        SOC2IncidentResponseService service = new SOC2IncidentResponseService();
        BreachNotificationTypes.BreachMetrics breachMetrics = service.getBreachMetrics(daysBack);

        IncidentMetrics metrics = new IncidentMetrics();
        metrics.totalIncidents = breachMetrics.totalBreaches;
        metrics.openIncidents = breachMetrics.openBreaches;
        metrics.resolvedIncidents = breachMetrics.closedBreaches;
        metrics.mttrDays = breachMetrics.averageResolutionDays;
        metrics.bySeverity = breachMetrics.breachesBySeverity;
        metrics.byType = breachMetrics.breachesByType;

        return metrics;
    }

    // ========== Private Helper Methods ==========

    private List<ComplianceServiceBase.InternalViolation> evaluateIncidentDetection() {
        List<ComplianceServiceBase.InternalViolation> violations = new List<ComplianceServiceBase.InternalViolation>();

        // Check for incidents without proper detection documentation
        // Note: Description__c is LongTextArea and can't be filtered in SOQL
        List<HIPAA_Breach__c> allOpenIncidents = [
            SELECT Id, Description__c
            FROM HIPAA_Breach__c
            WHERE Status__c != 'Closed'
            WITH SECURITY_ENFORCED
        ];
        
        Integer undocumentedIncidents = 0;
        for (HIPAA_Breach__c inc : allOpenIncidents) {
            if (String.isBlank(inc.Description__c)) {
                undocumentedIncidents++;
            }
        }

        if (undocumentedIncidents > 0) {
            ComplianceServiceBase.InternalViolation v = new ComplianceServiceBase.InternalViolation(
                'Undocumented Incidents',
                undocumentedIncidents + ' incidents lack proper documentation',
                'MEDIUM',
                'SOC2-CC7.2',
                'Add detailed descriptions to all security incidents',
                5.5
            );
            violations.add(v);
        }

        return violations;
    }

    private List<ComplianceServiceBase.InternalViolation> evaluateIncidentResponse() {
        List<ComplianceServiceBase.InternalViolation> violations = new List<ComplianceServiceBase.InternalViolation>();

        // Check for incidents exceeding SLA
        List<HIPAA_Breach__c> openIncidents = [
            SELECT Id, Risk_Level__c, Discovery_Date__c
            FROM HIPAA_Breach__c
            WHERE Status__c != 'Closed'
            WITH SECURITY_ENFORCED
        ];

        Integer slaBreaches = 0;
        for (HIPAA_Breach__c inc : openIncidents) {
            Integer slaHours = getSLAHours(inc.Risk_Level__c);
            DateTime slaDeadline = DateTime.newInstance(inc.Discovery_Date__c, Time.newInstance(0, 0, 0, 0)).addHours(slaHours);
            if (DateTime.now() > slaDeadline) {
                slaBreaches++;
            }
        }

        if (slaBreaches > 0) {
            ComplianceServiceBase.InternalViolation v = new ComplianceServiceBase.InternalViolation(
                'SLA Breaches',
                slaBreaches + ' incidents have exceeded their response SLA',
                'HIGH',
                'SOC2-CC7.3',
                'Prioritize and resolve overdue incidents immediately',
                8.0
            );
            violations.add(v);
        }

        return violations;
    }

    private List<ComplianceServiceBase.InternalViolation> evaluateIncidentRecovery() {
        List<ComplianceServiceBase.InternalViolation> violations = new List<ComplianceServiceBase.InternalViolation>();

        // Check for resolved incidents without root cause
        Integer noRootCause = [
            SELECT COUNT()
            FROM HIPAA_Breach__c
            WHERE Status__c = 'Closed'
            WITH SECURITY_ENFORCED
        ];

        if (noRootCause > 0) {
            ComplianceServiceBase.InternalViolation v = new ComplianceServiceBase.InternalViolation(
                'Missing Root Cause Analysis',
                noRootCause + ' resolved incidents lack root cause analysis',
                'MEDIUM',
                'SOC2-CC7.4',
                'Complete root cause analysis for all resolved incidents',
                5.0
            );
            violations.add(v);
        }

        return violations;
    }

    private Decimal calculateBreachRiskScore(BreachNotificationTypes.BreachAssessmentRequest request) {
        Decimal score = 5.0;

        // Records affected
        if (request.recordsAffected != null) {
            if (request.recordsAffected > 10000) {
                score += 3.0;
            } else if (request.recordsAffected > 1000) {
                score += 2.0;
            } else if (request.recordsAffected > 100) {
                score += 1.0;
            }
        }

        // Data types
        if (request.dataTypesExposed != null) {
            for (String dataType : request.dataTypesExposed) {
                if (dataType.containsIgnoreCase('PHI') || dataType.containsIgnoreCase('SSN') ||
                    dataType.containsIgnoreCase('Financial')) {
                    score += 1.5;
                }
            }
        }

        // Incident type
        if (request.incidentType == 'DATA_BREACH' || request.incidentType == 'UNAUTHORIZED_ACCESS') {
            score += 1.0;
        }

        // Encryption
        if (request.encryptionInPlace != null && request.encryptionInPlace) {
            score -= 1.0;
        }

        return Math.min(Math.max(score, 1.0), 10.0);
    }

    private Integer getSLAHours(String riskLevel) {
        if (riskLevel == 'Critical') return CRITICAL_RESPONSE_SLA;
        if (riskLevel == 'High') return HIGH_RESPONSE_SLA;
        if (riskLevel == 'Medium') return MEDIUM_RESPONSE_SLA;
        return LOW_RESPONSE_SLA;
    }

    private Decimal getSeverityRiskScore(String riskLevel) {
        if (riskLevel == 'Critical') return 9.5;
        if (riskLevel == 'High') return 7.5;
        if (riskLevel == 'Medium') return 5.5;
        return 3.5;
    }

    private String generateBreachAnalysis(BreachNotificationTypes.BreachAssessmentRequest request, Decimal riskScore) {
        String analysis = 'Incident Type: ' + request.incidentType + '\n';
        analysis += 'Risk Score: ' + riskScore + '/10\n';
        analysis += 'Records Affected: ' + (request.recordsAffected != null ? String.valueOf(request.recordsAffected) : 'Unknown') + '\n';
        if (request.dataTypesExposed != null && !request.dataTypesExposed.isEmpty()) {
            analysis += 'Data Types: ' + String.join(request.dataTypesExposed, ', ') + '\n';
        }
        return analysis;
    }

    private List<String> generateMitigationSteps(String incidentType) {
        List<String> steps = new List<String>();
        steps.add('1. Contain the incident and prevent further damage');
        steps.add('2. Preserve evidence for investigation');
        steps.add('3. Notify relevant stakeholders per escalation matrix');
        steps.add('4. Investigate root cause');
        steps.add('5. Implement remediation measures');
        steps.add('6. Document lessons learned');
        steps.add('7. Update security controls as needed');
        return steps;
    }

    private String generateIncidentReportContent(HIPAA_Breach__c incident) {
        String report = '# Security Incident Report\n\n';
        report += '**Incident ID:** ' + incident.Name + '\n';
        report += '**Type:** ' + incident.Breach_Type__c + '\n';
        report += '**Severity:** ' + incident.Risk_Level__c + '\n';
        report += '**Status:** ' + incident.Status__c + '\n\n';

        report += '## Timeline\n\n';
        report += '- **Detected:** ' + (incident.Discovery_Date__c != null ? String.valueOf(incident.Discovery_Date__c) : 'N/A') + '\n';
        report += '- **Status:** ' + (incident.Status__c != null ? incident.Status__c : 'Unknown') + '\n\n';

        report += '## Description\n\n';
        report += (incident.Description__c != null ? incident.Description__c : 'No description provided') + '\n\n';

        report += '## Impact\n\n';
        report += '- **Records Affected:** ' + (incident.Records_Affected__c != null ? String.valueOf(incident.Records_Affected__c.intValue()) : 'Unknown') + '\n\n';

        report += '## Analysis\n\n';
        report += (incident.Description__c != null ? incident.Description__c : 'Pending analysis') + '\n\n';

        report += '---\n';
        report += '*Report generated: ' + DateTime.now().format() + '*\n';

        return report;
    }

    // ========== Inner Classes ==========

    public class IncidentRequest {
        @AuraEnabled public String incidentType;
        @AuraEnabled public String description;
        @AuraEnabled public Integer recordsAffected;
        @AuraEnabled public List<String> dataTypes;
    }

    public class IncidentMetrics {
        @AuraEnabled public Integer totalIncidents;
        @AuraEnabled public Integer openIncidents;
        @AuraEnabled public Integer resolvedIncidents;
        @AuraEnabled public Decimal mttrDays;
        @AuraEnabled public Map<String, Integer> bySeverity;
        @AuraEnabled public Map<String, Integer> byType;
    }
}
