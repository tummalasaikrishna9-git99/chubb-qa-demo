# Test Execution Results

## Summary

Results below distinguish tests actually executed from commands provided for future runs. The latest Playwright E2E run executed after removing the invalid `globalSetup` reference. Maven and frontend suite counts are the recorded results from the preceding QA execution; the repository does not contain a consolidated machine-generated report for those historical runs.

| Test suite | Total | Passed | Failed | Skipped | Status | Priority |
|---|---:|---:|---:|---:|---|---|
| Claims service Maven suite (default excludes `integration`) | 199 | 199 | 0 | 0 | PASS | P0–P2 |
| BFF Maven suite (default excludes `integration`) | 213 | 213 | 0 | 0 | PASS | P0–P2 |
| Frontend Vitest suite | 270 | 269 | 1 | 0 | FAIL — retained regression evidence | P0–P2 |
| Playwright Chromium E2E | 3 | 3 | 0 | 0 | PASS | P0–P1 |
| Live Playwright UI-to-service integration | 1 discovered | — | — | — | NOT RUN — Docker daemon unavailable | P0 |
| Tagged Testcontainers integration | Not run | — | — | — | BLOCKED / NOT RUN (Docker unavailable in the recorded run) | P0–P1 |
| Pact/API contract verification | Not run | — | — | — | NOT IMPLEMENTED / NOT RUN | P0–P1 |

## Findings and caveats

- **Git history:** The workspace arrived without `.git` metadata or a configured author. With user approval, a local repository was initialized using the supplied author identity. Commit `04edaa2` is an explicitly labeled snapshot of the extracted workspace; it does not recover or represent earlier development history.
- The one frontend failure is the deliberate BFF routing regression: with `NEXT_PUBLIC_BFF_URL` unset, the generated client sends requests to `http://localhost:8080`, while the BFF is configured on port `8090`. It was retained because it exposes a product configuration defect.
- The Playwright suite uses intercepted BFF responses. The claim read-back is from the test’s in-memory response fixture, not a database; the 403 is returned by the stub, not a live authorization service.
- A separate live-stack integration test has now been added. It logs in through the UI and creates/reads back a claim through the live services. It has not been run: Docker is installed but its daemon cannot be reached in this environment. It creates a unique claim and leaves it in the target database; use only a disposable stack.
- The full TypeScript check was also attempted and failed on existing errors in unrelated test/application files (missing `beforeAll`/`afterAll` globals, stale `UserResponse.id` assumptions, a toast option type mismatch, and test fixtures using string dates instead of `Date`).
- Targeted ESLint passed for both Playwright configs and both browser test files.
- Playwright listed the one live integration test using discovery-only placeholder environment values; that command does not log in or contact services.
- `docker compose ... config --quiet` passed for infra, app, and CDC Compose files. The Docker daemon was unavailable, so application services and Testcontainers were not started. A Java process listened on 8080, but UI (3001), BFF (8090), and Keycloak (8180) were not listening; the process on 8080 was not treated as verified claims-service health.
- Playwright’s Next.js server emitted a deprecation warning about the repository’s `middleware` filename convention. It did not prevent the three tests from passing.

## Commands to run

Run commands from the indicated directory. Use a Java 21-compatible JDK, Node/npm versions supported by the project, and Maven. The checked-out Maven wrappers do not have wrapper properties; use an installed `mvn` command unless the wrapper has been repaired.

### Frontend unit/component tests

```powershell
Set-Location .\code\demo-app-ui
npm ci
npm run generate:api
npm test
```

`npm test` invokes `vitest run`. For the complete suite with coverage:

```powershell
npm run test:coverage
```

### Playwright E2E

```powershell
Set-Location .\code\demo-app-ui
npm ci
npm run generate:api
npx playwright install chromium
npm run test:e2e
```

Playwright starts Next.js on port 3001. The local suite uses Chromium and its route handlers to stub BFF traffic. In CI, the config also includes Firefox and starts a production build/server. To list discovered tests without running them:

```powershell
npm run test:e2e -- --list
```

### Live Playwright integration

Start the full stack from the repository root (`./start-infra.sh`, then `./start-app.sh`), and set credentials for the seeded claimant. The test uses real authentication and service endpoints, and writes a uniquely marked claim to the database.

PowerShell:

```powershell
$env:LIVE_E2E_BASE_URL = "http://localhost:3001"
$env:LIVE_E2E_CLAIMANT_EMAIL = "claimant@demo.com"
$env:LIVE_E2E_CLAIMANT_PASSWORD = "<seeded claimant password>"
Set-Location .\code\demo-app-ui
npm run test:integration
```

The command fails at configuration load if any required variable is missing. Do not use shared or production data. The test does not delete the claim; discard the isolated test database/volume after the run. `npm run test:integration -- --list` only checks discovery; it does not prove service readiness or execute the test.

### Java unit and default Maven suites

The standard Maven test command excludes tests tagged `integration`; it runs the ordinary unit/controller/security suites and any test-framework contract tests that are actually present.

```powershell
Set-Location .\code\claims-service
mvn test

Set-Location ..\bff-service
mvn test
```

To run both services’ default suites in a single PowerShell session, execute each command from its project directory as above. The default BFF suite includes MockMvc/RBAC tests; these should not be mistaken for live end-to-end authorization against Keycloak.

### Tagged integration tests

Integration tests use Testcontainers and require Docker Engine/Desktop to be running and accessible to the current user.

Run only the tests tagged `integration`:

```powershell
Set-Location .\code\claims-service
mvn test '-Dgroups=integration' '-Dsurefire.excludedGroups='

Set-Location ..\bff-service
mvn test '-Dgroups=integration' '-Dsurefire.excludedGroups='
```

To run all tests, including integration tests, in either service:

```powershell
mvn test '-Dsurefire.excludedGroups='
```

Run this from each Maven project directory. This can take longer and starts Testcontainers dependencies where required. Integration tests in the claims service include PostgreSQL persistence; BFF includes the Kafka consumer integration test.

### Contract tests

There is no verified Pact test command at present. The POMs declare Pact dependencies/configuration, but the inspected repository contains no Pact test classes or pact files. Do not count `mvn test`, OpenAPI generation, or generated client compilation as contract verification.

After adding actual Pact provider/consumer tests and pact artifacts, run them with the relevant Maven test selection, for example:

```powershell
Set-Location .\code\bff-service
mvn test '-Dtest=*Pact*'

Set-Location ..\claims-service
mvn test '-Dtest=*Pact*'
```

These are only candidate selectors, not currently verified executable commands: confirm test class names and provider setup when contract tests are implemented. The current OpenAPI spec files can support schema/contract work:

- `code/bff-service/src/main/resources/openapi/bff-api.yml`
- `code/claims-service/src/main/resources/openapi/claims-api.yml`

### Optional static checks

```powershell
Set-Location .\code\demo-app-ui
npm run lint
npx tsc --noEmit
```

The recorded targeted ESLint command passed. The full `tsc --noEmit` check currently fails with unrelated existing TypeScript errors; it is not a passing quality gate.
