import { describe, expect, it } from 'vitest';
import { claimSubmissionSchema } from '@/src/features/claims/schemas/claim-schemas';

describe('claim submission validation boundaries', () => {
  const incidentDate = new Date('2024-01-01T00:00:00.000Z');

  it('accepts minimum claim amount and minimum text lengths', () => {
    const result = claimSubmissionSchema.safeParse({
      incidentDate,
      incidentLocation: '12345',
      claimAmount: 0.01,
      description: '1234567890',
    });

    expect(result.success).toBe(true);
  });

  it('accepts maximum amount and maximum text lengths', () => {
    const result = claimSubmissionSchema.safeParse({
      incidentDate,
      incidentLocation: 'l'.repeat(200),
      claimAmount: 1_000_000,
      description: 'd'.repeat(1000),
    });

    expect(result.success).toBe(true);
  });

  it('rejects values outside the amount and text boundaries', () => {
    expect(claimSubmissionSchema.safeParse({
      incidentDate,
      incidentLocation: '1234',
      claimAmount: 0,
      description: 'too short',
    }).success).toBe(false);

    expect(claimSubmissionSchema.safeParse({
      incidentDate,
      incidentLocation: 'l'.repeat(201),
      claimAmount: 1_000_000.01,
      description: 'd'.repeat(1001),
    }).success).toBe(false);
  });
});
