# Elaro Remediation Plan

**Date:** February 14, 2026
**Current Score:** 69/100 (F — auto-fail on CRUD/FLS)
**Target Score:** 85+ (B — AppExchange submission viable)
**Methodology:** RALPH Loop (Review → Analyze → Learn → Plan → Handle) with GSD execution blocks

---

## Why RALPH Loop

This project has a discipline problem, not a design problem. The architecture is good. The standards doc (CLAUDE.md) is thorough. But nothing enforced those standards at commit time, so violations accumulated silently across 39 files until we had 121 of them.

**Pure GSD** is what created this debt — fast output, no feedback loop. Continuing with GSD alone means we fix 121 violations today and introduce 30 new ones next month.

**RALPH Loop** exists to prevent recurrence. Each wave follows the same cycle:

1. **Review** — Run scans, establish the current violation count
2. **Analyze** — Why do these violations exist? What allowed them in?
3. **Learn** — Convert the root cause into an automated prevention
4. **Plan** — Scope the fix batch, define acceptance criteria
5. **Handle** — GSD execution. Fix everything. Ship it.

The "Learn" step is the one that matters. Every wave must produce a CI check or linter rule that makes the fixed violation category impossible to reintroduce. Fixes without ratchets are temporary.

---

## Exact Violation Inventory

### DML Without `as user` — 121 violations, 39 files

| Type | Count | Files |
|------|-------|-------|
| `insert` | 77 | AccessReviewScheduler (4), ApiUsageSnapshot (1), AuditReportController (1), BlockchainVerification (2), BreachDeadlineMonitor (3), ComplianceReportScheduler (1), ComplianceScoreSnapshotScheduler (6), ComplianceServiceBase (3), ElaroAuditPackageGenerator (3), ElaroComplianceAlert (1), ElaroDeliveryService (1), ElaroGDPRDataErasureService (1), ElaroGraphIndexer (3), ElaroInstallHandler (4), ElaroLegalDocumentGenerator (2), ElaroPDFExporter (6), ElaroQuickActionsService (2), ElaroReasoningEngine (1), ElaroTestDataFactory (8), ElaroTestUserFactory (2), EvidenceCollectionService (1), FlowExecutionLogger (1), HIPAAAuditControlService (1), HIPAABreachNotificationService (1), HIPAAPrivacyRuleService (1), MultiOrgManager (1), OnCallScheduleController (1), PerformanceAlertPublisher (2), RemediationOrchestrator (2), RemediationSuggestionService (1), SOC2AccessReviewService (1), SOC2ChangeManagementService (1), SOC2IncidentResponseService (2), SchedulerErrorHandler (2), SlackNotifier (2), EscalationPathController (1) |
| `update` | 31 | BreachDeadlineMonitor (1), ElaroPDFExporter (1), ElaroQuickActionsService (2), ElaroTestUserFactory (1), EscalationPathController (1), HIPAABreachNotificationService (2), JiraIntegrationService (2), JiraWebhookHandler (3), MobileAlertEscalator (1), MobileAlertPublisher (2), MultiOrgManager (1), OnCallScheduleController (1), RemediationExecutor (6), RemediationOrchestrator (2), RemediationSuggestionService (2), SOC2ChangeManagementService (1), SOC2IncidentResponseService (2) |
| `delete` | 12 | ElaroQuickActionsService (6), EscalationPathController (1), MultiOrgManager (1), OnCallScheduleController (1), RemediationOrchestrator (2), SOC2AccessReviewService (1) |
| `upsert` | 1 | ElaroAuditTrailPoller (1) |
| `Database.*` | 2 | ElaroCCPASLAMonitorScheduler (1), ElaroGLBAAnnualNoticeBatch (1) — missing `AccessLevel.USER_MODE` param |

### SOQL Without `WITH USER_MODE` — 7 violations, 5 files

| File | Line | Query Target |
|------|------|-------------|
| BenchmarkingService.cls | 216 | `Compliance_Policy__mdt` (COUNT) |
| ComplianceGraphService.cls | 394 | `Compliance_Policy__mdt` |
| ComplianceGraphService.cls | 407 | `Compliance_Policy__mdt` (filtered) |
| ElaroComplianceCopilotService.cls | 173 | `Elaro_Evidence_Item__c` |
| ElaroComplianceCopilotService.cls | 217 | `Elaro_Evidence_Item__c` |
| DataResidencyService.cls | 146 | `User` (COUNT) |
| MultiOrgManager.cls | 112, 123 | `Elaro_Connected_Org__c` |
| RemediationOrchestrator.cls | 197 | `PermissionSetAssignment` |
| ElaroConsentWithdrawalHandler.cls | 100 | `Contact` |
| ElaroRealtimeMonitor.cls | 301 | `User` |

### SOQL Injection Risk — 1 file

| File | Lines | Issue |
|------|-------|-------|
| ElaroMatrixController.cls | 338-349, 382-388 | `Database.query()` with string concatenation. Sanitization exists but should be `Database.queryWithBinds()` |

