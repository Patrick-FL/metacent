import React, { useState } from 'react';
import { AccountType } from '../../types';
import { parseCurrencyInput } from '../../services/currency';
import { storage } from '../../services/storage';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-md w-full p-6 text-[#f1f5f2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <h3 className="font-semibold text-base text-[#f1f5f2]">Konto hinzufügen</h3>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
              Kontobezeichnung
            </label>
            <input
              type="text"
              required
              placeholder="z.B. Trade Republic, DKB Girokonto"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
              Kontotyp
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none"
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
            <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
              Aktueller Kontostand (EUR)
            </label>
            <input
              type="text"
              placeholder="0,00"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
              className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none font-mono"
            />
            <p className="text-[11px] text-[#8c9e91] mt-1">
              Erzeugt automatisch eine Anfangssaldo-Buchung im Kontobuch.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#232e26]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-[#8c9e91] hover:text-[#f1f5f2]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#adebb3] text-[#0d110e] font-semibold rounded-md text-xs hover:bg-[#adebb3]/90 transition-colors"
            >
              Konto anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

