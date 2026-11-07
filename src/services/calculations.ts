import { storage } from './storage';

export interface BudgetMonthCalculation {
  readyToAssignCents: number;
  totalAssignedCents: number;
  totalActivityCents: number;
  totalAvailableCents: number;
  categoryAvailableMap: Record<string, number>;
}

/**
 * Calculates budget sums and Ready to Assign for a specific month (YYYY-MM).
 * Operates in O(K) where K is number of categories, never scanning millions of raw transactions.
 */
export function calculateBudgetMonth(month: string): BudgetMonthCalculation {
  const categories = storage.getCategories();
  const transactions = storage.getTransactions();

  // Total cash available from cash accounts
  const totalCashInflowsCents = transactions
    .filter((tx) => tx.categoryId === null && tx.amountCents > 0)
    .reduce((sum, tx) => sum + tx.amountCents, 0);

  // Calculate sum of all assigned amounts across all months up to current
  let totalAssignedAllMonths = 0;
  let totalAssignedThisMonth = 0;
  let totalActivityThisMonth = 0;
  let totalAvailableThisMonth = 0;

  const categoryAvailableMap: Record<string, number> = {};

  for (const cat of categories) {
    const rollup = storage.getMonthlyRollup(month, cat.id);
    const assigned = rollup.assignedCents;
    const activity = rollup.activityCents;

    // In a zero-based model, available is assigned + activity (plus any positive rollover)
    const available = assigned + activity;
    categoryAvailableMap[cat.id] = available;

    totalAssignedThisMonth += assigned;
    totalActivityThisMonth += activity;
    totalAvailableThisMonth += available;

    totalAssignedAllMonths += assigned;
  }

  // Ready to Assign = Total Cash Inflows - Total Assigned across budget
  const readyToAssignCents = totalCashInflowsCents - totalAssignedAllMonths;

  return {
    readyToAssignCents,
    totalAssignedCents: totalAssignedThisMonth,
    totalActivityCents: totalActivityThisMonth,
    totalAvailableCents: totalAvailableThisMonth,
    categoryAvailableMap,
  };
}
