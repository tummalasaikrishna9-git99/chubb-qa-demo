# QA Walkthrough Notes

## Suggested walkthrough (15–20 minutes)

### 1. Architecture and risk focus (3–4 minutes)

Explain the actual implementation flow: Next.js/React UI → Spring BFF → claims service → PostgreSQL. Keycloak handles authentication, while Kafka/WebSocket supports claim updates. The most consequential risks are validation/state integrity, claimant ownership and admin authorization, claim submission/persistence, and configuration at the UI-to-BFF boundary.

Point out that the assessment brief describes Angular, but the repository contains a Next.js/React application. Tests and commands follow the code that is present.

### 2. Strategy and prioritization (3 minutes)

Open [test-strategy.md](./test-strategy.md). Explain:

- P0 focuses on claim validation and state changes, authorization, and successful submission.
- P1 focuses on routing and asynchronous/event integration.
- P2 focuses on dashboard/cache and related behavior.
- P3–P5 are lower-risk combinations, compatibility/accessibility breadth, and performance/resilience; they were not completed.
- The browser tests use BFF stubs, so their scope is UI workflow confidence, not proof of persistence or live service integration.

### 3. Test cases and execution steps (7–9 minutes)

#### Unit and component tests

- `ClaimValidationBoundaryTest.java` verifies accepted minimum amount/text lengths and maximum amount/text lengths in the Java domain.
- `claim-schema-boundaries.test.ts` checks the same lower/upper boundaries in the frontend schema and rejects out-of-range values.
- Existing claim domain/status/use-case suites cover state transitions, user existence, claim creation, ownership, and event publishing. `CreateClaimUseCaseTest` asserts a `ClaimSubmitted` event is published and domain events are cleared after publication.
- The BFF `RbacIntegrationTest` exercises unauthenticated 401, claimant 403 for admin actions, and admin access using Spring MockMvc security support.
- Existing component/store tests exercise visible React behavior and persistence. The theme-store test was aligned with the actual `sessionStorage` persistence behavior.
- `bff-routing-regression.test.ts` asserts local requests use port 8090. It is intentionally failing because the client currently sends the request to port 8080.

Run frontend unit/component tests with `npm test` from `code/demo-app-ui`; run Java unit/controller suites with `mvn test` from each Java service directory. On this run, Vitest reported 269 passed and the routing regression failed; claims-service reported 199 passed and BFF reported 213 passed.

#### Stubbed Playwright E2E cases

Open `code/demo-app-ui/tests/e2e/claims-flow.spec.ts`:

1. **Unauthenticated redirect (P0):** start with no auth cookie; visit `/claims`; assert the browser redirects to login and displays the login heading.
2. **Claim wizard and UI readback (P0):** set a cookie only to pass the UI middleware check; stub `GET /api/claims` as empty; enter incident date, location, and amount; go to supporting details and enter a description; review and submit; assert the POST body; have the stub return the created claim on subsequent list/detail requests; verify the claim appears in the list and details modal.
3. **Denied detail response (P0):** return a claim summary from the list request and 403 from the details request; assert the modal shows the authorization error and does not show protected detail fields.

Run with `npx playwright test --project=chromium --workers=1`. All three passed. Clarify that the cookie is not a real JWT and readback comes from the test’s in-memory API stub.

#### Live browser-to-service integration case

Open `code/demo-app-ui/tests/integration/live-claims.spec.ts`:

1. Navigate to the live login page and log in with the seeded claimant account.
2. Fill the claim wizard and submit a uniquely marked claim.
3. Assert the live API responds 201 and returns a claim ID.
4. Verify the claim appears in the live claims list and details.

Run with environment variables and `npm run test:integration`; the exact safe local command is in [execution-results.md](./execution-results.md). Run this separately from stubbed E2E because both target port 3001. This run attempted the test but got `ERR_CONNECTION_REFUSED` at `http://localhost:3001/login`; no login, write, or database readback occurred. It is therefore **blocked, not passed**. It leaves data in the target database when it does run; use a disposable stack.

#### Testcontainers integration cases

- `ClaimRepositoryIntegrationTest` starts PostgreSQL through Testcontainers and verifies save/readback, ordering, status timestamp updates, and constraints.
- `ClaimEventKafkaConsumerIntegrationTest` publishes claim-submitted, status-changed, and CDC messages and waits for expected WebSocket handler broadcasts.

Run the `integration` tag in each Java service using the command in [execution-results.md](./execution-results.md). The latest attempts errored before assertions because Docker could not be reached: 3 claims-service test errors and 4 BFF test errors. Do not present these as product-test failures or passes.

### 4. Execution outcome and defects (3–4 minutes)

Open [execution-results.md](./execution-results.md). Report the fresh suite totals, not only the earlier run: 199 claims unit tests pass; 213 BFF default tests pass; Vitest has 269 passes and the known routing regression failure; stubbed Chromium E2E has 3 passes; live UI integration and Testcontainers suites are blocked by unavailable services/Docker. Pact tests are not implemented. Full TypeScript checking has unrelated existing errors.

Git history begins with a newly initialized snapshot commit because the supplied folder had no Git metadata; it is not the original assessment work history.

Do not describe the 403 stub as a live authorization test or the stubbed read-back as persistence coverage.

## Q&A topics (10–15 minutes)

- **Why these tests first?** Claim integrity and authorization failures have higher impact than cosmetic or broad compatibility issues.
- **Why leave a regression failing?** It provides executable evidence of a real default-routing defect; masking it would make the suite misleading.
- **Does the E2E flow prove persistence?** No. It verifies the UI request/response path with an in-memory BFF stub. The repository has a separate PostgreSQL Testcontainers integration test that requires Docker.
- **Are contract tests covered?** Not currently. Dependencies/configuration alone do not constitute contract test execution; no Pact tests/artifacts were identified.
- **Are disputes or false positives covered?** No distinct dispute or false-positive detection flow was found. The access-denied test checks UI handling of a 403 and is not fraud/false-positive testing.
- **Can integration tests run locally?** Yes, after Docker is available; commands and selectors are in [execution-results.md](./execution-results.md).

## Next steps (10 minutes)

1. Fix or deliberately configure the frontend BFF default and rerun the routing regression.
2. Start Docker and run the tagged PostgreSQL/Kafka Testcontainers suites.
3. Execute and harden the implemented live UI integration flow, then add a second-user ownership check using real test authentication.
4. Implement executable provider/consumer contract verification from the OpenAPI contracts or Pact interactions.
5. Add dispute/false-positive cases only after confirming the product requirements and API behavior.
6. Resolve the pre-existing TypeScript errors and run the full static/type checks.

## Panel questions (5 minutes)

- Which uncovered failure would have the greatest business impact?
- What evidence would be required to test the dispute or false-positive workflow without inventing requirements?
- How would the suite separate a BFF routing defect from an unavailable service?
- Which tests belong in the pull-request gate versus a slower nightly run?
- How would you make integration test data independent and safe to rerun?

## Documents and commands

- Strategy: [test-strategy.md](./test-strategy.md)
- Execution results and commands: [execution-results.md](./execution-results.md)
- UI unit/component suite: `npm test` from `code/demo-app-ui`
- UI E2E suite: `npm run test:e2e` from `code/demo-app-ui`
- Maven default suite: `mvn test` from each service project
- Maven integration suite: see the exact tagged commands in [execution-results.md](./execution-results.md)
