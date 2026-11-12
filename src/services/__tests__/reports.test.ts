import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSpendingBreakdown,
  getIncomeVsExpense,
  getNetWorthData,
  calculateAgeOfMoney,
} from '../reports';
import { storage } from '../storage';

describe('Reports & Reflect Analytics Calculations', () => {
  const accountId = 'acc-giro-1';

  beforeEach(() => {
    // Clean state before tests
    storage.resetToDemoData();
  });

  it('Scenario 1: calculates spending breakdown accurately by category', () => {
    // Add sample transactions in 2026-11
    const tx1 = storage.addTransaction({
      accountId,
      date: '2026-11-05',
      payee: 'Groceries Supermarket',
      categoryId: 'cat-lebensmittel',
      memo: '',
      amountCents: -30000, // 300,00 €
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    const tx2 = storage.addTransaction({
      accountId,
      date: '2026-11-08',
      payee: 'Restaurant Dining Out',
      categoryId: 'cat-gastronomie',
      memo: '',
      amountCents: -10000, // 100,00 €
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    const breakdown = getSpendingBreakdown('2026-11', 'categories');
    expect(breakdown.totalSpendingCents).toBe(40000); // 400,00 € total

    const groceriesSlice = breakdown.slices.find((s) => s.id === 'cat-lebensmittel');
    const diningSlice = breakdown.slices.find((s) => s.id === 'cat-gastronomie');

    expect(groceriesSlice?.amountCents).toBe(30000);
    expect(groceriesSlice?.percentage).toBe(75); // 75%
    expect(diningSlice?.amountCents).toBe(10000);
    expect(diningSlice?.percentage).toBe(25); // 25%

    // Clean up
    storage.deleteTransaction(tx1.id);
    storage.deleteTransaction(tx2.id);
  });

  it('Scenario 2: calculates Net Worth from assets and debts', () => {
    const netWorth = getNetWorthData();
    expect(netWorth.length).toBeGreaterThan(0);
    const current = netWorth[0];

    // Net worth = Assets - Debts
    expect(current.netWorthCents).toBe(current.assetsCents - current.debtsCents);
  });

  it('Scenario 3: enforces Age of Money threshold of minimum 10 transactions', () => {
    const aom = calculateAgeOfMoney();
    if (aom.transactionCount < 10) {
      expect(aom.hasEnoughData).toBe(false);
      expect(aom.ageInDays).toBeNull();
    } else {
      expect(aom.hasEnoughData).toBe(true);
      expect(typeof aom.ageInDays).toBe('number');
    }
  });

  it('Scenario 4: verifies Income vs Expense balance equation', () => {
    const month = '2026-11';
    const report = getIncomeVsExpense(month);

    // Equation: Net Income = Total Income - Total Expense
    expect(report.netIncomeCents).toBe(report.totalIncomeCents - report.totalExpenseCents);
  });
});

