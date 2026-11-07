import {
  Account,
  AppSettings,
  Budget,
  Category,
  CategoryGroup,
  ImportProfile,
  MonthlyCategoryRollup,
  Transaction,
} from '../types';

const STORAGE_KEY = 'metacent_local_db_v1';

interface StorageSchema {
  budget: Budget;
  accounts: Account[];
  groups: CategoryGroup[];
  categories: Category[];
  transactions: Transaction[];
  rollups: Record<string, MonthlyCategoryRollup>; // key: `${month}:${categoryId}`
  importProfiles: ImportProfile[];
}

function getInitialData(): StorageSchema {
  const now = Date.now();
  const budgetId = 'budget-main-1';

  const budget: Budget = {
    id: budgetId,
    name: 'Hauptbudget',
    currency: 'EUR',
    currencySymbol: '€',
    dateFormat: 'DD.MM.YYYY',
    language: 'de-DE',
    settings: {
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3.2:3b',
      openRouterApiKey: '',
      negativeBalanceRollover: 'deduct_from_ready_to_assign',
    },
    createdAt: now,
    updatedAt: now,
  };

  const accountId = 'acc-giro-1';
  const initialAccounts: Account[] = [
    {
      id: accountId,
      budgetId,
      nickname: 'Girokonto',
      accountType: 'checking',
      isFavorite: true,
      isClosed: false,
      notes: 'Hauptgirokonto für Gehalt und Fixkosten',
      sortOrder: 0,
      lastReconciledAt: null,
      clearedBalanceCents: 80000, // 800,00 €
      unclearedBalanceCents: 0,
      workingBalanceCents: 80000,
    },
  ];

  const groups: CategoryGroup[] = [
    { id: 'grp-fixkosten', budgetId, name: 'Fixkosten & Rechnungen', isCollapsed: false, sortOrder: 0 },
    { id: 'grp-bedarfe', budgetId, name: 'Bedarfe des Alltags', isCollapsed: false, sortOrder: 1 },
    { id: 'grp-wuensche', budgetId, name: 'Wünsche & Freizeit', isCollapsed: false, sortOrder: 2 },
  ];

  const categories: Category[] = [
    // Fixkosten
    { id: 'cat-miete', groupId: 'grp-fixkosten', name: 'Miete / Hypothek', isHidden: false, sortOrder: 0 },
    { id: 'cat-telefon', groupId: 'grp-fixkosten', name: 'Telefon & Internet', isHidden: false, sortOrder: 1 },
    { id: 'cat-strom', groupId: 'grp-fixkosten', name: 'Strom & Heizung', isHidden: false, sortOrder: 2 },
    // Bedarfe
    { id: 'cat-lebensmittel', groupId: 'grp-bedarfe', name: 'Lebensmittel', isHidden: false, sortOrder: 0 },
    { id: 'cat-mobilitaet', groupId: 'grp-bedarfe', name: 'Mobilität & ÖPNV', isHidden: false, sortOrder: 1 },
    { id: 'cat-gesundheit', groupId: 'grp-bedarfe', name: 'Gesundheit & Körperpflege', isHidden: false, sortOrder: 2 },
    { id: 'cat-notgroschen', groupId: 'grp-bedarfe', name: 'Notgroschen', isHidden: false, sortOrder: 3 },
    // Wünsche
    { id: 'cat-gastronomie', groupId: 'grp-wuensche', name: 'Gastronomie & Ausgehen', isHidden: false, sortOrder: 0 },
    { id: 'cat-unterhaltung', groupId: 'grp-wuensche', name: 'Unterhaltung & Streaming', isHidden: false, sortOrder: 1 },
    { id: 'cat-urlaub', groupId: 'grp-wuensche', name: 'Urlaub & Reisen', isHidden: false, sortOrder: 2 },
    { id: 'cat-ungeplant', groupId: 'grp-wuensche', name: 'Ungeplante Ausgaben', isHidden: false, sortOrder: 3 },
  ];

  // Initial starting balance transaction: Inflow of 800,00 € to Ready to Assign
  const today = new Date().toISOString().split('T')[0];
  const initialTransactions: Transaction[] = [
    {
      id: 'tx-init-1',
      accountId,
      date: today,
      payee: 'Anfangssaldo',
      categoryId: null, // Ready to assign
      memo: 'Kontoeröffnung',
      amountCents: 80000,
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Pre-configured Trade Republic CSV import profile
  const importProfiles: ImportProfile[] = [
    {
      id: 'prof-trade-republic',
      accountId,
      profileName: 'Trade Republic Kontoauszug (CSV)',
      delimiter: ';',
      dateFormat: 'DD.MM.YYYY',
      decimalSeparator: ',',
      thousandsSeparator: '.',
      headerRowIndex: 0,
      fieldMappings: {
        date: 'Datum',
        payee: 'Bezeichnung',
        amount: 'Betrag',
        type: 'Typ',
      },
      categoryMatchRules: [
        { sourceField: 'Typ', pattern: 'Zinsen', targetCategoryId: 'cat-notgroschen' },
        { sourceField: 'Bezeichnung', pattern: 'Supermarkt', targetCategoryId: 'cat-lebensmittel' },
      ],
    },
  ];

  return {
    budget,
    accounts: initialAccounts,
    groups,
    categories,
    transactions: initialTransactions,
    rollups: {},
    importProfiles,
  };
}

class StorageService {
  private data: StorageSchema;
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor() {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        this.data = JSON.parse(raw);
      } catch {
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  private snapshotForUndo() {
    this.undoStack.push(JSON.stringify(this.data));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  private save() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }

  public undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const current = JSON.stringify(this.data);
    this.redoStack.push(current);
    const previous = this.undoStack.pop()!;
    this.data = JSON.parse(previous);
    this.save();
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const current = JSON.stringify(this.data);
    this.undoStack.push(current);
    const next = this.redoStack.pop()!;
    this.data = JSON.parse(next);
    this.save();
    return true;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getData(): StorageSchema {
    return this.data;
  }

  public getBudget(): Budget {
    return this.data.budget;
  }

  public getAccounts(): Account[] {
    return this.data.accounts;
  }

  public getCategoryGroups(): CategoryGroup[] {
    return this.data.groups;
  }

  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getTransactions(accountId?: string): Transaction[] {
    if (accountId) {
      return this.data.transactions.filter((tx) => tx.accountId === accountId);
    }
    return this.data.transactions;
  }

  public getImportProfiles(accountId?: string): ImportProfile[] {
    if (accountId) {
      return this.data.importProfiles.filter((p) => p.accountId === accountId);
    }
    return this.data.importProfiles;
  }

  public addAccount(
    account: Omit<Account, 'id' | 'clearedBalanceCents' | 'unclearedBalanceCents' | 'workingBalanceCents'>,
    initialBalanceCents: number
  ): Account {
    this.snapshotForUndo();
    const id = `acc-${Date.now()}`;
    const newAccount: Account = {
      ...account,
      id,
      clearedBalanceCents: initialBalanceCents,
      unclearedBalanceCents: 0,
      workingBalanceCents: initialBalanceCents,
    };
    this.data.accounts.push(newAccount);

    if (initialBalanceCents !== 0) {
      const today = new Date().toISOString().split('T')[0];
      this.data.transactions.push({
        id: `tx-${Date.now()}`,
        accountId: id,
        date: today,
        payee: 'Anfangssaldo',
        categoryId: null, // Ready to assign
        memo: 'Startguthaben',
        amountCents: initialBalanceCents,
        clearedStatus: 'cleared',
        isApproved: true,
        flag: 0,
        transferAccountId: null,
        transferTransactionId: null,
        importFitid: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    this.save();
    return newAccount;
  }

  public updateAccount(id: string, partial: Partial<Account>): Account | null {
    const acc = this.data.accounts.find((a) => a.id === id);
    if (!acc) return null;
    this.snapshotForUndo();
    Object.assign(acc, partial);
    this.save();
    return acc;
  }

  public adjustWorkingBalance(accountId: string, newWorkingBalanceCents: number): Transaction | null {
    const acc = this.data.accounts.find((a) => a.id === accountId);
    if (!acc) return null;
    this.snapshotForUndo();

    const diffCents = newWorkingBalanceCents - acc.workingBalanceCents;
    if (diffCents === 0) return null;

    const today = new Date().toISOString().split('T')[0];
    const adjustmentTx: Transaction = {
      id: `tx-adj-${Date.now()}`,
      accountId,
      date: today,
      payee: 'Abstimmungs-Korrekturbuchung',
      categoryId: null,
      memo: 'Automatische Saldenkorrektur',
      amountCents: diffCents,
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.data.transactions.unshift(adjustmentTx);
    acc.clearedBalanceCents += diffCents;
    acc.workingBalanceCents = acc.clearedBalanceCents + acc.unclearedBalanceCents;

    this.save();
    return adjustmentTx;
  }

  public deleteAccount(accountId: string): boolean {
    const index = this.data.accounts.findIndex((a) => a.id === accountId);
    if (index === -1) return false;
    this.snapshotForUndo();

    // Remove transactions for this account and revert their rollups
    const removedTxs = this.data.transactions.filter((tx) => tx.accountId === accountId);
    for (const tx of removedTxs) {
      if (tx.categoryId) {
        const month = tx.date.substring(0, 7);
        const key = `${month}:${tx.categoryId}`;
        if (this.data.rollups[key]) {
          this.data.rollups[key].activityCents -= tx.amountCents;
        }
      }
    }

    this.data.transactions = this.data.transactions.filter((tx) => tx.accountId !== accountId);
    this.data.accounts.splice(index, 1);
    this.data.importProfiles = this.data.importProfiles.filter((p) => p.accountId !== accountId);

    this.save();
    return true;
  }

  public setAssigned(month: string, categoryId: string, assignedCents: number) {
    this.snapshotForUndo();
    const key = `${month}:${categoryId}`;
    if (!this.data.rollups[key]) {
      this.data.rollups[key] = {
        budgetId: this.data.budget.id,
        month,
        categoryId,
        assignedCents: 0,
        activityCents: 0,
        note: '',
        availableCents: 0,
      };
    }
    this.data.rollups[key].assignedCents = assignedCents;
    this.save();
  }

  public copyAssignedFromMonth(
    sourceMonth: string,
    targetMonth: string,
    options: { overwriteExisting?: boolean } = { overwriteExisting: true }
  ): { count: number; totalCents: number } {
    this.snapshotForUndo();
    const categories = this.getCategories();
    let count = 0;
    let totalCents = 0;

    for (const cat of categories) {
      const prevRollup = this.getMonthlyRollup(sourceMonth, cat.id);
      if (prevRollup.assignedCents > 0) {
        const targetRollup = this.getMonthlyRollup(targetMonth, cat.id);
        if (options.overwriteExisting || targetRollup.assignedCents === 0) {
          const targetKey = `${targetMonth}:${cat.id}`;
          if (!this.data.rollups[targetKey]) {
            this.data.rollups[targetKey] = {
              budgetId: this.data.budget.id,
              month: targetMonth,
              categoryId: cat.id,
              assignedCents: 0,
              activityCents: 0,
              note: '',
              availableCents: 0,
            };
          }
          this.data.rollups[targetKey].assignedCents = prevRollup.assignedCents;
          count++;
          totalCents += prevRollup.assignedCents;
        }
      }
    }

    this.save();
    return { count, totalCents };
  }

  public copyAssignedForCategory(
    sourceMonth: string,
    targetMonth: string,
    categoryId: string
  ): number {
    this.snapshotForUndo();
    const prevRollup = this.getMonthlyRollup(sourceMonth, categoryId);
    const targetKey = `${targetMonth}:${categoryId}`;
    if (!this.data.rollups[targetKey]) {
      this.data.rollups[targetKey] = {
        budgetId: this.data.budget.id,
        month: targetMonth,
        categoryId,
        assignedCents: 0,
        activityCents: 0,
        note: '',
        availableCents: 0,
      };
    }
    this.data.rollups[targetKey].assignedCents = prevRollup.assignedCents;
    this.save();
    return prevRollup.assignedCents;
  }

  public getMonthlyRollup(month: string, categoryId: string): MonthlyCategoryRollup {
    const key = `${month}:${categoryId}`;
    if (this.data.rollups[key]) {
      return this.data.rollups[key];
    }
    return {
      budgetId: this.data.budget.id,
      month,
      categoryId,
      assignedCents: 0,
      activityCents: 0,
      note: '',
      availableCents: 0,
    };
  }

  public getAllRollupMonths(): string[] {
    const months = new Set<string>();
    for (const key of Object.keys(this.data.rollups)) {
      const parts = key.split(':');
      if (parts[0]) months.add(parts[0]);
    }
    for (const tx of this.data.transactions) {
      if (tx.date) months.add(tx.date.substring(0, 7));
    }
    return Array.from(months).sort();
  }

  public addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    this.snapshotForUndo();
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.data.transactions.unshift(newTx);

    // Update account balances
    const acc = this.data.accounts.find((a) => a.id === tx.accountId);
    if (acc) {
      if (tx.clearedStatus === 'uncleared') {
        acc.unclearedBalanceCents += tx.amountCents;
      } else {
        acc.clearedBalanceCents += tx.amountCents;
      }
      acc.workingBalanceCents = acc.clearedBalanceCents + acc.unclearedBalanceCents;
    }

    // Update monthly rollup activity
    if (tx.categoryId) {
      const month = tx.date.substring(0, 7);
      const key = `${month}:${tx.categoryId}`;
      if (!this.data.rollups[key]) {
        this.data.rollups[key] = {
          budgetId: this.data.budget.id,
          month,
          categoryId: tx.categoryId,
          assignedCents: 0,
          activityCents: 0,
          note: '',
          availableCents: 0,
        };
      }
      this.data.rollups[key].activityCents += tx.amountCents;
    }

    this.save();
    return newTx;
  }

  public updateTransaction(id: string, partial: Partial<Transaction>): Transaction | null {
    const tx = this.data.transactions.find((t) => t.id === id);
    if (!tx) return null;
    this.snapshotForUndo();

    const oldAmount = tx.amountCents;
    const oldCleared = tx.clearedStatus;
    const oldCategory = tx.categoryId;
    const oldDate = tx.date;

    Object.assign(tx, partial);
    tx.updatedAt = Date.now();

    const acc = this.data.accounts.find((a) => a.id === tx.accountId);
    if (acc) {
      // Revert old effect
      if (oldCleared === 'uncleared') {
        acc.unclearedBalanceCents -= oldAmount;
      } else {
        acc.clearedBalanceCents -= oldAmount;
      }
      // Apply new effect
      if (tx.clearedStatus === 'uncleared') {
        acc.unclearedBalanceCents += tx.amountCents;
      } else {
        acc.clearedBalanceCents += tx.amountCents;
      }
      acc.workingBalanceCents = acc.clearedBalanceCents + acc.unclearedBalanceCents;
    }

    // Adjust rollups if amount, category, or month changed
    if (oldCategory) {
      const oldMonth = oldDate.substring(0, 7);
      const oldKey = `${oldMonth}:${oldCategory}`;
      if (this.data.rollups[oldKey]) {
        this.data.rollups[oldKey].activityCents -= oldAmount;
      }
    }
    if (tx.categoryId) {
      const newMonth = tx.date.substring(0, 7);
      const newKey = `${newMonth}:${tx.categoryId}`;
      if (!this.data.rollups[newKey]) {
        this.data.rollups[newKey] = {
          budgetId: this.data.budget.id,
          month: newMonth,
          categoryId: tx.categoryId,
          assignedCents: 0,
          activityCents: 0,
          note: '',
          availableCents: 0,
        };
      }
      this.data.rollups[newKey].activityCents += tx.amountCents;
    }

    this.save();
    return tx;
  }

  public deleteTransaction(id: string): boolean {
    const index = this.data.transactions.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.snapshotForUndo();

    const tx = this.data.transactions[index];
    const acc = this.data.accounts.find((a) => a.id === tx.accountId);
    if (acc) {
      if (tx.clearedStatus === 'uncleared') {
        acc.unclearedBalanceCents -= tx.amountCents;
      } else {
        acc.clearedBalanceCents -= tx.amountCents;
      }
      acc.workingBalanceCents = acc.clearedBalanceCents + acc.unclearedBalanceCents;
    }

    if (tx.categoryId) {
      const month = tx.date.substring(0, 7);
      const key = `${month}:${tx.categoryId}`;
      if (this.data.rollups[key]) {
        this.data.rollups[key].activityCents -= tx.amountCents;
      }
    }

    this.data.transactions.splice(index, 1);
    this.save();
    return true;
  }

  public toggleCleared(txId: string): Transaction | null {
    const tx = this.data.transactions.find((t) => t.id === txId);
    if (!tx || tx.clearedStatus === 'reconciled') return null;
    this.snapshotForUndo();

    const acc = this.data.accounts.find((a) => a.id === tx.accountId);
    if (tx.clearedStatus === 'uncleared') {
      tx.clearedStatus = 'cleared';
      if (acc) {
        acc.unclearedBalanceCents -= tx.amountCents;
        acc.clearedBalanceCents += tx.amountCents;
      }
    } else {
      tx.clearedStatus = 'uncleared';
      if (acc) {
        acc.clearedBalanceCents -= tx.amountCents;
        acc.unclearedBalanceCents += tx.amountCents;
      }
    }

    this.save();
    return tx;
  }

  public reconcileAccount(accountId: string, statementBalanceCents: number): boolean {
    const acc = this.data.accounts.find((a) => a.id === accountId);
    if (!acc) return false;
    this.snapshotForUndo();

    const diff = statementBalanceCents - acc.clearedBalanceCents;
    if (diff !== 0) {
      // Create adjustment transaction
      const today = new Date().toISOString().split('T')[0];
      const adjTx: Transaction = {
        id: `tx-rec-adj-${Date.now()}`,
        accountId,
        date: today,
        payee: 'Abstimmungs-Korrekturbuchung',
        categoryId: null,
        memo: 'Saldenausgleich bei Kontoabstimmung',
        amountCents: diff,
        clearedStatus: 'reconciled',
        isApproved: true,
        flag: 0,
        transferAccountId: null,
        transferTransactionId: null,
        importFitid: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.data.transactions.unshift(adjTx);
      acc.clearedBalanceCents += diff;
      acc.workingBalanceCents = acc.clearedBalanceCents + acc.unclearedBalanceCents;
    }

    // Mark all cleared as reconciled (lock them)
    for (const tx of this.data.transactions) {
      if (tx.accountId === accountId && tx.clearedStatus === 'cleared') {
        tx.clearedStatus = 'reconciled';
      }
    }

    acc.lastReconciledAt = Date.now();
    this.save();
    return true;
  }

  public addCategory(groupId: string, name: string): Category {
    this.snapshotForUndo();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      groupId,
      name: name.trim(),
      isHidden: false,
      sortOrder: this.data.categories.length,
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  public renameCategory(categoryId: string, newName: string): boolean {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const cat = this.data.categories.find((c) => c.id === categoryId);
    if (!cat) return false;
    if (cat.name === trimmed) return true;

    this.snapshotForUndo();
    cat.name = trimmed;
    this.save();
    return true;
  }

  public updateCategory(
    categoryId: string,
    updates: Partial<Omit<Category, 'id'>>
  ): boolean {
    const cat = this.data.categories.find((c) => c.id === categoryId);
    if (!cat) return false;

    this.snapshotForUndo();
    if (updates.name !== undefined) {
      const trimmed = updates.name.trim();
      if (!trimmed) return false;
      cat.name = trimmed;
    }
    if (updates.groupId !== undefined) cat.groupId = updates.groupId;
    if (updates.isHidden !== undefined) cat.isHidden = updates.isHidden;
    if (updates.sortOrder !== undefined) cat.sortOrder = updates.sortOrder;

    this.save();
    return true;
  }

  public renameCategoryGroup(groupId: string, newName: string): boolean {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const grp = this.data.groups.find((g) => g.id === groupId);
    if (!grp) return false;
    if (grp.name === trimmed) return true;

    this.snapshotForUndo();
    grp.name = trimmed;
    this.save();
    return true;
  }

  public deleteCategory(categoryId: string): boolean {
    const idx = this.data.categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) return false;

    this.snapshotForUndo();
    this.data.categories.splice(idx, 1);

    // Unassign transactions
    for (const tx of this.data.transactions) {
      if (tx.categoryId === categoryId) {
        tx.categoryId = null;
      }
    }

    // Clean up rollups
    for (const key of Object.keys(this.data.rollups)) {
      if (key.endsWith(`:${categoryId}`)) {
        delete this.data.rollups[key];
      }
    }

    this.save();
    return true;
  }

  public addCategoryGroup(name: string): CategoryGroup {
    this.snapshotForUndo();
    const newGrp: CategoryGroup = {
      id: `grp-${Date.now()}`,
      budgetId: this.data.budget.id,
      name: name.trim(),
      isCollapsed: false,
      sortOrder: this.data.groups.length,
    };
    this.data.groups.push(newGrp);
    this.save();
    return newGrp;
  }

  public setCategoryTarget(categoryId: string, target: Omit<import('../types').Target, 'id' | 'categoryId'> | null) {
    this.snapshotForUndo();
    const cat = this.data.categories.find((c) => c.id === categoryId);
    if (!cat) return;

    if (target === null) {
      delete cat.target;
    } else {
      cat.target = {
        id: `tgt-${Date.now()}`,
        categoryId,
        ...target,
      };
    }
    this.save();
  }

  public duplicateTransaction(txId: string): Transaction | null {
    const tx = this.data.transactions.find((t) => t.id === txId);
    if (!tx) return null;
    return this.addTransaction({
      accountId: tx.accountId,
      date: tx.date,
      payee: tx.payee,
      categoryId: tx.categoryId,
      memo: tx.memo ? `${tx.memo} (Kopie)` : 'Kopie',
      amountCents: tx.amountCents,
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: tx.flag,
      transferAccountId: tx.transferAccountId,
      transferTransactionId: null,
      importFitid: null,
    });
  }

  public splitTransaction(
    txId: string,
    splits: Array<{ categoryId: string | null; memo: string; amountCents: number }>
  ): boolean {
    const tx = this.data.transactions.find((t) => t.id === txId);
    if (!tx || splits.length < 2) return false;

    const totalSplitCents = splits.reduce((sum, s) => sum + s.amountCents, 0);
    if (totalSplitCents !== tx.amountCents) {
      return false;
    }

    this.snapshotForUndo();

    // 1. Update the parent transaction to represent split line 1
    const first = splits[0];
    this.updateTransaction(tx.id, {
      categoryId: first.categoryId,
      memo: first.memo || tx.memo,
      amountCents: first.amountCents,
      isSplitParent: true,
    });

    // 2. Add child transactions for subsequent splits
    for (let i = 1; i < splits.length; i++) {
      const s = splits[i];
      this.addTransaction({
        accountId: tx.accountId,
        date: tx.date,
        payee: tx.payee,
        categoryId: s.categoryId,
        memo: s.memo || tx.memo,
        amountCents: s.amountCents,
        clearedStatus: tx.clearedStatus,
        isApproved: true,
        flag: tx.flag,
        transferAccountId: null,
        transferTransactionId: null,
        importFitid: null,
        splitParentId: tx.id,
      });
    }

    this.save();
    return true;
  }

  public isDuplicateTransaction(
    accountId: string,
    fitid?: string | null,
    date?: string,
    payee?: string,
    amountCents?: number
  ): boolean {
    const accTxs = this.data.transactions.filter((t) => t.accountId === accountId);
    if (fitid && fitid.trim() !== '') {
      if (accTxs.some((t) => t.importFitid === fitid)) return true;
    }
    if (date && payee && amountCents !== undefined) {
      return accTxs.some(
        (t) =>
          t.date === date &&
          t.payee.trim().toLowerCase() === payee.trim().toLowerCase() &&
          t.amountCents === amountCents
      );
    }
    return false;
  }

  public learnCategoryRule(
    accountId: string,
    pattern: string,
    targetCategoryId: string,
    sourceField: string = 'Bezeichnung'
  ): void {
    if (!pattern.trim() || !targetCategoryId) return;
    const profile =
      this.data.importProfiles.find((p) => p.accountId === accountId) || this.data.importProfiles[0];
    if (profile) {
      this.snapshotForUndo();
      const existing = profile.categoryMatchRules.find(
        (r) => r.pattern.toLowerCase() === pattern.toLowerCase()
      );
      if (existing) {
        existing.targetCategoryId = targetCategoryId;
        existing.sourceField = sourceField;
      } else {
        profile.categoryMatchRules.unshift({
          sourceField,
          pattern: pattern.trim(),
          targetCategoryId,
        });
      }
      this.save();
    }
  }

  public exportBudgetBackup(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public importBudgetBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as StorageSchema;
      if (!parsed.budget || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.categories)) {
        return false;
      }
      this.snapshotForUndo();
      this.data = parsed;
      this.save();
      this.undoStack = [];
      this.redoStack = [];
      return true;
    } catch {
      return false;
    }
  }

  public resetToDemoData(): void {
    this.snapshotForUndo();
    this.data = getInitialData();
    this.save();
    this.undoStack = [];
    this.redoStack = [];
  }

  public getSettings(): AppSettings {
    const defaults: AppSettings = {
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3.2:3b',
      openRouterApiKey: '',
      negativeBalanceRollover: 'deduct_from_ready_to_assign',
    };
    return {
      ...defaults,
      ...(this.data.budget.settings || {}),
    };
  }

  public updateSettings(partial: Partial<AppSettings>): void {
    this.snapshotForUndo();
    if (!this.data.budget.settings) {
      this.data.budget.settings = this.getSettings();
    }
    this.data.budget.settings = {
      ...this.data.budget.settings,
      ...partial,
    };
    this.save();
  }

  public saveImportProfile(profile: ImportProfile) {
    this.snapshotForUndo();
    const index = this.data.importProfiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      this.data.importProfiles[index] = profile;
    } else {
      this.data.importProfiles.push(profile);
    }
    this.save();
  }

  public deleteImportProfile(id: string) {
    this.snapshotForUndo();
    this.data.importProfiles = this.data.importProfiles.filter((p) => p.id !== id);
    this.save();
  }
}

export const storage = new StorageService();
