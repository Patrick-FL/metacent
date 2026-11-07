# Internal API — Service Layer

Since Metacent is a local-first application, there is no REST API. Instead, the internal API is structured as a **command/query service layer** that sits between the UI and the persistence layer. Every mutation is a command; every read is a query.

All commands are **invertible** (for undo/redo), **transactional** (atomic database writes), and **validated** (reject invalid input before touching data).

---

## Conventions

### Commands

```typescript
interface Command<TInput, TResult> {
  /** Validate the input. Throws ValidationError on failure. */
  validate(input: TInput): void;

  /** Execute the command. Returns the result and an undo function. */
  execute(input: TInput): { result: TResult; undo: () => void };
}
```

- All commands run within a database transaction
- All commands emit change events after successful execution
- All commands push an undo entry onto the history stack
- Input validation happens before any database access

### Queries

```typescript
interface Query<TInput, TResult> {
  /** Execute a read-only query. */
  execute(input: TInput): TResult;
}
```

- Queries are read-only — no side effects
- Queries may be cached/memoized based on their inputs
- Queries can be composed (a report query may call several sub-queries)

### Common Types

```typescript
/** All monetary values are integers in minor currency units (e.g., cents) */
type MoneyAmount = number; // integer

/** Month identifier: "YYYY-MM" */
type MonthKey = string;

/** UUID string */
type EntityId = string;

/** Sorting position */
type SortOrder = number;

type TransactionStatus = 'uncleared' | 'cleared' | 'reconciled';

type FlagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
```

---

## Budget Service

### Commands

#### `CreateBudget`
Create a new budget with default category groups and categories.

```typescript
input: {
  name: string;                    // required
  currencyCode?: string;           // default: "USD"
  currencySymbol?: string;         // default: "$"
  currencyPlacement?: 'before' | 'after';
  currencyDecimalDigits?: number;  // default: 2
  dateFormat?: string;             // default: "MM/DD/YYYY"
}

result: {
  budget: Budget;
  defaultGroups: CategoryGroup[];  // Bills, Needs, Wants + Inflow (internal)
  defaultCategories: Category[];   // e.g., Rent, Electric, Groceries, etc.
}
```

**Side effects:**
- Creates default category groups: "Inflow" (internal), "Bills", "Needs", "Wants"
- Creates starter categories in each group with emoji icons
- Creates the "Ready to Assign" internal category in the Inflow group

#### `UpdateBudgetSettings`
Update budget name, currency, or date format settings.

```typescript
input: {
  budgetId: EntityId;
  name?: string;
  currencyCode?: string;
  currencySymbol?: string;
  currencyPlacement?: 'before' | 'after';
  currencyDecimalDigits?: number;
  dateFormat?: string;
}

result: { budget: Budget }
```

#### `DeleteBudget`
Delete a budget and all its data. Requires confirmation.

```typescript
input: {
  budgetId: EntityId;
  confirmation: true;  // must be explicitly true
}

result: { deleted: true }
```

### Queries

#### `GetBudget`
```typescript
input: { budgetId: EntityId }
result: { budget: Budget }
```

#### `ListBudgets`
```typescript
input: { userId?: EntityId }
result: { budgets: Budget[] }
```

---

## Account Service

### Commands

#### `CreateAccount`
```typescript
input: {
  budgetId: EntityId;
  name: string;                    // nickname
  type: AccountType;               // 'checking' | 'savings' | 'cash' | 'credit_card' | ...
  balance?: MoneyAmount;           // opening balance (default: 0)
  notes?: string;
}

result: { account: Account }
```

**Side effects:**
- If `balance` is provided, creates an initial "Opening Balance" transaction
- The transaction's payee is the system payee "Starting Balance"
- Cash-type accounts: positive balance = inflow transaction
- Credit-type accounts: negative balance = outflow transaction (debt)

#### `UpdateAccount`
```typescript
input: {
  accountId: EntityId;
  name?: string;
  notes?: string;
  sortOrder?: SortOrder;
}

result: { account: Account }
```

