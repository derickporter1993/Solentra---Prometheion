# Elaro Remediation Backlog

**Generated:** 2026-02-19 | Post-Phase 7 | Solentra Review v2.0 baseline
**Current Grade:** C (3.325/5.00) | **Target Grade:** B+ (4.25+)
**Review Report:** `.review-state/final-report.md`

---

## Priority Legend

| Priority | Meaning | Impact |
|----------|---------|--------|
| **P0** | AppExchange blocker or Critical severity | Must fix before packaging |
| **P1** | High severity or grade-impacting | Needed for B grade |
| **P2** | Medium severity or quality improvement | Needed for B+ grade |
| **P3** | Low/Info or polish | Nice to have |

---

## P0 — Critical / AppExchange Blockers

### BL-001: DML without `as user` across codebase
**Status:** Open
**Scope:** ~128 bare DML statements in production classes (excludes test/factory classes)
**Files (sample):**
- `JiraIntegrationService.cls` — lines 53, 121 (`update gap` without `as user`)
- `ElaroDeliveryService.cls` — line 167 (`insert cd` without `as user`)
- `SOC2IncidentResponseService.cls` — line 86+
- `SOC2AccessReviewService.cls` — line 61+
- `EscalationPathController.cls` — lines 43, 59, 72
- `RemediationExecutor.cls` — multiple
- `ElaroQuickActionsService.cls` — multiple
- `MobileAlertEscalator.cls` — line 93
- `BlockchainVerification.cls` — multiple
**Why P0:** AppExchange security review will flag all non-`as user` DML as CRUD/FLS violations.
**Effort:** Medium (systematic find-and-replace, but each site needs verification)

### BL-002: SOQL without `WITH USER_MODE` across codebase
**Status:** Open
**Scope:** ~66 SOQL queries missing `WITH USER_MODE` in production classes
**Files (sample):**
- `ElaroDeliveryService.cls` — lines 33-37, 44-47, 140-143, 147-150, 167-173, 209-212, 221-226
- `JiraIntegrationService.cls` — multiple
- `RemediationExecutor.cls` — multiple
- `ElaroQuickActionsService.cls` — multiple
**Why P0:** Same as BL-001 — CRUD/FLS enforcement required for AppExchange.
**Effort:** Medium

### BL-003: Schema.sObjectType permission checks (legacy pattern)
**Status:** Open
**Scope:** 42 occurrences across 15 production classes
**Files:**
- `ElaroQuickActionsService.cls` (10 occurrences)
- `RemediationExecutor.cls` (6)
- `ElaroShieldService.cls` (4)
- `JiraWebhookHandler.cls` (3)
- `EscalationPathController.cls` (3)
- `RemediationSuggestionService.cls` (3)
- `JiraIntegrationService.cls` (2)
- `BlockchainVerification.cls` (2)
- `MobileAlertPublisher.cls` (2)
- `ElaroInstallHandler.cls` (2)
- `SOC2AccessReviewService.cls` (1)
- `SOC2IncidentResponseService.cls` (1)
- `MobileAlertEscalator.cls` (1)
- `ElaroLegalDocumentGenerator.cls` (1)
- `SlackNotifier.cls` (1)
**Why P0:** These are redundant with `as user` / `WITH USER_MODE`. Remove checks, rely on declarative enforcement.
**Effort:** Medium (must validate that `as user` is added at the same time)

### BL-004: `elaroHC` namespace registration for Health Check 2GP
**Status:** Open
**Scope:** `sfdx-project.json` — Health Check package needs its own namespace
**Current State:** Main package has `"namespace": "elaro"` (fixed). Health Check package at `force-app-healthcheck` has no namespace.
**Why P0:** Cannot create Health Check 2GP package version without registered namespace.
**Effort:** Low (config change + DevHub registration)

### BL-005: ElaroAuditPackageGeneratorTest — minimal test (1 assertion)
**Status:** Open
**File:** `force-app/main/default/classes/ElaroAuditPackageGeneratorTest.cls`
**Finding:** TEST-005 from review — only 1 assertion in entire test class.
**Why P0:** Critical finding — test provides no meaningful coverage.
**Effort:** Low

