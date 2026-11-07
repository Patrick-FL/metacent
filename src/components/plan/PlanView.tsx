import React, { useState, useEffect } from 'react';
import { Category, TargetType } from '../../types';
import { calculateBudgetMonth } from '../../services/calculations';
import { evaluateCategoryTarget } from '../../services/targetCalculations';
import { formatCurrency, parseCurrencyInput } from '../../services/currency';
import { storage } from '../../services/storage';
import { AddCategoryModal } from './AddCategoryModal';
import { AddGroupModal } from './AddGroupModal';
import { CopyPreviousMonthModal } from './CopyPreviousMonthModal';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Undo2,
  Redo2,
  Plus,
  CheckCircle2,
  Wand2,
  Clock,
  Target as TargetIcon,
  Trash2,
  Pencil,
  Check,
  X,
  Layers,
  Copy,
} from 'lucide-react';

interface PlanViewProps {
  onUpdate: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({ onUpdate }) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('cat-miete');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState<string>('');

  // Target editing state
  const [targetAmountStr, setTargetAmountStr] = useState<string>('500,00');
  const [targetType, setTargetType] = useState<TargetType>('monthly');
  const [targetDueDate, setTargetDueDate] = useState<string>('2026-12-01');

  // Category renaming state
  const [isEditingCategoryName, setIsEditingCategoryName] = useState(false);
  const [categoryNameInput, setCategoryNameInput] = useState('');

