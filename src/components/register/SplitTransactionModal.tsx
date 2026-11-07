import React, { useState, useEffect } from 'react';
import { Account, Category, Transaction } from '../../types';
import { formatCurrency, parseCurrencyInput } from '../../services/currency';
import { storage } from '../../services/storage';
import { X, Plus, Trash2, Split } from 'lucide-react';

interface SplitTransactionModalProps {
  isOpen: boolean;
  account: Account;
  transaction: Transaction;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

interface SplitLine {
  id: string;
  categoryId: string;
  memo: string;
  amountStr: string;
}

export const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({
  isOpen,
  transaction,
  categories,
  onClose,
  onSuccess,
}) => {
  const isNegative = transaction.amountCents < 0;
  const targetTotalCents = Math.abs(transaction.amountCents);

  const [lines, setLines] = useState<SplitLine[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize with 2 lines dividing the amount
      const halfCents = Math.floor(targetTotalCents / 2);
      const remainderCents = targetTotalCents - halfCents;

      setLines([
        {
          id: '1',
          categoryId: transaction.categoryId || categories[0]?.id || '',
          memo: transaction.memo,
          amountStr: (halfCents / 100).toFixed(2).replace('.', ','),
        },
        {
          id: '2',
          categoryId: categories[1]?.id || categories[0]?.id || '',
          memo: '',
          amountStr: (remainderCents / 100).toFixed(2).replace('.', ','),
        },
      ]);
      setErrorMsg(null);
    }
  }, [isOpen, targetTotalCents, transaction, categories]);

  if (!isOpen) return null;

  const currentAssignedCents = lines.reduce((sum, line) => {
    return sum + parseCurrencyInput(line.amountStr);
  }, 0);

  const remainingCents = targetTotalCents - currentAssignedCents;
  const isBalanced = remainingCents === 0;

  const handleAddLine = () => {
    const nextAmount = Math.max(0, remainingCents);
    setLines((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        categoryId: categories[0]?.id || '',
        memo: '',
        amountStr: (nextAmount / 100).toFixed(2).replace('.', ','),
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: keyof SplitLine, value: string) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = () => {
    if (!isBalanced) {
      setErrorMsg('Die Summe der Teilbeträge muss exakt dem Gesamtbetrag entsprechen.');
      return;
    }

    const splits = lines.map((l) => ({
      categoryId: l.categoryId || null,
      memo: l.memo.trim(),
      amountCents: isNegative ? -parseCurrencyInput(l.amountStr) : parseCurrencyInput(l.amountStr),
    }));

    const ok = storage.splitTransaction(transaction.id, splits);
    if (ok) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Fehler beim Speichern der Split-Buchung.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-xl w-full p-6 text-[var(--nothing-text)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Split className="w-5 h-5 text-[#D71921]" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">TRANSACTION // SPLIT</p>
              <h3 className="font-bold text-base text-[var(--nothing-text)]">Buchung aufteilen</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-3.5 rounded-2xl flex items-center justify-between mb-4 text-xs font-mono tabular-nums">
          <div>
            <div className="font-sans font-bold text-[var(--nothing-text)]">{transaction.payee}</div>
            <div className="font-mono text-[10px] text-[var(--nothing-muted)]">{transaction.date}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)]">Gesamtbetrag</div>
            <div className={`text-base font-bold font-mono ${isNegative ? 'text-[#D71921]' : 'text-[var(--nothing-sage)]'}`}>
              {formatCurrency(transaction.amountCents)}
            </div>
          </div>
        </div>

        {/* Split Lines */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {lines.map((line, idx) => (
            <div key={line.id} className="flex items-center gap-2 bg-[var(--nothing-subsurface)] p-3 rounded-2xl border border-[var(--nothing-border)]">
              {/* Category selector */}
              <div className="flex-1">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">Kategorie</label>
                <select
                  value={line.categoryId}
                  onChange={(e) => handleLineChange(idx, 'categoryId', e.target.value)}
                  className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Memo input */}
              <div className="flex-1">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">Notiz</label>
                <input
                  type="text"
                  placeholder="Verwendungszweck..."
                  value={line.memo}
                  onChange={(e) => handleLineChange(idx, 'memo', e.target.value)}
                  className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)]"
                />
              </div>

              {/* Amount input */}
              <div className="w-28">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1 text-right">Betrag (€)</label>
                <input
                  type="text"
                  value={line.amountStr}
                  onChange={(e) => handleLineChange(idx, 'amountStr', e.target.value)}
                  className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1.5 text-xs text-right font-mono tabular-nums text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)]"
                />
              </div>

              {/* Delete line button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleRemoveLine(idx)}
                  disabled={lines.length <= 2}
                  className={`p-1.5 rounded-full aspect-square ${
                    lines.length <= 2
                      ? 'text-[var(--nothing-border)] cursor-not-allowed'
                      : 'text-[var(--nothing-muted)] hover:text-[#D71921] cursor-pointer'
                  }`}
                  title="Zeile entfernen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Split Line Button */}
        <button
          type="button"
          onClick={handleAddLine}
          className="mt-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--nothing-text)] hover:underline self-start font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Weitere Split-Zeile hinzufügen</span>
        </button>

        {/* Remaining Calculation Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--nothing-border)] flex items-center justify-between text-xs font-mono tabular-nums">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[var(--nothing-muted)] block font-mono text-[9px] uppercase tracking-wider">Zugewiesen</span>
              <span className="text-[var(--nothing-text)] font-bold">{formatCurrency(currentAssignedCents)}</span>
            </div>
            <div>
              <span className="text-[var(--nothing-muted)] block font-mono text-[9px] uppercase tracking-wider">Verbleibend</span>
              <span
                className={`font-bold ${
                  isBalanced ? 'text-[var(--nothing-sage)]' : 'text-[#D71921]'
                }`}
              >
                {formatCurrency(remainingCents)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isBalanced}
              className={`px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                isBalanced
                  ? 'bg-[#D71921] text-white hover:opacity-90'
                  : 'bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] border border-[var(--nothing-border)] cursor-not-allowed opacity-50'
              }`}
            >
              Split speichern
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-[#D71921]/10 border border-[#D71921]/30 text-[#D71921] font-mono text-xs rounded-2xl">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
