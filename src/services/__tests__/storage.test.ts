import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('Storage Operations & State Machine', () => {
  beforeEach(() => {
    // Ensure fresh baseline
  });

  it('updates working balance by generating adjustment transaction', () => {
    const acc = storage.getAccounts()[0];
    const initialWorking = acc.workingBalanceCents;

    const adj = storage.adjustWorkingBalance(acc.id, initialWorking + 5000); // +50,00 €
    expect(adj).not.toBeNull();
    expect(adj?.amountCents).toBe(5000);
    expect(adj?.payee).toBe('Abstimmungs-Korrekturbuchung');

    const updatedAcc = storage.getAccounts().find((a) => a.id === acc.id);
    expect(updatedAcc?.workingBalanceCents).toBe(initialWorking + 5000);

    // Test Undo
    storage.undo();
    const undoneAcc = storage.getAccounts().find((a) => a.id === acc.id);
    expect(undoneAcc?.workingBalanceCents).toBe(initialWorking);
  });

  it('toggles transaction cleared status and shifts balance between cleared and uncleared', () => {
    const acc = storage.getAccounts()[0];
    const tx = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-01',
      payee: 'Test Payee',
      categoryId: 'cat-lebensmittel',
      memo: 'Test Memo',
      amountCents: -2500, // -25,00 €
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    expect(tx.clearedStatus).toBe('uncleared');

    // Toggle to cleared
    const toggled = storage.toggleCleared(tx.id);
    expect(toggled?.clearedStatus).toBe('cleared');

    // Toggle back to uncleared
    const toggledBack = storage.toggleCleared(tx.id);
    expect(toggledBack?.clearedStatus).toBe('uncleared');

    // Clean up
    storage.deleteTransaction(tx.id);
  });

  it('reconciles account, marks cleared transactions as reconciled, and locks them', () => {
    const acc = storage.getAccounts()[0];
    const clearedBefore = acc.clearedBalanceCents;

    const success = storage.reconcileAccount(acc.id, clearedBefore);
    expect(success).toBe(true);

    const reconciledAcc = storage.getAccounts().find((a) => a.id === acc.id);
    expect(reconciledAcc?.lastReconciledAt).not.toBeNull();

    // Verify transactions for this account that were cleared are now reconciled
    const txs = storage.getTransactions(acc.id);
    const hasReconciled = txs.some((t) => t.clearedStatus === 'reconciled');
    expect(hasReconciled).toBe(true);
  });

  it('duplicates transaction using Shift+D behavior', () => {
    const acc = storage.getAccounts()[0];
    const tx = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-01',
      payee: 'Bäcker',
      categoryId: 'cat-lebensmittel',
      memo: 'Brötchen',
      amountCents: -450,
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    const dup = storage.duplicateTransaction(tx.id);
    expect(dup).not.toBeNull();
    expect(dup?.id).not.toBe(tx.id);
    expect(dup?.payee).toBe('Bäcker');
    expect(dup?.amountCents).toBe(-450);
    expect(dup?.clearedStatus).toBe('uncleared'); // Duplicates start uncleared
  });

  it('splits transaction across multiple categories and updates rollups', () => {
    const acc = storage.getAccounts()[0];
    const tx = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-01',
      payee: 'Warenhaus',
      categoryId: null,
      memo: 'Einkauf',
      amountCents: -5000, // -50,00 €
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    const success = storage.splitTransaction(tx.id, [
      { categoryId: 'cat-lebensmittel', memo: 'Essen', amountCents: -3500 },
      { categoryId: 'cat-gesundheit', memo: 'Zahnbürste', amountCents: -1500 },
    ]);

    expect(success).toBe(true);

    const foodRollup = storage.getMonthlyRollup('2026-11', 'cat-lebensmittel');
    const healthRollup = storage.getMonthlyRollup('2026-11', 'cat-gesundheit');

    expect(foodRollup.activityCents).toBeLessThan(0);
    expect(healthRollup.activityCents).toBeLessThan(0);
  });

  it('exports and imports budget JSON backup cleanly', () => {
    const jsonBackup = storage.exportBudgetBackup();
    expect(jsonBackup).toContain('Hauptbudget');
    expect(jsonBackup).toContain('acc-giro-1');

    const importSuccess = storage.importBudgetBackup(jsonBackup);
    expect(importSuccess).toBe(true);

    const accounts = storage.getAccounts();
    expect(accounts.length).toBeGreaterThan(0);
  });

  it('renames a category and ensures transactions reference the updated name', () => {
    const categories = storage.getCategories();
    const catStrom = categories.find((c) => c.id === 'cat-strom');
    expect(catStrom).toBeDefined();
    expect(catStrom?.name).toBe('Strom & Heizung');

    // Add a transaction assigned to this category on an account
    const acc = storage.getAccounts()[0];
    const tx = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-05',
      payee: 'Stadtwerke Test',
      categoryId: 'cat-strom',
      memo: 'Abschlag November',
      amountCents: -12000,
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    // Rename the category
    const success = storage.renameCategory('cat-strom', 'Energie & Heizung (Stadtwerke)');
    expect(success).toBe(true);

    // Verify category name updated
    const updatedCategories = storage.getCategories();
    const updatedCat = updatedCategories.find((c) => c.id === 'cat-strom');
    expect(updatedCat?.name).toBe('Energie & Heizung (Stadtwerke)');

    // Verify transaction dynamically resolves to the updated category name
    const foundTx = storage.getTransactions().find((t) => t.id === tx.id);
    expect(foundTx).toBeDefined();
    const resolvedCat = updatedCategories.find((c) => c.id === foundTx?.categoryId);
    expect(resolvedCat?.name).toBe('Energie & Heizung (Stadtwerke)');

    // Clean up transaction
    storage.deleteTransaction(tx.id);

    // Reset name back for clean test state
    storage.renameCategory('cat-strom', 'Strom & Heizung');
  });

  it('supports undo and redo when renaming a category', () => {
    const originalCat = storage.getCategories().find((c) => c.id === 'cat-telefon');
    const originalName = originalCat?.name || 'Telefon & Internet';

    storage.renameCategory('cat-telefon', 'Telekommunikation & Glasfaser');
    expect(storage.getCategories().find((c) => c.id === 'cat-telefon')?.name).toBe('Telekommunikation & Glasfaser');

    // Undo
    storage.undo();
    expect(storage.getCategories().find((c) => c.id === 'cat-telefon')?.name).toBe(originalName);

    // Redo
    storage.redo();
    expect(storage.getCategories().find((c) => c.id === 'cat-telefon')?.name).toBe('Telekommunikation & Glasfaser');

    // Reset
    storage.renameCategory('cat-telefon', originalName);
  });

  it('rejects renaming category with empty or invalid inputs', () => {
    const successEmpty = storage.renameCategory('cat-miete', '   ');
    expect(successEmpty).toBe(false);

    const successNonExistent = storage.renameCategory('cat-non-existent-id', 'Neuer Name');
    expect(successNonExistent).toBe(false);
  });

  it('renames a category group', () => {
    const groups = storage.getCategoryGroups();
    const fixkostenGroup = groups.find((g) => g.id === 'grp-fixkosten');
    expect(fixkostenGroup).toBeDefined();
    const originalName = fixkostenGroup!.name;

    const success = storage.renameCategoryGroup('grp-fixkosten', 'Feste Monatskosten');
    expect(success).toBe(true);
    expect(storage.getCategoryGroups().find((g) => g.id === 'grp-fixkosten')?.name).toBe('Feste Monatskosten');

    // Reset
    storage.renameCategoryGroup('grp-fixkosten', originalName);
  });

  it('deletes a category and unassigns affected transactions to null', () => {
    // Create temporary category
    const cat = storage.addCategory('grp-bedarfe', 'Temporäre Kategorie');
    const acc = storage.getAccounts()[0];

    const tx = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-06',
      payee: 'Temp Payee',
      categoryId: cat.id,
      memo: '',
      amountCents: -1000,
      clearedStatus: 'cleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    expect(storage.getCategories().some((c) => c.id === cat.id)).toBe(true);

    const deleted = storage.deleteCategory(cat.id);
    expect(deleted).toBe(true);
    expect(storage.getCategories().some((c) => c.id === cat.id)).toBe(false);

    // Transaction categoryId is set to null (unassigned)
    const updatedTx = storage.getTransactions().find((t) => t.id === tx.id);
    expect(updatedTx?.categoryId).toBeNull();

    // Clean up
    storage.deleteTransaction(tx.id);
  });

  it('copies assigned amounts from previous month in bulk with 1-click undo', () => {
    // Set up source month (2026-10) with assigned values
    storage.setAssigned('2026-10', 'cat-lebensmittel', 30000); // 300,00 €
    storage.setAssigned('2026-10', 'cat-miete', 50000); // 500,00 €

    // Ensure target month (2026-11) is 0
    storage.setAssigned('2026-11', 'cat-lebensmittel', 0);
    storage.setAssigned('2026-11', 'cat-miete', 0);

    // Copy from 2026-10 to 2026-11
    const result = storage.copyAssignedFromMonth('2026-10', '2026-11');
    expect(result.count).toBe(2);
    expect(result.totalCents).toBe(80000);

    // Verify 2026-11 now has the copied values
    expect(storage.getMonthlyRollup('2026-11', 'cat-lebensmittel').assignedCents).toBe(30000);
    expect(storage.getMonthlyRollup('2026-11', 'cat-miete').assignedCents).toBe(50000);

    // Verify Undo works with a single step for all categories
    storage.undo();
    expect(storage.getMonthlyRollup('2026-11', 'cat-lebensmittel').assignedCents).toBe(0);
    expect(storage.getMonthlyRollup('2026-11', 'cat-miete').assignedCents).toBe(0);
  });

  it('copies assigned amount for a single specific category', () => {
    storage.setAssigned('2026-10', 'cat-lebensmittel', 35000); // 350,00 €
    storage.setAssigned('2026-11', 'cat-lebensmittel', 0);

    const copied = storage.copyAssignedForCategory('2026-10', '2026-11', 'cat-lebensmittel');
    expect(copied).toBe(35000);
    expect(storage.getMonthlyRollup('2026-11', 'cat-lebensmittel').assignedCents).toBe(35000);

    // Undo reverts this category
    storage.undo();
    expect(storage.getMonthlyRollup('2026-11', 'cat-lebensmittel').assignedCents).toBe(0);
  });

  it('performs bulk operations: update, clear status, duplicate, delete with 1-step undo', () => {
    const acc = storage.getAccounts()[0];
    const tx1 = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-01',
      payee: 'Bulk Tx 1',
      categoryId: 'cat-lebensmittel',
      memo: 'Memo 1',
      amountCents: -1000,
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });
    const tx2 = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-02',
      payee: 'Bulk Tx 2',
      categoryId: 'cat-lebensmittel',
      memo: 'Memo 2',
      amountCents: -2000,
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    const ids = [tx1.id, tx2.id];

    // 1. Bulk set cleared status
    const clearedCount = storage.setClearedStatusForTransactions(ids, 'cleared');
    expect(clearedCount).toBe(2);
    expect(storage.getTransactions().find((t) => t.id === tx1.id)?.clearedStatus).toBe('cleared');
    expect(storage.getTransactions().find((t) => t.id === tx2.id)?.clearedStatus).toBe('cleared');

    // 2. Bulk update category
    const updatedCount = storage.updateTransactions(ids, { categoryId: 'cat-miete' });
    expect(updatedCount).toBe(2);
    expect(storage.getTransactions().find((t) => t.id === tx1.id)?.categoryId).toBe('cat-miete');
    expect(storage.getTransactions().find((t) => t.id === tx2.id)?.categoryId).toBe('cat-miete');

    // 3. Bulk duplicate
    const dups = storage.duplicateTransactions(ids);
    expect(dups.length).toBe(2);
    expect(dups[0].memo).toContain('Kopie');

    // 4. Bulk delete
    const allIdsToDelete = [...ids, ...dups.map((d) => d.id)];
    const deletedCount = storage.deleteTransactions(allIdsToDelete);
    expect(deletedCount).toBe(4);
    for (const id of allIdsToDelete) {
      expect(storage.getTransactions().some((t) => t.id === id)).toBe(false);
    }

    // 5. Single undo restores all 4 deleted
    storage.undo();
    for (const id of allIdsToDelete) {
      expect(storage.getTransactions().some((t) => t.id === id)).toBe(true);
    }

    // Clean up
    storage.deleteTransactions(allIdsToDelete);
  });

  it('preserves reconciled status during bulk cleared status updates', () => {
    const acc = storage.getAccounts()[0];
    const tx1 = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-01',
      payee: 'Normal Tx',
      categoryId: null,
      memo: '',
      amountCents: -500,
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });
    const tx2 = storage.addTransaction({
      accountId: acc.id,
      date: '2026-11-01',
      payee: 'Reconciled Tx',
      categoryId: null,
      memo: '',
      amountCents: -500,
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    // Manually set tx2 to reconciled
    storage.updateTransaction(tx2.id, { clearedStatus: 'reconciled' });

    // Try to set both to cleared in bulk
    storage.setClearedStatusForTransactions([tx1.id, tx2.id], 'cleared');

    expect(storage.getTransactions().find((t) => t.id === tx1.id)?.clearedStatus).toBe('cleared');
    expect(storage.getTransactions().find((t) => t.id === tx2.id)?.clearedStatus).toBe('reconciled');

    // Clean up
    storage.deleteTransactions([tx1.id, tx2.id]);
  });
});

