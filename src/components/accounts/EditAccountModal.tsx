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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-md w-full p-6 text-[var(--nothing-text)]">
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">LEDGER // EDIT</p>
            <h3 className="font-bold text-base text-[var(--nothing-text)]">Konto bearbeiten</h3>
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
              Kontoname / Nickname
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              Notizen
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Notizen zum Konto..."
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              Arbeitssaldo (EUR)
            </label>
            <input
              type="text"
              value={workingBalanceStr}
              onChange={(e) => setWorkingBalanceStr(e.target.value)}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] font-mono tabular-nums focus:outline-none"
            />
            <p className="font-mono text-[10px] text-[var(--nothing-muted)] mt-1">
              Eine Differenz erzeugt automatisch eine Korrekturbuchung im Kontobuch.
            </p>
          </div>

          {/* Import Template Management */}
          <div className="pt-2 border-t border-[var(--nothing-border)]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTemplates();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] hover:border-[var(--nothing-border-hover)] text-xs text-[var(--nothing-text)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D71921]" />
                <span className="font-medium">Import-Vorlagen verwalten</span>
              </div>
              <span className="font-mono text-[11px] text-[var(--nothing-muted)]">Bearbeiten →</span>
            </button>
          </div>

          {/* Danger Zone & Actions */}
          <div className="pt-4 border-t border-[var(--nothing-border)] flex items-center justify-between">
            {!showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="font-mono text-xs uppercase tracking-wider text-[#D71921] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Löschen</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-[#D71921] text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-full cursor-pointer hover:opacity-90"
                >
                  Bestätigen
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs font-mono uppercase text-[var(--nothing-muted)] cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
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