#### `CloseAccount`
Soft-close an account. Hidden from default views but data retained.

```typescript
input: { accountId: EntityId }
result: { account: Account }
```

**Validation:** Account balance should be zero (or user confirms closing with balance).

#### `ReopenAccount`
```typescript
input: { accountId: EntityId }
result: { account: Account }
```

#### `DeleteAccount`
Hard-delete an account and all its transactions.

```typescript
input: {
  accountId: EntityId;
  confirmation: true;
}

result: { deleted: true }
```

#### `ReorderAccounts`
```typescript
input: {
  budgetId: EntityId;
  accountIds: EntityId[];  // in desired order within a class
}

result: { accounts: Account[] }
```

#### `ReconcileAccount`
Start and complete a reconciliation flow.

```typescript
// Step 1: Begin reconciliation
input: {
  accountId: EntityId;
  statementBalance: MoneyAmount;
  statementDate: string; // ISO date
}

result: {
  reconciliation: {
    clearedBalance: MoneyAmount;
    difference: MoneyAmount; // statementBalance - clearedBalance
    transactionsToReview: Transaction[];  // cleared but not reconciled
  }
}

// Step 2: Complete reconciliation
input: {
  accountId: EntityId;
  transactionIds: EntityId[];  // transactions to mark as reconciled
  adjustmentAmount?: MoneyAmount;  // if difference ≠ 0, create adjustment txn
}

result: {
  reconciledCount: number;
  adjustmentTransaction?: Transaction;
}
```

**Side effects:**
- Matched transactions transition: `cleared → reconciled`
- If `adjustmentAmount` provided, creates a "Reconciliation Balance Adjustment" transaction
- Updates `account.last_reconciled_at` and `last_reconciled_balance`

### Queries

#### `GetAccount`
```typescript
input: { accountId: EntityId }
result: { account: Account }
```

#### `ListAccounts`
```typescript
input: {
  budgetId: EntityId;
  includesClosed?: boolean;  // default: false
}

result: {
  accounts: Account[];  // grouped by account_class in response
}
```

#### `GetAccountBalance`
```typescript
input: { accountId: EntityId }
result: {
  clearedBalance: MoneyAmount;
  unclearedBalance: MoneyAmount;
  workingBalance: MoneyAmount;
}
```

---

## Category Service

### Commands

#### `CreateCategoryGroup`
```typescript
input: {
  budgetId: EntityId;
  name: string;
  sortOrder?: SortOrder;  // default: append to end
}

result: { group: CategoryGroup }
```

#### `UpdateCategoryGroup`
```typescript
input: {
  groupId: EntityId;
  name?: string;
  isCollapsed?: boolean;
  isHidden?: boolean;
}

result: { group: CategoryGroup }
```

#### `DeleteCategoryGroup`
```typescript
input: {
  groupId: EntityId;
  moveCategoriesToGroupId?: EntityId;  // move categories instead of deleting
}

result: { deleted: true; movedCategories?: Category[] }
```

**Validation:** Cannot delete internal groups (Inflow).

#### `ReorderCategoryGroups`
```typescript
input: {
  budgetId: EntityId;
  groupIds: EntityId[];  // in desired order
}

result: { groups: CategoryGroup[] }
```

#### `CreateCategory`
```typescript
input: {
  groupId: EntityId;
  name: string;
  emoji?: string;
  sortOrder?: SortOrder;
}

result: { category: Category }
```

#### `UpdateCategory`
```typescript
input: {
  categoryId: EntityId;
  name?: string;
  emoji?: string;
  note?: string;
  isHidden?: boolean;
}

result: { category: Category }
```

#### `DeleteCategory`
```typescript
input: {
  categoryId: EntityId;
  reassignToCategoryId?: EntityId;  // reassign transactions
}

result: { deleted: true; reassignedTransactionCount?: number }
```

