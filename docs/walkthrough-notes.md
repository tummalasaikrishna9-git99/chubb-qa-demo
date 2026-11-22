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

### 3. E2E test walkthrough (5–7 minutes)

Open `code/demo-app-ui/tests/e2e/claims-flow.spec.ts` and walk through:

1. **Protected route:** visit `/claims` without an access cookie; assert redirect to `/login`.
2. **Submission and read-back:** set the middleware cookie, stub the claims API, start from the empty state, fill the date/location/amount and description steps, review the claim, submit it, verify the POST body, then verify the generated record in the claims table and detail modal.
3. **Access denied:** return a 403 for detail retrieval and assert the authorization message appears without private claim fields.

Emphasize that the stub preserves submitted data for deterministic list/detail reads. This validates the UI behavior and request shape; it does not claim that a real database persisted the record. A separate live test is implemented in `tests/integration/live-claims.spec.ts`; it requires the Docker stack and seeded claimant credentials, writes a persistent uniquely marked claim, and has not been run in this environment.

### 4. Execution outcome and defects (3–4 minutes)

Open [execution-results.md](./execution-results.md). Report the three stubbed Chromium E2E tests passing and the recorded Maven suite results. Be transparent that one Vitest test intentionally fails on the default frontend BFF URL (`8080` vs BFF `8090`), that the new live test and Docker/Testcontainers integration tests could not run because Docker was unavailable, and that no Pact contract suite was found. The full TypeScript check also reports unrelated existing errors.

The supplied directory has no Git metadata, so its earlier development history cannot be presented. If a new local repository is initialized, disclose that it starts from the current snapshot and is not the original commit history.

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
3. Add a live API integration flow that creates a claim, reads it back from persistence, and validates ownership using real test authentication.
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
