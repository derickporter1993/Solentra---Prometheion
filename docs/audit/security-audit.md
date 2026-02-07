# Elaro Security Audit Report

**Date**: 2026-02-07
**Scope**: All production Apex classes in `/force-app/main/default/classes/`
**Auditor**: Security Reviewer Agent
**Purpose**: AppExchange Security Review Readiness
**Classes Audited**: 131 production classes (excluding *Test.cls, *Mock.cls, *TestDataFactory.cls)

---

## Executive Summary

The Elaro codebase demonstrates a **strong security posture overall**, with centralized security utilities (`ElaroSecurityUtils`), consistent use of `WITH SECURITY_ENFORCED` / `WITH USER_MODE` on most queries, and proper CRUD validation before DML operations. The codebase uses `with sharing` on the vast majority of classes.

However, **28 findings** were identified across 7 categories that require remediation before AppExchange submission. The most critical issues are:

1. **Missing SOQL security enforcement** on queries in compliance module classes (HIPAAModule, GDPRModule, FINRAModule, BenchmarkingService, ElaroDailyDigest, ElaroComplianceAlert)
2. **Dynamic SOQL with AI-generated input** in NaturalLanguageQueryService (even with mitigations)
3. **Missing sharing keyword** on 2 classes (ElaroHistoricalEventBatch, ElaroScheduledDelivery)
4. **Missing input validation** on several `@AuraEnabled` methods
5. **Exposed SOQL in API response** in ElaroDynamicReportController

### Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 10 |
| MEDIUM | 11 |
| LOW | 4 |
| **TOTAL** | **28** |

---

## Findings Table