**Validation:** Cannot delete internal categories (Ready to Assign).

#### `MoveCategory`
Move a category from one group to another.

```typescript
input: {
  categoryId: EntityId;
  targetGroupId: EntityId;
  sortOrder?: SortOrder;  // position within new group
}

result: { category: Category }
```

#### `ReorderCategories`
```typescript
input: {
  groupId: EntityId;
  categoryIds: EntityId[];  // in desired order
}

result: { categories: Category[] }
```

#### `SetTarget`
Set or update a category's spending/saving target.

```typescript
input: {
  categoryId: EntityId;
  type: TargetType;
  amount: MoneyAmount;
  frequency?: TargetFrequency;
  targetDate?: string;              // ISO date for savings_target_by_date
  customFrequencyMonths?: number;   // for 'custom' frequency
  yearlyRollover?: boolean;
  yearlyRolloverMonth?: number;     // 1-12
}

result: { target: Target }
```

#### `RemoveTarget`
```typescript
input: { categoryId: EntityId }
result: { deleted: true }
```

### Queries

#### `ListCategoryGroups`
```typescript
input: {
  budgetId: EntityId;
  includeHidden?: boolean;
}

result: {
  groups: (CategoryGroup & {
    categories: Category[];
  })[];
}
```

#### `GetCategoryBalance`
```typescript
input: {
  categoryId: EntityId;
  month: MonthKey;
}

result: {
  assigned: MoneyAmount;
  activity: MoneyAmount;
  available: MoneyAmount;
  target?: {
    type: TargetType;
    goalAmount: MoneyAmount;
    monthlyFundingNeeded: MoneyAmount;
    isUnderfunded: boolean;
    percentComplete: number; // 0-100
  };
}
```

#### `GetCategoryBalancesByMonth`
Full budget view data for a single month.

```typescript
input: {
  budgetId: EntityId;
  month: MonthKey;
}

result: {
  readyToAssign: MoneyAmount;
  isOverAssigned: boolean;
  groups: {
    group: CategoryGroup;
    assignedTotal: MoneyAmount;
    activityTotal: MoneyAmount;
    availableTotal: MoneyAmount;
    categories: {
      category: Category;
      assigned: MoneyAmount;
      activity: MoneyAmount;
      available: MoneyAmount;
      target?: TargetStatus;
    }[];
  }[];
}
```

---

## Transaction Service

### Commands

#### `CreateTransaction`
```typescript
input: {
  accountId: EntityId;
  date: string;                    // ISO date
  payeeName?: string;              // looked up or created
  payeeId?: EntityId;              // or directly by ID
  categoryId?: EntityId;
  memo?: string;
  amount: MoneyAmount;             // positive = inflow, negative = outflow
  status?: TransactionStatus;      // default: 'uncleared'
  flagColor?: FlagColor;
  approved?: boolean;              // default: true
  splits?: {                       // for split transactions
    categoryId: EntityId;
    amount: MoneyAmount;
    memo?: string;
  }[];
}

result: { transaction: Transaction }
```

**Validation:**
- If `splits` provided, sum of split amounts must equal `amount`
- `amount` must not be 0
- `date` must be valid

**Side effects:**
- Creates or resolves Payee from `payeeName`
- Updates payee's `auto_category_id` to the used category
- For splits: creates parent + child transactions

#### `UpdateTransaction`
```typescript
input: {
  transactionId: EntityId;
  date?: string;
  payeeName?: string;
  payeeId?: EntityId;
  categoryId?: EntityId;
  memo?: string;
  amount?: MoneyAmount;
  flagColor?: FlagColor | null;   // null to clear
  approved?: boolean;
  splits?: { categoryId: EntityId; amount: MoneyAmount; memo?: string }[];
}

result: { transaction: Transaction }
```

**Validation:** Reconciled transactions cannot be updated.

#### `DeleteTransaction`
```typescript
input: { transactionId: EntityId }
result: { deleted: true }
```

