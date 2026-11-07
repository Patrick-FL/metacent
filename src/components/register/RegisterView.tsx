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
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // Inline entry state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState('');
  const [categoryId, setCategoryId] = useState<string>('cat-lebensmittel');
  const [memo, setMemo] = useState('');
  const [outflowStr, setOutflowStr] = useState('');
  const [inflowStr, setInflowStr] = useState('');

  const transactions = storage.getTransactions(account.id);
  const categories = storage.getCategories();
  const selectedTx = selectedTxId ? transactions.find((t) => t.id === selectedTxId) : null;

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
      // Shift+N -> Add transaction
      if (e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsAddingInline(true);
      }
      // Shift+E -> Reconcile
      if (e.shiftKey && e.key === 'E') {
        e.preventDefault();
        onOpenReconcile();
      }
      // Shift+D -> Duplicate transaction
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        if (selectedTxId && !isAddingInline) {
          e.preventDefault();
          const dup = storage.duplicateTransaction(selectedTxId);
          if (dup) {
            setSelectedTxId(dup.id);
            onUpdate();
          }
        }
      }
      // S -> Split transaction
      if (
        (e.key === 's' || e.key === 'S') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        if (selectedTxId && !isAddingInline) {
          e.preventDefault();
          setIsSplitModalOpen(true);
        }
      }
      // C -> Toggle cleared on selected transaction
      if (e.key === 'c' || e.key === 'C') {
        if (selectedTxId && !isAddingInline) {
          e.preventDefault();
          storage.toggleCleared(selectedTxId);
          onUpdate();
        }
      }
      // Delete -> Delete selected transaction
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTxId && !isAddingInline) {
          e.preventDefault();
          storage.deleteTransaction(selectedTxId);
          setSelectedTxId(null);
          onUpdate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTxId, isAddingInline, onOpenReconcile, onUpdate]);

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
    if (selectedTxId === txId) setSelectedTxId(null);
    onUpdate();
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

          {selectedTxId && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--nothing-border)]">
              <button
                type="button"
                onClick={() => {
                  const dup = storage.duplicateTransaction(selectedTxId);
                  if (dup) {
                    setSelectedTxId(dup.id);
                    onUpdate();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                title="Ausgewählte Buchung duplizieren (Shift+D)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplizieren</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSplitModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                title="Buchung aufteilen (S)"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Aufteilen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  storage.deleteTransaction(selectedTxId);
                  setSelectedTxId(null);
                  onUpdate();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[#D71921] text-[#D71921] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                title="Buchung löschen (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Löschen</span>
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
        <div className="col-span-2">
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
            const isSelected = selectedTxId === tx.id;

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTxId(tx.id)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`grid grid-cols-12 px-6 py-2 text-xs border-b border-[var(--nothing-border)] items-center transition-colors font-mono tabular-nums cursor-pointer ${
                  isSelected ? 'bg-[var(--nothing-subsurface)] border-l-2 border-l-[#D71921]' : 'hover:bg-[var(--nothing-subsurface)]/50'
                }`}
              >
                <span className="col-span-2 text-[var(--nothing-muted)] font-mono">{tx.date}</span>
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
            setSelectedTxId(null);
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
