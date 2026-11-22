import { expect, test } from '@playwright/test';

const claimId = '660e8400-e29b-41d4-a716-446655440001';
const claimantId = 'e2e-claimant';
const incidentDate = '2026-02-15';
const description = 'A pipe burst and caused water damage in the basement.';
const submittedAt = '2026-02-17T10:30:00.000Z';

function claimResponse(overrides: Record<string, unknown> = {}) {
  return {
    claimId,
    userId: claimantId,
    incidentDate,
    incidentLocation: '12 Example Street, Singapore',
    description,
    claimAmount: 1250.5,
    status: 'SUBMITTED',
    createdAt: submittedAt,
    updatedAt: submittedAt,
    ...overrides,
  };
}

async function authenticateAsClaimant(page: import('@playwright/test').Page) {
  await page.context().addCookies([
    {
      name: 'access_token',
      value: 'e2e-access-token',
      url: 'http://localhost:3001',
      httpOnly: true,
    },
  ]);
}

test('redirects unauthenticated visitors from claims to login', async ({ page }) => {
  await page.goto('/claims');

  await expect(page).toHaveURL(/\/login\?redirect=%2Fclaims$/);
  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
});

test('submits a claim and reads it back in the claims list and details', async ({ page }) => {
  await authenticateAsClaimant(page);

  let createdClaim: ReturnType<typeof claimResponse> | undefined;
  await page.route('**/api/claims**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'POST' && url.pathname === '/api/claims') {
      const requestBody = request.postDataJSON() as {
        incidentDate: string;
        incidentLocation: string;
        description: string;
        claimAmount: number;
      };
      createdClaim = claimResponse({
        incidentDate: requestBody.incidentDate,
        incidentLocation: requestBody.incidentLocation,
        description: requestBody.description,
        claimAmount: requestBody.claimAmount,
      });
      await route.fulfill({ status: 201, json: createdClaim });
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/api/claims') {
      const summary = createdClaim
        ? {
            claimId: createdClaim.claimId,
            incidentDate: createdClaim.incidentDate,
            description: createdClaim.description,
            claimAmount: createdClaim.claimAmount,
            status: createdClaim.status,
            createdAt: createdClaim.createdAt,
          }
        : [];
      await route.fulfill({ json: createdClaim ? [summary] : [] });
      return;
    }

    if (
      request.method() === 'GET' &&
      url.pathname === `/api/claims/${claimId}` &&
      createdClaim
    ) {
      await route.fulfill({ json: createdClaim });
      return;
    }

    await route.fulfill({ status: 404, json: { detail: 'Not found' } });
  });

  await page.goto('/claims');
  await expect(page.getByText('No claims yet')).toBeVisible();
  await page.getByRole('button', { name: 'Submit New Claim' }).click();

  await page.getByLabel(/When did the incident occur/).fill(incidentDate);
  await page
    .getByLabel(/Where did the incident occur/)
    .fill('12 Example Street, Singapore');
  await page.getByLabel('Claim Amount').fill('1250.50');
  await page
    .getByTestId('wizard-step-1')
    .getByRole('button', { name: 'Next' })
    .click();

  await page.getByLabel(/Describe what happened/).fill(description);
  await page
    .getByTestId('wizard-step-2')
    .getByRole('button', { name: 'Next' })
    .click();

  await expect(page.getByRole('heading', { name: 'Review Your Claim' })).toBeVisible();
  await expect(page.getByText('$1,250.50')).toBeVisible();
  const submittedClaim = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/claims') && request.method() === 'POST'
  );
  await page.getByRole('button', { name: 'Submit Claim' }).click();

  const request = await submittedClaim;
  expect(request.postDataJSON()).toEqual({
    incidentDate: expect.any(String),
    incidentLocation: '12 Example Street, Singapore',
    description,
    claimAmount: 1250.5,
  });

  await expect(page.getByRole('heading', { name: 'My Claims' })).toBeVisible();
  await expect(
    page.getByRole('row').filter({ hasText: 'A pipe burst and caused water damage' })
  ).toBeVisible();
  await page.locator('[data-testid="view-details-button"]:visible').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(claimId)).toBeVisible();
  await expect(dialog.getByText('12 Example Street, Singapore')).toBeVisible();
  await expect(dialog.getByText(description)).toBeVisible();
});

test('does not show claim details when the BFF denies access', async ({ page }) => {
  await authenticateAsClaimant(page);

  await page.route('**/api/claims**', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET' && url.pathname === '/api/claims') {
      await route.fulfill({
        json: [
          {
            claimId,
            incidentDate,
            description: 'Claim summary',
            claimAmount: 1250.5,
            status: 'SUBMITTED',
            createdAt: submittedAt,
          },
        ],
      });
      return;
    }

    await route.fulfill({
      status: 403,
      json: { detail: 'You are not authorized to view this claim.' },
    });
  });

  await page.goto('/claims');
  await expect(page.getByText('Claim summary').first()).toBeVisible();
  await page.locator('[data-testid="view-details-button"]:visible').click();

  await expect(page.getByTestId('claim-detail-modal').getByRole('alert')).toContainText(
    'You are not authorized to view this claim.'
  );
  await expect(page.getByText('12 Example Street, Singapore')).not.toBeVisible();
});
