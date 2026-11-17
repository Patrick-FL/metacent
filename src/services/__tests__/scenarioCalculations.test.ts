import { describe, it, expect } from 'vitest';
import {
  addMonthsToKey,
  calculateRemainingNeededCents,
  simulateTargetAcceleration,
} from '../scenarioCalculations';
import { Target } from '../../types';

describe('scenarioCalculations (Deterministic Math Kernel)', () => {
  it('adds months to month keys correctly across years', () => {
    expect(addMonthsToKey('2026-11', 1)).toBe('2026-12');
    expect(addMonthsToKey('2026-11', 2)).toBe('2027-01');
    expect(addMonthsToKey('2026-11', 14)).toBe('2028-01');
  });

  it('calculates remaining needed cents correctly', () => {
    const target: Target = {
      id: 'tgt-1',
      categoryId: 'cat-urlaub',
      targetType: 'custom',
      amountCents: 240000, // 2.400,00 €
      dueDate: '2027-11-01',
      rolloverAction: 'set_aside',
    };

    expect(calculateRemainingNeededCents(target, 40000)).toBe(200000); // 2.000 € needed
    expect(calculateRemainingNeededCents(target, 250000)).toBe(0); // already fully funded
  });

  it('simulates target acceleration correctly (Scenario 2 from ACCEPTANCE.md)', () => {
    // GIVEN an active target "Japan-Reise" with remaining target balance 2,400.00 €
    // AND current monthly target funding is 200.00 € (projected completion: 12 months)
    const target: Target = {
      id: 'tgt-japan',
      categoryId: 'cat-japan',
      targetType: 'custom',
      amountCents: 240000, // 2.400 €
      dueDate: '2027-11-30',
      rolloverAction: 'set_aside',
    };

    // WHEN the user adjusts the savings lever to reduce spending by 40.00 €/month
    const result = simulateTargetAcceleration({
      target,
      currentAvailableCents: 0,
      baseMonthlyRateCents: 20000, // 200 €/month
      monthlyLeverCents: 4000, // +40 €/month savings lever
      currentMonthKey: '2026-11',
    });

    // Baseline: 2.400 / 200 = 12 months -> Nov 2027
    expect(result.baselineMonths).toBe(12);
    expect(result.baselineTargetMonth).toBe('2027-11');

    // Simulated: 2.400 / 240 = 10 months -> Sep 2027
    expect(result.simulatedMonths).toBe(10);
    expect(result.simulatedTargetMonth).toBe('2027-09');

    // Months accelerated: 12 - 10 = 2 months
    expect(result.monthsAccelerated).toBe(2);
    expect(result.effectiveMonthlyRateCents).toBe(24000);
  });
});
