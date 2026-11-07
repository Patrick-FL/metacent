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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-xl w-full p-6 text-[#f1f5f2] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Split className="w-5 h-5 text-[#adebb3]" />
            <h3 className="text-base font-bold">Split-Buchung aufteilen</h3>
          </div>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-[#0d110e] border border-[#232e26] p-3 rounded-lg flex items-center justify-between mb-4 text-xs font-mono tabular-nums">
          <div>
            <div className="font-sans font-medium text-[#f1f5f2]">{transaction.payee}</div>
            <div className="text-[11px] text-[#8c9e91] font-sans">{transaction.date}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-sans text-[#8c9e91]">Gesamtbetrag</div>
            <div className={`text-sm font-bold ${isNegative ? 'text-[#e8706d]' : 'text-[#adebb3]'}`}>
              {formatCurrency(transaction.amountCents)}
            </div>
          </div>
        </div>

        {/* Split Lines */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {lines.map((line, idx) => (
            <div key={line.id} className="flex items-center gap-2 bg-[#0d110e] p-2.5 rounded border border-[#232e26]">
              {/* Category selector */}
              <div className="flex-1">
                <label className="block text-[10px] text-[#8c9e91] mb-1">Kategorie</label>
                <select
                  value={line.categoryId}
                  onChange={(e) => handleLineChange(idx, 'categoryId', e.target.value)}
                  className="w-full bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2] focus:outline-none focus:border-[#adebb3]"
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
                <label className="block text-[10px] text-[#8c9e91] mb-1">Notiz</label>
                <input
                  type="text"
                  placeholder="Verwendungszweck..."
                  value={line.memo}
                  onChange={(e) => handleLineChange(idx, 'memo', e.target.value)}
                  className="w-full bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2] focus:outline-none focus:border-[#adebb3]"
                />
              </div>

              {/* Amount input */}
              <div className="w-28">
                <label className="block text-[10px] text-[#8c9e91] mb-1 text-right">Betrag (€)</label>
                <input
                  type="text"
                  value={line.amountStr}
                  onChange={(e) => handleLineChange(idx, 'amountStr', e.target.value)}
                  className="w-full bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-right font-mono tabular-nums text-[#f1f5f2] focus:outline-none focus:border-[#adebb3]"
                />
              </div>

              {/* Delete line button */}
              <div className="pt-4">
                <button
                  onClick={() => handleRemoveLine(idx)}
                  disabled={lines.length <= 2}
                  className={`p-1 rounded ${
                    lines.length <= 2
                      ? 'text-[#232e26] cursor-not-allowed'
                      : 'text-[#8c9e91] hover:text-[#e8706d] transition-colors'
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
          onClick={handleAddLine}
          className="mt-3 flex items-center gap-1.5 text-xs text-[#adebb3] hover:underline self-start font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Weitere Split-Zeile hinzufügen</span>
        </button>

        {/* Remaining Calculation Footer */}
        <div className="mt-4 pt-3 border-t border-[#232e26] flex items-center justify-between text-xs font-mono tabular-nums">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[#8c9e91] block text-[10px] uppercase font-sans">Zugewiesen</span>
              <span className="text-[#f1f5f2] font-semibold">{formatCurrency(currentAssignedCents)}</span>
            </div>
            <div>
              <span className="text-[#8c9e91] block text-[10px] uppercase font-sans">Verbleibend</span>
              <span
                className={`font-semibold ${
                  isBalanced ? 'text-[#adebb3]' : 'text-[#e8706d]'
                }`}
              >
                {formatCurrency(remainingCents)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-[#232e26] text-xs text-[#8c9e91] hover:text-[#f1f5f2] rounded transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!isBalanced}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
                isBalanced
                  ? 'bg-[#adebb3] text-[#0d110e] hover:bg-[#adebb3]/90'
                  : 'bg-[#232e26] text-[#8c9e91] cursor-not-allowed'
              }`}
            >
              Split speichern
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2 bg-[#e8706d]/10 border border-[#e8706d]/30 text-[#e8706d] text-xs rounded">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