### BL-006: IComplianceModule integration test missing
**Status:** Open
**File:** `force-app/main/default/classes/IComplianceModule.cls`
**Finding:** TEST-001 from review — core interface has no integration test verifying contract.
**Why P0:** Critical finding — key architectural interface untested.
**Effort:** Medium

---

## P1 — High Severity / Grade-Impacting

### BL-007: `Assert.isTrue(true)` stub assertions across test classes
**Status:** Open
**Scope:** 187 occurrences across 56 test classes
**Top offenders:**
- `ElaroPCIAccessAlertHandlerTest.cls` (12)
- `ElaroSchedulerTests.cls` (11)
- `ElaroTeamsNotifierQueueableTest.cls` (10)
- `ElaroTrendControllerTest.cls` (9)
- `MobileAlertPublisherTest.cls` (9)
- `ElaroLoggerTest.cls` (8)
- `ElaroSlackNotifierQueueableTest.cls` (7)
- `ElaroScheduledDeliveryTest.cls` (7)
- `ElaroRealtimeMonitorTest.cls` (7)
- `ElaroComplianceAlertTest.cls` (6)
- `ElaroMatrixControllerTest.cls` (6)
- `ElaroDailyDigestTest.cls` (6)
- 44 more files...
**Why P1:** Always-pass assertions provide zero test value. Reduces Test Quality score.
**Effort:** High (each stub must be analyzed and replaced with meaningful assertion)
**Pattern:** Replace with `Assert.isNull(caughtEx, ...)` for void methods, or actual state assertions.

### BL-008: Pre-existing HC test classes missing `@IsTest(testFor=...)`
**Status:** Open
**Scope:** 8 test classes in `force-app-healthcheck/main/default/classes/`
**Files:**
- `HealthCheckScannerTest.cls`
- `HealthCheckControllerTest.cls`
- `ScoreAggregatorTest.cls`
- `ToolingApiServiceTest.cls`
- `SessionSettingsScannerTest.cls`
- `ProfilePermissionScannerTest.cls`
- `AuditTrailScannerTest.cls`
- `MFAComplianceScannerTest.cls`
**Why P1:** Spring '26 `RunRelevantTests` needs `testFor` for optimal test execution.
**Effort:** Low (add annotation to each class)

### BL-009: HealthCheckScannerTest has only 2 test methods
**Status:** Open
**File:** `force-app-healthcheck/main/default/classes/HealthCheckScannerTest.cls`
**Why P1:** Below 3-method minimum per test class standard.
**Effort:** Low (add 1+ test methods)

### BL-010: GOV-003 — ElaroConsentWithdrawalHandler SOQL pattern
**Status:** Open
**Finding:** Bounded SOQL-in-loop pattern could be reorganized.
**Why P1:** Governor limit risk under high volume.
**Effort:** Medium

### BL-011: GOV-013 — CCPAOptOutService potential callout-in-loop
**Status:** Open
**Finding:** Code comment suggests future callout-in-loop risk.
**Why P1:** Latent governor limit violation.
**Effort:** Medium

### BL-012: Code Analyzer v5 not yet run (AX-013)
**Status:** Open
**Action:** `sf scanner run --target force-app --format table --severity-threshold 1`
**Why P1:** Required for AppExchange submission. May surface additional findings.
**Effort:** Low (run tool, triage results)

---

## P2 — Medium Severity / Quality

### BL-013: `@description` tags in 46 test classes (58 occurrences)
**Status:** Open
**Scope:** 46 test classes still use `@description` in ApexDoc.
**Why P2:** Non-standard tag. Not blocking but inconsistent with production classes (which were cleaned up).
**Effort:** Low (batch removal)

### BL-014: ComplianceTestDataFactory misplaced `@since`/`@group`
**Status:** Open
**File:** `force-app/main/default/classes/ComplianceTestDataFactory.cls`
**Issue:** `@since` and `@group` tags are in method-level doc, not class-level.
**Effort:** Low

### BL-015: Dynamic SOQL using `Database.query()` instead of `queryWithBinds()`
**Status:** Open
**Scope:** 3 instances (from review: medium severity)
**Why P2:** `queryWithBinds()` is the modern standard. `Database.query()` with concatenation is injection-prone.
**Effort:** Low per instance

