import React, { useState } from 'react';
import { AccountType } from '../../types';
import { parseCurrencyInput } from '../../services/currency';
import { storage } from '../../services/storage';
import { X, Plus } from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [nickname, setNickname] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [balanceStr, setBalanceStr] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    const initialCents = parseCurrencyInput(balanceStr);

    storage.addAccount(
      {
        budgetId: storage.getBudget().id,
        nickname: nickname.trim(),
        accountType,
        isFavorite: false,
        isClosed: false,
        notes: '',
        sortOrder: 0,
        lastReconciledAt: null,
      },
      initialCents
    );

    setNickname('');
    setBalanceStr('');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-md w-full p-6 text-[var(--nothing-text)]">
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">LEDGER // SETUP</p>
            <h3 className="font-bold text-base text-[var(--nothing-text)]">Konto hinzufügen</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              Kontobezeichnung
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="z.B. Trade Republic, DKB Girokonto"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              Kontotyp
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] focus:outline-none"
            >
              <optgroup label="Barkonten">
                <option value="checking">Girokonto</option>
                <option value="savings">Tagesgeld / Sparkonto</option>
                <option value="cash">Bargeld</option>
              </optgroup>
              <optgroup label="Kreditkonten">
                <option value="credit_card">Kreditkarte</option>
                <option value="line_of_credit">Dispositionskredit</option>
              </optgroup>
              <optgroup label="Kredite & Darlehen">
                <option value="mortgage">Immobilienkredit</option>
                <option value="loan">Ratenkredit</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              Startsaldo (EUR)
            </label>
            <input
              type="text"
              placeholder="0,00"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] font-mono tabular-nums focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--nothing-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Anlegen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
