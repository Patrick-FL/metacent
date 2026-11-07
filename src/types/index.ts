// metacent domain types derived from specs/architecture/DATA_MODEL.md

export type AccountType =
  | 'checking'
  | 'savings'
  | 'cash'
  | 'credit_card'
  | 'line_of_credit'
  | 'mortgage'
  | 'loan';

export type ClearedStatus = 'uncleared' | 'cleared' | 'reconciled';

export type TargetType = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface AppSettings {
  ollamaEndpoint: string;
  ollamaModel: string;
  openRouterApiKey: string;
  negativeBalanceRollover: 'deduct_from_ready_to_assign' | 'rollover_into_category';
}

export interface Budget {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  language: string;
  settings?: AppSettings;
  createdAt: number;
  updatedAt: number;
}

export interface Account {
  id: string;
  budgetId: string;
  nickname: string;
  accountType: AccountType;
  isFavorite: boolean;
  isClosed: boolean;
  notes: string;
  sortOrder: number;
  lastReconciledAt: number | null;
  // Computed balances
  clearedBalanceCents: number;
  unclearedBalanceCents: number;
  workingBalanceCents: number;
}

export interface CategoryGroup {
  id: string;
  budgetId: string;
  name: string;
  isCollapsed: boolean;
  sortOrder: number;
}

export interface Target {
  id: string;
  categoryId: string;
  targetType: TargetType;
  amountCents: number;
  dueDate: string | null;
  rolloverAction: string;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  isHidden: boolean;
  sortOrder: number;
  target?: Target;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  payee: string;
  categoryId: string | null;
  memo: string;
  amountCents: number; // Signed integer cents (+ inflow, - outflow)
  clearedStatus: ClearedStatus;
  isApproved: boolean;
  flag: number; // 0-6
  transferAccountId: string | null;
  transferTransactionId: string | null;
  importFitid: string | null;
  aiSuggested?: boolean;
  splitParentId?: string | null;
  isSplitParent?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MonthlyCategoryRollup {
  budgetId: string;
  month: string; // YYYY-MM
  categoryId: string;
  assignedCents: number;
  activityCents: number;
  note: string;
  // Computed on read
  availableCents: number;
}

export interface ImportProfile {
  id: string;
  accountId: string;
  profileName: string;
  delimiter: string;
  dateFormat: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  headerRowIndex: number;
  fieldMappings: {
    date: string;
    payee: string;
    amount?: string;
    inflow?: string;
    outflow?: string;
    memo?: string;
    type?: string;
    fitid?: string;
  };
  categoryMatchRules: Array<{
    sourceField: string;
    pattern: string;
    targetCategoryId: string;
  }>;
}

