import { Target } from '../types';

export interface ScenarioSimulationResult {
  baselineMonths: number;
  simulatedMonths: number;
  monthsAccelerated: number;
  baselineTargetMonth: string;
  simulatedTargetMonth: string;
  remainingNeededCents: number;
  effectiveMonthlyRateCents: number;
  feasibilityScore: number; // 0.0 - 1.0 (safety score)
}

/**
 * Helper to add N months to a YYYY-MM key.
 * e.g. addMonthsToKey('2026-11', 2) => '2027-01'
 */
export function addMonthsToKey(monthKey: string, months: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month)) return monthKey;

  month += months;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  const mm = month < 10 ? `0${month}` : `${month}`;
  return `${year}-${mm}`;
}

/**
 * Calculates the exact remaining minor units (cents) needed to reach target completion.
 */
export function calculateRemainingNeededCents(
  target: Target,
  availableCents: number = 0
): number {
  if (target.amountCents <= 0) return 0;
  return Math.max(0, target.amountCents - Math.max(0, availableCents));
}

/**
 * Deterministically simulates how a monthly savings lever accelerates target completion.
 * All arithmetic is in integer minor-units (cents, i64 equivalent).
 */
export function simulateTargetAcceleration(params: {
  target: Target;
  currentAvailableCents?: number;
  baseMonthlyRateCents?: number;
  monthlyLeverCents: number;
  currentMonthKey: string; // "YYYY-MM"
  discretionarySpendingFloorCents?: number;
}): ScenarioSimulationResult {
  const {
    target,
    currentAvailableCents = 0,
    baseMonthlyRateCents = 0,
    monthlyLeverCents,
    currentMonthKey,
    discretionarySpendingFloorCents = 0,
  } = params;

  const remainingNeededCents = calculateRemainingNeededCents(target, currentAvailableCents);

  // If already reached or zero target
  if (remainingNeededCents === 0) {
    return {
      baselineMonths: 0,
      simulatedMonths: 0,
      monthsAccelerated: 0,
      baselineTargetMonth: currentMonthKey,
      simulatedTargetMonth: currentMonthKey,
      remainingNeededCents: 0,
      effectiveMonthlyRateCents: baseMonthlyRateCents + monthlyLeverCents,
      feasibilityScore: 1.0,
    };
  }

  // Determine baseline rate
  let baselineRate = baseMonthlyRateCents;
  if (baselineRate <= 0) {
    if (target.targetType === 'monthly') {
      baselineRate = target.amountCents;
    } else if (target.dueDate) {
      // Calculate from target dueDate
      const [curY, curM] = currentMonthKey.split('-').map(Number);
      const [dueY, dueM] = target.dueDate.split('-').map(Number);
      const diffMonths = Math.max(1, (dueY - curY) * 12 + (dueM - curM) + 1);
      baselineRate = Math.ceil(remainingNeededCents / diffMonths);
    } else {
      // Default to 10% of target if unspecified
      baselineRate = Math.max(1000, Math.ceil(remainingNeededCents / 12));
    }
  }

  const baselineMonths = Math.max(1, Math.ceil(remainingNeededCents / Math.max(1, baselineRate)));
  const baselineTargetMonth = addMonthsToKey(currentMonthKey, baselineMonths);

  const effectiveMonthlyRateCents = baselineRate + Math.max(0, monthlyLeverCents);
  const simulatedMonths = Math.max(1, Math.ceil(remainingNeededCents / Math.max(1, effectiveMonthlyRateCents)));
  const simulatedTargetMonth = addMonthsToKey(currentMonthKey, simulatedMonths);

  const monthsAccelerated = Math.max(0, baselineMonths - simulatedMonths);

  // Calculate feasibility score: checks if lever cuts too deeply into discretionary floor
  let feasibilityScore = 1.0;
  if (discretionarySpendingFloorCents > 0) {
    const ratio = monthlyLeverCents / discretionarySpendingFloorCents;
    if (ratio > 0.6) {
      feasibilityScore = Math.max(0.2, 1.0 - (ratio - 0.6) * 1.5);
    }
  }

  return {
    baselineMonths,
    simulatedMonths,
    monthsAccelerated,
    baselineTargetMonth,
    simulatedTargetMonth,
    remainingNeededCents,
    effectiveMonthlyRateCents,
    feasibilityScore: Math.round(feasibilityScore * 100) / 100,
  };
}