### @AuraEnabled Without Try-Catch — 1 method

| File | Line | Method |
|------|------|--------|
| ElaroAIRiskPredictor.cls | 18 | `predictRisk` — throws `IllegalArgumentException` unwrapped |

### Permission Set Tab Gaps — 18 tabs missing from both core sets

Neither `Elaro_Admin` nor `Elaro_User` grant visibility to any of the 18 custom tabs. Subscribers who install the package and assign these permission sets will see zero tabs. Only `Elaro_Admin_Extended` has tab grants.

### Hardcoded English in LWC — 59 strings, 10 components

| Component | String Count |
|-----------|-------------|
| escalationPathConfig | 8 |
| elaroROICalculator | 11 |
| remediationSuggestionCard | 6 |
| controlMappingMatrix | 4 |
| elaroEventExplorer | 4 |
| elaroEventMonitor | 5 |
| elaroDashboard | 5 |
| elaroCopilot | 4 |
| reportSchedulerConfig | 1 |
| jiraCreateModal | 4 |
| complianceScoreCard | 1 |
| elaroTrendAnalyzer | 4 |
| elaroComparativeAnalytics | 1 |

### CI Enforcement Gaps — 10 items

| Gap | Impact |
|-----|--------|
| Code Analyzer scan soft-fails (`\|\| true`) | AppExchange violations merge to main |
| Format check soft-fails (`\|\| echo`) | Inconsistent formatting merges |
| No Apex test execution in CI | 85% coverage not enforced |
| No `WITH USER_MODE` validation | SOQL security violations undetected |
| No `as user` validation | DML security violations undetected |
| No ApexDoc enforcement | Undocumented classes merge |
| No Custom Label enforcement | Hardcoded strings merge |
| No Permission Set validation | Missing grants undetected |
| No `lwc:if` enforcement | Deprecated template syntax possible |
| No Health Check 2GP structure validation | Namespace isolation not verified |

---

## Wave Execution Plan

### Wave 1 — Security: DML + SOQL (AppExchange Blocker)

**RALPH Cycle:**
- **Review:** 121 DML violations, 7 SOQL violations across 44 files
- **Analyze:** Root cause = no CI enforcement. Standards existed in CLAUDE.md but no gate checked compliance
- **Learn → Ratchet:** Build `scripts/check-apex-security.sh` — grep-based CI step that fails on bare DML or SOQL without `USER_MODE`. Add as required step in `elaro-ci.yml`
- **Plan:** Mechanical find-replace. `insert X;` → `insert as user X;`. `Database.insert(X, false)` → `Database.insert(X, false, AccessLevel.USER_MODE)`. Add `WITH USER_MODE` to 7 queries.
- **Handle:** Execute across all 44 files. Run `npm run precommit`. Commit.

**Acceptance Criteria:**
- [ ] `grep -rn '^\s*insert ' --include='*.cls' | grep -v 'as user' | grep -v 'Test\.cls'` returns 0 results
- [ ] `grep -rn '^\s*update ' --include='*.cls' | grep -v 'as user' | grep -v 'Test\.cls'` returns 0 results
- [ ] `grep -rn '^\s*delete ' --include='*.cls' | grep -v 'as user' | grep -v 'Test\.cls'` returns 0 results
- [ ] `grep -rn '^\s*upsert ' --include='*.cls' | grep -v 'as user' | grep -v 'Test\.cls'` returns 0 results
- [ ] Security check script exists and runs in CI
- [ ] CI step is non-soft-fail (no `|| true`)

**Score Impact:** F → C+ (estimated 75-78)

---

### Wave 2 — Controller Hardening + Permission Sets

**RALPH Cycle:**
- **Review:** 1 SOQL injection surface, 1 missing try-catch, 18 missing tab grants
- **Analyze:** ElaroMatrixController was likely built before `Database.queryWithBinds()` was standardized. Permission sets were created before tabs were finalized.
- **Learn → Ratchet:** Add grep check for `Database.query(` (should always be `Database.queryWithBinds`). Add tab count validation to metadata check script.
- **Plan:** Refactor ElaroMatrixController query methods. Wrap ElaroAIRiskPredictor in try-catch. Add all 18 tabs to both Elaro_Admin and Elaro_User.
- **Handle:** Execute. Test with `npm run precommit`. Commit.

**Acceptance Criteria:**
- [ ] Zero `Database.query(` calls in non-test production code (all converted to `queryWithBinds`)
- [ ] All `@AuraEnabled` methods have try-catch + `AuraHandledException`
- [ ] Both core permission sets grant all 18 tabs
- [ ] Metadata validation script checks tab coverage

**Score Impact:** C+ → B- (estimated 80-82)

---

### Wave 3 — LWC i18n + Async Cleanup

