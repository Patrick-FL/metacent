import React, { useState } from 'react';
import { Account } from '../../types';
import { formatCurrency, parseCurrencyInput } from '../../services/currency';
import { storage } from '../../services/storage';
import { X, CheckCircle, HelpCircle } from 'lucide-react';

interface ReconciliationModalProps {
  isOpen: boolean;
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  account,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'prompt' | 'mismatch'>('prompt');
  const [statementBalanceStr, setStatementBalanceStr] = useState('');

  if (!isOpen) return null;

  const handleConfirmMatch = () => {
    storage.reconcileAccount(account.id, account.clearedBalanceCents);
    onSuccess();
    onClose();
  };

  const handleMismatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const statementCents = parseCurrencyInput(statementBalanceStr);
    storage.reconcileAccount(account.id, statementCents);
    onSuccess();
    onClose();
  };

  const parsedStatementCents = parseCurrencyInput(statementBalanceStr);
  const discrepancyCents = parsedStatementCents - account.clearedBalanceCents;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-sm w-full p-6 text-[var(--nothing-text)]">
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">RECONCILIATION // VERIFY</p>
            <h3 className="font-bold text-base text-[var(--nothing-text)]">Konto abstimmen</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'prompt' ? (
          <div className="space-y-4 text-center">
            <p className="font-mono text-xs text-[var(--nothing-muted)]">
              Stimmt der aktuelle bestätigte Saldo auf deinem Bankauszug überein?
            </p>
            <div className="text-3xl font-bold font-mono text-[var(--nothing-text)] py-2 tabular-nums">
              {formatCurrency(account.clearedBalanceCents)}
            </div>

            <div className="flex items-center justify-center gap-1 font-mono text-[11px] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Wie finde ich meinen Kontostand?</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('mismatch')}
                className="py-2 px-3 border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
              >
                Nein, weicht ab
              </button>
              <button
                type="button"
                onClick={handleConfirmMatch}
                className="py-2 px-3 bg-[#D71921] hover:opacity-90 text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Ja, stimmt</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleMismatchSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1.5">
                Tatsächlicher Saldo laut Auszug (EUR)
              </label>
              <input
                autoFocus
                type="text"
                placeholder="0,00"
                value={statementBalanceStr}
                onChange={(e) => setStatementBalanceStr(e.target.value)}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] focus:outline-none font-mono tabular-nums"
              />
            </div>

            {statementBalanceStr.trim() !== '' && (
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-3 rounded-2xl text-xs space-y-1 font-mono">
                <div className="flex justify-between text-[var(--nothing-muted)]">
                  <span>Bestätigter Saldo:</span>
                  <span>{formatCurrency(account.clearedBalanceCents)}</span>
                </div>
                <div className="flex justify-between text-[var(--nothing-muted)]">
                  <span>Auszug-Saldo:</span>
                  <span>{formatCurrency(parsedStatementCents)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--nothing-border)] font-bold">
                  <span>Differenz:</span>
                  <span
                    className={`tabular-nums ${
                      discrepancyCents === 0
                        ? 'text-[var(--nothing-sage)]'
                        : discrepancyCents < 0
                        ? 'text-[#D71921]'
                        : 'text-[var(--nothing-sage)]'
                    }`}
                  >
                    {formatCurrency(discrepancyCents)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--nothing-border)]">
              <button
                type="button"
                onClick={() => setStep('prompt')}
                className="px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] cursor-pointer"
              >
                Zurück
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#D71921] text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
              >
                Korrekturbuchung erzeugen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
