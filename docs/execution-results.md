# Test Execution Results

## Latest execution

Executed on 2026-11-22. Maven default suites and Vitest were run; Playwright stubbed E2E and the live integration test were run; both tagged Maven integration suites were attempted. Docker was unavailable, so live/Testcontainers errors below are environmental and do not establish product behavior.

| Test suite | Total | Passed | Failed / errors | Skipped | Status | Priority |
|---|---:|---:|---:|---:|---|---|
| Claims service default Maven suite | 199 | 199 | 0 | 0 | PASS | P0–P2 |
| BFF default Maven suite | 213 | 213 | 0 | 0 | PASS | P0–P2 |
| Frontend Vitest unit/component suite | 270 | 269 | 1 | 0 | FAIL — retained routing regression | P0–P2 |
| Stubbed Chromium Playwright E2E | 3 | 3 | 0 | 0 | PASS | P0 |
| Live Playwright UI-to-service integration | 1 | 0 | 1 (connection refused) | 0 | BLOCKED — UI not running | P0 |
| Claims-service tagged Testcontainers integration | 3 | 0 | 3 errors (Docker unavailable) | 0 | BLOCKED — Docker daemon unavailable | P0–P1 |
| BFF tagged Testcontainers/Kafka integration | 4 | 0 | 4 errors (Docker unavailable) | 0 | BLOCKED — Docker daemon unavailable | P1 |
| Pact/API contract verification | Not present | — | — | — | NOT IMPLEMENTED / NOT RUN | P1 |

The Java default suites cover multiple priorities; individual tests are not tagged with P0/P1/P2 metadata, so trustworthy per-priority test counts cannot be extracted. The matrix below maps executed scenarios to risk priorities without inventing test counts.

## Results by priority

| Priority | Coverage exercised | Result and limitation |
|---|---|---|
| **P0 — claim integrity, access control, and submission** | Java claim validation, status/use-case, claimant ownership and BFF RBAC tests are included in the passing Java default suites. Browser E2E covered unauthenticated route redirect, a full wizard submission/list/detail flow with stubbed BFF responses, and UI handling of a stubbed 403. A separate live login/create/readback scenario was attempted. | Unit/controller coverage and stubbed E2E passed as part of their suites. The live test did not reach `/login` because `localhost:3001` refused the connection; it did not test real authentication or persistence. |
| **P1 — service boundaries, routing, events** | The frontend BFF routing regression; Kafka event publisher/consumer unit coverage; tagged Kafka integration; OpenAPI artifacts. | The routing regression fails as expected: actual default request URL is `http://localhost:8080/api/claims/claim-id`, expected BFF URL is port 8090. The BFF and claims tagged integration runs errored before assertions because Testcontainers could not find a Docker environment. Pact verification is not implemented. |
| **P2 — dashboard/cache and supporting behavior** | Existing dashboard/cache/controller and other Java unit tests ran inside the default Maven suites; existing frontend component/store tests ran in Vitest. | Default Maven suites passed; Vitest has one unrelated-to-P2 routing regression failure. No separate P2 execution count is available because tests are not priority-tagged. |

## Failure diagnosis and environment evidence