**Validation:** Reconciled transactions cannot be deleted.

#### `DeleteTransactions` (Bulk)
```typescript
input: { transactionIds: EntityId[] }
result: { deletedCount: number }
```

#### `ClearTransaction`
Toggle cleared status.

```typescript
input: {
  transactionId: EntityId;
  status: 'uncleared' | 'cleared';
}

result: { transaction: Transaction }
```

**Validation:** Cannot un-clear reconciled transactions.

#### `ApproveTransaction`
```typescript
input: { transactionId: EntityId }
result: { transaction: Transaction }
```

#### `ApproveTransactions` (Bulk)
```typescript
input: { transactionIds: EntityId[] }
result: { approvedCount: number }
```

#### `FlagTransaction`
```typescript
input: {
  transactionId: EntityId;
  flagColor: FlagColor | null;  // null to remove flag
}

result: { transaction: Transaction }
```

#### `CreateTransfer`
Create a transfer between two accounts.

```typescript
input: {
  fromAccountId: EntityId;
  toAccountId: EntityId;
  date: string;
  amount: MoneyAmount;           // positive: amount transferred
  memo?: string;
  status?: TransactionStatus;
}

result: {
  fromTransaction: Transaction;
  toTransaction: Transaction;
}
```

**Side effects:**
- Creates two linked transactions (outflow in source, inflow in destination)
- Sets `is_transfer`, `transfer_account_id`, `transfer_transaction_id` on both
- Payee is auto-set to "Transfer: [Other Account Name]"

#### `MatchTransaction`
Match an imported transaction to an existing manually-entered one.

```typescript
input: {
  importedTransactionId: EntityId;
  existingTransactionId: EntityId;
}

result: { transaction: Transaction }
```

**Side effects:**
- Merges the two: keeps the existing transaction, adopts import metadata
- Deletes the imported duplicate
- Updates `matched_transaction_id`

#### `UnmatchTransaction`
```typescript
input: { transactionId: EntityId }
result: { transaction: Transaction; restoredTransaction: Transaction }
```

### Queries

#### `ListTransactions`
```typescript
input: {
  accountId?: EntityId;          // filter by account (omit for all accounts)
  budgetId: EntityId;
  startDate?: string;
  endDate?: string;
  payeeId?: EntityId;
  categoryId?: EntityId;
  status?: TransactionStatus;
  flagColor?: FlagColor;
  searchQuery?: string;          // full-text search on payee + memo
  approved?: boolean;
  limit?: number;                // pagination
  offset?: number;
  sortBy?: 'date' | 'amount' | 'payee';
  sortDir?: 'asc' | 'desc';
}

result: {
  transactions: Transaction[];
  totalCount: number;
}
```

#### `GetTransaction`
```typescript
input: { transactionId: EntityId }
result: { transaction: Transaction; splits?: Transaction[] }
```

---

## Planning Service

Commands specific to the budgeting / planning workflow.

### Commands

#### `AssignToCategory`
Set or update the assigned amount for a category in a specific month.

```typescript
input: {
  categoryId: EntityId;
  month: MonthKey;
  amount: MoneyAmount;
}

result: {
  monthlyBudget: MonthlyBudget;
  newAvailable: MoneyAmount;
  newReadyToAssign: MoneyAmount;
}
```

#### `MoveMoney`
Move available funds from one category to another.

```typescript
input: {
  fromCategoryId: EntityId;
  toCategoryId: EntityId;
  month: MonthKey;
  amount: MoneyAmount;          // positive amount to move
}

result: {
  fromNewAssigned: MoneyAmount;
  fromNewAvailable: MoneyAmount;
  toNewAssigned: MoneyAmount;
  toNewAvailable: MoneyAmount;
}
```

**Side effects:** Adjusts `assigned_amount` in both categories' MonthlyBudgets for the month.

#### `AutoAssign`
Automatically assign funds to categories based on a strategy.

