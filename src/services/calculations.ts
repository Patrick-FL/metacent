import { storage } from './storage';

export interface BudgetMonthCalculation {
  readyToAssignCents: number;
  totalAssignedCents: number;
  totalActivityCents: number;
  totalAvailableCents: number;
  categoryAvailableMap: Record<string, number>;
  categoryStartingBalanceMap: Record<string, number>;
}

/**
 * Calculates budget sums and Ready to Assign for a specific month (YYYY-MM).
 * Accurately tracks positive rollover balances from previous months according to envelope budgeting.
 */
export function calculateBudgetMonth(month: string): BudgetMonthCalculation {
  const categories = storage.getCategories();
  const transactions = storage.getTransactions();

  // Total cash available from cash accounts
  const totalCashInflowsCents = transactions
    .filter((tx) => tx.categoryId === null && tx.amountCents > 0)
    .reduce((sum, tx) => sum + tx.amountCents, 0);

  const allMonths = storage.getAllRollupMonths();
  const priorMonths = allMonths.filter((m) => m < month);
  const settings = storage.getBudget().settings;
  const negativeRollover = settings?.negativeBalanceRollover || 'deduct_from_ready_to_assign';

  // 1. Calculate rollover / starting balances for all categories coming from prior months
  const categoryStartingBalanceMap: Record<string, number> = {};

  for (const cat of categories) {
    let balance = 0;
    for (const m of priorMonths) {
      const r = storage.getMonthlyRollup(m, cat.id);
      const monthAvailable = balance + r.assignedCents + r.activityCents;
      if (negativeRollover === 'rollover_into_category') {
        balance = monthAvailable;
      } else {
        // 'deduct_from_ready_to_assign': only positive balance rolls over into category
        balance = Math.max(0, monthAvailable);
      }
    }
    categoryStartingBalanceMap[cat.id] = balance;
  }

  // 2. Calculate current month values
  let totalAssignedThisMonth = 0;
  let totalActivityThisMonth = 0;
  let totalAvailableThisMonth = 0;

  const categoryAvailableMap: Record<string, number> = {};

  for (const cat of categories) {
    const rollup = storage.getMonthlyRollup(month, cat.id);
    const starting = categoryStartingBalanceMap[cat.id] ?? 0;
    const assigned = rollup.assignedCents;
    const activity = rollup.activityCents;

    // Available is starting balance + assigned + activity
    const available = starting + assigned + activity;
    categoryAvailableMap[cat.id] = available;

    totalAssignedThisMonth += assigned;
    totalActivityThisMonth += activity;
    totalAvailableThisMonth += available;
  }

  // 3. Ready to Assign = Total Cash Inflows - Total Assigned across all months up to current
  let totalAssignedAllMonths = 0;
  const monthsUpToCurrent = allMonths.filter((m) => m <= month);
  if (!monthsUpToCurrent.includes(month)) {
    monthsUpToCurrent.push(month);
  }
  for (const m of monthsUpToCurrent) {
    for (const cat of categories) {
      totalAssignedAllMonths += storage.getMonthlyRollup(m, cat.id).assignedCents;
    }
  }

  const readyToAssignCents = totalCashInflowsCents - totalAssignedAllMonths;

  return {
    readyToAssignCents,
    totalAssignedCents: totalAssignedThisMonth,
    totalActivityCents: totalActivityThisMonth,
    totalAvailableCents: totalAvailableThisMonth,
    categoryAvailableMap,
    categoryStartingBalanceMap,
  };
}