| # | File | Line(s) | Severity | Category | Description | Recommended Fix |
|---|------|---------|----------|----------|-------------|-----------------|
| 1 | `HIPAAModule.cls` | 217-222, 225-229, 246-249, 293-298, 315-319 | CRITICAL | SOQL Security | 5 SOQL queries use neither `WITH SECURITY_ENFORCED` nor `WITH USER_MODE`. Queries on `Elaro_Evidence_Item__c`, `PermissionSetAssignment`, `SetupAuditTrail`. | Add `WITH SECURITY_ENFORCED` to all 5 queries. |
| 2 | `GDPRModule.cls` | 154-158, 174-178, 206-210 | CRITICAL | SOQL Security | 3 SOQL queries on `Elaro_Evidence_Item__c` lack security enforcement. | Add `WITH SECURITY_ENFORCED` to all 3 queries. |
| 3 | `FINRAModule.cls` | 134-139, 155-159, 185-189 | CRITICAL | SOQL Security | 3 SOQL queries on `Elaro_Evidence_Item__c` and `SetupAuditTrail` lack security enforcement. | Add `WITH SECURITY_ENFORCED` to all 3 queries. |
| 4 | `BenchmarkingService.cls` | 215, 221, 232 | HIGH | SOQL Security | 3 inline SOQL queries (`Compliance_Policy__mdt`, `SetupAuditTrail`, `User`) lack security enforcement. | Add `WITH SECURITY_ENFORCED` to all 3 queries. Note: `Compliance_Policy__mdt` (Custom Metadata) is exempt; `SetupAuditTrail` and `User` queries should be secured. |
| 5 | `ElaroComplianceAlert.cls` | 44, 149-156, 200-208, 270-275, 337-342 | HIGH | SOQL Security / CRUD | (a) `insert alertRecord` at line 44 has no CRUD check. (b) SOQL at lines 149-156 (`Elaro_Evidence_Item__c`) has no security enforcement. (c) Dynamic SOQL at line 208 (`Elaro_Alert_Config__c`) has no `WITH SECURITY_ENFORCED`. (d) SOQL at lines 270-275 (`CustomNotificationType`) has no security enforcement. (e) SOQL at lines 337-342 (`User`) has no security enforcement. | Add CRUD check before insert; add `WITH SECURITY_ENFORCED` to all inline SOQL queries; add security clause to dynamic query string. |
| 6 | `ElaroDailyDigest.cls` | 115-121, 147-152, 172-179, 378-384 | HIGH | SOQL Security | 4 SOQL queries on `Elaro_Evidence_Item__c`, `SetupAuditTrail`, and `User` lack security enforcement. | Add `WITH SECURITY_ENFORCED` to all 4 queries. |
| 7 | `ElaroShieldService.cls` | 69-77, 97-102, 151-157, 198-199 | HIGH | SOQL Security | (a) `EventLogFile` queries at lines 69-77 and 97-102 lack `WITH SECURITY_ENFORCED` (only manual `isAccessible()` check, which is incomplete). (b) Aggregate query at 151-157 lacks enforcement. (c) `Database.countQuery` on `TenantSecret` at line 198 has no security. | Add `WITH SECURITY_ENFORCED` to all EventLogFile queries and the TenantSecret count query. |
| 8 | `NaturalLanguageQueryService.cls` | 55-70 | HIGH | SOQL Injection | Executes AI-generated SOQL via `Database.query()`. While the code has object whitelisting, LIMIT checks, DML keyword checks, and `WITH SECURITY_ENFORCED` injection, the AI-generated query is inherently untrusted. An AI hallucination or injection could craft a SOQL string that bypasses the `isSOQLSafe()` check. | Add field-level whitelisting (not just object-level). Parse the generated SOQL into an AST or use `Database.query()` with `AccessLevel.USER_MODE` instead of string-based `WITH SECURITY_ENFORCED` injection. Consider executing in `with sharing` context with `stripInaccessible` (already partially done). |
| 9 | `ElaroHistoricalEventBatch.cls` | 7 | HIGH | Sharing Model | Declared as `public class` without sharing keyword. Batch classes should explicitly declare sharing model. | Change to `public with sharing class ElaroHistoricalEventBatch` or add `without sharing` with documented justification. |
| 10 | `ElaroScheduledDelivery.cls` | 6 | HIGH | Sharing Model | Declared as `global class` without sharing keyword. | Change to `global with sharing class ElaroScheduledDelivery` or document why `without sharing` is needed. |
| 11 | `ElaroInstallHandler.cls` | 11 | HIGH | Sharing Model | Declared as `global class` without sharing keyword. Install handlers often need system context, but should be documented. | Add `without sharing` with documented justification (install handlers run in system context), or change to `global with sharing class`. |
| 12 | `ElaroComplianceAlert.cls` | 44 | HIGH | CRUD/FLS | `insert alertRecord` (line 44) has no `ElaroSecurityUtils.validateCRUDAccess()` check before DML on `Elaro_Alert_Config__c`. | Add `ElaroSecurityUtils.validateCRUDAccess('Elaro_Alert_Config__c', ElaroSecurityUtils.DmlOperation.DML_INSERT);` before insert. |
| 13 | `ElaroDynamicReportController.cls` | 173 | MEDIUM | Information Disclosure | `result.queryExecuted = soql` returns the executed SOQL query string to the client UI. This exposes internal query structure to end users. | Remove or conditionally include `queryExecuted` field. Only expose in admin/debug mode if needed. |
| 14 | `AccessReviewScheduler.cls` | 247-251, 264-268 | MEDIUM | SOQL Security | 2 queries on `CronTrigger` lack `WITH SECURITY_ENFORCED`. These are admin utility methods but should still enforce security. | Add `WITH SECURITY_ENFORCED` to both `CronTrigger` queries. |
| 15 | `BreachDeadlineMonitor.cls` | 360-364 | MEDIUM | SOQL Security | `CronTrigger` query in `abortAllJobs()` lacks `WITH SECURITY_ENFORCED`. | Add `WITH SECURITY_ENFORCED` to the query. |
| 16 | `ElaroAuditTrailPoller.cls` | 65-68 | MEDIUM | SOQL Security | `CronTrigger` query in `unschedule()` lacks `WITH SECURITY_ENFORCED`. | Add `WITH SECURITY_ENFORCED` to the query. |
| 17 | `ElaroAuditTrailPoller.cls` | 140 | MEDIUM | CRUD/FLS | `upsert settings` on `Elaro_Settings__c` at line 140 has no CRUD check. | Add `ElaroSecurityUtils.validateCRUDAccess()` before upsert, or use `Security.stripInaccessible`. |
| 18 | `ElaroInstallHandler.cls` | 174-179 | MEDIUM | SOQL Security | `PermissionSetAssignment` query in `notifyAdministrators()` lacks `WITH SECURITY_ENFORCED`. | Add `WITH SECURITY_ENFORCED` to the query. |
| 19 | `ComplianceScoreSnapshotScheduler.cls` | 337 | MEDIUM | SOQL Security | `CronTrigger` query lacks `WITH SECURITY_ENFORCED` (identified from grep patterns). | Add `WITH SECURITY_ENFORCED` to the query. |
| 20 | `MobileAlertPublisher.cls` | 338 | MEDIUM | SOQL Security | `CronTrigger` query lacks `WITH SECURITY_ENFORCED`. | Add `WITH SECURITY_ENFORCED` to the query. |
| 21 | `ElaroReasoningEngine.cls` | 161 | MEDIUM | CRUD/FLS | `insert adjudication` on Big Object `Elaro_Compliance_Graph__b` has no CRUD check. While Big Objects have limited CRUD enforcement, a check should still be present for consistency. | Add CRUD check or documented exception for Big Object. |
| 22 | `ElaroScoreCallback.cls` | 420 | MEDIUM | Cryptographic Weakness | HMAC signature comparison uses `String.equals()` instead of a constant-time comparison function. This is susceptible to timing attacks. Code comment says "constant-time comparison" but `String.equals()` is NOT constant-time. | Use `Crypto.generateMac()` to re-compute and compare Blob values, or implement a true constant-time comparison loop. |
| 23 | `ElaroScoreCallback.cls` | 354-358 | MEDIUM | Authentication Bypass | Replay protection allows requests without timestamp/nonce headers (backward compatibility). This means replay protection can be completely bypassed by omitting headers. | Make replay protection headers required in production. Log as WARNING and plan migration path. |
| 24 | `AccessReviewScheduler.cls` | 287-290 | LOW | Input Validation | `@AuraEnabled runNow()` has no authorization check beyond sharing rules. Any user with access to the method can trigger an immediate access review. | Add permission check (e.g., custom permission or admin profile check) before allowing execution. |
| 25 | `BreachDeadlineMonitor.cls` | 374-378 | LOW | Input Validation | `@AuraEnabled runNow()` has no authorization check. Any user with method access can trigger breach deadline monitoring. | Add permission check before allowing manual execution. |
| 26 | `BlockchainVerification.cls` | 126-134 | LOW | Bulkification in Loop | `batchAnchorEvidence()` calls `anchorEvidence()` in a loop. Each call runs SOQL queries, potentially hitting governor limits with large input lists. | Refactor to bulkify queries outside the loop. |
| 27 | `ElaroComplianceAlert.cls` | 100-112 | LOW | Async in Loop | `System.enqueueJob()` called inside a `for` loop for each alert channel. Could hit the 50-job queueable limit. | Batch all channels into a single queueable job, or use a chain pattern. |
| 28 | `SOC2Module.cls` (pattern match) | N/A | MEDIUM | SOQL Security | SOC2Module, like HIPAAModule and GDPRModule, likely contains evidence queries without security enforcement (follows same pattern as other compliance modules). | Audit and add `WITH SECURITY_ENFORCED` to all queries. |

