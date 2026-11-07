import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Account, Transaction } from '../../types';
import { formatCurrency, parseCurrencyInput } from '../../services/currency';
import { storage } from '../../services/storage';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Star,
  Plus,
  Upload,
  Search,
  Sparkles,
  CheckCheck,
  Edit2,
  Trash2,
  Lock,
  Copy,
  Split,
  FilterX,
  Check,
  Minus,
  Tag,
  X,
} from 'lucide-react';
import { SplitTransactionModal } from './SplitTransactionModal';
import {
  AllFilters,
  emptyFilters,
  hasActiveFilters,
  applyAllFilters,
  CategoryFilter,
  PayeeFilter,
  DateFilter,
  StatusFilter,
  AmountFilter,
} from './ColumnFilter';

interface RegisterViewProps {
  account: Account;
  onUpdate: () => void;
  onOpenFileImport: () => void;
  onOpenReconcile: () => void;
  onOpenEditAccount: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  account,
  onUpdate,
  onOpenFileImport,
  onOpenReconcile,
  onOpenEditAccount,
}) => {
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<AllFilters>(emptyFilters);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [lastAnchorId, setLastAnchorId] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Inline entry state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState('');
  const [categoryId, setCategoryId] = useState<string>('cat-lebensmittel');
  const [memo, setMemo] = useState('');
  const [outflowStr, setOutflowStr] = useState('');
  const [inflowStr, setInflowStr] = useState('');

  const transactions = storage.getTransactions(account.id);
  const categories = storage.getCategories();

  // Reset selection on account change
  useEffect(() => {
    setSelectedTxIds(new Set());
    setLastAnchorId(null);
  }, [account.id]);

  // Close category menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryMenuOpen]);

  const singleSelectedId = selectedTxIds.size === 1 ? Array.from(selectedTxIds)[0] : null;
  const selectedTx = singleSelectedId ? transactions.find((t) => t.id === singleSelectedId) : null;

  const selectedTransactions = useMemo(
    () => transactions.filter((t) => selectedTxIds.has(t.id)),
    [transactions, selectedTxIds]
  );

  const selectedTotalCents = useMemo(
    () => selectedTransactions.reduce((acc, t) => acc + t.amountCents, 0),
    [selectedTransactions]
  );

  const filteredCategoriesForMenu = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  // Derive unique payees for the filter dropdown
  const uniquePayees = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.payee.trim()) set.add(tx.payee);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
  }, [transactions]);

  // Apply column filters + text search
  const filteredTransactions = useMemo(() => {
    // First apply column filters
    let result = applyAllFilters(transactions, columnFilters);

    // Then apply text search on top
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.payee.toLowerCase().includes(q) ||
          tx.memo.toLowerCase().includes(q)
      );
    }

    return result;
  }, [transactions, columnFilters, searchQuery]);

  const isFiltered = hasActiveFilters(columnFilters);
  const activeFilterCount = Object.values(columnFilters).filter((v) => v !== null).length;

  const handleClearAllFilters = () => {
    setColumnFilters(emptyFilters);
    setSearchQuery('');
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38,
    overscan: 5,
  });

  // Global keyboard shortcuts within register
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      // Select All: Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A') && !isInput) {
        e.preventDefault();
        setSelectedTxIds(new Set(filteredTransactions.map((t) => t.id)));
        return;
      }

      // Escape -> Clear selection
      if (e.key === 'Escape' && !isAddingInline && !isSplitModalOpen) {
        if (selectedTxIds.size > 0) {
          e.preventDefault();
          setSelectedTxIds(new Set());
          return;
        }
      }

      // Shift+N -> Add transaction
      if (e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsAddingInline(true);
        return;
      }
      // Shift+E -> Reconcile
      if (e.shiftKey && e.key === 'E') {
        e.preventDefault();
        onOpenReconcile();
        return;
      }
      // Shift+D -> Duplicate selected transactions
      if (e.shiftKey && (e.key === 'D' || e.key === 'd') && !isInput) {
        if (selectedTxIds.size > 0 && !isAddingInline) {
          e.preventDefault();
          const dups = storage.duplicateTransactions(Array.from(selectedTxIds));
          setSelectedTxIds(new Set(dups.map((d) => d.id)));
          onUpdate();
          return;
        }
      }
      // S -> Split transaction (only when single selected)
      if ((e.key === 's' || e.key === 'S') && !isInput) {
        if (selectedTxIds.size === 1 && !isAddingInline) {
          e.preventDefault();
          setIsSplitModalOpen(true);
          return;
        }
      }
      // C -> Toggle cleared on selected transactions
      if ((e.key === 'c' || e.key === 'C') && !isInput) {
        if (selectedTxIds.size > 0 && !isAddingInline) {
          e.preventDefault();
          const selectedList = transactions.filter((t) => selectedTxIds.has(t.id));
          const hasUncleared = selectedList.some((t) => t.clearedStatus === 'uncleared');
          storage.setClearedStatusForTransactions(
            Array.from(selectedTxIds),
            hasUncleared ? 'cleared' : 'uncleared'
          );
          onUpdate();
          return;
        }
      }
      // Delete / Backspace -> Delete selected transactions
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedTxIds.size > 0 && !isAddingInline) {
          e.preventDefault();
          storage.deleteTransactions(Array.from(selectedTxIds));
          setSelectedTxIds(new Set());
          onUpdate();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedTxIds,
    filteredTransactions,
    transactions,
    isAddingInline,
    isSplitModalOpen,
    onOpenReconcile,
    onUpdate,
  ]);

  const handleSaveTransaction = (keepOpen: boolean = false) => {
    const outflowCents = parseCurrencyInput(outflowStr);
    const inflowCents = parseCurrencyInput(inflowStr);

    let amountCents = 0;
    if (outflowCents > 0) {
      amountCents = -outflowCents;
    } else if (inflowCents > 0) {
      amountCents = inflowCents;
    }

    if (!payee.trim() || amountCents === 0) return;

    storage.addTransaction({
      accountId: account.id,
      date,
      payee: payee.trim(),
      categoryId: categoryId || null,
      memo: memo.trim(),
      amountCents,
      clearedStatus: 'uncleared',
      isApproved: true,
      flag: 0,
      transferAccountId: null,
      transferTransactionId: null,
      importFitid: null,
    });

    onUpdate();

    if (keepOpen) {
      setPayee('');
      setMemo('');
      setOutflowStr('');
      setInflowStr('');
    } else {
      setIsAddingInline(false);
    }
  };

  const handleToggleCleared = (tx: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tx.clearedStatus === 'reconciled') return;
    storage.toggleCleared(tx.id);
    onUpdate();
  };

  const handleDeleteSelected = (txId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteTransaction(txId);
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      next.delete(txId);
      return next;
    });
    onUpdate();
  };

  const handleBulkSetCategory = (catId: string | null) => {
    storage.updateTransactions(Array.from(selectedTxIds), { categoryId: catId });
    setIsCategoryMenuOpen(false);
    onUpdate();
  };

  const handleBulkSetCleared = () => {
    storage.setClearedStatusForTransactions(Array.from(selectedTxIds), 'cleared');
    onUpdate();
  };

  const handleBulkSetUncleared = () => {
    storage.setClearedStatusForTransactions(Array.from(selectedTxIds), 'uncleared');
    onUpdate();
  };

  const handleBulkDuplicate = () => {
    const dups = storage.duplicateTransactions(Array.from(selectedTxIds));
    setSelectedTxIds(new Set(dups.map((d) => d.id)));
    onUpdate();
  };

  const handleBulkDelete = () => {
    storage.deleteTransactions(Array.from(selectedTxIds));
    setSelectedTxIds(new Set());
    onUpdate();
  };

  const isAllSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((t) => selectedTxIds.has(t.id));

  const isSomeSelected =
    !isAllSelected &&
    filteredTransactions.some((t) => selectedTxIds.has(t.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTxIds((prev) => {
        const next = new Set(prev);
        filteredTransactions.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedTxIds((prev) => {
        const next = new Set(prev);
        filteredTransactions.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const handleRowClick = (txId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, a')) {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedTxIds((prev) => {
        const next = new Set(prev);
        if (next.has(txId)) {
          next.delete(txId);
        } else {
          next.add(txId);
        }
        return next;
      });
      setLastAnchorId(txId);
    } else if (e.shiftKey) {
      e.preventDefault();
      const ids = filteredTransactions.map((t) => t.id);
      const currentIndex = ids.indexOf(txId);
      const anchorIndex = lastAnchorId ? ids.indexOf(lastAnchorId) : -1;

      if (anchorIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(anchorIndex, currentIndex);
        const end = Math.max(anchorIndex, currentIndex);
        const rangeIds = ids.slice(start, end + 1);

        setSelectedTxIds((prev) => {
          if (e.ctrlKey || e.metaKey) {
            const next = new Set(prev);
            rangeIds.forEach((id) => next.add(id));
            return next;
          }
          return new Set(rangeIds);
        });
      } else {
        setSelectedTxIds(new Set([txId]));
        setLastAnchorId(txId);
      }
    } else {
      setSelectedTxIds(new Set([txId]));
      setLastAnchorId(txId);
    }
  };

  const handleCheckboxClick = (txId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      handleRowClick(txId, e);
      return;
    }
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
    setLastAnchorId(txId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--nothing-bg)] text-[var(--nothing-text)] transition-colors">
      {/* Account Header */}
      <header className="px-6 py-3.5 bg-[var(--nothing-surface)] border-b border-[var(--nothing-border)] flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              storage.updateAccount(account.id, { isFavorite: !account.isFavorite });
              onUpdate();
            }}
            className="text-[var(--nothing-muted)] hover:text-[#D71921] transition-colors cursor-pointer"
          >
            <Star className={`w-5 h-5 ${account.isFavorite ? 'fill-[#D71921] text-[#D71921]' : ''}`} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--nothing-text)]">{account.nickname}</h2>
              <button
                type="button"
                onClick={onOpenEditAccount}
                className="text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] p-1 rounded-full hover:bg-[var(--nothing-subsurface)] transition-colors cursor-pointer"
                title="Konto bearbeiten"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] font-medium">
                {account.accountType}
              </span>
            </div>
            <div className="font-mono text-[11px] text-[var(--nothing-muted)] mt-0.5 flex items-center gap-2">
              <span>
                {account.lastReconciledAt
                  ? `Abgestimmt am ${new Date(account.lastReconciledAt).toLocaleDateString('de-DE')}`
                  : 'Noch nicht abgestimmt'}
              </span>
              <button
                type="button"
                onClick={onOpenReconcile}
                className="text-[var(--nothing-text)] hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[var(--nothing-sage)]" /> Abstimmen (Shift+E)
              </button>
            </div>
          </div>
        </div>

        {/* Live Balance Equation Bento Pill */}
        <div className="flex items-center gap-2.5 font-mono text-xs tabular-nums bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] px-4 py-2 rounded-2xl">
          <div className="text-right">
            <span className="text-[var(--nothing-sage)] font-bold">{formatCurrency(account.clearedBalanceCents)}</span>
            <span className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)]">Bestätigt</span>
          </div>
          <span className="text-[var(--nothing-muted)]">+</span>
          <div className="text-right">
            <span className="text-[var(--nothing-muted)] font-semibold">{formatCurrency(account.unclearedBalanceCents)}</span>
            <span className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)]">Offen</span>
          </div>
          <span className="text-[var(--nothing-muted)]">=</span>
          <div className="text-right pl-2.5 border-l border-[var(--nothing-border)]">
            <span className="text-[var(--nothing-text)] font-bold text-sm">{formatCurrency(account.workingBalanceCents)}</span>
            <span className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)]">Arbeitssaldo</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-6 py-2.5 bg-[var(--nothing-surface)] border-b border-[var(--nothing-border)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* Primary CTA: Nothing Red Pill */}
          <button
            type="button"
            onClick={() => setIsAddingInline(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buchung hinzufügen (Shift+N)</span>
          </button>

          <button
            type="button"
            onClick={onOpenFileImport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Datei importieren</span>
          </button>

          {selectedTxIds.size > 0 && (
            <div className="flex items-center gap-2 pl-3 border-l border-[var(--nothing-border)] flex-wrap">
              {/* Selected Count & Sum Pill */}
              <div className="flex items-center gap-2 bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] px-3 py-1 rounded-full font-mono text-xs">
                <span className="font-semibold text-[var(--nothing-text)]">
                  {selectedTxIds.size} ausgewählt
                </span>
                <span className="text-[var(--nothing-muted)]">•</span>
                <span
                  className={`font-semibold tabular-nums ${
                    selectedTotalCents > 0
                      ? 'text-[var(--nothing-sage)]'
                      : selectedTotalCents < 0
                      ? 'text-[#D71921]'
                      : 'text-[var(--nothing-muted)]'
                  }`}
                >
                  Summe: {formatCurrency(selectedTotalCents)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTxIds(new Set())}
                  title="Auswahl aufheben (Esc)"
                  className="text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Category Assignment Dropdown */}
              <div className="relative" ref={categoryMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  title="Kategorie für markierte Buchungen zuweisen"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Kategorie</span>
                </button>

                {isCategoryMenuOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-60 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-2xl shadow-none p-2 z-50">
                    <input
                      type="text"
                      placeholder="Kategorie suchen..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      autoFocus
                      className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl text-xs px-2.5 py-1.5 text-[var(--nothing-text)] placeholder-[var(--nothing-muted)] mb-2 focus:outline-none focus:border-[var(--nothing-border-hover)]"
                    />
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      <button
                        type="button"
                        onClick={() => handleBulkSetCategory(null)}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)] hover:text-[var(--nothing-text)] transition-colors cursor-pointer"
                      >
                        Bereit zur Zuweisung (Keine)
                      </button>
                      {filteredCategoriesForMenu.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleBulkSetCategory(cat.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-[var(--nothing-text)] hover:bg-[var(--nothing-subsurface)] transition-colors cursor-pointer truncate"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cleared Status Quick Buttons */}
              <button
                type="button"
                onClick={handleBulkSetCleared}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                title="Markierte Buchungen bestätigen (C)"
              >
                <Check className="w-3.5 h-3.5 text-[var(--nothing-sage)]" />
                <span>Bestätigen</span>
              </button>

              <button
                type="button"
                onClick={handleBulkSetUncleared}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                title="Markierte Buchungen auf offen setzen"
              >
                <span>Auf Offen</span>
              </button>

              {/* Duplicate Button */}
              <button
                type="button"
                onClick={handleBulkDuplicate}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                title="Markierte Buchungen duplizieren (Shift+D)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplizieren</span>
              </button>

              {/* Split (available only when single transaction is selected) */}
              {selectedTxIds.size === 1 && (
                <button
                  type="button"
                  onClick={() => setIsSplitModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  title="Buchung aufteilen (S)"
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Aufteilen</span>
                </button>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[#D71921] text-[#D71921] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                title="Markierte Buchungen löschen (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{selectedTxIds.size > 1 ? `${selectedTxIds.size} Löschen` : 'Löschen'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Search + Clear All Filters */}
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D71921]/30 bg-[#D71921]/5 text-[#D71921] font-mono text-[10px] uppercase tracking-wider font-semibold hover:bg-[#D71921]/10 transition-colors cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Alle Filter aufheben ({activeFilterCount})</span>
            </button>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--nothing-muted)]" />
            <input
              type="text"
              placeholder="Buchungen suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-full text-xs pl-8 pr-3 py-1.5 text-[var(--nothing-text)] placeholder-[var(--nothing-muted)] focus:outline-none focus:border-[var(--nothing-border-hover)]"
            />
          </div>
        </div>
      </div>

      {/* Inline Entry Row (When active) */}
      {isAddingInline && (
        <div className="bg-[var(--nothing-subsurface)] border-b border-[var(--nothing-border)] p-3 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 text-[var(--nothing-text)] font-mono"
          />
          <input
            autoFocus
            type="text"
            placeholder="Zahlungsempfänger"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 flex-1 min-w-[140px] text-[var(--nothing-text)]"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 text-[var(--nothing-text)]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Verwendungszweck"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 flex-1 text-[var(--nothing-text)]"
          />
          <input
            type="text"
            placeholder="Ausgabe €"
            value={outflowStr}
            onChange={(e) => {
              setOutflowStr(e.target.value);
              if (e.target.value) setInflowStr('');
            }}
            className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 w-24 text-right text-[#D71921] font-mono tabular-nums"
          />
          <input
            type="text"
            placeholder="Einnahme €"
            value={inflowStr}
            onChange={(e) => {
              setInflowStr(e.target.value);
              if (e.target.value) setOutflowStr('');
            }}
            className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 w-24 text-right text-[var(--nothing-sage)] font-mono tabular-nums"
          />

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => handleSaveTransaction(false)}
              className="px-4 py-1.5 bg-[#D71921] text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => handleSaveTransaction(true)}
              className="px-3 py-1.5 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider rounded-full cursor-pointer"
            >
              Weitere
            </button>
            <button
              type="button"
              onClick={() => setIsAddingInline(false)}
              className="px-3 py-1.5 text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Table Header with Column Filters */}
      <div className="bg-[var(--nothing-subsurface)] border-b border-[var(--nothing-border)] font-mono text-xs uppercase tracking-wider text-[var(--nothing-muted)] font-medium grid grid-cols-12 px-6 py-2.5 select-none shrink-0 items-center">
        <div className="col-span-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            title={isAllSelected ? 'Auswahl aufheben' : 'Alle auswählen (Strg+A)'}
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isAllSelected
                ? 'bg-[#D71921] border-[#D71921]'
                : isSomeSelected
                ? 'bg-[#D71921]/15 border-[#D71921]'
                : 'border-[var(--nothing-border)] hover:border-[var(--nothing-border-hover)] bg-[var(--nothing-surface)]'
            }`}
          >
            {isAllSelected && <Check className="w-3 h-3 text-white" />}
            {isSomeSelected && <Minus className="w-2.5 h-2.5 text-[#D71921]" />}
          </button>
          <DateFilter
            value={columnFilters.date}
            onChange={(v) =>
              setColumnFilters((prev) => ({ ...prev, date: v }))
            }
          />
        </div>
        <div className="col-span-3">
          <PayeeFilter
            payees={uniquePayees}
            value={columnFilters.payee}
            onChange={(v) =>
              setColumnFilters((prev) => ({ ...prev, payee: v }))
            }
          />
        </div>
        <div className="col-span-3">
          <CategoryFilter
            categories={categories}
            value={columnFilters.category}
            onChange={(v) =>
              setColumnFilters((prev) => ({ ...prev, category: v }))
            }
          />
        </div>
        <div className="col-span-2 flex justify-end">
          <AmountFilter
            label="Ausgabe"
            value={columnFilters.outflow}
            onChange={(v) =>
              setColumnFilters((prev) => ({ ...prev, outflow: v }))
            }
            align="right"
          />
        </div>
        <div className="col-span-1 flex justify-end">
          <AmountFilter
            label="Einnahme"
            value={columnFilters.inflow}
            onChange={(v) =>
              setColumnFilters((prev) => ({ ...prev, inflow: v }))
            }
            align="right"
          />
        </div>
        <div className="col-span-1 flex justify-center">
          <StatusFilter
            value={columnFilters.status}
            onChange={(v) =>
              setColumnFilters((prev) => ({ ...prev, status: v }))
            }
          />
        </div>
      </div>

      {/* Filter summary bar (when filters are active) */}
      {isFiltered && (
        <div className="bg-[#D71921]/5 border-b border-[#D71921]/10 px-6 py-1.5 flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#D71921] font-semibold">
            {filteredTransactions.length} von {transactions.length} Buchungen
          </span>
          <div className="flex items-center gap-1 ml-auto flex-wrap">
            {columnFilters.date && (
              <FilterTag
                label="Datum"
                onRemove={() =>
                  setColumnFilters((prev) => ({ ...prev, date: null }))
                }
              />
            )}
            {columnFilters.payee && (
              <FilterTag
                label={`Empfänger (${columnFilters.payee.selectedPayees.length || columnFilters.payee.searchQuery})`}
                onRemove={() =>
                  setColumnFilters((prev) => ({ ...prev, payee: null }))
                }
              />
            )}
            {columnFilters.category && (
              <FilterTag
                label={`Kategorie (${columnFilters.category.selectedIds.length})`}
                onRemove={() =>
                  setColumnFilters((prev) => ({ ...prev, category: null }))
                }
              />
            )}
            {columnFilters.outflow && (
              <FilterTag
                label="Ausgabe"
                onRemove={() =>
                  setColumnFilters((prev) => ({ ...prev, outflow: null }))
                }
              />
            )}
            {columnFilters.inflow && (
              <FilterTag
                label="Einnahme"
                onRemove={() =>
                  setColumnFilters((prev) => ({ ...prev, inflow: null }))
                }
              />
            )}
            {columnFilters.status && (
              <FilterTag
                label="Status"
                onRemove={() =>
                  setColumnFilters((prev) => ({ ...prev, status: null }))
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Virtualized Scroll Area */}
      <div ref={parentRef} className="flex-1 overflow-y-auto bg-[var(--nothing-surface)]">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const tx = filteredTransactions[virtualRow.index];
            const cat = categories.find((c) => c.id === tx.categoryId);
            const isNegative = tx.amountCents < 0;
            const isSelected = selectedTxIds.has(tx.id);

            return (
              <div
                key={tx.id}
                onClick={(e) => handleRowClick(tx.id, e)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`grid grid-cols-12 px-6 py-2 text-xs border-b border-[var(--nothing-border)] items-center transition-colors font-mono tabular-nums select-none cursor-pointer ${
                  isSelected ? 'bg-[var(--nothing-subsurface)] border-l-2 border-l-[#D71921]' : 'hover:bg-[var(--nothing-subsurface)]/50'
                }`}
              >
                <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => handleCheckboxClick(tx.id, e)}
                    title={isSelected ? 'Auswahl aufheben' : 'Auswählen'}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#D71921] border-[#D71921]'
                        : 'border-[var(--nothing-border)] hover:border-[var(--nothing-border-hover)] bg-[var(--nothing-surface)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="text-[var(--nothing-muted)] font-mono truncate">{tx.date}</span>
                </div>
                <span className="col-span-3 font-medium text-[var(--nothing-text)] font-sans truncate flex items-center gap-1.5">
                  {tx.aiSuggested && (
                    <span title="KI-Kategorisiert (Ollama)">
                      <Sparkles className="w-3 h-3 text-[#D71921] shrink-0" />
                    </span>
                  )}
                  <span className="truncate">{tx.payee}</span>
                </span>
                <span className="col-span-3 text-[var(--nothing-muted)] font-sans truncate flex items-center gap-1.5">
                  {(tx.isSplitParent || tx.splitParentId) && (
                    <span className="text-[9px] bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] text-[var(--nothing-text)] px-1.5 py-0.5 rounded-full font-mono uppercase">
                      Split
                    </span>
                  )}
                  <span className="truncate">{cat ? cat.name : 'Bereit zur Zuweisung'}</span>
                </span>
                <span className="col-span-2 text-right text-[#D71921] font-mono">
                  {isNegative ? formatCurrency(Math.abs(tx.amountCents)) : ''}
                </span>
                <span className="col-span-1 text-right text-[var(--nothing-sage)] font-mono">
                  {!isNegative ? formatCurrency(tx.amountCents) : ''}
                </span>
                <div className="col-span-1 flex items-center justify-center gap-1">
                  {tx.clearedStatus === 'reconciled' ? (
                    <span title="Abgestimmt und gesperrt" className="text-[var(--nothing-muted)]">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleToggleCleared(tx, e)}
                      title="Status umschalten (C)"
                      className={`w-5 h-5 rounded-full text-[10px] leading-5 text-center font-mono font-bold transition-colors cursor-pointer ${
                        tx.clearedStatus === 'cleared'
                          ? 'bg-[var(--nothing-sage)]/15 text-[var(--nothing-sage)] border border-[var(--nothing-sage)]/30'
                          : 'border border-[var(--nothing-border)] text-[var(--nothing-muted)] hover:border-[var(--nothing-border-hover)] hover:text-[var(--nothing-text)]'
                      }`}
                    >
                      C
                    </button>
                  )}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSelected(tx.id, e)}
                      title="Löschen (Delete)"
                      className="text-[#D71921] opacity-70 hover:opacity-100 ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTx && (
        <SplitTransactionModal
          isOpen={isSplitModalOpen}
          account={account}
          transaction={selectedTx}
          categories={categories}
          onClose={() => setIsSplitModalOpen(false)}
          onSuccess={() => {
            setSelectedTxIds(new Set());
            setLastAnchorId(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

// ─── Filter Tag (removable pill) ────────────────────────────────────────

const FilterTag: React.FC<{ label: string; onRemove: () => void }> = ({
  label,
  onRemove,
}) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#D71921]/20 bg-[#D71921]/5 text-[#D71921] font-mono text-[10px] uppercase tracking-wider">
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="hover:text-[#D71921] cursor-pointer"
    >
      <span className="text-xs leading-none">×</span>
    </button>
  </span>
);
