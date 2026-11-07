import { describe, it, expect } from 'vitest';
import {
  calculateRemainingMonths,
  evaluateCategoryTarget,
} from '../targetCalculations';
import { Target } from '../../types';

describe('targetCalculations', () => {
  describe('calculateRemainingMonths', () => {
    it('returns 1 when target is in the same month', () => {
      expect(calculateRemainingMonths('2026-11', '2026-11-15')).toBe(1);
    });

    it('returns 2 when target is in next month', () => {
      expect(calculateRemainingMonths('2026-11', '2026-12-01')).toBe(2);
    });

    it('returns 14 when target is in next year', () => {
      // Nov 2026 to Dec 2027: (2027-2026)*12 + (12-11) + 1 = 12 + 1 + 1 = 14
      expect(calculateRemainingMonths('2026-11', '2027-12-31')).toBe(14);
    });

    it('returns <= 0 when target is in the past', () => {
      expect(calculateRemainingMonths('2026-11', '2026-10-31')).toBe(0);
    });
  });

  describe('Monthly Target', () => {
    const monthlyTarget: Target = {
      id: 'tgt-1',
      categoryId: 'cat-lebensmittel',
      targetType: 'monthly',
      amountCents: 50000, // 500,00 €
      dueDate: null,
      rolloverAction: 'set_aside',
    };

    it('shows uncompleted with full amount needed when assigned is 0', () => {
      const res = evaluateCategoryTarget(monthlyTarget, 0, 0, '2026-11');
      expect(res.isFunded).toBe(false);
      expect(res.neededThisMonthCents).toBe(50000);
      expect(res.monthlyQuotaCents).toBe(50000);
    });

    it('shows partially funded when assigned is 300,00 €', () => {
      const res = evaluateCategoryTarget(monthlyTarget, 30000, 30000, '2026-11');
      expect(res.isFunded).toBe(false);
      expect(res.neededThisMonthCents).toBe(20000);
      expect(res.progressRatio).toBeCloseTo(0.6);
    });

    it('remains funded even after spending activity reduces available balance', () => {
      // 500 € assigned, 200 € spent -> available is 300 €
      const res = evaluateCategoryTarget(monthlyTarget, 50000, 30000, '2026-11');
      expect(res.isFunded).toBe(true);
      expect(res.neededThisMonthCents).toBe(0);
    });
  });

  describe('Weekly Target (averaged 52/12)', () => {
    const weeklyTarget: Target = {
      id: 'tgt-2',
      categoryId: 'cat-taschengeld',
      targetType: 'weekly',
      amountCents: 10000, // 100,00 € / week
      dueDate: null,
      rolloverAction: 'set_aside',
    };

    it('averages weekly amount by 52/12 (approx 433,33 €)', () => {
      const res = evaluateCategoryTarget(weeklyTarget, 0, 0, '2026-11');
      // 10000 * 52 / 12 = 43333.33 -> 43333
      expect(res.monthlyQuotaCents).toBe(43333);
      expect(res.neededThisMonthCents).toBe(43333);
      expect(res.isFunded).toBe(false);
    });

    it('is funded when assigned matches or exceeds monthly quota', () => {
      const res = evaluateCategoryTarget(weeklyTarget, 43333, 43333, '2026-11');
      expect(res.isFunded).toBe(true);
      expect(res.neededThisMonthCents).toBe(0);
    });
  });

  describe('Yearly Target (dynamic rate logic)', () => {
    const yearlyTarget: Target = {
      id: 'tgt-3',
      categoryId: 'cat-versicherung',
      targetType: 'yearly',
      amountCents: 120000, // 1.200,00 € due in Dec 2026
      dueDate: '2026-12-01',
      rolloverAction: 'set_aside',
    };

    it('splits remaining deficit evenly across remaining months (Nov and Dec = 2 months)', () => {
      // In Nov 2026: 2 months remaining (Nov, Dec). Deficit = 1.200 € -> 600 € / month
      const res = evaluateCategoryTarget(yearlyTarget, 0, 0, '2026-11');
      expect(res.monthsRemaining).toBe(2);
      expect(res.monthlyQuotaCents).toBe(60000);
      expect(res.neededThisMonthCents).toBe(60000);
      expect(res.isFunded).toBe(false);
    });

    it('marks month as funded when the monthly quota is assigned', () => {
      const res = evaluateCategoryTarget(yearlyTarget, 60000, 60000, '2026-11');
      expect(res.isFunded).toBe(true);
      expect(res.neededThisMonthCents).toBe(0);
      expect(res.overallNeededCents).toBe(60000);
    });

    it('dynamically lowers quota in the final month if more was saved earlier', () => {
      // In Dec 2026: 1 month remaining.
      // Already saved 800 € from earlier months. Current assigned = 0.
      const res = evaluateCategoryTarget(yearlyTarget, 0, 80000, '2026-12');
      expect(res.monthsRemaining).toBe(1);
      // Only 400 € deficit left
      expect(res.monthlyQuotaCents).toBe(40000);
      expect(res.neededThisMonthCents).toBe(40000);
    });

    it('requires the full remaining balance in the due month if underfunded', () => {
      // In Dec 2026: 1 month remaining.
      // Only 200 € was saved earlier.
      const res = evaluateCategoryTarget(yearlyTarget, 0, 20000, '2026-12');
      expect(res.monthsRemaining).toBe(1);
      expect(res.monthlyQuotaCents).toBe(100000);
      expect(res.neededThisMonthCents).toBe(100000);
    });
  });

  describe('Custom Target with dueDate', () => {
    const customTarget: Target = {
      id: 'tgt-4',
      categoryId: 'cat-urlaub',
      targetType: 'custom',
      amountCents: 300000, // 3.000,00 €
      dueDate: '2027-02-01',
      rolloverAction: 'set_aside',
    };

    it('calculates dynamic monthly savings rate until due date', () => {
      // Nov 2026 to Feb 2027: Nov, Dec, Jan, Feb = 4 months
      // 3.000 € / 4 = 750 € per month
      const res = evaluateCategoryTarget(customTarget, 0, 0, '2026-11');
      expect(res.monthsRemaining).toBe(4);
      expect(res.monthlyQuotaCents).toBe(75000);
      expect(res.neededThisMonthCents).toBe(75000);
    });
  });
});

