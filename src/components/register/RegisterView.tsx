import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { SplitTransactionModal } from './SplitTransactionModal';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'uncleared' | 'cleared' | 'reconciled'>('all');
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

  const filteredTransactions = transactions.filter((tx) => {
    if (statusFilter !== 'all' && tx.clearedStatus !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.payee.toLowerCase().includes(q) ||
      tx.memo.toLowerCase().includes(q)
    );
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0d110e] text-[#f1f5f2]">
      {/* Account Header */}
      <header className="px-6 py-4 border-b border-[#232e26] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              storage.updateAccount(account.id, { isFavorite: !account.isFavorite });
              onUpdate();
            }}
            className="text-[#8c9e91] hover:text-[#adebb3] transition-colors"
          >
            <Star className={`w-5 h-5 ${account.isFavorite ? 'fill-[#adebb3] text-[#adebb3]' : ''}`} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#f1f5f2]">{account.nickname}</h2>
              <button
                onClick={onOpenEditAccount}
                className="text-[#8c9e91] hover:text-[#adebb3] p-1 rounded transition-colors"
                title="Konto bearbeiten"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] bg-[#141a16] border border-[#232e26] px-2 py-0.5 rounded text-[#8c9e91] uppercase">
                {account.accountType}
              </span>
            </div>
            <div className="text-xs text-[#8c9e91] mt-0.5 flex items-center gap-2">
              <span>
                {account.lastReconciledAt
                  ? `Abgestimmt am ${new Date(account.lastReconciledAt).toLocaleDateString('de-DE')}`
                  : 'Noch nicht abgestimmt'}
              </span>
              <button
                onClick={onOpenReconcile}
                className="text-[#adebb3] hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                <CheckCheck className="w-3 h-3" /> Abstimmen (Shift+E)
              </button>
            </div>
          </div>
        </div>

        {/* Live Balance Equation */}
        <div className="flex items-center gap-2 font-mono text-sm tabular-nums bg-[#141a16] border border-[#232e26] px-4 py-2 rounded-lg">
          <div className="text-right">
            <span className="text-[#adebb3] font-semibold">{formatCurrency(account.clearedBalanceCents)}</span>
            <span className="block text-[9px] font-sans text-[#8c9e91] uppercase">Bestätigt</span>
          </div>
          <span className="text-[#8c9e91]">+</span>
          <div className="text-right">
            <span className="text-[#8c9e91]">{formatCurrency(account.unclearedBalanceCents)}</span>
            <span className="block text-[9px] font-sans text-[#8c9e91] uppercase">Offen</span>
          </div>
          <span className="text-[#8c9e91]">=</span>
          <div className="text-right pl-2 border-l border-[#232e26]">
            <span className="text-[#f1f5f2] font-bold">{formatCurrency(account.workingBalanceCents)}</span>
            <span className="block text-[9px] font-sans text-[#8c9e91] uppercase">Arbeitssaldo</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-6 py-2.5 border-b border-[#232e26] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingInline(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#adebb3] text-[#0d110e] rounded text-xs font-semibold hover:bg-[#adebb3]/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buchung hinzufügen (Shift+N)</span>
          </button>

          <button
            onClick={onOpenFileImport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#232e26] hover:border-[#adebb3]/40 rounded text-xs text-[#8c9e91] hover:text-[#f1f5f2] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Datei importieren</span>
          </button>

          {selectedTxId && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#232e26]">
              <button
                onClick={() => {
                  const dup = storage.duplicateTransaction(selectedTxId);
                  if (dup) {
                    setSelectedTxId(dup.id);
                    onUpdate();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-[#232e26] hover:border-[#adebb3]/40 rounded text-xs text-[#8c9e91] hover:text-[#adebb3] transition-colors"
                title="Ausgewählte Buchung duplizieren (Shift+D)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplizieren</span>
              </button>

              <button
                onClick={() => setIsSplitModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-[#232e26] hover:border-[#adebb3]/40 rounded text-xs text-[#8c9e91] hover:text-[#adebb3] transition-colors"
                title="Buchung aufteilen (S)"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Aufteilen</span>
              </button>

              <button
                onClick={() => {
                  storage.deleteTransaction(selectedTxId);
                  setSelectedTxId(null);
                  onUpdate();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-[#232e26] hover:border-[#e8706d]/40 rounded text-xs text-[#8c9e91] hover:text-[#e8706d] transition-colors"
                title="Buchung löschen (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Löschen</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#141a16] border border-[#232e26] rounded text-xs px-2.5 py-1.5 text-[#8c9e91] focus:outline-none"
          >
            <option value="all">Alle Buchungen</option>
            <option value="uncleared">Nur Offene</option>
            <option value="cleared">Nur Bestätigte</option>
            <option value="reconciled">Nur Abgestimmte (Gesperrt)</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8c9e91]" />
            <input
              type="text"
              placeholder="Buchungen suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141a16] border border-[#232e26] rounded text-xs pl-8 pr-3 py-1.5 text-[#f1f5f2] placeholder-[#8c9e91] focus:outline-none focus:border-[#adebb3]"
            />
          </div>
        </div>
      </div>

      {/* Inline Entry Row (When active) */}
      {isAddingInline && (
        <div className="bg-[#1b241e] border-b border-[#adebb3]/40 p-3 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#0d110e] border border-[#232e26] rounded px-2 py-1 text-[#f1f5f2]"
          />
          <input
            autoFocus
            type="text"
            placeholder="Zahlungsempfänger"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className="bg-[#0d110e] border border-[#232e26] rounded px-2 py-1 flex-1 min-w-[140px] text-[#f1f5f2]"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-[#0d110e] border border-[#232e26] rounded px-2 py-1 text-[#f1f5f2]"
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
            className="bg-[#0d110e] border border-[#232e26] rounded px-2 py-1 flex-1 text-[#f1f5f2]"
          />
          <input
            type="text"
            placeholder="Ausgabe €"
            value={outflowStr}
            onChange={(e) => {
              setOutflowStr(e.target.value);
              if (e.target.value) setInflowStr('');
            }}
            className="bg-[#0d110e] border border-[#232e26] rounded px-2 py-1 w-24 text-right text-[#e8706d] font-mono"
          />
          <input
            type="text"
            placeholder="Einnahme €"
            value={inflowStr}
            onChange={(e) => {
              setInflowStr(e.target.value);
              if (e.target.value) setOutflowStr('');
            }}
            className="bg-[#0d110e] border border-[#232e26] rounded px-2 py-1 w-24 text-right text-[#adebb3] font-mono"
          />

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => handleSaveTransaction(false)}
              className="px-3 py-1 bg-[#adebb3] text-[#0d110e] font-semibold rounded hover:bg-[#adebb3]/90"
            >
              Speichern
            </button>
            <button
              onClick={() => handleSaveTransaction(true)}
              className="px-2.5 py-1 bg-[#141a16] border border-[#232e26] text-[#8c9e91] hover:text-[#f1f5f2] rounded"
            >
              Weitere
            </button>
            <button
              onClick={() => setIsAddingInline(false)}
              className="px-2 py-1 text-[#8c9e91] hover:text-[#f1f5f2]"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Virtualized Table Header */}
      <div className="bg-[#141a16] border-b border-[#232e26] text-[11px] font-semibold text-[#8c9e91] uppercase tracking-wider grid grid-cols-12 px-6 py-2">
        <span className="col-span-2">Datum</span>
        <span className="col-span-3">Zahlungsempfänger</span>
        <span className="col-span-3">Kategorie</span>
        <span className="col-span-2 text-right">Ausgabe</span>
        <span className="col-span-1 text-right">Einnahme</span>
        <span className="col-span-1 text-center">Status</span>
      </div>

      {/* Virtualized Scroll Area (TanStack Virtual) */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
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
                className={`grid grid-cols-12 px-6 py-2 text-xs border-b border-[#232e26]/40 items-center transition-colors font-mono tabular-nums cursor-pointer ${
                  isSelected ? 'bg-[#1b241e] border-l-2 border-l-[#adebb3]' : 'hover:bg-[#141a16]/50'
                }`}
              >
                <span className="col-span-2 text-[#8c9e91] font-sans">{tx.date}</span>
                <span className="col-span-3 font-medium text-[#f1f5f2] font-sans truncate flex items-center gap-1.5">
                  {tx.aiSuggested && (
                    <span title="KI-Kategorisiert (Ollama)">
                      <Sparkles className="w-3 h-3 text-[#adebb3] shrink-0" />
                    </span>
                  )}
                  <span className="truncate">{tx.payee}</span>
                </span>
                <span className="col-span-3 text-[#8c9e91] font-sans truncate flex items-center gap-1.5">
                  {(tx.isSplitParent || tx.splitParentId) && (
                    <span className="text-[9px] bg-[#1b241e] border border-[#adebb3]/40 text-[#adebb3] px-1 py-0.5 rounded font-mono">
                      Split
                    </span>
                  )}
                  <span className="truncate">{cat ? cat.name : 'Bereit zur Zuweisung'}</span>
                </span>
                <span className="col-span-2 text-right text-[#e8706d]">
                  {isNegative ? formatCurrency(Math.abs(tx.amountCents)) : ''}
                </span>
                <span className="col-span-1 text-right text-[#adebb3]">
                  {!isNegative ? formatCurrency(tx.amountCents) : ''}
                </span>
                <div className="col-span-1 flex items-center justify-center gap-1">
                  {tx.clearedStatus === 'reconciled' ? (
                    <span title="Abgestimmt und gesperrt" className="text-[#8c9e91]">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleToggleCleared(tx, e)}
                      title="Status umschalten (C)"
                      className={`w-4 h-4 rounded-full text-[10px] leading-4 text-center font-bold transition-colors ${
                        tx.clearedStatus === 'cleared'
                          ? 'bg-[#adebb3]/20 text-[#adebb3] border border-[#adebb3]/40'
                          : 'border border-[#232e26] text-[#8c9e91] hover:border-[#adebb3]'
                      }`}
                    >
                      C
                    </button>
                  )}
                  {isSelected && (
                    <button
                      onClick={(e) => handleDeleteSelected(tx.id, e)}
                      title="Löschen (Delete)"
                      className="text-[#e8706d] opacity-60 hover:opacity-100 ml-1"
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
