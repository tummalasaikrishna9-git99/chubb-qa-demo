# CHUBB APAC QA Assessment — AI Agent Context

> **Purpose:** Central engineering and execution policy for AI-assisted completion of the CHUBB APAC Claims Management QA take-home. Pair this file with `chubb-qa-execution-prompt.md`, the official assessment DOCX, and the supplied repository. This file governs **how** to work; the official assessment governs **what is required**; the checked-out source and observed runtime govern **what the application actually does**.

## 1. Authority and conflict resolution

1. Official `V1_Chubb_APAC_Take-Home_Assessment_QA.docx`: assessment requirements, time guidance, deliverables, evaluation criteria.
2. Repository source code, configuration, API specifications, migrations, and observed running behaviour: actual implementation and technical contracts.
3. `ARCHITECTURE.md` and `README.md`: documented design and commands; verify against code/runtime.
4. This context: implementation practices and workflow.
5. `playwright-mcp-context.md`: reusable Playwright conventions, adopted only where compatible with this repository and assessment time budget.

The official brief describes an Angular app without tests. The supplied repository's README describes **Next.js 16 / React 19 with existing tests**, plus Java 21/Spring Boot 4 services. **Do not replace React with Angular or assume the test suites are empty.** Explicitly document the discrepancy in the strategy and use React Testing Library when testing React components. Do not mistake an architecture diagram for proof of business requirements.

## 2. Non-negotiable objectives

- **Required:** concise risk-based test strategy; user-observable component tests using Testing Library; isolated unit tests; meaningful integration tests across important flows; real issue/quality concern log; reproducible working suite; meaningful Git history; truthful AI working journal; walkthrough readiness.
- **Optional:** visual regression, k6/load, broad contract coverage, exhaustive Kafka infrastructure. Pursue only after required work is credible.
- **Time:** aim for 2–3 hours, hard cap 5 hours of actual assessment work. Track real time honestly. Do not fabricate timestamps, commits, test runs, or AI decisions.
- **Evaluation:** quality over count. A legitimately failing test that demonstrates an application bug must not be weakened or deleted to make the suite green.

## 3. Verified repository orientation (from supplied ZIP)

- Root: `README.md`, `ARCHITECTURE.md`, `docker-compose.infra.yml`, `docker-compose.apps.yml`, start/stop scripts.
- Frontend: `code/demo-app-ui/` — Next.js/React, Vitest/Testing Library, Playwright configuration.
- Backend: `code/claims-service/` — Spring Boot, Java, domain/use cases, JUnit/Mockito, repository/integration tests.
- Gateway: `code/bff-service/` — Spring Boot BFF, REST forwarding, auth and WebSocket, JUnit/Mockito, integration and security tests.
- Infrastructure documented: PostgreSQL, Redis, Kafka, Keycloak; optional Debezium CDC.
- Existing source includes many Java tests, including `ClaimTest`, `ClaimStatusTest`, `CreateClaimUseCaseTest`, `UpdateClaimStatusUseCaseTest`, `RbacIntegrationTest`, `ClaimEventKafkaConsumerIntegrationTest`, and `ClaimRepositoryIntegrationTest`. Existing tests are **not evidence of passing execution**.
- README documents UI `http://localhost:3001`, BFF `:8090`, claims `:8080`, Keycloak `:8180`, Kafka UI `:9093`; confirm configuration and availability at runtime.
- README states direct Kafka and Debezium CDC are alternative event modes; running both can duplicate notifications. Verify mode before testing.

## 4. Required discovery before editing

1. Inventory repository files, test runners, dependencies, configs, Git status and existing tests.
2. Read domain entities, status transition rules, validation, controllers, DTOs, OpenAPI specs, migrations, security config, Kafka event handlers and frontend forms.
3. Draw a **source-evidenced** flow: browser → Next.js → BFF → claims service → PostgreSQL; authentication via Keycloak; Kafka → BFF → WebSocket → UI; Redis where used.
4. Extract business rules only from explicit source/contract evidence. For every disputed behaviour, label it `specified`, `implemented`, `observed`, or `unknown`.
5. Establish baseline by running available tests and capturing commands, exit codes, pass/fail/skip counts, errors, and environment limitations. If not runnable, mark `NOT RUN`.
6. Prioritize tests based on impact × likelihood × integration complexity; document tradeoffs and exclusions.

## 5. Recommended test allocation

| Priority | Coverage | Test mechanism | Goal |
|---|---|---|---|
| P0 | Claim validation and legal state transitions | Existing Java JUnit/Mockito domain/use-case tests | Catch corrupt business state |
| P0 | Ownership and admin authorization | BFF/service security integration or API tests | Prevent cross-user access/unauthorized changes |
| P0 | Claim creation/retrieval with real services | Playwright/API integration | Prove end-to-end persistence |
| P1 | Form validation and feedback | React Testing Library + existing Vitest setup | Verify user-observable UI behaviour |
| P1 | Kafka → BFF → WebSocket update | Focused integration test | Detect stale real-time state |
| P1 | Error handling, duplicate events, transaction boundaries | Targeted service/integration tests | Detect brittle cross-layer behaviour |
| P2 | Cache consistency, contract checks | Existing testing infrastructure | Extend coverage if time allows |
| Bonus | Load, visual, exhaustive combinations | k6/visual tooling | Only if required coverage is complete |

**Priority is provisional until the code is inspected.** A missing business rule is not automatically a bug. Invalid transitions must be assessed against the actual `ClaimStatus` rules and the contract, not an assumed industry workflow.

## 6. Playwright + TypeScript conventions

