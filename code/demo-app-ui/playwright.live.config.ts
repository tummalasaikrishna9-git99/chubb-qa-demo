import { defineConfig, devices } from '@playwright/test';

const requiredEnvironment = [
  'LIVE_E2E_BASE_URL',
  'LIVE_E2E_CLAIMANT_EMAIL',
  'LIVE_E2E_CLAIMANT_PASSWORD',
] as const;

const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name]
);

if (missingEnvironment.length > 0) {
  throw new Error(
    `Live integration tests require: ${missingEnvironment.join(', ')}`
  );
}

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  outputDir: 'test-results-live',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-live-report' }],
    ['junit', { outputFile: 'playwright-live-report/results.xml' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.LIVE_E2E_BASE_URL,
    trace: 'retain-on-failure',
  },
});