  // Modals
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [addCatGroupId, setAddCatGroupId] = useState<string | null>(null);
  const [isCopyPreviousMonthOpen, setIsCopyPreviousMonthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute previous month (YYYY-MM)
  const [currYearStr, currMonthStr] = selectedMonth.split('-');
  let prevYear = parseInt(currYearStr, 10);
  let prevMonthNum = parseInt(currMonthStr, 10) - 1;
  if (prevMonthNum < 1) {
    prevMonthNum = 12;
    prevYear -= 1;
  }
  const previousMonth = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`;

  const groups = storage.getCategoryGroups();
  const categories = storage.getCategories();
  const accounts = storage.getAccounts();
  const allTransactions = storage.getTransactions();
  const calc = calculateBudgetMonth(selectedMonth);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedRollup = selectedCategory
    ? storage.getMonthlyRollup(selectedMonth, selectedCategory.id)
    : null;
  const previousMonthRollup = selectedCategory
    ? storage.getMonthlyRollup(previousMonth, selectedCategory.id)
    : null;
  const selectedAvailable = selectedCategory
    ? calc.categoryAvailableMap[selectedCategory.id] ?? 0
    : 0;
  const selectedCategoryTargetEval = selectedCategory?.target
    ? evaluateCategoryTarget(
        selectedCategory.target,
        selectedRollup?.assignedCents ?? 0,
        selectedAvailable,
        selectedMonth
      )
    : null;

  const categoryTransactions = selectedCategory
    ? allTransactions
        .filter((tx) => tx.categoryId === selectedCategory.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const recentCategoryTransactions = categoryTransactions.slice(0, 5);

  useEffect(() => {
    if (selectedCategory) {
      setCategoryNameInput(selectedCategory.name);
      setIsEditingCategoryName(false);
      if (selectedCategory.target) {
        setTargetAmountStr((selectedCategory.target.amountCents / 100).toFixed(2).replace('.', ','));
        setTargetType(selectedCategory.target.targetType);
        if (selectedCategory.target.dueDate) setTargetDueDate(selectedCategory.target.dueDate);
      } else {
        setTargetAmountStr('0,00');
        setTargetType('monthly');
        setTargetDueDate('');
      }
    }
  }, [selectedCategory?.id]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleStartRenameCategory = () => {
    if (selectedCategory) {
      setCategoryNameInput(selectedCategory.name);
      setIsEditingCategoryName(true);
    }
  };

  const handleSaveCategoryName = () => {
    if (!selectedCategory) return;
    const trimmed = categoryNameInput.trim();
    if (!trimmed) {
      setCategoryNameInput(selectedCategory.name);
      setIsEditingCategoryName(false);
      return;
    }
    storage.renameCategory(selectedCategory.id, trimmed);
    setIsEditingCategoryName(false);
    onUpdate();
  };

  const handleCancelRenameCategory = () => {
    if (selectedCategory) {
      setCategoryNameInput(selectedCategory.name);
    }
    setIsEditingCategoryName(false);
  };

  const handleStartEdit = (category: Category) => {
    const rollup = storage.getMonthlyRollup(selectedMonth, category.id);
    setEditingCategoryId(category.id);
    setEditInputVal((rollup.assignedCents / 100).toFixed(2).replace('.', ','));
  };

  const handleSaveEdit = (categoryId: string) => {
    const cents = parseCurrencyInput(editInputVal);
    storage.setAssigned(selectedMonth, categoryId, cents);
    setEditingCategoryId(null);
    onUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(categoryId);
    } else if (e.key === 'Escape') {
      setEditingCategoryId(null);
    }
  };

  const formatMonthTitle = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  };

  const handleShiftMonth = (delta: number) => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + delta;
    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }
    setSelectedMonth(`${year}-${month.toString().padStart(2, '0')}`);
  };

  const handleUndo = () => {
    if (storage.undo()) onUpdate();
  };

  const handleRedo = () => {
    if (storage.redo()) onUpdate();
  };

  const handleFixOverAssigned = () => {
    if (calc.readyToAssignCents >= 0) return;
    const deficit = Math.abs(calc.readyToAssignCents);

    let highestCat: Category | null = null;
    let highestAssigned = 0;

    for (const c of categories) {
      const rollup = storage.getMonthlyRollup(selectedMonth, c.id);
      if (rollup.assignedCents > highestAssigned) {
        highestAssigned = rollup.assignedCents;
        highestCat = c;
      }
    }

    if (highestCat) {
      const currentAssigned = storage.getMonthlyRollup(selectedMonth, highestCat.id).assignedCents;
      const newAssigned = Math.max(0, currentAssigned - deficit);
      storage.setAssigned(selectedMonth, highestCat.id, newAssigned);
      onUpdate();
    }
  };

  const handleSaveTarget = () => {
    if (!selectedCategoryId) return;
    const amountCents = parseCurrencyInput(targetAmountStr);
    if (amountCents <= 0) return;

    storage.setCategoryTarget(selectedCategoryId, {
      targetType,
      amountCents,
      dueDate: targetDueDate || null,
      rolloverAction: 'set_aside',
    });
    onUpdate();
  };

  const handleDeleteTarget = () => {
    if (!selectedCategoryId) return;
    storage.setCategoryTarget(selectedCategoryId, null);
    onUpdate();
  };

  const isOverAssigned = calc.readyToAssignCents < 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--nothing-bg)] text-[var(--nothing-text)] transition-colors">
      {/* Top Bar: Month Selector & Primary Telemetry */}
      <header className="px-6 py-3 bg-[var(--nothing-surface)] border-b border-[var(--nothing-border)] flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3">
          {/* Month Switcher Capsule */}
          <div className="flex items-center gap-1 bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-full px-1.5 py-1">
            <button
              type="button"
              onClick={() => handleShiftMonth(-1)}
              className="w-7 h-7 rounded-full aspect-square flex items-center justify-center text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] transition-colors cursor-pointer"
              title="Vorheriger Monat"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold text-xs px-2 uppercase tracking-wider text-[var(--nothing-text)]">
              {formatMonthTitle(selectedMonth)}
            </span>
            <button
              type="button"
              onClick={() => handleShiftMonth(1)}
              className="w-7 h-7 rounded-full aspect-square flex items-center justify-center text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] transition-colors cursor-pointer"
              title="Nächster Monat"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Undo / Redo Circular Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!storage.canUndo()}
              onClick={handleUndo}
              className={`w-8 h-8 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center transition-colors cursor-pointer ${
                storage.canUndo()
                  ? 'hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)]'
                  : 'text-[var(--nothing-muted)] opacity-40 cursor-not-allowed'
              }`}
              title="Rückgängig (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!storage.canRedo()}
              onClick={handleRedo}
              className={`w-8 h-8 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center transition-colors cursor-pointer ${
                storage.canRedo()
                  ? 'hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)]'
                  : 'text-[var(--nothing-muted)] opacity-40 cursor-not-allowed'
              }`}
              title="Wiederholen (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ready to Assign Bento Widget */}
        <div
          className={`flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all ${
            isOverAssigned
              ? 'bg-[#D71921]/10 border-[#D71921] text-[#D71921]'
              : 'bg-[var(--nothing-subsurface)] border-[var(--nothing-border)] text-[var(--nothing-text)]'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isOverAssigned ? 'bg-[#D71921] animate-pulse' : 'bg-[var(--nothing-sage)]'
            }`}
          />
          <div className="text-left">
            <div className="font-mono text-base font-bold tracking-tight tabular-nums leading-none">
              {formatCurrency(calc.readyToAssignCents)}
            </div>
            <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--nothing-muted)] font-medium mt-0.5">
              {isOverAssigned ? 'ÜBERBUCHT (DEFIZIT)' : 'BEREIT ZUR ZUWEISUNG'}
            </div>
          </div>
          {isOverAssigned && (
            <button
              type="button"
              onClick={handleFixOverAssigned}
              className="flex items-center gap-1 font-mono text-[10px] uppercase font-semibold bg-[#D71921] text-white px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity ml-1 cursor-pointer"
            >
              <Wand2 className="w-3 h-3" />
              <span>Fix</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCopyPreviousMonthOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            title={`Zuweisungen aus ${formatMonthTitle(previousMonth)} übernehmen`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Vormonat</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddGroupOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gruppe</span>
          </button>
        </div>
      </header>

      {/* Main Budget Grid + Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--nothing-surface)]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[var(--nothing-subsurface)] border-b border-[var(--nothing-border)] font-mono text-xs uppercase tracking-wider text-[var(--nothing-muted)] z-10 font-medium">
              <tr>
                <th className="py-2.5 px-6">Kategorie</th>
                <th className="py-2.5 px-4 text-right w-36">Zugewiesen</th>
                <th className="py-2.5 px-4 text-right w-36">Aktivität</th>
                <th className="py-2.5 px-6 text-right w-44">Verfügbar</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const groupCategories = categories.filter((c) => c.groupId === group.id);
                const groupAssigned = groupCategories.reduce((sum, c) => sum + storage.getMonthlyRollup(selectedMonth, c.id).assignedCents, 0);
                const groupActivity = groupCategories.reduce((sum, c) => sum + storage.getMonthlyRollup(selectedMonth, c.id).activityCents, 0);
                const groupAvailable = groupAssigned + groupActivity;

                return (
                  <React.Fragment key={group.id}>
                    {/* Group Header Row */}
                    <tr className="bg-[var(--nothing-subsurface)]/70 border-t border-b border-[var(--nothing-border)] text-xs font-mono uppercase tracking-wider font-semibold text-[var(--nothing-text)]">
                      <td className="py-2 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="w-3.5 h-3.5 text-[var(--nothing-muted)]" />
                          <span>{group.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAddCatGroupId(group.id)}
                          className="font-mono text-[10px] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Kategorie
                        </button>
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-[var(--nothing-muted)]">
                        {formatCurrency(groupAssigned)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-[var(--nothing-muted)]">
                        {formatCurrency(groupActivity)}
                      </td>
                      <td className="py-2 px-6 text-right font-mono tabular-nums text-[var(--nothing-text)] font-bold">
                        {formatCurrency(groupAvailable)}
                      </td>
                    </tr>

                    {/* Category Rows */}
                    {groupCategories.map((category) => {
                      const rollup = storage.getMonthlyRollup(selectedMonth, category.id);
                      const available = calc.categoryAvailableMap[category.id] ?? 0;
                      const isSelected = selectedCategoryId === category.id;
                      const isEditing = editingCategoryId === category.id;
                      const target = category.target;
                      const targetEval = target
                        ? evaluateCategoryTarget(target, rollup.assignedCents, available, selectedMonth)
                        : null;
                      const isTargetFunded = targetEval ? targetEval.isFunded : false;
                      const targetNeeded = targetEval ? targetEval.neededThisMonthCents : 0;

                      return (
                        <tr
                          key={category.id}
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            if (category.target) {
                              setTargetAmountStr((category.target.amountCents / 100).toFixed(2).replace('.', ','));
                              setTargetType(category.target.targetType);
                              if (category.target.dueDate) setTargetDueDate(category.target.dueDate);
                            }
                          }}
                          className={`text-xs border-b border-[var(--nothing-border)] cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[var(--nothing-subsurface)] border-l-2 border-l-[#D71921]'
                              : 'hover:bg-[var(--nothing-subsurface)]/40'
                          }`}
                        >
                          <td
                            className="py-2.5 px-6 font-medium text-[var(--nothing-text)]"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategoryId(category.id);
                              setCategoryNameInput(category.name);
                              setIsEditingCategoryName(true);
                            }}
                            title="Doppelklick zum Umbenennen in Kategorie-Details"
                          >
                            <div className="flex items-center gap-2">
                              <span>{category.name}</span>
                              {target && targetEval && !isTargetFunded && (
                                <span
                                  className="text-[10px] font-mono text-[var(--nothing-amber)] flex items-center gap-1 font-normal"
                                  title={targetEval.statusDescription}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{formatCurrency(targetNeeded)} nötig</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Assigned Column (Editable) */}
                          <td
                            className="py-1 px-4 text-right"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(category);
                            }}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={editInputVal}
                                onChange={(e) => setEditInputVal(e.target.value)}
                                onBlur={() => handleSaveEdit(category.id)}
                                onKeyDown={(e) => handleKeyDown(e, category.id)}
                                className="w-28 text-right bg-[var(--nothing-surface)] border border-[#D71921] text-[var(--nothing-text)] px-2.5 py-1 rounded-lg font-mono text-xs focus:outline-none"
                              />
                            ) : (
                              <span className="font-mono tabular-nums px-2 py-1 rounded hover:bg-[var(--nothing-subsurface)] text-[var(--nothing-text)]">
                                {formatCurrency(rollup.assignedCents)}
                              </span>
                            )}
                          </td>

                          {/* Activity Column */}
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[var(--nothing-muted)]">
                            {formatCurrency(rollup.activityCents)}
                          </td>

                          {/* Available Column with Nothing OS Capsule Badges */}
                          <td className="py-2.5 px-6 text-right">
                            <span
                              className={`inline-block px-3 py-0.5 rounded-full font-mono tabular-nums text-xs ${
                                available < 0
                                  ? 'bg-[#D71921]/15 text-[#D71921] border border-[#D71921]/30 font-bold'
                                  : isTargetFunded
                                  ? 'bg-[var(--nothing-sage)]/15 text-[var(--nothing-sage)] border border-[var(--nothing-sage)]/30 font-bold'
                                  : available > 0
                                  ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-medium'
                                  : 'text-[var(--nothing-muted)]'
                              }`}
                            >
                              {formatCurrency(available)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Inspector Panel: Category Details & Target Setting */}
        <aside className="w-84 border-l border-[var(--nothing-border)] bg-[var(--nothing-surface)] p-5 flex flex-col gap-4 overflow-y-auto shrink-0 transition-colors">
          {selectedCategory ? (
            <div className="space-y-4">
              <div className="border-b border-[var(--nothing-border)] pb-3 mb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold text-[var(--nothing-muted)] uppercase tracking-widest">
                    KATEGORIE // DETAILS
                  </span>
                  {!isEditingCategoryName && (
                    <button
                      type="button"
                      onClick={handleStartRenameCategory}
                      className="font-mono text-[11px] uppercase tracking-wider text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center gap-1 font-medium transition-colors p-1 rounded hover:bg-[var(--nothing-subsurface)] cursor-pointer"
                      title="Kategorie umbenennen"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingCategoryName ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      autoFocus
                      value={categoryNameInput}
                      onChange={(e) => setCategoryNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCategoryName();
                        if (e.key === 'Escape') handleCancelRenameCategory();
                      }}
                      className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-sm font-semibold text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)]"
                      placeholder="Kategoriename eingeben"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveCategoryName}
                        className="flex-1 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Speichern</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRenameCategory}
                        className="px-3 py-1.5 bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] text-[var(--nothing-text)] hover:border-[var(--nothing-border-hover)] rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Abbrechen</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between group">
                    <h3
                      onClick={handleStartRenameCategory}
                      className="text-base font-bold text-[var(--nothing-text)] cursor-pointer hover:underline transition-colors truncate"
                      title="Klicken zum Umbenennen"
                    >
                      {selectedCategory.name}
                    </h3>
                  </div>
                )}

                {/* Linked Accounts Info Badge */}
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[var(--nothing-muted)]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] font-mono text-[10px] text-[var(--nothing-text)] font-semibold">
                    {categoryTransactions.length} {categoryTransactions.length === 1 ? 'Buchung' : 'Buchungen'}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">auf Konten verknüpft</span>
                </div>

                {/* Previous Month Quick Copy for Single Category */}
                {previousMonthRollup && previousMonthRollup.assignedCents > 0 && (
                  <div className="mt-3 bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono text-[9px] text-[var(--nothing-muted)] uppercase tracking-wider">
                        Vormonat ({formatMonthTitle(previousMonth)})
                      </div>
                      <div className="font-mono font-bold text-[var(--nothing-text)] mt-0.5 tabular-nums">
                        {formatCurrency(previousMonthRollup.assignedCents)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        storage.copyAssignedForCategory(previousMonth, selectedMonth, selectedCategory.id);
                        onUpdate();
                        setToastMessage(
                          `${formatCurrency(previousMonthRollup.assignedCents)} aus ${formatMonthTitle(previousMonth)} für „${selectedCategory.name}“ übernommen`
                        );
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                      title={`${formatCurrency(previousMonthRollup.assignedCents)} in ${formatMonthTitle(selectedMonth)} übertragen`}
                    >
                      <Copy className="w-3 h-3" />
                      <span>Kopieren</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Target Configuration Bento Card */}
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold text-[var(--nothing-text)]">
                    <TargetIcon className="w-4 h-4 text-[#D71921]" />
                    <span>Sparziel konfigurieren</span>
                  </div>
                  {selectedCategory.target && (
                    <button
                      type="button"
                      onClick={handleDeleteTarget}
                      className="text-[#D71921] hover:opacity-80 p-1 cursor-pointer"
                      title="Ziel löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {selectedCategory.target && selectedCategoryTargetEval && (
                  <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">Status</span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          selectedCategoryTargetEval.isFunded
                            ? 'text-[var(--nothing-sage)]'
                            : selectedCategoryTargetEval.isOverdue
                            ? 'text-[#D71921]'
                            : 'text-[var(--nothing-amber)]'
                        }`}
                      >
                        {selectedCategoryTargetEval.statusDescription}
                      </span>
                    </div>