```typescript
input: {
  budgetId: EntityId;
  month: MonthKey;
  strategy: 'underfunded'        // assign what targets need
           | 'last_month'        // match last month's assignments
           | 'average'           // use average of last 3 months
           | 'spent_last_month'; // assign what was spent last month
  categoryIds?: EntityId[];      // optional: only auto-assign these categories
}

result: {
  assignments: { categoryId: EntityId; amount: MoneyAmount }[];
  totalAssigned: MoneyAmount;
  newReadyToAssign: MoneyAmount;
}
```

**Validation:** Will not assign more than Ready to Assign allows (stops when funds exhausted).

### Queries

#### `GetReadyToAssign`
```typescript
input: {
  budgetId: EntityId;
  month: MonthKey;
}

result: {
  readyToAssign: MoneyAmount;
  totalInflows: MoneyAmount;     // all inflows ever (to inflow category)
  totalAssigned: MoneyAmount;    // sum of all assignments up to this month
  isOverAssigned: boolean;
  overspentLastMonth: MoneyAmount; // negative available rolled up from last month
}
```

#### `GetMonthlySnapshot`
Summary of a single month's budget activity.

```typescript
input: {
  budgetId: EntityId;
  month: MonthKey;
}

result: {
  month: MonthKey;
  totalBudgeted: MoneyAmount;
  totalActivity: MoneyAmount;
  totalAvailable: MoneyAmount;
  readyToAssign: MoneyAmount;
  categoryCount: number;
  underfundedCount: number;
  overspentCount: number;
}
```

---

## Import Service

### Commands

#### `ImportFile`
Parse and import a transaction file.

```typescript
input: {
  accountId: EntityId;
  file: File | ArrayBuffer;
  fileName: string;
  format: 'ofx' | 'qfx' | 'qif' | 'csv';
  csvMapping?: {                   // required for CSV format
    dateColumn: number | string;
    payeeColumn: number | string;
    amountColumn?: number | string;       // single amount column
    inflowColumn?: number | string;       // or separate inflow/outflow
    outflowColumn?: number | string;
    memoColumn?: number | string;
    dateFormat?: string;                   // e.g., "MM/DD/YYYY"
    skipRows?: number;                     // header rows to skip
    delimiter?: string;                    // default: ","
  };
}

result: {
  importRecord: ImportRecord;
  preview: {
    transactions: {
      date: string;
      payeeName: string;
      amount: MoneyAmount;
      memo: string;
      status: 'new' | 'duplicate' | 'matched';
      matchedTransactionId?: EntityId;
    }[];
    newCount: number;
    duplicateCount: number;
    matchedCount: number;
  };
}
```

**This is a two-step process:**
1. `ImportFile` parses and returns a preview with duplicate/match detection
2. `ConfirmImport` applies the import

#### `ConfirmImport`
```typescript
input: {
  importRecordId: EntityId;
  transactionsToImport: EntityId[];     // which previewed txns to actually import
  transactionsToSkip: EntityId[];       // which to skip
  matchConfirmations: {                 // confirm/reject matches
    importedId: EntityId;
    existingId: EntityId;
    accept: boolean;
  }[];
}

result: {
  importedCount: number;
  skippedCount: number;
  matchedCount: number;
  transactions: Transaction[];
}
```

#### `PreviewCsvMapping`
Preview the first N rows of a CSV file with a given column mapping.

```typescript
input: {
  file: File | ArrayBuffer;
  csvMapping: CsvMapping;
  previewRows?: number;           // default: 5
}

result: {
  headers: string[];
  sampleRows: string[][];
  parsedPreview: {
    date: string;
    payeeName: string;
    amount: MoneyAmount;
    memo: string;
  }[];
  parseErrors: { row: number; error: string }[];
}
```

### Queries

#### `ListImportRecords`
```typescript
input: { accountId: EntityId }
result: { imports: ImportRecord[] }
```

---

## Report Service

All report queries. These are read-only aggregations used by the Reflect view.

### Queries

