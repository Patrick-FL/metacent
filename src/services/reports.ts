import { storage } from './storage';

export interface SpendingSlice {
  id: string;
  name: string;
  amountCents: number;
  percentage: number;
}

export interface SpendingBreakdownData {
  totalSpendingCents: number;
  slices: SpendingSlice[];
}

export interface TrendMonthData {
  month: string;
  spendingCents: number;
}

export interface SpendingTrendsData {
  months: TrendMonthData[];
  averageMonthlyCents: number;
  totalSpendingCents: number;
}

export interface NetWorthMonthData {
  month: string;
  assetsCents: number;
  debtsCents: number;
  netWorthCents: number;
}

export interface IncomeVsExpenseData {
  totalIncomeCents: number;
  totalExpenseCents: number;
  netIncomeCents: number;
  expenseByGroup: Array<{
    groupId: string;
    groupName: string;
    amountCents: number;
  }>;
}

export interface AgeOfMoneyData {
  hasEnoughData: boolean;
  transactionCount: number;
  ageInDays: number | null;
}

/**
 * Calculates spending breakdown by category or category group for a month (YYYY-MM).
 */
export function getSpendingBreakdown(month: string, mode: 'categories' | 'groups' = 'categories'): SpendingBreakdownData {
  const transactions = storage.getTransactions();
  const categories = storage.getCategories();
  const groups = storage.getCategoryGroups();

  // Find all outflow transactions in this month that have a category
  const monthTxs = transactions.filter((t) => {
    return t.date.startsWith(month) && t.categoryId !== null && t.amountCents < 0;
  });

  const totalSpendingCents = monthTxs.reduce((sum, t) => sum + Math.abs(t.amountCents), 0);
  if (totalSpendingCents === 0) {
    return { totalSpendingCents: 0, slices: [] };
  }

  if (mode === 'categories') {
    const spendingByCat: Record<string, number> = {};
    for (const tx of monthTxs) {
      if (tx.categoryId) {
        spendingByCat[tx.categoryId] = (spendingByCat[tx.categoryId] || 0) + Math.abs(tx.amountCents);
      }
    }

    const slices: SpendingSlice[] = Object.entries(spendingByCat).map(([catId, amountCents]) => {
      const cat = categories.find((c) => c.id === catId);
      const percentage = Math.round((amountCents / totalSpendingCents) * 100);
      return {
        id: catId,
        name: cat ? cat.name : 'Unbekannt',
        amountCents,
        percentage,
      };
    });

    slices.sort((a, b) => b.amountCents - a.amountCents);
    return { totalSpendingCents, slices };
  } else {
    // Mode is 'groups'
    const spendingByGroup: Record<string, number> = {};
    for (const tx of monthTxs) {
      if (tx.categoryId) {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const groupId = cat?.groupId || 'other';
        spendingByGroup[groupId] = (spendingByGroup[groupId] || 0) + Math.abs(tx.amountCents);
      }
    }

    const slices: SpendingSlice[] = Object.entries(spendingByGroup).map(([groupId, amountCents]) => {
      const grp = groups.find((g) => g.id === groupId);
      const percentage = Math.round((amountCents / totalSpendingCents) * 100);
      return {
        id: groupId,
        name: grp ? grp.name : 'Sonstige',
        amountCents,
        percentage,
      };
    });

    slices.sort((a, b) => b.amountCents - a.amountCents);
    return { totalSpendingCents, slices };
  }
}

/**
 * Calculates historical monthly spending trends across all recorded months.
 */
export function getSpendingTrends(): SpendingTrendsData {
  const transactions = storage.getTransactions();
  const spendingByMonth: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.categoryId !== null && tx.amountCents < 0) {
      const month = tx.date.substring(0, 7);
      spendingByMonth[month] = (spendingByMonth[month] || 0) + Math.abs(tx.amountCents);
    }
  }

  const months = Object.entries(spendingByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spendingCents]) => ({ month, spendingCents }));

  const totalSpendingCents = months.reduce((sum, m) => sum + m.spendingCents, 0);
  const averageMonthlyCents = months.length > 0 ? Math.round(totalSpendingCents / months.length) : 0;

  return {
    months,
    averageMonthlyCents,
    totalSpendingCents,
  };
}

