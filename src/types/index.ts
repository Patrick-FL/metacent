// metacent domain types derived from specs/architecture/DATA_MODEL.md

export type AccountType =
  | 'checking'
  | 'savings'
  | 'cash'
  | 'credit_card'
  | 'line_of_credit'
  | 'mortgage'
  | 'loan';

export function getAccountTypeLabel(type: AccountType): string {
  switch (type) {
    case 'checking':
      return 'Girokonto';
    case 'savings':
      return 'Tagesgeld / Sparkonto';
    case 'cash':
      return 'Bargeld';
    case 'credit_card':
      return 'Kreditkarte';
    case 'line_of_credit':
      return 'Dispositionskredit';
    case 'mortgage':
      return 'Immobilienkredit';
    case 'loan':
      return 'Ratenkredit';
    default:
      return type;
  }
}

export function isDebtAccountType(type: AccountType): boolean {
  return (
    type === 'credit_card' ||
    type === 'line_of_credit' ||
    type === 'mortgage' ||
    type === 'loan'
  );
}

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
  notes?: string;
  isHidden: boolean;
  isProtected?: boolean; // "Geschützte Lebensqualität" - exempt from AI cuts
  priorityTier?: 'essential' | 'standard' | 'discretionary' | 'luxury';
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

// ==========================================
// KI-Finanzberater & Ziel-Copilot Domain Types
// ==========================================

export type AiRecommendationType =
  | 'recurring_subscription'
  | 'rate_optimization'
  | 'discretionary_trim'
  | 'target_acceleration';

export type AiRecommendationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'deferred';

export interface AiRecommendation {
  id: string;
  auditRunId: string;
  categoryId?: string;
  categoryName?: string;
  type: AiRecommendationType;
  title: string;
  description: string;
  potentialMonthlySavingsCents: number;
  currentMonthlyAverageCents: number;
  suggestedMonthlyTargetCents: number;
  confidence: number;
  status: AiRecommendationStatus;
  createdAt: number;
  // Specific research candidate data
  researchCategory?: 'mobile_phone' | 'internet_dsl' | 'electricity_gas' | 'insurance' | 'subscription' | 'target_item';
  marketAlternatives?: AiMarketAlternative[];
}

export interface AiMarketAlternative {
  id: string;
  recommendationId?: string;
  categoryId?: string;
  sanitizedQuery: string;
  providerName: string;
  offerTitle: string;
  monthlyPriceCents: number;
  oneTimeFeeCents: number;
  estimatedAnnualSavingsCents: number;
  featuresSummary: string[];
  directUrl: string;
  verifiedAt: number;
}

export interface AiAuditRun {
  id: string;
  budgetId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  totalAnalyzedCents: number;
  identifiedMonthlySavingsCents: number;
  summaryMarkdown: string;
  modelUsed: string;
  recommendations: AiRecommendation[];
  createdAt: number;
}

export interface AiGoalScenario {
  id: string;
  budgetId: string;
  targetCategoryId: string;
  scenarioName: string;
  monthlySavingsAllocatedCents: number;
  baselineTargetMonth: string; // YYYY-MM
  simulatedTargetMonth: string; // YYYY-MM
  monthsSaved: number;
  isApplied: boolean;
  createdAt: number;
}

export interface AiChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structuredPayload?: {
    actionChips?: Array<{
      label: string;
      actionCommand: string;
      payload?: unknown;
    }>;
    suggestedTarget?: {
      categoryName: string;
      targetType: TargetType;
      amountCents: number;
      dueDate: string | null;
      monthlyQuotaCents: number;
    };
    suggestedLever?: {
      categoryId: string;
      categoryName: string;
      monthlySavingsCents: number;
    };
  };
  createdAt: number;
}

export interface AiChatSession {
  id: string;
  budgetId: string;
  title: string;
  contextType: 'audit' | 'goal_refinement' | 'prioritization' | 'general';
  messages: AiChatMessage[];
  createdAt: number;
  updatedAt: number;
}


