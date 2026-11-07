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
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0d110e] text-[#f1f5f2]">
      {/* Top Bar: Month Selector & Actions */}
      <header className="px-6 py-4 border-b border-[#232e26] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-[#141a16] border border-[#232e26] rounded-md px-2 py-1">
            <button
              onClick={() => handleShiftMonth(-1)}
              className="p-1 text-[#8c9e91] hover:text-[#f1f5f2] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm px-2 text-[#f1f5f2]">
              {formatMonthTitle(selectedMonth)}
            </span>
            <button
              onClick={() => handleShiftMonth(1)}
              className="p-1 text-[#8c9e91] hover:text-[#f1f5f2] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={!storage.canUndo()}
              onClick={handleUndo}
              className={`p-1.5 rounded transition-colors ${
                storage.canUndo()
                  ? 'hover:bg-[#141a16] text-[#8c9e91] hover:text-[#f1f5f2]'
                  : 'text-[#4c5950] cursor-not-allowed'
              }`}
              title="Rückgängig (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              disabled={!storage.canRedo()}
              onClick={handleRedo}
              className={`p-1.5 rounded transition-colors ${
                storage.canRedo()
                  ? 'hover:bg-[#141a16] text-[#8c9e91] hover:text-[#f1f5f2]'
                  : 'text-[#4c5950] cursor-not-allowed'
              }`}
              title="Wiederholen (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ready to Assign Banner */}
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${
            isOverAssigned
              ? 'bg-[#e8706d]/10 border-[#e8706d] text-[#e8706d]'
              : 'bg-[#adebb3]/10 border-[#adebb3] text-[#adebb3]'
          }`}
        >
          <div>
            <div className="text-xl font-bold font-mono tracking-tight tabular-nums">
              {formatCurrency(calc.readyToAssignCents)}
            </div>
            <div className="text-[10px] tracking-wide uppercase font-semibold">
              {isOverAssigned ? 'Mehr zugewiesen als verfügbar' : 'Bereit zur Zuweisung'}
            </div>
          </div>
          {isOverAssigned && (
            <button
              onClick={handleFixOverAssigned}
              className="flex items-center gap-1 text-xs bg-[#e8706d] text-[#0d110e] px-2.5 py-1 rounded font-bold hover:opacity-90 transition-opacity"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Korrigieren</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCopyPreviousMonthOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#232e26] hover:border-[#adebb3]/40 hover:text-[#adebb3] rounded-md text-[#8c9e91] transition-colors"
            title={`Zuweisungen aus ${formatMonthTitle(previousMonth)} übernehmen`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Vormonat übernehmen</span>
          </button>

          <button
            onClick={() => setIsAddGroupOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#232e26] hover:border-[#adebb3]/40 rounded-md text-[#8c9e91] hover:text-[#f1f5f2] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kategoriegruppe</span>
          </button>
        </div>
      </header>

      {/* Main Budget Grid + Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table Area */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#0d110e] border-b border-[#232e26] text-[11px] font-semibold text-[#8c9e91] uppercase tracking-wider z-10">
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
                    <tr className="bg-[#141a16]/60 border-t border-b border-[#232e26] text-xs font-semibold text-[#f1f5f2]">
                      <td className="py-2 px-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="w-3.5 h-3.5 text-[#8c9e91]" />
                          <span>{group.name}</span>
                        </div>
                        <button
                          onClick={() => setAddCatGroupId(group.id)}
                          className="opacity-60 hover:opacity-100 text-[#adebb3] text-[11px] flex items-center gap-1 font-normal"
                        >
                          <Plus className="w-3 h-3" /> Kategorie
                        </button>
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-[#8c9e91]">
                        {formatCurrency(groupAssigned)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-[#8c9e91]">
                        {formatCurrency(groupActivity)}
                      </td>
                      <td className="py-2 px-6 text-right font-mono tabular-nums text-[#f1f5f2]">
                        {formatCurrency(groupAvailable)}
                      </td>
                    </tr>

                    {/* Category Rows (Clean Typography, No Emojis) */}
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
                          className={`text-xs border-b border-[#232e26]/50 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#1b241e] border-l-2 border-l-[#adebb3]'
                              : 'hover:bg-[#141a16]/40'
                          }`}
                        >
                          <td
                            className="py-2.5 px-6 font-medium text-[#f1f5f2]"
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
                                  className="text-[10px] text-[#f3d279] flex items-center gap-1 font-normal"
                                  title={targetEval.statusDescription}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{formatCurrency(targetNeeded)} noch nötig</span>
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
                                className="w-28 text-right bg-[#0d110e] border border-[#adebb3] text-[#adebb3] px-2 py-1 rounded font-mono text-xs focus:outline-none"
                              />
                            ) : (
                              <span className="font-mono tabular-nums px-2 py-1 rounded hover:bg-[#232e26]/50 text-[#f1f5f2]">
                                {formatCurrency(rollup.assignedCents)}
                              </span>
                            )}
                          </td>

                          {/* Activity Column */}
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#8c9e91]">
                            {formatCurrency(rollup.activityCents)}
                          </td>

                          {/* Available Column with Target indicators */}
                          <td className="py-2.5 px-6 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-medium tabular-nums text-[11px] ${
                                available < 0
                                  ? 'bg-[#e8706d]/15 text-[#e8706d] border border-[#e8706d]/30'
                                  : isTargetFunded
                                  ? 'bg-[#adebb3] text-[#0d110e] font-bold'
                                  : available > 0
                                  ? 'bg-[#adebb3]/15 text-[#adebb3] border border-[#adebb3]/30'
                                  : 'text-[#8c9e91]'
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
        <aside className="w-80 border-l border-[#232e26] bg-[#0a0d0b] p-5 flex flex-col gap-4 overflow-y-auto">
          {selectedCategory ? (
            <div className="space-y-4">
              <div className="border-b border-[#232e26] pb-3 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#8c9e91] uppercase tracking-wider">
                    Kategorie-Details
                  </span>
                  {!isEditingCategoryName && (
                    <button
                      type="button"
                      onClick={handleStartRenameCategory}
                      className="text-[11px] text-[#8c9e91] hover:text-[#adebb3] flex items-center gap-1 font-medium transition-colors p-1 -mr-1 rounded hover:bg-[#141a16]"
                      title="Kategorie umbenennen"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Umbenennen</span>
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
                      className="w-full bg-[#0d110e] border border-[#adebb3] rounded-md px-2.5 py-1.5 text-sm font-semibold text-[#f1f5f2] focus:outline-none"
                      placeholder="Kategoriename eingeben"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveCategoryName}
                        className="flex-1 py-1.5 bg-[#adebb3] text-[#0d110e] rounded text-xs font-bold hover:bg-[#adebb3]/90 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Speichern</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRenameCategory}
                        className="px-3 py-1.5 bg-[#141a16] border border-[#232e26] text-[#8c9e91] hover:text-[#f1f5f2] rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
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
                      className="text-base font-semibold text-[#f1f5f2] cursor-pointer hover:text-[#adebb3] transition-colors truncate"
                      title="Klicken zum Umbenennen"
                    >
                      {selectedCategory.name}
                    </h3>
                  </div>
                )}

                {/* Linked Accounts Info Badge */}
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[#8c9e91]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#141a16] border border-[#232e26] font-mono text-[10px] text-[#adebb3]">
                    {categoryTransactions.length} {categoryTransactions.length === 1 ? 'Buchung' : 'Buchungen'}
                  </span>
                  <span>auf Konten verknüpft</span>
                </div>

                {/* Previous Month Quick Copy for Single Category */}
                {previousMonthRollup && previousMonthRollup.assignedCents > 0 && (
                  <div className="mt-3 bg-[#141a16] border border-[#232e26] rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-[#8c9e91] uppercase tracking-wider">
                        Vormonat ({formatMonthTitle(previousMonth)})
                      </div>
                      <div className="font-mono font-medium text-[#f1f5f2] mt-0.5">
                        {formatCurrency(previousMonthRollup.assignedCents)} zugewiesen
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
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#232e26] hover:bg-[#adebb3] text-[#8c9e91] hover:text-[#0d110e] hover:font-bold rounded text-xs transition-colors"
                      title={`${formatCurrency(previousMonthRollup.assignedCents)} in ${formatMonthTitle(selectedMonth)} übertragen`}
                    >
                      <Copy className="w-3 h-3" />
                      <span>Übernehmen</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Target Configuration Card */}
              <div className="bg-[#141a16] border border-[#232e26] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-xs text-[#f1f5f2]">
                    <TargetIcon className="w-4 h-4 text-[#adebb3]" />
                    <span>Sparziel konfigurieren</span>
                  </div>
                  {selectedCategory.target && (
                    <button
                      onClick={handleDeleteTarget}
                      className="text-[#e8706d] hover:text-[#e8706d]/80 p-1"
                      title="Ziel löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {selectedCategory.target && selectedCategoryTargetEval && (
                  <div className="bg-[#0d110e] border border-[#232e26] rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8c9e91]">Status</span>
                      <span
                        className={`font-medium ${
                          selectedCategoryTargetEval.isFunded
                            ? 'text-[#adebb3]'
                            : selectedCategoryTargetEval.isOverdue
                            ? 'text-[#e8706d]'
                            : 'text-[#f3d279]'
                        }`}
                      >
                        {selectedCategoryTargetEval.statusDescription}
                      </span>
                    </div>

                    <div className="w-full bg-[#141a16] h-1.5 rounded-full overflow-hidden border border-[#232e26]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          selectedCategoryTargetEval.isFunded
                            ? 'bg-[#adebb3]'
                            : selectedCategoryTargetEval.isOverdue
                            ? 'bg-[#e8706d]'
                            : 'bg-[#f3d279]'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(selectedCategoryTargetEval.progressRatio * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8c9e91] font-mono">
                      <span>
                        Soll {formatMonthTitle(selectedMonth)}: {formatCurrency(selectedCategoryTargetEval.monthlyQuotaCents)}
                      </span>
                      <span>{Math.round(selectedCategoryTargetEval.progressRatio * 100)} %</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-[#8c9e91] mb-1">Rhythmus</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as TargetType)}
                    className="w-full bg-[#0d110e] border border-[#232e26] rounded px-2.5 py-1 text-xs text-[#f1f5f2]"
                  >
                    <option value="monthly">Monatlich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="yearly">Jährlich</option>
                    <option value="custom">Benutzerdefiniert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#8c9e91] mb-1">Zielbetrag (EUR)</label>
                  <input
                    type="text"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    className="w-full bg-[#0d110e] border border-[#232e26] rounded px-2.5 py-1 text-xs text-[#adebb3] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#8c9e91] mb-1">Fälligkeitsdatum (optional)</label>
                  <input
                    type="date"
                    value={targetDueDate}
                    onChange={(e) => setTargetDueDate(e.target.value)}
                    className="w-full bg-[#0d110e] border border-[#232e26] rounded px-2.5 py-1 text-xs text-[#f1f5f2]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveTarget}
                  className="w-full py-2 bg-[#adebb3] text-[#0d110e] rounded text-xs font-bold hover:bg-[#adebb3]/90 transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ziel speichern</span>
                </button>
              </div>

              {/* Linked Account Transactions Card */}
              <div className="bg-[#141a16] border border-[#232e26] rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-xs text-[#f1f5f2]">
                    <Layers className="w-3.5 h-3.5 text-[#adebb3]" />
                    <span>Zugeordnete Kontobuchungen</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d110e] border border-[#232e26] text-[#8c9e91]">
                    {categoryTransactions.length > 5
                      ? `5 von ${categoryTransactions.length}`
                      : categoryTransactions.length}
                  </span>
                </div>

                {recentCategoryTransactions.length > 0 ? (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                    {recentCategoryTransactions.map((tx) => {
                      const acc = accounts.find((a) => a.id === tx.accountId);
                      const isNegative = tx.amountCents < 0;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[#0d110e]/70 border border-[#232e26]/60"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-[#f1f5f2] truncate">{tx.payee}</div>
                            <div className="text-[9px] text-[#8c9e91] truncate font-sans">
                              {acc ? acc.nickname : 'Konto'} • {tx.date}
                            </div>
                          </div>
                          <span
                            className={`font-mono font-medium text-xs shrink-0 tabular-nums ${
                              isNegative ? 'text-[#e8706d]' : 'text-[#adebb3]'
                            }`}
                          >
                            {formatCurrency(tx.amountCents)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8c9e91] italic py-1">
                    Aktuell keine Buchungen auf Konten dieser Kategorie zugeordnet.
                  </p>
                )}
                {categoryTransactions.length > 5 && (
                  <div className="text-[10px] text-[#8c9e91] text-right font-mono">
                    + {categoryTransactions.length - 5} ältere Buchungen
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-[#8c9e91]">
              Wähle eine Kategorie aus, um Details und Sparziele zu verwalten.
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

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#141a16] border border-[#adebb3] text-[#adebb3] px-4 py-2.5 rounded-lg text-xs font-medium shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#adebb3]" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#8c9e91] hover:text-[#f1f5f2] ml-2 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
