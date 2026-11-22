# Defect and Quality Concern Report

Findings below separate reproducible behavior from configuration discrepancies that could not be exercised because the Docker daemon was unavailable.

## Confirmed: frontend API default targets the claims service port instead of the BFF

- **Status:** Confirmed by the retained frontend routing regression test.
- **Severity:** High for local development without an explicit BFF URL; lower where deployment injects the correct URL.
- **Evidence:** `code/demo-app-ui/src/lib/api/bff-client.ts` falls back to `http://localhost:8080`; Compose maps the claims service to 8080 and the BFF to 8090. `tests/unit/bff-routing-regression.test.ts` observed a request to `http://localhost:8080/api/claims/claim-id` where the documented BFF URL is port 8090.
- **Reproduction:** From `code/demo-app-ui`, run the routing regression with `NEXT_PUBLIC_BFF_URL` unset. Observe the actual request URL and compare it with the BFF port in `docker-compose.apps.yml`.
- **Expected:** The normal frontend client calls the BFF on port 8090 by default, or clearly requires a configured URL.
- **Actual:** Without `NEXT_PUBLIC_BFF_URL`, the client calls port 8080.
- **Impact:** Local browser API calls can reach the claims service directly or fail due to wrong path/auth expectations. The Docker UI service explicitly supplies port 8090, so that deployment path is configured differently.
- **Action:** Regression remains failing to preserve evidence. Fix the default/configuration and then update the regression to assert correct behavior.

## Confirmed configuration/documentation discrepancy: CDC mode

- **Status:** Source/config discrepancy confirmed; runtime event impact not verified.
- **Severity:** Medium until the intended default and deployment mode are clarified.
- **Evidence:** README previously described direct Kafka as default and CDC disabled. `docker-compose.apps.yml` sets `APP_EVENTS_CDC_ENABLED: "true"`; claims service `application.yml` sets `app.events.cdc-enabled: true`. The standard infra stack does not itself start the CDC connector; the repository provides a separate `start-cdc.sh` path.
- **Reproduction:** Compare the README event-mode section with the Compose environment and claims-service application configuration.
- **Expected:** Documentation, application property, Compose environment, and event infrastructure describe one consistent default.
- **Actual:** Documentation and checked-in runtime configuration disagree. Under the checked-in value, CDC mode is selected, while standard startup does not automatically start the connector.
- **Impact:** Real-time claim notifications may not be delivered as expected when users follow the old “direct Kafka default” instructions.
- **Action:** README updated to describe the actual checked-in values and discrepancy. No event-mode code/config was changed because live Kafka/CDC behavior could not be verified.

## Confirmed test harness issue: missing Playwright global setup

- **Status:** Fixed.
- **Evidence:** Previous Playwright config referenced `tests/e2e/global-setup.ts`, which did not exist.
- **Impact:** Playwright could not list or run tests using the configured setup.
- **Action:** Removed the stale `globalSetup` reference. Playwright test discovery and the three Chromium stubbed E2E tests then passed.

## Existing TypeScript check errors

- **Status:** Confirmed quality concern, not diagnosed as caused by this work.
- **Evidence:** `npx tsc --noEmit` returned errors involving missing `beforeAll`/`afterAll` globals, stale `UserResponse.id` references, a toast option type mismatch, and test fixtures using string dates where `Date` is required.
- **Impact:** Full TypeScript validation is not currently a clean quality gate.
- **Action:** Errors are recorded in `docs/execution-results.md`; unrelated production/test code was not changed in this pass.
