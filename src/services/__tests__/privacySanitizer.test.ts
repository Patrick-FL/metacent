import { describe, it, expect } from 'vitest';
import { sanitizeForMarketResearch } from '../privacySanitizer';

describe('privacySanitizer (Scenario 3 from ACCEPTANCE.md)', () => {
  it('strips IBANs, customer IDs, and names completely from web search query', () => {
    // GIVEN a transaction with payee "Vodafone D2 GmbH", memo "Kunden-Nr 123456789 Max Mustermann IBAN DE89370400440532013000", amount 59.99 €
    const report = sanitizeForMarketResearch(
      'Mobilfunk & Handy',
      'Vodafone D2 GmbH',
      'Kunden-Nr 123456789 Herr Max Mustermann IBAN DE89370400440532013000',
      5999
    );

    // THEN the outbound search query contains no names, customer numbers, or IBAN
    expect(report.sanitizedQuery).not.toContain('Max Mustermann');
    expect(report.sanitizedQuery).not.toContain('DE89370400440532013000');
    expect(report.sanitizedQuery).not.toContain('123456789');

    // AND strippedTokens records the sanitizations
    expect(report.strippedTokens).toContain('IBAN / Bank Account Number');
    expect(report.strippedTokens).toContain('Customer / Contract Identifier');
    expect(report.strippedTokens).toContain('Personal Name / Salutation');

    // AND it produces a clean generic market comparison query
    expect(report.categoryType).toBe('mobile_phone');
    expect(report.sanitizedQuery).toMatch(/Mobilfunk Allnet Flat/);
    expect(report.isPrivacyCompliant).toBe(true);
  });

  it('generates clean query for DSL and fiber contracts', () => {
    const report = sanitizeForMarketResearch('Internet & Festnetz', 'Telekom Deutschland', 'Vertrag 987654', 4500);
    expect(report.categoryType).toBe('internet_dsl');
    expect(report.sanitizedQuery).toContain('Internet DSL Glasfaser');
  });

  it('generates clean query for physical target items', () => {
    const report = sanitizeForMarketResearch('Canyon Grizl 7 Gravelbike', '', '', 180000);
    expect(report.categoryType).toBe('target_item');
    expect(report.sanitizedQuery).toContain('Canyon Grizl 7 Gravelbike Preisvergleich');
  });
});
