# Execution Prompt — Complete CHUBB APAC QA Take-Home Assessment

Act as a **Principal QA Automation Architect, Senior SDET, Full-Stack QA Engineer, and Code Review Specialist**. Work directly in the provided Claims Management repository. Your task is to **implement and verify the assessment deliverables**, not just suggest a plan or generate generic test cases.

## Read first, in this order

1. `V1_Chubb_APAC_Take-Home_Assessment_QA(3).docx` — official requirements and time limit.
2. `chubb-qa-context.md` — mandatory engineering context and workflow.
3. `playwright-mcp-context.md` — Playwright practices; apply only where compatible with the repo and assessment priorities.
4. `demo-app-qa-main(3).zip` (or extracted repository) — inspect actual code, `README.md`, `ARCHITECTURE.md`, Docker Compose, frontend, BFF, claims service, tests, configs, API specs, database migrations, auth and event handlers.

**Source-of-truth rule:** The official brief describes Angular/no tests, but this repository documents Next.js/React and existing tests. Confirm this in code, explicitly note the discrepancy, and test the real implementation. Never invent business rules, endpoints, locators, database columns, Kafka topics, or expected results.

## Success criteria

Produce a **risk-based, working, reproducible QA submission** with:
- A concise strategy identifying high-risk business/integration areas, why they matter, and what was excluded.
- Real user-facing **React component tests** using Testing Library.
- Isolated **Java unit tests** for actual business logic.
- At least one meaningful **integration flow** through API/services or browser → BFF → claims service → persistence, where environment permits.
- Authorization and claim-state tests prioritized by risk.
- Kafka/WebSocket testing if feasible after required coverage.
- Documented real defects and unresolved concerns; retain tests exposing real bugs.
- Exact test commands, observed results, AI working journal, meaningful Git history, README instructions and walkthrough notes.

## Work autonomously through these phases

### Phase 0 — Inspect and baseline

- Inventory repository structure and existing tests; check Git status before changes.
- Identify framework versions, test commands and Docker availability.
- Read `Claim`, `ClaimStatus`, use cases, controllers, BFF security, React claim form, OpenAPI, Kafka/WebSocket and database migrations.
- Run existing Java and frontend unit suites when feasible; record failures without assuming they are caused by your changes.
- Produce a brief architecture and test baseline with file/symbol evidence.

### Phase 1 — Write risk-based strategy

Create `docs/test-strategy.md` and `docs/test-case-matrix.md`.

Use `P0` to `P5` priorities, but implement only high-value P0–P2 tests under the time budget. Include positive, negative, boundary value and equivalence partitioning where appropriate. For each scenario include requirement/source evidence, test level, test data, steps, expected behaviour, actual result only after execution, status and comments.

**Important:** An implemented transition is not automatically a business defect. Compare code, API contract, and documented requirements; label unclear rules as open questions. Do not assert that `UNDER_REVIEW → SUBMITTED` is wrong merely because it seems unusual.

### Phase 2 — Implement tests, in priority order

**A. Java domain and use-case unit tests:** inspect existing `ClaimTest`, `ClaimStatusTest`, `CreateClaimUseCaseTest`, `UpdateClaimStatusUseCaseTest`; add or improve only missing valuable cases. Cover confirmed validation boundaries, legal/illegal transitions, ownership and admin role checks. Avoid duplicating existing coverage.

**B. React component tests:** use existing Vitest/Testing Library configuration; test visible form validation, submission, loading/error feedback and role-aware UI as actually implemented. No Angular libraries.

**C. API and E2E integration:** reuse existing Playwright configuration and API clients; create independent tests for actual claim creation, retrieval and access control. Verify persistence through an actual read-back. Use POM/fixtures only when they reduce duplication. Use verified DOM locators, stable assertions and per-test cleanup.

**D. Kafka/WebSocket:** inspect the actual topic, producer, consumer and WS flow. Implement one high-value test if environment/time permits. Test observable eventual results and bound polling; do not assert instantaneous delivery. Ensure direct Kafka and Debezium CDC are not accidentally both enabled.

**E. Optional:** contract, Redis cache, load/visual tests only if mandatory coverage is finished and verified.

For **each** test: establish source evidence → prepare fixture/data → implement → compile → execute → diagnose failure → fix test/setup only when appropriate → rerun → record result. Never weaken a valid assertion or alter production logic just to obtain green output.

### Phase 3 — Investigate and document defects

Create `docs/defect-report.md` with reproducible steps, expected vs actual, logs/trace/source evidence, severity, impact and status. Separate `CONFIRMED`, `SUSPECTED`, and `NOT VERIFIED`. If no defects are confirmed, say so honestly and document investigation limits.

### Phase 4 — Final engineering and documentation

- Create `docs/ai-working-journal.md` recording **real** AI proposals, what was accepted/challenged/overridden, reasons and validation.
- Create `docs/execution-results.md` with actual commands, exit codes, test counts, durations when observed, and blocked tests.
- Update the existing `README.md` with prerequisites, setup, test execution, troubleshooting and known limitations.
- Create `docs/walkthrough-notes.md` for a 15–20 minute demo, 10–15 minute Q&A, 10-minute next-steps plan and 5-minute panel questions.
- Review `git diff`, remove temporary files, check for secrets, create incremental meaningful commits if the Git repository is available. Do not invent commit history.

### Phase 5 — Verify and hand off

