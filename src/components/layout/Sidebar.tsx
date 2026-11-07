import React from 'react';
import { Account } from '../../types';
import { formatCurrency } from '../../services/currency';
import { Wallet, PieChart, Layers, Plus, Settings, Star } from 'lucide-react';
import logoUrl from '../../assets/logo.png';

interface SidebarProps {
  currentView: 'plan' | 'reflect' | 'accounts';
  selectedAccountId: string | null;
  accounts: Account[];
  onSelectView: (view: 'plan' | 'reflect' | 'accounts') => void;
  onSelectAccount: (accountId: string) => void;
  onOpenAddAccount: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedAccountId,
  accounts,
  onSelectView,
  onSelectAccount,
  onOpenAddAccount,
  onOpenSettings,
}) => {
  const cashAccounts = accounts.filter(
    (a) => a.accountType === 'checking' || a.accountType === 'savings' || a.accountType === 'cash'
  );
  const totalCashCents = cashAccounts.reduce((sum, a) => sum + a.workingBalanceCents, 0);

  return (
    <aside className="w-64 bg-[var(--nothing-surface)] border-r border-[var(--nothing-border)] flex flex-col h-full select-none text-[var(--nothing-text)] shrink-0 transition-colors">
      {/* Brand Header with Nothing OS Styling */}
      <div className="p-4 border-b border-[var(--nothing-border)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] p-1 flex items-center justify-center shrink-0">
          <img src={logoUrl} alt="metacent logo" className="w-5 h-5 object-contain" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold tracking-wider text-xs uppercase text-[var(--nothing-text)] truncate">
              METACENT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0" />
          </div>
          <span className="block font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)] truncate">
            ZERO-BASED BUDGET
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1.5">
        <button
          type="button"
          onClick={() => onSelectView('plan')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
            currentView === 'plan' && !selectedAccountId
              ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
              : 'text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)]/60 hover:text-[var(--nothing-text)] border border-transparent'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate">Planung</span>
          {currentView === 'plan' && !selectedAccountId && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D71921]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectView('reflect')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
            currentView === 'reflect'
              ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
              : 'text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)]/60 hover:text-[var(--nothing-text)] border border-transparent'
          }`}
        >
          <PieChart className="w-4 h-4 shrink-0" />
          <span className="truncate">Berichte</span>
          {currentView === 'reflect' && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D71921]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectView('accounts')}
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
            currentView === 'accounts' && !selectedAccountId
              ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
              : 'text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)]/60 hover:text-[var(--nothing-text)] border border-transparent'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span className="truncate">Alle Konten</span>
          {currentView === 'accounts' && !selectedAccountId && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D71921]" />
          )}
        </button>
      </nav>

      {/* Account Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex items-center justify-between px-2 mb-2 font-mono text-[10px] font-semibold tracking-widest text-[var(--nothing-muted)] uppercase">
          <span>BARKONTEN</span>
          <span className="tabular-nums font-mono text-[11px] text-[var(--nothing-text)]">
            {formatCurrency(totalCashCents)}
          </span>
        </div>

        <div className="space-y-1">
          {cashAccounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onSelectAccount(acc.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-medium'
                    : 'text-[var(--nothing-muted)] hover:bg-[var(--nothing-subsurface)]/50 hover:text-[var(--nothing-text)] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {acc.isFavorite && (
                    <Star className="w-3 h-3 text-[#D71921] fill-[#D71921] shrink-0" />
                  )}
                  <span className="truncate">{acc.nickname}</span>
                </div>
                <span className="tabular-nums font-mono text-xs text-[var(--nothing-text)] shrink-0">
                  {formatCurrency(acc.workingBalanceCents)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Account Button */}
        <button
          type="button"
          onClick={onOpenAddAccount}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-dashed border-[var(--nothing-border)] font-mono text-xs uppercase tracking-wider text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] hover:border-[var(--nothing-border-hover)] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Konto hinzufügen</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--nothing-border)] flex items-center justify-between">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--nothing-sage)]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] font-medium">
            Lokal (Offline)
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center transition-colors cursor-pointer"
          title="Einstellungen"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
