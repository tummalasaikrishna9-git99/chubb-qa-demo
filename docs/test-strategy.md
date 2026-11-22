# Risk-Based Test Strategy

## Application and test scope

The application is a claims system with a Next.js/React UI, a Spring BFF, and a Spring claims service. The UI calls the BFF, which mediates authentication and claims requests to the service. Claims service persistence uses PostgreSQL; Kafka events can feed BFF WebSocket updates. Relevant sources include `code/demo-app-ui/app/(authenticated)/claims/new/page.tsx`, `code/demo-app-ui/src/features/claims/stores/use-claim-wizard-store.ts`, `code/bff-service/src/main/resources/openapi/bff-api.yml`, and the Java claim domain/use cases.

The official assessment material describes a different Angular implementation. This strategy follows the repository’s actual Next.js/React code and its existing Vitest, Playwright, and Maven configurations.

## Risk assessment and priorities

| Priority | Risk / impact | Test focus | Coverage and limits |
|---|---|---|---|
| P0 | Invalid claim data or an incorrect state transition can corrupt claim handling. | Claim field boundaries and legal/illegal status transitions. | Java domain and use-case tests run; UI schema boundary tests run. Live persistence is not covered by the browser suite. |
| P0 | Claimant access to another user’s claim or unauthorized admin actions can expose sensitive records or permit improper changes. | Ownership and role enforcement. | Use-case tests and BFF MockMvc/RBAC tests run. Browser denial handling is stubbed; it does not exercise a live JWT or BFF authorization decision. |
| P0 | Claim submission may appear successful but fail to persist or return the wrong record. | Submit through the wizard, read the list, open the detail view. | E2E covers the UI flow against a stateful in-memory BFF stub. A separate Testcontainers repository integration test exists but was not run in this environment; the E2E flow does not prove database persistence. |
| P1 | Frontend-to-BFF URL/configuration mismatch can make local submission fail. | Verify actual request URL and configuration. | A frontend routing regression test is intentionally failing: the default points to port 8080 while the BFF is on 8090. Docker Compose supplies an explicit BFF URL. |
| P1 | Event serialization, Kafka consumption, and WebSocket delivery cross service boundaries. | Envelope validation, producer/consumer behavior, observable update delivery. | Publisher and consumer unit tests exist; Kafka integration test is tagged `integration` and was not run. Live WebSocket delivery was not verified. |
| P2 | Dashboard, cache, error handling, and responsive claims display can degrade secondary user workflows. | Existing unit/controller coverage and targeted UI checks. | Existing suites ran where included. No load or broad viewport/browser matrix was executed. |
| P3 | Uncommon role/data combinations may produce inconsistent behavior. | Broader combinatorial authorization and malformed-data coverage. | Some role scenarios exist; broad combinations are deferred. |
| P4 | Browser, device, and accessibility variation may introduce usability issues. | Cross-browser, accessibility, and visual checks. | Not comprehensively tested. Chromium is the only browser used in the observed E2E run. |
| P5 | Throughput, soak, and resilience under operational stress may fail. | Load, soak, chaos, and recovery testing. | Not implemented or run. |

## Test levels and scope

### Unit and component

- Java tests cover claim domain constraints, status transitions, use cases, mapping, error handling, and event publishing.
- Vitest/Testing Library tests cover React components, form behavior, stores, and frontend schema boundaries.
- These are fast feedback tests and do not establish that all service boundaries work together.

### API/MVC and integration

- BFF MockMvc tests, including RBAC scenarios, exercise request/controller/security behavior inside Spring test contexts.
- Testcontainers tests are tagged `integration`; they exercise PostgreSQL persistence and Kafka event consumption. They were attempted, but Docker was unavailable and the container-backed tests errored before assertions.
- Run tagged tests separately as documented in [execution-results.md](./execution-results.md). Docker must be available.

### Browser E2E

The Playwright tests exercise the real Next.js routes and controls, but stub the BFF:

1. A request to `/claims` without an access cookie is redirected to login.
2. A claimant enters incident date, location, amount, and description; reviews and submits the claim; then sees it in the claims list and details. The stub returns the created record on read-back.
3. If the details endpoint returns 403, the UI shows an authorization error and does not display private claim fields.

The browser suite is not a live system E2E test: its cookie is a test value, the app middleware only checks cookie presence, and API responses are intercepted. It does not authenticate with Keycloak, persist to PostgreSQL, or verify live Kafka/WebSocket behavior.

An opt-in live test is now defined in `code/demo-app-ui/tests/integration/live-claims.spec.ts`. It performs a real UI login, submits a uniquely marked claim through the running UI/BFF/claims-service stack, and checks the resulting claim in the list and details. It requires an already running stack plus `LIVE_E2E_BASE_URL`, `LIVE_E2E_CLAIMANT_EMAIL`, and `LIVE_E2E_CLAIMANT_PASSWORD`. The test leaves the uniquely marked claim in the configured database. It has not been executed because the Docker daemon was unavailable; its existence is not a claim of verified live coverage.

### Contract

Pact dependencies are present in Maven configuration, but no Pact consumer/provider test classes or pact files were identified in the inspected tree. OpenAPI specifications and generated clients exist; generation is not contract-test execution. Therefore contract-test coverage is **not established**. Do not report the project as having passed contract tests until executable consumer/provider verification is added and run.

## Disputes and false positives

No separate dispute workflow or false-positive classification/detection behavior was identified in the selected claim submission and retrieval paths. The authorization E2E case verifies that a 403 is surfaced and protected details are not shown; it is not a test of fraud/false-positive detection. Business rules for disputes or false-positive handling need to be identified before meaningful tests can be specified.

## Intentional exclusions

Live external-service integration, full claim persistence through the browser, Keycloak login, full Kafka/WebSocket delivery, Pact verification, broad browser/device matrices, visual testing, and load testing were not represented as covered by the current results. The main reasons are environment availability and the time/risk-based focus on claim boundaries, authorization, submission UX, and the known routing configuration defect.
