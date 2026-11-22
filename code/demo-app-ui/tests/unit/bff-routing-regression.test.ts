import { afterEach, describe, expect, it, vi } from 'vitest';

describe('BFF API routing', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends local claim API requests to the documented BFF port', async () => {
    vi.stubEnv('NEXT_PUBLIC_BFF_URL', '');
    vi.stubEnv('USE_WIREMOCK_BFF', 'false');
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { claimsApi } = await import('@/src/lib/api/bff-client');

    await claimsApi.getClaimRaw({ claimId: 'claim-id' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8090/api/claims/claim-id',
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
  });
});
