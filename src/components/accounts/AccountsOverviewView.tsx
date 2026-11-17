import React from 'react';
import { Account, getAccountTypeLabel } from '../../types';
import { formatCurrency } from '../../services/currency';
import { storage } from '../../services/storage';
import {
  Wallet,
  CreditCard,
  Landmark,
  Plus,
  Star,
  CheckCheck,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface AccountsOverviewViewProps {
  onSelectAccount: (accountId: string) => void;
  onOpenAddAccount: () => void;
  onOpenEditAccount: (account: Account) => void;
  onOpenReconcile: (account: Account) => void;
  onUpdate: () => void;
}

export const AccountsOverviewView: React.FC<AccountsOverviewViewProps> = ({
  onSelectAccount,
  onOpenAddAccount,
  onOpenEditAccount,
  onOpenReconcile,
  onUpdate,
}) => {
  const accounts = storage.getAccounts();

  const cashAccounts = accounts.filter(
    (a) => a.accountType === 'checking' || a.accountType === 'savings' || a.accountType === 'cash'
  );
  const creditAccounts = accounts.filter(
    (a) => a.accountType === 'credit_card' || a.accountType === 'line_of_credit'
  );
  const loanAccounts = accounts.filter(
    (a) => a.accountType === 'mortgage' || a.accountType === 'loan'
  );

  const totalCashCents = cashAccounts.reduce((sum, a) => sum + a.workingBalanceCents, 0);
  const totalCreditCents = creditAccounts.reduce((sum, a) => sum + a.workingBalanceCents, 0);
  const totalLoanCents = loanAccounts.reduce((sum, a) => sum + a.workingBalanceCents, 0);

  const totalDebtsCents = totalCreditCents + totalLoanCents;
  const netWorthCents = totalCashCents + totalDebtsCents;

  const handleToggleFavorite = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    storage.updateAccount(account.id, { isFavorite: !account.isFavorite });
    onUpdate();
  };

  const handleDeleteAccount = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    if (confirm(`Möchtest du das Konto "${account.nickname}" und alle zugehörigen Buchungen wirklich unwiderruflich löschen?`)) {
      storage.deleteAccount(account.id);
      onUpdate();
    }
  };

  const renderAccountCard = (acc: Account) => {
    const isDebt =
      acc.accountType === 'credit_card' ||
      acc.accountType === 'line_of_credit' ||
      acc.accountType === 'mortgage' ||
      acc.accountType === 'loan';

    return (
      <div
        key={acc.id}
        onClick={() => onSelectAccount(acc.id)}
        className="group relative bg-[var(--nothing-surface)] hover:bg-[var(--nothing-subsurface)]/70 border border-[var(--nothing-border)] hover:border-[var(--nothing-border-hover)] rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={(e) => handleToggleFavorite(e, acc)}
                className="text-[var(--nothing-muted)] hover:text-[#D71921] transition-colors cursor-pointer shrink-0"
                title={acc.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
              >
                <Star
                  className={`w-4 h-4 ${
                    acc.isFavorite ? 'fill-[#D71921] text-[#D71921]' : 'stroke-current'
                  }`}
                />
              </button>
              <h3 className="font-bold text-sm text-[var(--nothing-text)] truncate group-hover:text-[#D71921] transition-colors">
                {acc.nickname}
              </h3>
            </div>

            <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] shrink-0 font-medium">
              {getAccountTypeLabel(acc.accountType)}
            </span>
          </div>

          {acc.notes && (
            <p className="font-mono text-[11px] text-[var(--nothing-muted)] line-clamp-1 mb-3">
              {acc.notes}
            </p>
          )}

          {/* Balance display */}
          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">
                Arbeitssaldo
              </span>
              <span
                className={`font-mono text-base font-bold tabular-nums ${
                  acc.workingBalanceCents < 0
                    ? 'text-[#D71921]'
                    : isDebt
                    ? 'text-[var(--nothing-text)]'
                    : 'text-[var(--nothing-sage)]'
                }`}
              >
                {formatCurrency(acc.workingBalanceCents)}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-[var(--nothing-muted)] tabular-nums pt-1 border-t border-[var(--nothing-border)]/50">
              <span>Bestätigt: {formatCurrency(acc.clearedBalanceCents)}</span>
              {acc.unclearedBalanceCents !== 0 && (
                <span>Offen: {formatCurrency(acc.unclearedBalanceCents)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer info & Actions */}
        <div className="pt-3 border-t border-[var(--nothing-border)]/70 flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] text-[var(--nothing-muted)] truncate">
            {acc.lastReconciledAt
              ? `Abgestimmt: ${new Date(acc.lastReconciledAt).toLocaleDateString('de-DE')}`
              : 'Nicht abgestimmt'}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReconcile(acc);
              }}
              className="p-1.5 rounded-full hover:bg-[var(--nothing-surface)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] transition-colors cursor-pointer"
              title="Saldenabstimmung"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditAccount(acc);
              }}
              className="p-1.5 rounded-full hover:bg-[var(--nothing-surface)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] transition-colors cursor-pointer"
              title="Konto bearbeiten"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteAccount(e, acc)}
              className="p-1.5 rounded-full hover:bg-[var(--nothing-surface)] text-[var(--nothing-muted)] hover:text-[#D71921] transition-colors cursor-pointer"
              title="Konto löschen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <span className="ml-1 p-1 rounded-full text-[var(--nothing-muted)] group-hover:text-[var(--nothing-text)] transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--nothing-bg)] select-none">
      {/* Top Header */}
      <header className="px-6 py-4 bg-[var(--nothing-surface)] border-b border-[var(--nothing-border)] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#D71921] font-semibold">
              LEDGER // KONTENÜBERSICHT
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D71921]" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--nothing-text)] font-sans">
              Alle Konten
            </h1>
            <span className="font-mono text-xs text-[var(--nothing-muted)]">
              ({accounts.length} {accounts.length === 1 ? 'Konto' : 'Konten'})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddAccount}
          className="flex items-center gap-2 px-4 py-2 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Konto hinzufügen</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Bento Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Net Worth Card */}
          <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">
                Nettovermögen
              </span>
              <div className="w-7 h-7 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center text-[var(--nothing-text)]">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold tracking-tight text-[var(--nothing-text)]">
              {formatCurrency(netWorthCents)}
            </div>
            <p className="mt-1 font-mono text-[10px] text-[var(--nothing-muted)]">
              Guthaben abzüglich aller Verbindlichkeiten
            </p>
          </div>

          {/* Cash Assets Card */}
          <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">
                Barkonten (Guthaben)
              </span>
              <div className="w-7 h-7 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center text-[var(--nothing-sage)]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold tracking-tight text-[var(--nothing-sage)]">
              {formatCurrency(totalCashCents)}
            </div>
            <p className="mt-1 font-mono text-[10px] text-[var(--nothing-muted)]">
              {cashAccounts.length} {cashAccounts.length === 1 ? 'Konto' : 'Konten'} (Giro, Tagesgeld, Bar)
            </p>
          </div>

          {/* Debts & Loans Card */}
          <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">
                Verbindlichkeiten & Kredite
              </span>
              <div className="w-7 h-7 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center text-[#D71921]">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold tracking-tight text-[#D71921]">
              {formatCurrency(totalDebtsCents)}
            </div>
            <p className="mt-1 font-mono text-[10px] text-[var(--nothing-muted)]">
              {creditAccounts.length + loanAccounts.length}{' '}
              {creditAccounts.length + loanAccounts.length === 1 ? 'Konto' : 'Konten'} (Kreditkarten, Ratenkredite)
            </p>
          </div>
        </div>

        {/* Global Empty State */}
        {accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-[var(--nothing-surface)] border border-dashed border-[var(--nothing-border)] rounded-3xl">
            <div className="w-14 h-14 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center mb-3 text-[var(--nothing-muted)]">
              <Wallet className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--nothing-text)] mb-1">
              Noch keine Konten angelegt
            </h3>
            <p className="max-w-md font-mono text-xs text-[var(--nothing-muted)] mb-5">
              Lege dein erstes Konto an (z. B. Girokonto, Kreditkarte oder Ratenkredit), um Buchungen zu erfassen.
            </p>
            <button
              type="button"
              onClick={onOpenAddAccount}
              className="flex items-center gap-2 px-4 py-2 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Erstes Konto hinzufügen</span>
            </button>
          </div>
        )}

        {/* Section 1: Barkonten */}
        {accounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[var(--nothing-muted)]" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                  BARKONTEN
                </h2>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)]">
                  ({cashAccounts.length})
                </span>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[var(--nothing-sage)]">
                {formatCurrency(totalCashCents)}
              </span>
            </div>

            {cashAccounts.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-[var(--nothing-border)] bg-[var(--nothing-surface)]/40 text-center font-mono text-xs text-[var(--nothing-muted)]">
                Keine Barkonten angelegt
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cashAccounts.map(renderAccountCard)}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Kreditkonten */}
        {accounts.length > 0 && (creditAccounts.length > 0 || loanAccounts.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--nothing-muted)]" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                  KREDITKONTEN
                </h2>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)]">
                  ({creditAccounts.length})
                </span>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[var(--nothing-text)]">
                {formatCurrency(totalCreditCents)}
              </span>
            </div>

            {creditAccounts.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-[var(--nothing-border)] bg-[var(--nothing-surface)]/40 text-center font-mono text-xs text-[var(--nothing-muted)]">
                Keine Kreditkarten oder Dispositionskredite angelegt
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {creditAccounts.map(renderAccountCard)}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Kredite & Darlehen (Ratenkredit, Immobilienkredit) */}
        {accounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#D71921]" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                  KREDITE & DARLEHEN
                </h2>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)]">
                  ({loanAccounts.length})
                </span>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[#D71921]">
                {formatCurrency(totalLoanCents)}
              </span>
            </div>

            {loanAccounts.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-[var(--nothing-border)] bg-[var(--nothing-surface)]/40 text-center font-mono text-xs text-[var(--nothing-muted)] flex items-center justify-between">
                <span>Keine Kredite oder Darlehen vorhanden.</span>
                <button
                  type="button"
                  onClick={onOpenAddAccount}
                  className="font-mono text-[11px] uppercase tracking-wider text-[#D71921] hover:underline font-semibold cursor-pointer"
                >
                  + Ratenkredit anlegen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {loanAccounts.map(renderAccountCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
