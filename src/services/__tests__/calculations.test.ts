import { describe, it, expect } from 'vitest';
import { calculateBudgetMonth } from '../calculations';
import { storage } from '../storage';

describe('Budget Calculations & Invariants', () => {
  it('correctly calculates initial Ready to Assign from starting cash balance', () => {
    const calc = calculateBudgetMonth('2026-11');
    // Default mock setup starts with 800,00 € cash
    expect(calc.readyToAssignCents).toBe(80000);
    expect(calc.totalAssignedCents).toBe(0);
  });

  it('adjusts Ready to Assign dynamically when funds are assigned', () => {
    storage.setAssigned('2026-11', 'cat-miete', 50000); // 500,00 € to Miete
    const calc = calculateBudgetMonth('2026-11');
    expect(calc.readyToAssignCents).toBe(30000); // 800 - 500 = 300 €
    expect(calc.categoryAvailableMap['cat-miete']).toBe(50000);

    // Reset back
    storage.setAssigned('2026-11', 'cat-miete', 0);
  });

  it('detects over-assignment when assigned exceeds available cash', () => {
    storage.setAssigned('2026-11', 'cat-miete', 150000); // 1.500,00 €
    const calc = calculateBudgetMonth('2026-11');
    expect(calc.readyToAssignCents).toBe(-70000); // 800 - 1500 = -700,00 €
    expect(calc.readyToAssignCents < 0).toBe(true);

    // Reset back
    storage.setAssigned('2026-11', 'cat-miete', 0);
  });
});

