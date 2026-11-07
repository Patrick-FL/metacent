import { describe, it, expect, beforeEach } from 'vitest';
import { parseCsvFile } from '../csvParser';
import { categorizeWithOllama } from '../ollama';
import { storage } from '../storage';
import { ImportProfile } from '../../types';

describe('Feature: File Import Acceptance Scenarios', () => {
  beforeEach(() => {
    storage.resetToDemoData();
  });

  const tradeRepublicProfile: ImportProfile = {
    id: 'prof-trade-republic',
    accountId: 'acc-giro-1',
    profileName: 'Trade Republic',
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
      fitid: 'FITID',
    },
    categoryMatchRules: [
      { sourceField: 'Typ', pattern: 'Zinsen', targetCategoryId: 'cat-notgroschen' },
      { sourceField: 'Bezeichnung', pattern: 'REWE', targetCategoryId: 'cat-lebensmittel' },
    ],
  };

  it('Scenario 1: Saved Import Profile Detection & German Currency Parsing', () => {
    const csvContent = `Datum;Typ;Bezeichnung;Betrag;Saldo
24.10.2026;Überweisung;Gehalt Arbeitgeber;1.250,50;2500,00`;

    const parsed = parseCsvFile(csvContent, tradeRepublicProfile);
    expect(parsed.length).toBe(1);
    expect(parsed[0].date).toBe('2026-10-24');
    expect(parsed[0].payee).toBe('Gehalt Arbeitgeber');
    expect(parsed[0].amountCents).toBe(125050); // 1.250,50 € exactly
  });

  it('Scenario 2: Deterministic Rule Categorization', () => {
    const csvContent = `Datum;Typ;Bezeichnung;Betrag;Saldo
22.10.2026;Kartenzahlung;REWE Filiale 412 Muenchen;-45,80;1200,00`;

    const parsed = parseCsvFile(csvContent, tradeRepublicProfile);
    expect(parsed.length).toBe(1);
    expect(parsed[0].suggestedCategoryId).toBe('cat-lebensmittel');
    expect(parsed[0].matchRuleName).toContain('REWE');
  });

  it('Scenario 3: Local Ollama SLM Categorization Fallback', async () => {
    const categories = storage.getCategories();
    // Dr. Mueller Praxis Zahnarzt should categorize to Gesundheit & Körperpflege
    const result = await categorizeWithOllama(
      'Dr. Mueller Praxis Zahnarzt',
      'Zahnreinigung',
      -8500,
      categories
    );

    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe('cat-gesundheit');
  });

  it('Scenario 4: User Correction Feeds Learning Loop', () => {
    // User modifies payee "Papierwaren Schulz" to category "cat-ungeplant"
    storage.learnCategoryRule('acc-giro-1', 'Papierwaren Schulz', 'cat-ungeplant', 'Bezeichnung');

    const profile = storage.getImportProfiles('acc-giro-1').find((p) => p.id === 'prof-trade-republic');
    expect(profile).toBeDefined();

    // Verify subsequent parse auto-categorizes with the learned rule
    const csvContent = `Datum;Typ;Bezeichnung;Betrag;Saldo
15.10.2026;Kartenzahlung;Papierwaren Schulz Muenchen;-14,99;1100,00`;

    const parsed = parseCsvFile(csvContent, profile!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].suggestedCategoryId).toBe('cat-ungeplant');
    expect(parsed[0].matchRuleName).toContain('Papierwaren Schulz');
  });

  it('Scenario 5: Duplicate Prevention via FITID & Exact Transaction Signature', () => {
    const fitid = 'TR-2026-998811';

    // Given existing transaction with this fitid
    storage.addTransaction({
      accountId: 'acc-giro-1',
      date: '2026-10-24',
      payee: 'Zinsgutschrift Trade Republic',
      categoryId: 'cat-notgroschen',
      memo: 'Zinsen',
      amountCents: 4120,
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: fitid,
    });

    // Check duplicate with FITID
    const isDup = storage.isDuplicateTransaction('acc-giro-1', fitid);
    expect(isDup).toBe(true);

    // Check duplicate with exact signature
    const isSigDup = storage.isDuplicateTransaction(
      'acc-giro-1',
      null,
      '2026-10-24',
      'Zinsgutschrift Trade Republic',
      4120
    );
    expect(isSigDup).toBe(true);

    // Non-duplicate transaction
    const isNotDup = storage.isDuplicateTransaction(
      'acc-giro-1',
      'TR-NEW-12345',
      '2026-10-25',
      'Neue Buchung',
      1000
    );
    expect(isNotDup).toBe(false);
  });
});

