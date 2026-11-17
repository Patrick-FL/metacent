import { describe, it, expect } from 'vitest';
import { runSpendingAudit } from '../spendingAudit';
import { Category, Transaction } from '../../types';

describe('spendingAudit (Scenarios 1 & 8 from ACCEPTANCE.md)', () => {
  const categories: Category[] = [
    { id: 'cat-telekom', groupId: 'grp-fix', name: 'Telekom Mobilfunk', isHidden: false, sortOrder: 0 },
    { id: 'cat-gastro', groupId: 'grp-wants', name: 'Gastronomie & Restaurants', isHidden: false, sortOrder: 1 },
    { id: 'cat-kaffee', groupId: 'grp-wants', name: 'Kaffee & Bäckerei', isHidden: false, isProtected: true, sortOrder: 2 },
  ];

  const transactions: Transaction[] = [
    // 6 months of Telekom 49.99 €
    { id: 't1', accountId: 'acc-1', date: '2026-06-15', payee: 'Telekom Mobilfunk', categoryId: 'cat-telekom', memo: '', amountCents: -4999, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },
    { id: 't2', accountId: 'acc-1', date: '2026-07-15', payee: 'Telekom Mobilfunk', categoryId: 'cat-telekom', memo: '', amountCents: -4999, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },
    { id: 't3', accountId: 'acc-1', date: '2026-08-15', payee: 'Telekom Mobilfunk', categoryId: 'cat-telekom', memo: '', amountCents: -4999, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },
    { id: 't4', accountId: 'acc-1', date: '2026-09-15', payee: 'Telekom Mobilfunk', categoryId: 'cat-telekom', memo: '', amountCents: -4999, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },
    { id: 't5', accountId: 'acc-1', date: '2026-10-15', payee: 'Telekom Mobilfunk', categoryId: 'cat-telekom', memo: '', amountCents: -4999, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },
    { id: 't6', accountId: 'acc-1', date: '2026-11-15', payee: 'Telekom Mobilfunk', categoryId: 'cat-telekom', memo: '', amountCents: -4999, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },

    // Gastro 240 €/month
    { id: 'g1', accountId: 'acc-1', date: '2026-10-20', payee: 'Pizzeria Bella', categoryId: 'cat-gastro', memo: '', amountCents: -24000, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },
    { id: 'g2', accountId: 'acc-1', date: '2026-11-10', payee: 'Sushi Bar', categoryId: 'cat-gastro', memo: '', amountCents: -24000, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },

    // Kaffee (Protected)
    { id: 'k1', accountId: 'acc-1', date: '2026-11-05', payee: 'Espresso Bar', categoryId: 'cat-kaffee', memo: '', amountCents: -8000, clearedStatus: 'cleared', isApproved: true, flag: 0, transferAccountId: null, transferTransactionId: null, importFitid: null, createdAt: 0, updatedAt: 0 },
  ];

  it('detects contract optimization and discretionary lever (Scenario 1)', async () => {
    const audit = await runSpendingAudit({
      lookbackMonths: 6,
      selectedMonth: '2026-11',
      budgetId: 'budget-1',
      categories,
      transactions,
      rollups: {},
    });

    expect(audit.totalAnalyzedCents).toBeGreaterThan(0);
    expect(audit.recommendations.length).toBeGreaterThanOrEqual(2);

    // Rate optimization for Telekom
    const telekomRec = audit.recommendations.find((r) => r.categoryId === 'cat-telekom');
    expect(telekomRec).toBeDefined();
    expect(telekomRec?.type).toBe('rate_optimization');
    expect(telekomRec?.potentialMonthlySavingsCents).toBeGreaterThan(2000);

    // Discretionary lever for Gastro
    const gastroRec = audit.recommendations.find((r) => r.categoryId === 'cat-gastro');
    expect(gastroRec).toBeDefined();
    expect(gastroRec?.type).toBe('discretionary_trim');
    expect(gastroRec?.potentialMonthlySavingsCents).toBeGreaterThan(0);
  });

  it('strictly excludes categories flagged as isProtected (Scenario 8)', async () => {
    const audit = await runSpendingAudit({
      lookbackMonths: 6,
      selectedMonth: '2026-11',
      budgetId: 'budget-1',
      categories,
      transactions,
      rollups: {},
    });

    // cat-kaffee isProtected = true, so no recommendation must exist for it!
    const kaffeeRec = audit.recommendations.find((r) => r.categoryId === 'cat-kaffee');
    expect(kaffeeRec).toBeUndefined();

    // Summary must mention the protected category
    expect(audit.summaryMarkdown).toContain('Geschützte Lebensqualität');
  });

  it('handles empty or sparse transaction history gracefully (Scenario 9)', async () => {
    const audit = await runSpendingAudit({
      lookbackMonths: 6,
      selectedMonth: '2026-11',
      budgetId: 'budget-1',
      categories,
      transactions: [], // no transactions
      rollups: {},
    });

    expect(audit.totalAnalyzedCents).toBe(0);
    expect(audit.recommendations).toHaveLength(0);
    expect(audit.summaryMarkdown).toContain('solide aufgestellt');
  });
});