#### `GetSpendingBreakdown`
Data for the donut chart — spending by category or group.

```typescript
input: {
  budgetId: EntityId;
  startDate: string;
  endDate: string;
  groupBy: 'category' | 'group';
  excludeTransfers?: boolean;     // default: true
}

result: {
  totalSpending: MoneyAmount;
  breakdown: {
    id: EntityId;
    name: string;
    emoji?: string;
    amount: MoneyAmount;           // absolute value of outflows
    percentage: number;            // 0-100
    color: string;                 // chart color
  }[];
}
```

#### `GetSpendingTrends`
Data for the line chart — spending over time by category/group.

```typescript
input: {
  budgetId: EntityId;
  startDate: string;
  endDate: string;
  categoryIds?: EntityId[];       // filter specific categories
  groupIds?: EntityId[];
  granularity: 'monthly';
}

result: {
  months: MonthKey[];
  series: {
    id: EntityId;
    name: string;
    values: MoneyAmount[];        // one per month
  }[];
  averageMonthly: MoneyAmount;
}
```

#### `GetNetWorth`
Data for the bar chart — assets vs. debts over time.

```typescript
input: {
  budgetId: EntityId;
  startDate: string;
  endDate: string;
}

result: {
  months: {
    month: MonthKey;
    assets: MoneyAmount;          // sum of cash-type account balances
    debts: MoneyAmount;           // sum of credit/loan account balances (positive = debt)
    netWorth: MoneyAmount;        // assets - debts
    change: MoneyAmount;          // netWorth - previous month's netWorth
  }[];
}
```

#### `GetIncomeVsExpense`
Data for the income vs. expense table.

```typescript
input: {
  budgetId: EntityId;
  startDate: string;
  endDate: string;
}

result: {
  months: {
    month: MonthKey;
    income: {
      total: MoneyAmount;
      byCategory: { categoryId: EntityId; name: string; amount: MoneyAmount }[];
    };
    expenses: {
      total: MoneyAmount;
      byGroup: {
        groupId: EntityId;
        name: string;
        amount: MoneyAmount;
        categories: { categoryId: EntityId; name: string; amount: MoneyAmount }[];
      }[];
    };
    netIncome: MoneyAmount;       // income.total + expenses.total
  }[];
  totals: {
    totalIncome: MoneyAmount;
    totalExpenses: MoneyAmount;
    totalNetIncome: MoneyAmount;
    averageMonthlyIncome: MoneyAmount;
    averageMonthlyExpenses: MoneyAmount;
  };
}
```

#### `GetAgeOfMoney`
Calculate the Age of Money metric — average days between earning and spending.

```typescript
input: {
  budgetId: EntityId;
  asOfDate?: string;              // default: today
}

result: {
  ageOfMoneyDays: number | null;  // null if < 10 outflow transactions
  trend: {
    date: string;
    days: number;
  }[];                            // historical trend data points
  hasEnoughData: boolean;         // true if >= 10 outflow transactions
  transactionCount: number;       // total outflow transactions used
}
```

**Calculation method:**
1. Take the 10 most recent outflow (spending) transactions
2. For each, find the inflow transaction that "funded" it (FIFO: oldest unspent inflow first)
3. Age = days between inflow date and outflow date
4. Age of Money = average of these ages

---

## Payee Service

### Commands

#### `UpdatePayee`
```typescript
input: {
  payeeId: EntityId;
  name?: string;
  autoCategoryId?: EntityId | null;
}

result: { payee: Payee }
```

#### `MergePayees`
Merge multiple payees into one, re-assigning all transactions.

```typescript
input: {
  keepPayeeId: EntityId;         // the payee to keep
  mergePayeeIds: EntityId[];     // payees to merge into the kept one
}

result: {
  payee: Payee;
  mergedCount: number;
  updatedTransactionCount: number;
}
```

#### `DeletePayee`
```typescript
input: { payeeId: EntityId }
result: { deleted: true }
```

### Queries