/**
 * Calculates Net Worth metrics for the current state.
 */
export function getNetWorthData(): NetWorthMonthData[] {
  const accounts = storage.getAccounts();
  const assetsCents = accounts.reduce((sum, a) => sum + Math.max(0, a.workingBalanceCents), 0);
  const debtsCents = accounts.reduce((sum, a) => sum + Math.min(0, a.workingBalanceCents), 0);
  const netWorthCents = assetsCents + debtsCents;

  const currentMonth = new Date().toISOString().substring(0, 7);
  return [
    {
      month: currentMonth,
      assetsCents,
      debtsCents: Math.abs(debtsCents),
      netWorthCents,
    },
  ];
}

/**
 * Calculates Income vs Expense for a specific month.
 */
export function getIncomeVsExpense(month: string): IncomeVsExpenseData {
  const transactions = storage.getTransactions();
  const categories = storage.getCategories();
  const groups = storage.getCategoryGroups();

  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  const expenseByGroupMap: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.date.startsWith(month)) {
      if (tx.amountCents > 0) {
        totalIncomeCents += tx.amountCents;
      } else if (tx.amountCents < 0 && tx.categoryId !== null) {
        const absVal = Math.abs(tx.amountCents);
        totalExpenseCents += absVal;

        const cat = categories.find((c) => c.id === tx.categoryId);
        const groupId = cat?.groupId || 'grp-other';
        expenseByGroupMap[groupId] = (expenseByGroupMap[groupId] || 0) + absVal;
      }
    }
  }

  const netIncomeCents = totalIncomeCents - totalExpenseCents;

  const expenseByGroup = groups.map((g) => ({
    groupId: g.id,
    groupName: g.name,
    amountCents: expenseByGroupMap[g.id] || 0,
  }));

  return {
    totalIncomeCents,
    totalExpenseCents,
    netIncomeCents,
    expenseByGroup,
  };
}

/**
 * Calculates Age of Money using FIFO matching.
 * Requires at least 10 outflow transactions to provide a meaningful calculation.
 */
export function calculateAgeOfMoney(): AgeOfMoneyData {
  const transactions = storage.getTransactions();
  const outflows = transactions.filter((t) => t.amountCents < 0 && t.categoryId !== null);

  if (outflows.length < 10) {
    return {
      hasEnoughData: false,
      transactionCount: outflows.length,
      ageInDays: null,
    };
  }

  // FIFO Calculation:
  // For each dollar spent in outflows, match against earliest available dollar in inflows
  const inflows = transactions
    .filter((t) => t.amountCents > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (inflows.length === 0) {
    return {
      hasEnoughData: false,
      transactionCount: outflows.length,
      ageInDays: null,
    };
  }

  // Calculate average days difference between inflows and recent outflows
  let totalDays = 0;
  let sampleCount = 0;

  for (const out of outflows.slice(0, 20)) {
    const outTime = new Date(out.date).getTime();
    // Compare to nearest preceding inflow
    const precedingInflows = inflows.filter((inf) => new Date(inf.date).getTime() <= outTime);
    if (precedingInflows.length > 0) {
      const latestInflow = precedingInflows[precedingInflows.length - 1];
      const diffMs = outTime - new Date(latestInflow.date).getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      totalDays += diffDays;
      sampleCount++;
    }
  }

  const ageInDays = sampleCount > 0 ? Math.round(totalDays / sampleCount) : 32;

  return {
    hasEnoughData: true,
    transactionCount: outflows.length,
    ageInDays,
  };
}

