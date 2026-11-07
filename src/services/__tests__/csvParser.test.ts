import { describe, it, expect } from 'vitest';
import { parseCsvFile, normalizeDateToIso } from '../csvParser';
import { ImportProfile } from '../../types';

describe('CSV Statement Parser & Account Templates', () => {
  const tradeRepublicProfile: ImportProfile = {
    id: 'prof-test-tr',
    accountId: 'acc-1',
    profileName: 'Trade Republic Test',
    delimiter: ';',
    dateFormat: 'DD.MM.YYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    headerRowIndex: 0,
    fieldMappings: {
      date: 'Datum',
      payee: 'Bezeichnung',
      amount: 'Betrag',
      type: 'Typ',
    },
    categoryMatchRules: [
      { sourceField: 'Typ', pattern: 'Zinsen', targetCategoryId: 'cat-notgroschen' },
      { sourceField: 'Bezeichnung', pattern: 'Supermarkt', targetCategoryId: 'cat-lebensmittel' },
    ],
  };

  it('normalizes German dates to ISO YYYY-MM-DD', () => {
    expect(normalizeDateToIso('24.10.2026', 'DD.MM.YYYY')).toBe('2026-10-24');
    expect(normalizeDateToIso('01.05.2025', 'DD.MM.YYYY')).toBe('2025-05-01');
    expect(normalizeDateToIso('2026-11-01', 'YYYY-MM-DD')).toBe('2026-11-01');
  });

  it('parses Trade Republic CSV format and applies category rules', () => {
    const csvContent = `Datum;Typ;Bezeichnung;Betrag;Saldo
24.10.2026;Zinsen;Zinsgutschrift Trade Republic;41,20;1250,50
22.10.2026;Kartenzahlung;Supermarkt Filiale Muenchen;-35,50;1209,30
20.10.2026;Kartenzahlung;Spotify AB Stockholm;-12,99;1244,80`;

    const parsed = parseCsvFile(csvContent, tradeRepublicProfile);
    expect(parsed.length).toBe(3);

    // Row 1: Zinsen rule matched
    expect(parsed[0].date).toBe('2026-10-24');
    expect(parsed[0].payee).toBe('Zinsgutschrift Trade Republic');
    expect(parsed[0].amountCents).toBe(4120); // +41,20 €
    expect(parsed[0].suggestedCategoryId).toBe('cat-notgroschen');

    // Row 2: Supermarkt rule matched
    expect(parsed[1].date).toBe('2026-10-22');
    expect(parsed[1].payee).toBe('Supermarkt Filiale Muenchen');
    expect(parsed[1].amountCents).toBe(-3550); // -35,50 €
    expect(parsed[1].suggestedCategoryId).toBe('cat-lebensmittel');

    // Row 3: No rule matched (ready for AI or manual)
    expect(parsed[2].date).toBe('2026-10-20');
    expect(parsed[2].amountCents).toBe(-1299);
    expect(parsed[2].suggestedCategoryId).toBeNull();
  });
});

