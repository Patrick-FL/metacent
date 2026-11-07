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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-sm w-full p-6 text-[#f1f5f2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <h3 className="font-semibold text-sm text-[#f1f5f2]">Konto abstimmen</h3>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'prompt' ? (
          <div className="space-y-4 text-center">
            <p className="text-xs text-[#8c9e91]">
              Stimmt der aktuelle bestätigte Saldo auf deinem Bankauszug überein?
            </p>
            <div className="text-2xl font-bold font-mono text-[#adebb3] py-2 tabular-nums">
              {formatCurrency(account.clearedBalanceCents)}
            </div>

            <div className="flex items-center justify-center gap-1 text-[11px] text-[#8c9e91] hover:text-[#f1f5f2] cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Wie finde ich meinen Kontostand?</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('mismatch')}
                className="py-2 px-3 border border-[#232e26] hover:bg-[#1b241e] text-[#8c9e91] rounded-md text-xs font-semibold"
              >
                Nein, weicht ab
              </button>
              <button
                type="button"
                onClick={handleConfirmMatch}
                className="py-2 px-3 bg-[#adebb3] hover:bg-[#adebb3]/90 text-[#0d110e] rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Ja, stimmt</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleMismatchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
                Tatsächlicher Saldo laut Kontoauszug (EUR)
              </label>
              <input
                autoFocus
                type="text"
                placeholder="0,00"
                value={statementBalanceStr}
                onChange={(e) => setStatementBalanceStr(e.target.value)}
                className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none font-mono"
              />
            </div>

            {statementBalanceStr.trim() !== '' && (
              <div className="bg-[#0d110e] border border-[#232e26] p-3 rounded text-xs space-y-1">
                <div className="flex justify-between text-[#8c9e91]">
                  <span>Bestätigter Saldo:</span>
                  <span className="font-mono">{formatCurrency(account.clearedBalanceCents)}</span>
                </div>
                <div className="flex justify-between text-[#8c9e91]">
                  <span>Auszug-Saldo:</span>
                  <span className="font-mono">{formatCurrency(parsedStatementCents)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#232e26] font-semibold">
                  <span>Differenz:</span>
                  <span
                    className={`font-mono tabular-nums ${
                      discrepancyCents === 0
                        ? 'text-[#adebb3]'
                        : discrepancyCents < 0
                        ? 'text-[#e8706d]'
                        : 'text-[#adebb3]'
                    }`}
                  >
                    {formatCurrency(discrepancyCents)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232e26]">
              <button
                type="button"
                onClick={() => setStep('prompt')}
                className="px-3 py-1.5 text-xs text-[#8c9e91]"
              >
                Zurück
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#adebb3] text-[#0d110e] text-xs font-bold rounded hover:bg-[#adebb3]/90"
              >
                Korrekturbuchung erzeugen & abschließen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

