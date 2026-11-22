import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const claimantEmail = process.env.LIVE_E2E_CLAIMANT_EMAIL!;
const claimantPassword = process.env.LIVE_E2E_CLAIMANT_PASSWORD!;
const claimMarker = `LIVE-E2E-${randomUUID()}`;
const incidentDate = new Date().toISOString().slice(0, 10);
const incidentLocation = 'Live integration test - Singapore';
const claimAmount = '99.87';
const description = `${claimMarker}: create and read back a claim through the live application stack.`;

test('authenticates, creates a claim, and reads persisted data back', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(claimantEmail);
  await page.getByLabel('Password').fill(claimantPassword);

  await Promise.all([
    page.waitForURL('**/claims'),
    page.getByRole('button', { name: 'Log In' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'My Claims' })).toBeVisible();

  await page.getByRole('button', { name: 'Submit New Claim' }).click();
  await page.getByLabel(/When did the incident occur/).fill(incidentDate);
  await page.getByLabel(/Where did the incident occur/).fill(incidentLocation);
  await page.getByLabel('Claim Amount').fill(claimAmount);
  await page
    .getByTestId('wizard-step-1')
    .getByRole('button', { name: 'Next' })
    .click();

  await page.getByLabel(/Describe what happened/).fill(description);
  await page
    .getByTestId('wizard-step-2')
    .getByRole('button', { name: 'Next' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Review Your Claim' })
  ).toBeVisible();
  const submitResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/claims' &&
      response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Submit Claim' }).click();

  const submitResponse = await submitResponsePromise;
  expect(submitResponse.status()).toBe(201);
  const createdClaim = (await submitResponse.json()) as {
    claimId: string;
    incidentLocation: string;
    description: string;
    claimAmount: number;
  };
  expect(createdClaim.claimId).toBeTruthy();

  await expect(page.getByRole('heading', { name: 'My Claims' })).toBeVisible();
  const claimRow = page
    .getByRole('row')
    .filter({ hasText: claimMarker });
  await expect(claimRow).toBeVisible();
  await claimRow.getByRole('button', { name: 'View Details' }).click();

  const claimDetails = page.getByRole('dialog');
  await expect(claimDetails).toBeVisible();
  await expect(claimDetails.getByText(createdClaim.claimId)).toBeVisible();
  await expect(claimDetails.getByText(incidentLocation)).toBeVisible();
  await expect(claimDetails.getByText(description)).toBeVisible();
  expect(createdClaim).toMatchObject({
    incidentLocation,
    description,
    claimAmount: Number(claimAmount),
  });
});