#### `ListPayees`
```typescript
input: {
  budgetId: EntityId;
  searchQuery?: string;
}

result: { payees: Payee[] }
```

#### `GetPayeeSuggestions`
Autocomplete suggestions for payee name input.

```typescript
input: {
  budgetId: EntityId;
  query: string;                  // partial name
  limit?: number;                 // default: 10
}

result: {
  suggestions: {
    payee: Payee;
    suggestedCategoryId?: EntityId;
    suggestedCategoryName?: string;
  }[];
}
```

---

## Scheduled Transaction Service

### Commands

#### `CreateScheduledTransaction`
```typescript
input: {
  accountId: EntityId;
  payeeName?: string;
  payeeId?: EntityId;
  categoryId?: EntityId;
  memo?: string;
  amount: MoneyAmount;
  frequency: ScheduledFrequency;
  startDate: string;               // first occurrence
  endDate?: string;                // when to stop (null = forever)
  flagColor?: FlagColor;
  isTransfer?: boolean;
  transferAccountId?: EntityId;
  autoApprove?: boolean;           // default: false
}

result: { scheduledTransaction: ScheduledTransaction }
```

#### `UpdateScheduledTransaction`
```typescript
input: {
  scheduledTransactionId: EntityId;
  // ... same optional fields as create
}

result: { scheduledTransaction: ScheduledTransaction }
```

#### `DeleteScheduledTransaction`
```typescript
input: { scheduledTransactionId: EntityId }
result: { deleted: true }
```

#### `SkipNextOccurrence`
Skip the next scheduled occurrence without creating a transaction.

```typescript
input: { scheduledTransactionId: EntityId }
result: {
  scheduledTransaction: ScheduledTransaction;  // with updated next_occurrence
}
```

#### `ProcessDueScheduledTransactions`
Materialize all scheduled transactions that are due.

```typescript
input: {
  budgetId: EntityId;
  asOfDate?: string;               // default: today
}

result: {
  createdTransactions: Transaction[];
  updatedSchedules: ScheduledTransaction[];
}
```

**This is called automatically on app startup and date change.**

### Queries

#### `ListScheduledTransactions`
```typescript
input: {
  budgetId: EntityId;
  accountId?: EntityId;
  includeInactive?: boolean;
}

result: { scheduledTransactions: ScheduledTransaction[] }
```

#### `GetUpcomingTransactions`
Preview what scheduled transactions will fire in a date range.

```typescript
input: {
  budgetId: EntityId;
  startDate: string;
  endDate: string;
}

result: {
  upcoming: {
    scheduledTransaction: ScheduledTransaction;
    occurrenceDate: string;
  }[];
}
```

---

## Undo/Redo Service

### Commands

#### `Undo`
```typescript
input: {}
result: {
  undone: boolean;
  description: string;  // human-readable: "Undo: Create transaction"
}
```

#### `Redo`
```typescript
input: {}
result: {
  redone: boolean;
  description: string;
}
```

### Queries

#### `GetUndoRedoState`
```typescript
input: {}
result: {
  canUndo: boolean;
  undoDescription?: string;  // "Create transaction $85.50 at Grocery Store"
  canRedo: boolean;
  redoDescription?: string;
  historyLength: number;
}
```

---

## Error Handling

All commands may throw these errors:

| Error Type | HTTP-like Code | Description |
|-----------|---------------|-------------|
| `ValidationError` | 400 | Invalid input (missing required fields, bad format) |
| `NotFoundError` | 404 | Entity not found |
| `ConflictError` | 409 | Constraint violation (e.g., duplicate payee name) |
| `ImmutableError` | 403 | Attempted to modify reconciled transaction |
| `InsufficientFundsError` | 422 | Auto-assign exhausted Ready to Assign |

Errors include:
```typescript
interface ServiceError {
  type: string;          // error type name
  message: string;       // human-readable message
  field?: string;        // which input field caused the error
  details?: unknown;     // additional context
}
```
