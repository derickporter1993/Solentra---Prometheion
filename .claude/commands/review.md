# Salesforce Code Review

You are conducting a comprehensive Salesforce code review against Winter '26 (API v65.0) and Spring '26 (API v66.0) standards, with AppExchange security review readiness as the target quality bar.

## Instructions

1. Read the full review checklist and scorecard: `agent_docs/apex-review-checklist.md`
2. Read the AppExchange security requirements: `agent_docs/appexchange-security.md`
3. Read the governor limits reference: `agent_docs/governor-limits.md`
4. Read the breaking changes reference: `agent_docs/breaking-changes.md`

## Review Scope

If the user specified files or a directory, review those. Otherwise, identify the most recently changed files using `git diff --name-only HEAD~5` and review those.

For each Apex class under review:

### Step 1: Gather Context
- Read the file completely
- Identify the sharing declaration, API version, and class purpose
- Check for a corresponding test class

### Step 2: Run Auto-Fail Gate Check
Check all 8 auto-fail conditions from the checklist. If ANY fail, the file gets an automatic F regardless of other scores. The gates are:
1. CRUD/FLS violation (no USER_MODE enforcement)
2. SOQL or DML inside a loop
3. Hardcoded credentials or secrets
4. Test coverage below 75%
5. Missing sharing declaration
6. SOQL injection (string concatenation with user input)
7. XSS vulnerability
8. API version below v58.0

### Step 3: Score Each Category
Evaluate against all 8 categories from the checklist:
- Security (25%)
- Governor Limits & Performance (20%)
- Test Quality (15%)
- Maintainability (15%)
- Architecture & Async Patterns (10%)
- Documentation (5%)
- API Version & Platform Compliance (5%)
- AppExchange Readiness (5%)

### Step 4: Produce Output
For each file, output:

1. **File Summary** — Path, class name, sharing, API version, purpose
2. **Auto-Fail Gate Results** — PASS/FAIL for each gate
3. **Findings Table** — All issues found with severity, line numbers, and fix suggestions
4. **Scorecard** — Filled weighted calculation table
5. **Letter Grade** — A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
6. **Top 3 Recommendations** — Highest-impact improvements

### Step 5: Summary
After reviewing all files, produce an overall summary with:
- Aggregate score across all files
- Most common issues found
- Critical items requiring immediate attention
- AppExchange readiness assessment (Ready / Needs Work / Not Ready)

## Key Standards (Quick Reference)

- SOQL: `WITH USER_MODE` (NOT `WITH SECURITY_ENFORCED`)
- DML: `as user` or `AccessLevel.USER_MODE`
- Dynamic SOQL: `Database.queryWithBinds()` with `AccessLevel.USER_MODE`
- Assertions: `Assert` class (NOT `System.assertEquals`)
- Async: Queueable (NOT `@future`)
- Logging: `ElaroLogger` (NOT `System.debug()`)
- Sharing: Every class must have explicit declaration
- ApexDoc: No `@description` tag; use `@author`, `@since`, `@group`
- API: v66.0 for all new code
- LWC: `lwc:if` (NOT `if:true`), Custom Labels for all strings
