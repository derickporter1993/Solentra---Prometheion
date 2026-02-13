# Team 2: Agent Build Prompts

> **Instructions**: Read all coding standards in CLAUDE.md first.
> Execute these agent prompts in order. Each agent builds one workstream.
> Do NOT skip agents. Each depends on patterns established by the previous one.
> After completing each agent, run `sf scanner run` and `sf apex run test` before proceeding.

## AGENT 1: WS4 — FREE HEALTH CHECK TOOL

**Package**: Separate 2GP, elaroHC namespace
**Directory**: force-app-healthcheck/main/default/
**Timeline**: Q1-Q2, Weeks 1-12
**Priority**: HIGHEST (ships first for lead generation)

### Build Order

1. ToolingApiService (shared utility)
2. DTOs (HealthCheckResult, ScanFinding, ScanRecommendation)
3. Scanner services (5 scanners)
4. ScoreAggregator
5. HealthCheckController
6. Custom Labels
7. Permission Sets
8. Feature Flag Custom Setting
9. All Apex test classes
10. LWC components (dashboard, then children)
11. LWC Jest tests
12. Metadata (app, tab, flexipage)

### Apex Classes to Build

**1. ToolingApiService.cls** (inherited sharing, force-app-healthcheck/main/default/classes/)

```apex
/**
 * Provides HTTP REST access to the Salesforce Tooling API for querying
 * SecurityHealthCheck, SecurityHealthCheckRisks, and other Tooling objects.
 *
 * SECURITY NOTE: Tooling API runs in system context. No WITH USER_MODE equivalent.
 * Caller permission validation happens in the controller layer (with sharing).
 * Tooling queries return org-wide security settings, not user record data.
 *
 * @author Elaro Team
 * @since v1.0.0 (Spring '26)
 * @group Health Check
 */
public inherited sharing class ToolingApiService {
    public static Map<String, Object> queryTooling(String query) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(URL.getOrgDomainUrl().toExternalForm()
            + '/services/data/v66.0/tooling/query/?q=' + EncodingUtil.urlEncode(query, 'UTF-8'));
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
        req.setHeader('Content-Type', 'application/json');
        Http http = new Http();
        HttpResponse res = http.send(req);
        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('Tooling API query failed: ' + res.getStatus());
        }
        return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
    }
}
```

**2. HealthCheckResult.cls** — wrapper DTO: overallScore (Integer 0-100), categoryScores (Map<String, Integer>), findings (List<ScanFinding>), recommendations (List<ScanRecommendation>), scanTimestamp (Datetime)

**3. ScanFinding.cls** — wrapper DTO: category, setting, currentValue, recommendedValue, severity (HIGH_RISK/MEDIUM_RISK/LOW_RISK), description

**4. ScanRecommendation.cls** — wrapper DTO: title, description, setupMenuPath, priority (1=critical, 2=high, 3=medium), category

**5. HealthCheckScanner.cls** (inherited sharing) — Query SecurityHealthCheck and SecurityHealthCheckRisks via Tooling API

**6. MFAComplianceScanner.cls** (inherited sharing) — Query LoginHistory for MFA adoption percentage

**7. ProfilePermissionScanner.cls** (inherited sharing) — Query PermissionSets with ModifyAllData/ViewAllData

**8. SessionSettingsScanner.cls** (inherited sharing) — Query SessionSettings via Tooling API

**9. AuditTrailScanner.cls** (inherited sharing) — Query SetupAuditTrail for high-risk changes

**10. ScoreAggregator.cls** (inherited sharing) — Weighted composite score: Health Check 40%, MFA 20%, Permissions 15%, Sessions 15%, Audit 10%

**11. HealthCheckController.cls** (with sharing) — @AuraEnabled runFullScan(), getLastScanTimestamp()

**12. HealthCheckFeatureFlags.cls** (inherited sharing) — Hierarchy Custom Setting wrapper

### Custom Labels Required

HC_ScanInProgress, HC_ScanComplete, HC_ScanFailed, HC_NoDataAvailable, HC_HighRisk, HC_MediumRisk, HC_LowRisk, HC_OverallScore, HC_MfaAdoption, HC_PermissionHygiene, HC_SessionSecurity, HC_AuditTrailRisk, HC_GoToSetup, HC_CtaTitle, HC_CtaBody, HC_CtaLink, HC_ScoreExcellent, HC_ScoreGood, HC_ScoreNeedsWork, HC_ScoreCritical, HC_UsersOnMfa, HC_FilterAll, HC_FilterHigh, HC_FilterMedium, HC_FilterLow

