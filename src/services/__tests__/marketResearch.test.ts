import { describe, it, expect } from 'vitest';
import { searchMarketAlternatives } from '../marketResearch';

describe('marketResearch (Scenario 4 from ACCEPTANCE.md)', () => {
  it('returns verified market alternatives with estimated annual savings', async () => {
    // Current mobile bill: 49.99 €/month
    const result = await searchMarketAlternatives({
      categoryName: 'Mobilfunk',
      payee: 'Deutsche Telekom',
      currentMonthlyCostCents: 4999,
    });

    expect(result.report.isPrivacyCompliant).toBe(true);
    expect(result.alternatives.length).toBeGreaterThanOrEqual(2);

    for (const alt of result.alternatives) {
      expect(alt.providerName).toBeTruthy();
      expect(alt.monthlyPriceCents).toBeGreaterThan(0);
      expect(alt.estimatedAnnualSavingsCents).toBeGreaterThan(0);
      expect(alt.featuresSummary.length).toBeGreaterThan(0);
      expect(alt.directUrl.startsWith('https://')).toBe(true);
      // No affiliate tracking parameters
      expect(alt.directUrl).not.toContain('affiliate');
      expect(alt.directUrl).not.toContain('utm_');
    }
  });
});