- Extend `code/demo-app-ui/playwright.config.ts` and its existing E2E directories; do not create a second competing framework.
- Prefer `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, `getByTestId`; inspect actual DOM before selecting.
- Use Page Objects and typed custom fixtures where they meaningfully reduce duplication. Build page objects before fixtures, then tests; do not force unnecessary wrappers for one-off actions.
- Prefer web-first assertions, Playwright auto-waiting, `test.step`, traces/screenshots on failure. No arbitrary `waitForTimeout`, brittle positional selectors, or assertions that cannot fail.
- Use isolated per-test data, deterministic cleanup, bounded asynchronous polling, and parallel-safe accounts/records. Do not use `describe.serial` as a substitute for test independence.
- API tests use `APIRequestContext` and verified routes/contracts; schema checks only when supported by actual OpenAPI/response data. DB assertions use actual migrations/schema and parameterized queries.
- Reuse project environment conventions. Never commit tokens, passwords, real secrets or captured auth state. Demo credentials in README are not authorization to expose them in generated logs.
- TypeScript: strict types, no unnecessary `any`, reuse existing types/helpers, no duplicate files or dependencies.

## 7. Java / React / messaging conventions

- Java: JUnit 5, Mockito, AssertJ, Spring Boot Test/Testcontainers where already configured. Test domain rules in isolation and integration boundaries with the smallest credible setup. Use parameterized boundary cases and verify side effects, not only method invocation.
- React: Testing Library queries by role/label, user-event when configured, assert visible messages and user behaviour, not component implementation details.
- Kafka/WebSocket: test actual topics, event schema, consumer wiring, delivery/retry semantics and eventual UI state. Wait on observable conditions with bounded timeouts; do not sleep a fixed number of seconds. Avoid assuming exactly-once delivery.
- Database: prefer disposable data and rollback/cleanup; validate persistence when it adds value beyond API response assertions.
- Auth: distinguish claimant/admin and missing/expired tokens. Verify server-side authorization, not only hidden buttons.

## 8. Mandatory working sequence

**Phase 0 — Baseline:** read brief, context, repo; confirm available tools and clock; record Git state and test inventory; attempt baseline commands.

**Phase 1 — Strategy:** create `docs/test-strategy.md` with architecture, evidence-based rules, risk matrix, coverage selections/exclusions, environment, and residual risks.

**Phase 2 — High-value tests:** improve/add focused Java domain/use-case tests; React component tests; API/E2E integration; Kafka/WebSocket only where time allows. For each test: identify source requirement → dependencies → data → implement → run → diagnose → rerun → log evidence.

**Phase 3 — Defects:** create `docs/defect-report.md`; include ID, title, classification (confirmed/suspected), preconditions, reproducible steps, expected/actual, source references, evidence, impact and disposition. Do not invent defects. Preserve reproducible failing tests when appropriate.

**Phase 4 — Documentation:** create/update `docs/ai-working-journal.md`, `README.md` test section, `docs/execution-results.md`, `docs/walkthrough-notes.md`. Journal must record actual AI suggestions accepted/challenged/overridden and why.

**Phase 5 — Submission:** run relevant tests, check changed files and secrets, create meaningful Git commits if Git is available, verify commands, package/repository only as requested, provide honest final handoff.

## 9. Required evidence and test-case traceability

For each selected scenario record: `TC-ID | feature | source evidence (path + symbol/line) | priority P0–P5 | type | steps | test data | expected result | actual result | status | issue link`. Do not fill `actual result` from expectation. Status vocabulary: `PASS`, `FAIL-APP-DEFECT`, `FAIL-TEST`, `BLOCKED`, `NOT RUN`, `SKIPPED` (with reason).

For all test executions capture exact command, timestamp if available, environment, exit code, pass/fail/skip, and relevant evidence path. An unrun test cannot be called passing. Do not chase a 100% pass rate by hiding defects.

## 10. Required repository artifacts

```text
docs/
  test-strategy.md
  test-case-matrix.md
  defect-report.md
  ai-working-journal.md
  execution-results.md
  walkthrough-notes.md
README.md                    # extend existing, do not replace
code/claims-service/...      # focused existing-style Java tests
code/bff-service/...         # security/messaging tests where valuable
code/demo-app-ui/...         # React tests + Playwright tests
```

Only create files that add value; the layout is guidance, not a mandate to duplicate existing files.

## 11. Timeboxing and stop rules

Suggested 180-minute allocation: 30 min discovery/baseline, 25 min strategy, 85 min focused tests, 20 min execution/defect investigation, 20 min documentation/commits. Adjust based on setup cost. At the 2–3 hour mark, prioritize a verified, explainable submission over additional shallow tests. Never exceed five hours without stopping and obtaining explicit direction.

If Docker, Java, Maven, Node or browser automation is unavailable: do not fake a result; document blocker, run the feasible subset, give reproducible commands for the rest. If application bug is discovered, document it instead of changing product logic to force green tests. If baseline is broken, distinguish pre-existing failures from introduced regressions.

## 12. Output format after each phase

- **Phase / elapsed time:** actual, not invented.
- **Source evidence:** paths, methods, contracts, observations.
- **Decisions:** what was prioritized/deferred and why.
- **Files changed:** exact paths and purpose.
- **Execution:** commands, outcomes, blockers.
- **AI journal entry:** accepted/challenged/overridden decision.
- **Next action:** highest-value remaining step.

Do not stop merely to ask permission after every phase; continue within the agreed scope. Ask only for genuine blockers, missing credentials, destructive actions, or decisions that materially change scope.

## 13. Definition of done

Required coverage types exist and are meaningful; tests are run wherever possible; known failures are honestly documented; strategy, exclusions, AI journal and reproducible instructions exist; Git history is meaningful if Git operations are available; no leaked secrets or unrelated production changes; walkthrough notes can explain each decision and each nontrivial assertion. **The goal is a defensible assessment, not a cosmetically all-green report.**