- **Vitest:** one genuine application/configuration regression remains red. With `NEXT_PUBLIC_BFF_URL` empty, `bff-client.ts` called `localhost:8080`; BFF is configured on `8090`. Result: 269 passed, 1 failed. Vitest config was updated to exclude `tests/integration/**`, preventing the Playwright spec from being loaded as a Vitest test.
- **Stubbed E2E:** 3 passed. Next.js emits a non-blocking warning that the `middleware` filename convention is deprecated.
- **Live E2E:** 1 attempted, 0 passed. The isolated final run's primary error was `page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/login`. The test stopped before login, submit, or database readback. The run did not validate application behavior beyond service unavailability. A simultaneous initial run encountered the stubbed E2E server on the same port and exposed an ambiguous password locator; the locator was corrected, Playwright artifact output was separated, and the isolated rerun confirmed the stack is unavailable. Run stubbed and live Playwright configs serially because both target port 3001.
- **Claims Testcontainers:** 3 tests errored before assertions because Testcontainers reported “Could not find a valid Docker environment.”
- **BFF Testcontainers:** 4 tests errored for the same missing Docker environment.
- Docker CLI was installed, but `docker info` could not connect to `npipe:////./pipe/dockerDesktopLinuxEngine`. Ports 3001, 8090, and 8180 were not listening. A Java process listened on 8080, but that alone was not treated as verified service health.
- All three Compose files (`docker-compose.infra.yml`, `docker-compose.apps.yml`, `docker-compose.cdc.yml`) passed `docker compose ... config --quiet` syntax validation earlier; syntax validation does not start or health-check containers.
- Targeted ESLint on both Playwright configs and both browser test files passed. Full `npx tsc --noEmit` still reports existing errors: missing `beforeAll`/`afterAll` globals, stale `UserResponse.id` test references, invalid toast option typing, and string dates where `Date` is expected.
- Git history was initialized from the extracted workspace with user approval. Commit `04edaa2` is a snapshot, not recovered development history.

## Commands executed

Run from the relevant project directory. On this machine Maven was invoked from `C:\Users\tumma\AppData\Local\Temp\apache-maven-3.9.11\bin\mvn.cmd`; a globally installed `mvn` command was unavailable.

```powershell
# Claims service unit/default suite
Set-Location .\code\claims-service
mvn test

# BFF unit/default suite
Set-Location ..\bff-service
mvn test

# Frontend unit/component suite
Set-Location ..\demo-app-ui
npm test

# Stubbed browser E2E
npx playwright test --project=chromium --workers=1

# Claims Testcontainers integration
Set-Location ..\claims-service
mvn test '-Dgroups=integration' '-Dsurefire.excludedGroups='

# BFF Kafka/Testcontainers integration
Set-Location ..\bff-service
mvn test '-Dgroups=integration' '-Dsurefire.excludedGroups='

# Live browser-to-service test (run only against a disposable local stack)
Set-Location ..\demo-app-ui
$env:LIVE_E2E_BASE_URL = 'http://localhost:3001'
$env:LIVE_E2E_CLAIMANT_EMAIL = 'claimant@demo.com'
$env:LIVE_E2E_CLAIMANT_PASSWORD = '<seeded claimant password>'
npm run test:integration
```

The commands above are examples using a globally available `mvn`; use the Maven executable appropriate to your machine. Live integration writes a uniquely marked claim and does not delete it. Do not target production/shared data.

## Reproducible commands for a configured workstation

### Java default suites

```powershell
Set-Location .\code\claims-service
mvn test
Set-Location ..\bff-service
mvn test
```

By default, Maven excludes the `integration` tag.

### Frontend unit and stubbed E2E

```powershell
Set-Location .\code\demo-app-ui
npm ci
npm run generate:api
npm test
npx playwright install chromium
npm run test:e2e
```

Stubbed Playwright starts Next.js locally and intercepts BFF responses; it does not require the Docker stack.

Run the stubbed and live Playwright suites separately, not concurrently: the local stubbed E2E config starts Next.js on port 3001, which is also the default live-stack URL.

### Live Playwright and Testcontainers integration

Start Docker Desktop/Engine, run `./start-infra.sh` and `./start-app.sh` from the repository root, and verify UI, BFF, claims-service, Keycloak, and database health before running `npm run test:integration`. Supply claimant credentials via environment variables, not tracked files.

To run tagged Testcontainers tests, run this from each Maven project:

```powershell
mvn test '-Dgroups=integration' '-Dsurefire.excludedGroups='
```

### Contract tests

No executable Pact test suite or pact files were identified. Pact dependencies, OpenAPI specifications, and generated clients do not constitute contract test execution. Contract results are therefore **not implemented/not run**.