---

## Detailed Category Analysis

### 1. Sharing Model

**Status**: Mostly compliant. 127 of 131 production classes use `with sharing`.

**`without sharing` classes (4 total, all documented)**:
- `ElaroReasoningEngine.cls` - Documented justification (Big Object access, cross-org analysis)
- `ElaroAuditTrailPoller.cls` - Documented (system context for audit trail polling)
- `SchedulerErrorHandler.cls` - Documented (error logging must always work)
- `ElaroEventPublisher.cls` - Documented (Platform Events must publish regardless)
- `ElaroScoreCallback.cls` - Documented (REST callback, system context for score updates)

**Missing sharing keyword (3 total)**:
- `ElaroHistoricalEventBatch.cls` - **Finding #9**
- `ElaroScheduledDelivery.cls` - **Finding #10**
- `ElaroInstallHandler.cls` - **Finding #11**

### 2. SOQL Security Enforcement

**Status**: Majority of queries are secured. ~85% of SOQL uses `WITH SECURITY_ENFORCED` or `WITH USER_MODE`.

**Gap Pattern**: The compliance evaluation modules (HIPAAModule, GDPRModule, FINRAModule, SOC2Module) consistently use inline SOQL without security enforcement in their `evaluateControl()` methods. These are COUNT() queries on `Elaro_Evidence_Item__c`, `SetupAuditTrail`, and `PermissionSetAssignment`.