### BL-016: Missing method-level ApexDoc on public methods
**Status:** Open
**Scope:** Class-level ApexDoc now complete. Many public methods still lack `@param`/`@return`/`@throws`.
**Why P2:** Agentforce parses method-level docs. AppExchange reviewers check for completeness.
**Effort:** High (hundreds of methods)

### BL-017: Inconsistent Custom Label `<protected>` values (AX-015)
**Status:** Open
**Scope:** Some labels have `<protected>true</protected>`, others `false`.
**Why P2:** 2GP managed package should protect labels from subscriber modification.
**Effort:** Low

### BL-018: Two admin permission sets with unclear distinction (AX-014)
**Status:** Open
**Why P2:** Confusing for subscriber admins.
**Effort:** Low (documentation or consolidation)

### BL-019: Weak assertion patterns in non-stub tests
**Status:** Open
**Scope:** Tests that use meaningful assertions but could be stronger.
**Why P2:** Test Quality score improvement.
**Effort:** Medium

---

## P3 — Low / Polish

### BL-020: GOV-001 — HIPAAAuditControlService SOQL in for-each (bounded)
**Status:** Open
**File:** `HIPAAAuditControlService.cls:444`
**Why P3:** Low risk (bounded collection), but stylistically impure.
**Effort:** Low

### BL-021: GOV-002 — ElaroDailyDigest SOQL in for-each (bounded)
**Status:** Open
**File:** `ElaroDailyDigest.cls:48`
**Why P3:** Same as BL-020.
**Effort:** Low

### BL-022: Nested loop CPU concern in ComplianceGraphService
**Status:** Open
**Why P3:** Potential CPU timeout under extreme load. No real-world reports.
**Effort:** Medium

### BL-023: Callout timeout set to 30s (low priority)
**Status:** Open
**Why P3:** Could cause test failures in slow environments.
**Effort:** Low

### BL-024: CI pipeline soft-fails on format/lint
**Status:** Open
**Why P3:** Pipeline should hard-fail to enforce quality gates.
**Effort:** Low (adjust CI config)

### BL-025: No Cursor/AsyncOptions usage
**Status:** Open
**Finding:** Architecture score dinged for not using Spring '26 Cursor API or AsyncOptions.
**Why P3:** Would improve Architecture score but not required.
**Effort:** Medium

---

## Summary by Priority

| Priority | Count | Effort Estimate | Grade Impact |
|----------|-------|-----------------|--------------|
| **P0** | 6 | Medium-High | C → B- |
| **P1** | 6 | Medium | B- → B |
| **P2** | 7 | Medium-High | B → B+ |
| **P3** | 6 | Low-Medium | B+ polish |
| **Total** | **25** | | |

## Recommended Execution Order

1. **Sprint 1 (BL-001 + BL-002 + BL-003):** Sweep all DML/SOQL/Schema.sObjectType across remaining production classes. This is the single biggest grade lever — ~236 violations across ~30 files. Systematic but high-impact.

2. **Sprint 2 (BL-007):** Replace 187 `Assert.isTrue(true)` stubs across 56 test files. Directly improves Test Quality from 3.5 → 4.0+.

3. **Sprint 3 (BL-005 + BL-006 + BL-008 + BL-009):** Small test fixes — expand ElaroAuditPackageGeneratorTest, add IComplianceModule integration test, fix HC test annotations, add HealthCheckScannerTest methods.

4. **Sprint 4 (BL-004 + BL-012 + BL-013 + BL-015 + BL-017):** Config and cleanup — namespace, Code Analyzer, @description removal, queryWithBinds, labels.

5. **Sprint 5 (BL-016 + remaining):** Method-level ApexDoc and polish items.

---

## Completed (This Session)

- [x] SEC-003→SEC-025: Security controllers (3 files, 21 critical+high)
- [x] GOV-005→GOV-012: @future → Queueable (4 files, 10 critical)
- [x] AX-001→AX-011: Permission sets, namespace, feature flags
- [x] TEST-002→TEST-004: 3 stub tests replaced
- [x] TEST-006→TEST-010: 5 HC test classes created
- [x] TEST-011→TEST-013: 166 @IsTest(testFor) added
- [x] ARCH-001→ARCH-003: ApexDoc on 176 production classes
- [x] ElaroEventProcessorTest: stub assertions fixed
