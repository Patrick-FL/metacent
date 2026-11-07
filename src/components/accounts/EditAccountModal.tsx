import React, { useState } from 'react';
import { Account } from '../../types';
import { parseCurrencyInput } from '../../services/currency';
import { storage } from '../../services/storage';
import { X, Trash2, Sliders } from 'lucide-react';

interface EditAccountModalProps {
  isOpen: boolean;
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
  onOpenTemplates: () => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onSuccess,
  onOpenTemplates,
}) => {
  const [nickname, setNickname] = useState(account.nickname);
  const [notes, setNotes] = useState(account.notes);
  const [workingBalanceStr, setWorkingBalanceStr] = useState(
    (account.workingBalanceCents / 100).toFixed(2).replace('.', ',')
  );
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    // Update metadata
    storage.updateAccount(account.id, {
      nickname: nickname.trim(),
      notes: notes.trim(),
    });

    // Check if working balance changed
    const newWorkingCents = parseCurrencyInput(workingBalanceStr);
    if (newWorkingCents !== account.workingBalanceCents) {
      storage.adjustWorkingBalance(account.id, newWorkingCents);
    }

    onSuccess();
    onClose();
  };

  const handleDelete = () => {
    storage.deleteAccount(account.id);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-md w-full p-6 text-[#f1f5f2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <h3 className="font-semibold text-base text-[#f1f5f2]">Konto bearbeiten</h3>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
              Kontoname / Nickname
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
              Notizen
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Notizen zum Konto..."
              className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
              Arbeitssaldo (EUR)
            </label>
            <input
              type="text"
              value={workingBalanceStr}
              onChange={(e) => setWorkingBalanceStr(e.target.value)}
              className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none font-mono"
            />
            <p className="text-[11px] text-[#8c9e91] mt-1">
              Eine Differenz erzeugt automatisch eine Korrekturbuchung im Kontobuch.
            </p>
          </div>

          {/* Import Template Management */}
          <div className="pt-2 border-t border-[#232e26]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTemplates();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0d110e] border border-[#232e26] hover:border-[#adebb3]/40 text-xs text-[#f1f5f2] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#adebb3]" />
                <span>Import-Vorlagen verwalten (z.B. Trade Republic)</span>
              </div>
              <span className="text-[#8c9e91] text-[11px]">Bearbeiten →</span>
            </button>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="pt-4 border-t border-[#232e26] flex items-center justify-between">
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs text-[#e8706d] hover:underline flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Konto löschen</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#e8706d] font-semibold">Wirklich löschen?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-[#e8706d] text-[#0d110e] text-xs font-bold rounded"
                >
                  Ja, löschen
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2 py-1 text-xs text-[#8c9e91]"
                >
                  Nein
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#8c9e91] hover:text-[#f1f5f2]"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#adebb3] text-[#0d110e] font-semibold text-xs rounded hover:bg-[#adebb3]/90 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