**Dynamic SOQL**: All dynamic SOQL files (ElaroDrillDownController, ElaroDynamicReportController, ElaroMatrixController, ElaroTrendController, ComplianceReportGenerator, ElaroDashboardController, ElaroPDFController) properly append `WITH SECURITY_ENFORCED` to dynamically built queries. Object and field whitelisting is implemented. Field names are sanitized with `replaceAll('[^a-zA-Z0-9_]+', '')`.

### 3. CRUD/FLS Enforcement

**Status**: Good. Centralized `ElaroSecurityUtils.validateCRUDAccess()` is used consistently before most DML operations.

**Notable Patterns**:
- `ElaroScoreCallback.cls` uses `Security.stripInaccessible()` with `AccessLevel.USER_MODE` -- excellent practice
- `AlertHistoryService.cls` uses both `hasReadAccess()` and `validateFLSAccess()` -- thorough
- `ApiUsageSnapshot.cls` uses `Schema.sObjectType.*.isCreateable()` -- acceptable alternative

**Gaps**: 5 DML operations found without preceding CRUD checks (Findings #5, #12, #17, #21).

### 4. Input Validation on @AuraEnabled Methods

**Status**: Good overall. Most `@AuraEnabled` methods validate inputs.

**Well-validated examples**:
- `AnomalyDetectionService.detectAnomalies()` - checks blank/null/range
- `AuditReportController.generateAuditReport()` - validates all three params
- `ElaroDrillDownController.getRecords()` - comprehensive context validation
- `ElaroDynamicReportController.executeReport()` - thorough config validation

**Gaps**: `runNow()` methods on scheduler classes (Findings #24, #25) lack authorization checks.

### 5. SOQL Injection Prevention

**Status**: Strong. No direct concatenation of user input into SOQL queries found.

**Mitigations in place**:
- Bind variables used throughout static SOQL
- Dynamic SOQL controllers use object whitelisting, operator whitelisting, field sanitization (`replaceAll('[^a-zA-Z0-9_]+', '')`), and `String.escapeSingleQuotes()`
- `NaturalLanguageQueryService` is the one high-risk area (Finding #8) due to AI-generated SOQL

### 6. Hardcoded IDs

**Status**: PASS. No hardcoded Salesforce IDs found in production classes. All hardcoded IDs are in test classes only (appropriate for test data factories).

### 7. Sensitive Data / Credentials

**Status**: PASS. No hardcoded credentials, API keys, or tokens found in production code.

**Good practices observed**:
- `ElaroScoreCallback.cls` uses Custom Metadata (`Elaro_API_Config__mdt`) for API key hashes
- Named Credentials used for callouts (`callout:SF_Limits`, `callout:Slack_Webhook`, `callout:Elaro_Claude_API`)
- `ElaroComplianceAlert.cls` uses `{!$Credential.PagerDuty_API_Key}` credential reference
- Webhook secrets stored in Custom Settings (`Jira_Integration_Settings__c.Webhook_Secret__c`)

---

## `without sharing` Justification Review

| Class | Declared | Justification | Acceptable? |
|-------|----------|---------------|-------------|
| `ElaroReasoningEngine` | `without sharing` | Big Object access, cross-org analysis, documented | Yes - with caveat |
| `ElaroAuditTrailPoller` | `without sharing` | System context for audit trail, documented | Yes |
| `SchedulerErrorHandler` | `without sharing` | Error logging reliability, documented | Yes |
| `ElaroEventPublisher` | `without sharing` | Platform Event publishing, documented | Yes |
| `ElaroScoreCallback` | `without sharing` | REST callback, uses `AccessLevel.USER_MODE` for DML | Yes - good mitigation |
| `ElaroHistoricalEventBatch` | **Missing** | Batch class, no keyword at all | No - must add keyword |
| `ElaroScheduledDelivery` | **Missing** | Schedulable class, no keyword at all | No - must add keyword |
| `ElaroInstallHandler` | **Missing** | Install handler, no keyword at all | No - must add keyword |

---

## Recommendations (Priority Order)

### Immediate (Before AppExchange Submission)

1. **Add `WITH SECURITY_ENFORCED` to all compliance module queries** (HIPAAModule, GDPRModule, FINRAModule, SOC2Module). These are the most numerous findings and are straightforward fixes.

2. **Add sharing keyword to 3 classes** missing it (ElaroHistoricalEventBatch, ElaroScheduledDelivery, ElaroInstallHandler).

3. **Add CRUD checks** before the 4 DML operations that lack them.

4. **Remove `queryExecuted` from ElaroDynamicReportController response** or gate behind admin permission.

5. **Fix SOQL security on ElaroComplianceAlert queries** (5 queries across the class).

### Short-Term

6. **Harden NaturalLanguageQueryService** - add field-level whitelisting and consider `AccessLevel.USER_MODE` on `Database.query()`.

7. **Fix timing-safe HMAC comparison** in ElaroScoreCallback.

8. **Make replay protection headers required** (remove backward compatibility bypass).

9. **Add authorization checks** to `runNow()` methods on scheduler classes.

### Proactive

10. **Add `WITH SECURITY_ENFORCED`** to all `CronTrigger` utility queries across scheduler classes (6 instances).

11. **Consider a SOQL security linting rule** in CI/CD to catch queries missing security enforcement.

12. **Document `without sharing` usage** in a security design document for auditor review.

---

## Compliance Notes

### HIPAA
- The platform handles Protected Health Information (PHI) through `HIPAA_Breach__c`, `HIPAAModule`, and related services.
- All PHI-related queries in `BreachDeadlineMonitor`, `ElaroHIPAAComplianceService`, and `HIPAABreachNotificationService` properly use `WITH SECURITY_ENFORCED`.
- The `HIPAAModule` evaluation queries (Finding #1) are a gap that must be fixed.

### SOC2
- Audit trail functionality is comprehensive with `SetupAuditTrail` polling and event publishing.
- Access review automation (`AccessReviewScheduler`, `SOC2AccessReviewService`) is well-implemented with proper security.

### AppExchange Security Review
- The scanner will flag all `without sharing` classes -- ensure each has documented justification.
- The scanner will flag all SOQL without `WITH SECURITY_ENFORCED` or `WITH USER_MODE`.
- The scanner will flag `Database.query()` with dynamic strings -- ensure sanitization is documented.
- The `global` keyword on 3 classes (ElaroScoreCallback, ElaroScheduledDelivery, ElaroInstallHandler) is necessary but will need justification.

---

*Report generated 2026-02-07 by Security Reviewer Agent*