                    <div className="w-full bg-[var(--nothing-subsurface)] h-2 rounded-full overflow-hidden border border-[var(--nothing-border)]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          selectedCategoryTargetEval.isFunded
                            ? 'bg-[var(--nothing-sage)]'
                            : selectedCategoryTargetEval.isOverdue
                            ? 'bg-[#D71921]'
                            : 'bg-[var(--nothing-amber)]'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(selectedCategoryTargetEval.progressRatio * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--nothing-muted)] font-mono tabular-nums">
                      <span>
                        Soll {formatMonthTitle(selectedMonth)}: {formatCurrency(selectedCategoryTargetEval.monthlyQuotaCents)}
                      </span>
                      <span className="font-bold">{Math.round(selectedCategoryTargetEval.progressRatio * 100)} %</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">Rhythmus</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as TargetType)}
                    className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)]"
                  >
                    <option value="monthly">Monatlich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="yearly">Jährlich</option>
                    <option value="custom">Benutzerdefiniert</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">Zielbetrag (EUR)</label>
                  <input
                    type="text"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] font-mono tabular-nums focus:outline-none focus:border-[var(--nothing-text)]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">Fälligkeitsdatum (optional)</label>
                  <input
                    type="date"
                    value={targetDueDate}
                    onChange={(e) => setTargetDueDate(e.target.value)}
                    className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveTarget}
                  className="w-full py-2 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ziel speichern</span>
                </button>
              </div>

              {/* Linked Account Transactions Bento Card */}
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold text-[var(--nothing-text)]">
                    <Layers className="w-3.5 h-3.5 text-[#D71921]" />
                    <span>Zugeordnete Buchungen</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] text-[var(--nothing-muted)]">
                    {categoryTransactions.length > 5
                      ? `5 / ${categoryTransactions.length}`
                      : categoryTransactions.length}
                  </span>
                </div>

                {recentCategoryTransactions.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {recentCategoryTransactions.map((tx) => {
                      const acc = accounts.find((a) => a.id === tx.accountId);
                      const isNegative = tx.amountCents < 0;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[var(--nothing-surface)] border border-[var(--nothing-border)]"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-[var(--nothing-text)] truncate">{tx.payee}</div>
                            <div className="font-mono text-[10px] text-[var(--nothing-muted)] truncate">
                              {acc ? acc.nickname : 'Konto'} • {tx.date}
                            </div>
                          </div>
                          <span
                            className={`font-mono font-semibold text-xs shrink-0 tabular-nums ${
                              isNegative ? 'text-[#D71921]' : 'text-[var(--nothing-sage)]'
                            }`}
                          >
                            {formatCurrency(tx.amountCents)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-[var(--nothing-muted)] py-2 text-center">
                    Keine Buchungen vorhanden.
                  </p>
                )}
                {categoryTransactions.length > 5 && (
                  <div className="font-mono text-[10px] text-[var(--nothing-muted)] text-right">
                    + {categoryTransactions.length - 5} ältere Buchungen
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 font-mono text-xs text-[var(--nothing-muted)] uppercase tracking-wider">
              Kategorie auswählen für Details.
            </div>
          )}
        </aside>
      </div>

      {/* Add Modals */}
      <AddGroupModal
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
        onSuccess={onUpdate}
      />

      {addCatGroupId && (
        <AddCategoryModal
          isOpen={true}
          groupId={addCatGroupId}
          groupName={groups.find((g) => g.id === addCatGroupId)?.name || ''}
          onClose={() => setAddCatGroupId(null)}
          onSuccess={onUpdate}
        />
      )}

      <CopyPreviousMonthModal
        isOpen={isCopyPreviousMonthOpen}
        currentMonth={selectedMonth}
        onClose={() => setIsCopyPreviousMonthOpen(false)}
        onSuccess={(msg) => {
          onUpdate();
          if (msg) setToastMessage(msg);
        }}
      />

      {/* Floating Action Toast (Bento Capsule) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] text-[var(--nothing-text)] px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[var(--nothing-sage)]" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] ml-2 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