### LWC Components

- **healthCheckDashboard** — Main container, imperative scan call
- **healthCheckScoreGauge** — SVG radial arc gauge 0-100
- **healthCheckRiskTable** — lightning-datatable with severity filters
- **healthCheckRecommendations** — SLDS cards with Setup navigation
- **healthCheckMfaIndicator** — Circular progress ring
- **healthCheckCtaBanner** — AppExchange CTA

### Quality Gate

```bash
sf scanner run --target force-app-healthcheck --format table --severity-threshold 1
sf apex run test --target-org elaro-dev --test-level RunLocalTests --wait 10
npm run test:unit -- --testPathPattern=healthCheck
```

---

## AGENT 2: WS-CC — COMPLIANCE COMMAND CENTER

**Package**: Main Elaro 2GP
**Directory**: force-app/main/default/
**Timeline**: Q2, Weeks 13-16
**Dependency**: Team 1 Async Framework (Week 8), CMMC data model (Week 12)

### Build Order

1. Compliance_Action\_\_mdt Custom Metadata Type + 30-50 action records
2. ComplianceContextEngine.cls
3. CommandCenterController.cls
4. Custom Labels
5. LWC components (complianceCommandCenter, complianceActionCard, complianceContextSidebar, complianceNotificationFeed)
6. Test classes and Jest tests

---

## AGENT 3: WS-EM — EVENT-DRIVEN MONITORING

**Package**: Main Elaro 2GP
**Timeline**: Q2-Q3, Weeks 17-20
**Dependency**: Team 1 Async Framework for ConfigDriftDetector as CursorStep

### Platform Events

- **ComplianceAlert\_\_e**: Framework, Control_Reference, Severity, Finding_Summary, Alert_Type, Source_Record_Id
- **ConfigurationDrift\_\_e**: Change_Type, Changed_By, Changed_Object, Old_Value, New_Value, Risk_Level, Detection_Timestamp
- **BreachIndicator\_\_e**: Pattern_Name, Severity, Event_Sequence (JSON), Time_Window_Minutes, Affected_User_Id

### Core Classes

- ComplianceAlertPublisher.cls (without sharing — must publish regardless of user context)
- ConfigDriftDetector.cls (inherited sharing, implement as CursorStep or Schedulable)
- EventCorrelationEngine.cls (inherited sharing)
- BreachPatternMatcher.cls (inherited sharing)
- EventWindowService.cls (inherited sharing) — Big Object operations

### Custom Metadata

- **Correlation_Rule\_\_mdt**: Rule_Name, Event_Sequence (JSON), Time_Window_Minutes, Severity, Description, Is_Active

---

## AGENT 4: WS-AW — GUIDED ASSESSMENT WIZARDS

**Package**: Main Elaro 2GP
**Timeline**: Q3, Weeks 21-24
**Dependency**: Team 1 Rule Engine schema (Week 22), CMMC data model (Week 12)

### Custom Objects

- **Compliance_Assessment_Session\_\_c**: Session_State (JSON), Wizard_Name, Framework, Current_Stage, Current_Step, Status, Percent_Complete

### Custom Metadata

- **Assessment_Wizard_Config\_\_mdt**: Wizard_Name, Framework, Stage_Order, Step_Order, Step_Type (Auto_Scan/Manual_Attestation/Evidence_Upload/Approval/Review), Control_Reference, Help_Text, Is_Required

### LWC Components

- **assessmentWizard** — Parent, persists state to Session\_\_c
- **wizardStep** — Polymorphic based on Step_Type
- **assessmentProgressTracker** — Visual progress bar
- **crossFrameworkPrefill** — Pre-fill from prior assessments

---

## AGENT 5: WS8 — SEC CYBERSECURITY DISCLOSURE MODULE

**Package**: Main Elaro 2GP
**Timeline**: Q3, Weeks 25-32

### Custom Objects

- **Materiality_Assessment\_\_c**: Incident details, Discovery_Date, Determination_Date, Filing_Deadline (formula: +4 business days), AG_Delay fields, Qualitative impact picklists, Determination_Result, Status
- **Disclosure_Workflow\_\_c**: Form_Type (8-K/10-K), EDGAR_Filing_Number, multi-step Status
- **Board_Governance_Report\_\_c**: Annual 10-K governance reporting
- **Incident_Timeline\_\_c**: Event tracking with SLA indicators
- **Holiday\_\_c**: Business day calculation support
- **SEC_Control_Mapping\_\_c**: Junction to existing control objects

