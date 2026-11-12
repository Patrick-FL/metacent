import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBudgetMonth } from '../calculations';
import { storage } from '../storage';

describe('Budget Calculations & Invariants', () => {
  beforeEach(() => {
    storage.resetToDemoData();
  });
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

  it('rolls over positive category balances from prior months into next month', () => {
    // Sept: assign 80,00 € to Lebensmittel
    storage.setAssigned('2026-09', 'cat-lebensmittel', 8000);
    // Oct: assign 100,00 € to Lebensmittel
    storage.setAssigned('2026-10', 'cat-lebensmittel', 10000);

    // Calculate Oct: starting balance from Sept is 80 € + assigned 100 € = 180 € available
    const octCalc = calculateBudgetMonth('2026-10');
    expect(octCalc.categoryStartingBalanceMap['cat-lebensmittel']).toBe(8000);
    expect(octCalc.categoryAvailableMap['cat-lebensmittel']).toBe(18000);

    // Nov: assign 50,00 €
    storage.setAssigned('2026-11', 'cat-lebensmittel', 5000);
    const novCalc = calculateBudgetMonth('2026-11');
    expect(novCalc.categoryStartingBalanceMap['cat-lebensmittel']).toBe(18000); // 180 € carried over
    expect(novCalc.categoryAvailableMap['cat-lebensmittel']).toBe(23000); // 180 + 50 = 230 €

    // Reset back
    storage.setAssigned('2026-09', 'cat-lebensmittel', 0);
    storage.setAssigned('2026-10', 'cat-lebensmittel', 0);
    storage.setAssigned('2026-11', 'cat-lebensmittel', 0);
  });

  it('correctly calculates ready to assign as 0,00 € in empty production mode', () => {
    storage.resetToEmptyProductionData();
    const calc = calculateBudgetMonth('2026-11');
    expect(calc.readyToAssignCents).toBe(0);
    expect(calc.totalAssignedCents).toBe(0);
    expect(calc.totalActivityCents).toBe(0);
    expect(calc.totalAvailableCents).toBe(0);
  });
});