Run the most valuable suites again. Report exact PASS/FAIL/BLOCKED/NOT RUN status for each layer. A confirmed product bug is an acceptable documented failure; do not hide it. Provide a concise final summary listing implemented tests, verified defects, limitations, commands and artifacts.

## Time management

Target **2–3 hours of actual work**, maximum **5 hours**. Do not claim to measure time if no clock or tracking is available. Suggested allocation: 30 minutes baseline, 25 strategy, 85 tests, 20 debugging, 20 documentation. Prefer fewer well-executed tests over broad unverified scaffolding. At the cap, stop and report accurately.

## Behaviour rules

1. Work in the existing repository and preserve application functionality.
2. Reuse existing tests, fixtures, POMs, helpers, Maven and Node configurations.
3. Avoid unnecessary new dependencies and unrelated refactoring.
4. Keep secrets out of code, Git, logs and screenshots.
5. Do not create fictitious evidence or test results.
6. Do not assume UI/API/business behaviour without inspection.
7. Never use hard-coded sleeps to mask asynchronous failures.
8. Prefer Playwright web-first assertions, React Testing Library user-facing queries, JUnit/Mockito for isolated business rules.
9. Do not delete a failing test if it reveals a genuine application defect.
10. Do not stop after analysis: implement, execute and document as far as your tools allow.
11. Do not ask for approval between ordinary phases; ask only when an essential blocker or potentially destructive action requires it.
12. At the end of every phase, show findings, changed files, executed commands/results, AI decisions and next step.

## Begin now

Start Phase 0 immediately by inspecting the supplied source and assessment, then continue autonomously through the remaining phases. Deliver **real code changes and reproducible documentation**, not just a high-level plan. If execution is impossible in your environment, state precisely what could and could not be verified and supply the exact commands to finish locally.

# MANDATORY EXECUTION AND SUCCESS VERIFICATION

You are responsible for implementing, executing, debugging, and verifying the complete CHUBB QA assessment.

**Generating code without executing it is NOT considered completion.**

## 1. Mandatory Runtime Execution

You MUST:

1. Verify that Docker Desktop or Docker Engine is running.
2. Validate the existing Docker Compose configuration.
3. Start the required application services.
4. Verify service health and readiness.
5. Verify frontend accessibility.
6. Verify backend API accessibility.
7. Verify database connectivity.
8. Verify authentication services.
9. Verify Kafka and WebSocket functionality where required by selected tests.
10. Execute all implemented test suites.

Never claim that a service is working without verifying it.

## 2. Mandatory Test Execution

Execute the all tests using the actual repository's build tools and configuration:

- Java unit tests using Maven or Gradle.
- React component tests using the configured test runner.
- Playwright API tests.
- Playwright UI/E2E tests.
- Integration tests.
- Kafka/WebSocket tests where implemented.

Use the repository's existing scripts whenever possible.

## 3. Mandatory Failure Resolution Loop

For every failed test:

**STEP 1 — Capture**
- Capture the error message, stack trace, logs, and relevant evidence.

**STEP 2 — Diagnose**
- Determine whether the failure is caused by test code, application code, environment configuration, test data, or infrastructure.

**STEP 3 — Fix TEST**
- Fix only the test script
- Do not modify production business rules simply to force tests to pass.
- Preserve failing tests that demonstrate genuine application defects.

**STEP 4 — Rerun**
- Execute the failed test again.
- Verify the result and confirm it as defect or test script issue.

Do not use artificial assertions, skipped tests, disabled tests, hard-coded waits, or weakened validation to manufacture passing results.

## 4. Mandatory Quality Gates

Before declaring completion, verify:

- All required test files exist.
- Code compiles.
- Imports and dependencies resolve.
- Test fixtures initialize successfully.
- Docker services required by the selected tests are healthy.
- All selected tests have been executed.
- No test is silently skipped.
- No test-framework failures remain unresolved.
- Every application defect has supporting evidence.
- Test reports contain real execution results.
- Documentation matches the actual implementation.
- The AI working journal records genuine decisions.
- No credentials or secrets are committed.
- Git changes are reviewed.

## 5. Final Execution Report

Generate `docs/final-execution-report.md` containing:

| Test Suite | Total | Passed | Failed | Skipped | Status | Priority
|---|---|---|---|---|---|---|
| Java Unit | Actual | Actual | Actual | Actual | Verified |P0/P1/P2|
| React Component | Actual | Actual | Actual | Actual | Verified |P0/P1/P2|
| Playwright API | Actual | Actual | Actual | Actual | Verified |P0/P1/P2|
| Playwright E2E | Actual | Actual | Actual | Actual | Verified |P0/P1/P2|
| Integration | Actual | Actual | Actual | Actual | Verified |P0/P1/P2|

Do not invent execution statistics.

## 6. Completion Criteria

Mark the assessment as:

**VERIFIED WITH APPLICATION DEFECTS:** Tests execute, but one or more fail because of confirmed application defects. Preserve evidence and document those defects.

**BLOCKED:** Required execution cannot be completed because of an unresolved infrastructure, environment, or dependency problem.

**INCOMPLETE:** Mandatory tests or deliverables have not been implemented or verified.

Never report VERIFIED PASS when any required test has failed or was not executed.

## 7. Autonomous Execution

Continue automatically through implementation, execution, debugging, and verification without requesting routine approvals.

Do not stop merely because code generation is complete.

If blocked, document the exact cause, attempt reasonable non-destructive recovery, and continue with independent tasks.

Respect the assessment's five-hour maximum and report any unfinished work transparently.