### Filing Deadline Formula

Filing_Deadline\_\_c = Determination_Date + 4 business days (excludes weekends, Holiday\_\_c checked via validation rule/flow)

### Approval Process

Multi-step declarative: CISO > Legal > CFO > CEO > Board > Filing

---

## AGENT 6: WS2 — AI GOVERNANCE MODULE MVP

**Package**: Main Elaro 2GP
**Timeline**: Q3-Q4, Weeks 29-38
**DEADLINE**: EU AI Act enforcement August 2, 2026

### Custom Objects

- **AI_System_Registry\_\_c**: System_Name, System_Type (Einstein_Prediction/Einstein_Bot/GenAI_Function/GenAI_Planner/Custom_ML), Detection_Method, Risk_Level (Unacceptable/High/Limited/Minimal per EU AI Act Annex III), Status, Use_Case_Description
- **AI_Human_Oversight_Record\_\_c**: Original_AI_Output, Human_Decision (Accept/Modify/Reject/Override), Justification, Reviewer
- **AI_Classification_Rule\_\_mdt**: Feature_Type, Use_Case_Context, Risk_Level, EU_AI_Act_Article, Rationale
- **AI_RMF_Mapping\_\_c**: RMF_Function (Govern/Map/Measure/Manage), Compliance_Status

### Core Classes

- AIDetectionEngine.cls — Metadata API listMetadata() scan for Einstein/GenAI components
- AIAuditTrailScanner.cls — SetupAuditTrail for AI-related changes
- AILicenseDetector.cls — PermissionSetAssignment for Einstein licenses
- AIRiskClassificationEngine.cls — EU AI Act Annex III classification
- AIGovernanceService.cls — IComplianceModule implementation
- AIGovernanceController.cls — Dashboard and discovery endpoints

---

## AGENT 7: WS5 — TRUST CENTER MVP

**Package**: Main Elaro 2GP
**Timeline**: Q4, Weeks 39-46

**CRITICAL SECURITY**: This module exposes data publicly via Salesforce Sites.

- NEVER expose Compliance_Finding\_\_c, Evidence\_\_c, or any PII
- ONLY expose Trust_Center_View\_\_c (materialized/aggregated data)
- Guest User gets minimal field-level access
- Every Sites page load validates shareable link expiration

### Custom Objects

- **Trust_Center_View\_\_c** (materialized view): Framework, Compliance_Percentage, Last_Audit_Date, Certification_Status, Badge_Image_URL, Is_Public
- **Trust_Center_Link\_\_c**: Link_Token (UUID), Expiration_Date, Access_Tier (Public/Email_Gated/NDA_Required), Access_Count, Is_Active

### Core Classes

- TrustCenterDataService.cls (without sharing — scheduled aggregation)
- TrustCenterLinkService.cls (inherited sharing — token management)
- TrustCenterController.cls (with sharing — internal admin)
- TrustCenterGuestController.cls (with sharing — Sites, triple-check every method)

### Sites Configuration

- Guest User Profile: ZERO access to Compliance_Finding\_\_c, Evidence\_\_c, \_\_mdt, \_\_e
- Only Trust_Center_View\_\_c read, only TrustCenterGuestController execute

---

## AGENT 8: INTEGRATION, QA & LAUNCH (Weeks 47-52)

1. Upgrade all v65.0 classes to v66.0
2. Wire Command Center to Team 1 Orchestration Engine
3. Wire Assessment Wizard auto-scan to Team 1 Rule Engine
4. Wire Event Monitoring to Team 1 Rule Engine results
5. Joint Checkmarx scan — fix ALL findings
6. End-to-end testing: CMMC, SEC, AI Gov workflows
7. Performance testing: 500+ rules, 1000+ controls
8. WCAG 2.1 AA audit
9. AppExchange security review submission
10. Documentation and listing content

### Final Quality Gates

```bash
sf scanner run --target force-app --format table --severity-threshold 1
sf scanner run --target force-app-healthcheck --format table --severity-threshold 1
sf apex run test --target-org elaro-dev --test-level RunLocalTests --wait 30
npm run test:unit
sf apex run test --target-org elaro-dev --test-level RunLocalTests --code-coverage --wait 30
```

Zero HIGH findings. 85%+ coverage per class. All Jest tests passing. WCAG 2.1 AA compliant.