**RALPH Cycle:**
- **Review:** 59 hardcoded strings, 1 `@future` method, 1 trigger with inline DML
- **Analyze:** LWC components were built with English directly in templates. Jira integration predates Queueable adoption.
- **Learn → Ratchet:** ESLint custom rule or CI grep to detect non-expression text content in LWC HTML. Document in CLAUDE.md that every new string needs a Custom Label.
- **Plan:** Create 59 Custom Labels. Update 10 LWC components to import labels. Rewrite JiraIntegrationService callout as Queueable. Extract PerformanceAlertEventTrigger DML to handler.
- **Handle:** Execute. Verify no hardcoded text in `npm run lint`. Commit.

**Acceptance Criteria:**
- [ ] Zero hardcoded English strings in LWC HTML (all use `{label.X}`)
- [ ] 59 new Custom Label entries in `CustomLabels.labels-meta.xml`
- [ ] Zero `@future` methods in codebase
- [ ] All 5 triggers delegate 100% of DML to handler classes
- [ ] CI check catches new hardcoded strings

**Score Impact:** B- → B (estimated 83-85)

---

### Wave 4 — Test Quality + Documentation + CI Hardening

**RALPH Cycle:**
- **Review:** Missing `@IsTest(testFor)`, no `System.runAs()` tests, incomplete ApexDoc, CI soft-fails
- **Analyze:** Test annotations and ApexDoc are easy to skip under time pressure. CI soft-fails were likely added "temporarily" during early development and never removed.
- **Learn → Ratchet:** Remove every `|| echo` and `|| true` from CI. Add ApexDoc check script (verify `@author`, `@since`, `@group` on all public classes).
- **Plan:** Add `@IsTest(testFor=X.class)` to all test classes. Add `System.runAs()` to at least: CommandCenterControllerTest, HealthCheckControllerTest, ElaroQuickActionsServiceTest, RemediationOrchestratorTest. Add `@since v3.1.0 (Spring '26)`, `@group [Module]` to all production classes. Remove CI soft-fails.
- **Handle:** Execute. Full `npm run precommit`. Commit.

**Acceptance Criteria:**
- [ ] All test classes have `@IsTest(testFor=...)` annotation
- [ ] At least 4 test classes have `System.runAs()` permission tests
- [ ] All production classes have `@author`, `@since`, `@group` in ApexDoc
- [ ] CI pipeline has zero `|| true` or `|| echo` soft-fails
- [ ] Code Analyzer runs with `--severity-threshold 1` and fails build on violations

**Score Impact:** B → B+ (estimated 86-89)

---

## Workflow Cadence

Each wave follows this daily structure:

| Time | Activity | Mode |
|------|----------|------|
| Start of wave | **Review + Analyze** — Run scans, confirm violation count | RALPH |
| After analysis | **Learn** — Write the CI check / ratchet script | RALPH |
| After ratchet built | **Plan** — List exact files, define acceptance criteria | RALPH |
| Remainder of wave | **Handle** — Fix every file, run tests, commit | GSD |
| End of wave | **Verify** — Run new CI check, confirm zero violations | RALPH |

The transition from RALPH to GSD is explicit. Once the plan is set and the ratchet is built, stop thinking and start executing. The ratchet guarantees that whatever you fix stays fixed.

---

## Ratchet Registry

After all waves, these automated checks prevent regression:

| Check | Enforcement Point | What It Catches |
|-------|-------------------|-----------------|
| `check-apex-security.sh` | CI + pre-commit | Bare DML, SOQL without USER_MODE |
| `check-dynamic-soql.sh` | CI | `Database.query(` without `queryWithBinds` |
| `check-hardcoded-strings.sh` | CI | Non-expression text in LWC HTML |
| `check-apexdoc.sh` | CI | Missing @author, @since, @group |
| `check-permissionsets.sh` | CI | Tabs/classes not granted in permission sets |
| Code Analyzer v5 | CI (hard fail) | AppExchange security violations |
| ESLint (0 warnings) | CI + pre-commit | JS code quality |
| Prettier | CI + pre-commit | Formatting |
| Jest | CI + pre-commit | LWC test failures |

---

## Success Metrics

| Metric | Current | Post-Wave 1 | Post-Wave 2 | Post-Wave 3 | Post-Wave 4 |
|--------|---------|-------------|-------------|-------------|-------------|
| Bare DML count | 121 | 0 | 0 | 0 | 0 |
| SOQL without USER_MODE | 7 | 0 | 0 | 0 | 0 |
| SOQL injection surfaces | 1 | 1 | 0 | 0 | 0 |
| Missing try-catch | 1 | 1 | 0 | 0 | 0 |
| Missing tab grants | 18 | 18 | 0 | 0 | 0 |
| Hardcoded English strings | 59 | 59 | 59 | 0 | 0 |
| @future methods | 1 | 1 | 1 | 0 | 0 |
| CI soft-fail steps | 10 | 8 | 6 | 4 | 0 |
| Automated ratchets | 0 | 1 | 3 | 5 | 9 |
| Estimated score | 69 | 76 | 82 | 85 | 88 |
| AppExchange ready | No | No | Maybe | Yes | Yes |
