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
    <aside className="w-60 bg-[#0a0d0b] border-r border-[#232e26] flex flex-col h-screen select-none text-[#f1f5f2]">
      {/* Brand Header with Bamboo Logo */}
      <div className="p-4 border-b border-[#232e26] flex items-center gap-3">
        <img src={logoUrl} alt="metacent logo" className="w-8 h-8 rounded object-contain bg-[#adebb3] p-0.5" />
        <div>
          <span className="font-semibold tracking-wider text-sm uppercase text-[#f1f5f2]">metacent</span>
          <span className="block text-[10px] text-[#8c9e91]">Zero-Based Budgeting</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-2 space-y-1">
        <button
          onClick={() => onSelectView('plan')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'plan' && !selectedAccountId
              ? 'bg-[#1b241e] text-[#adebb3] border border-[#adebb3]/30'
              : 'text-[#8c9e91] hover:bg-[#141a16] hover:text-[#f1f5f2]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Planung</span>
        </button>

        <button
          onClick={() => onSelectView('reflect')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'reflect'
              ? 'bg-[#1b241e] text-[#adebb3] border border-[#adebb3]/30'
              : 'text-[#8c9e91] hover:bg-[#141a16] hover:text-[#f1f5f2]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Berichte</span>
        </button>

        <button
          onClick={() => onSelectView('accounts')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'accounts' && !selectedAccountId
              ? 'bg-[#1b241e] text-[#adebb3] border border-[#adebb3]/30'
              : 'text-[#8c9e91] hover:bg-[#141a16] hover:text-[#f1f5f2]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Alle Konten</span>
        </button>
      </nav>

      {/* Account Section */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex items-center justify-between px-3 mb-2 text-[11px] font-semibold tracking-wider text-[#8c9e91] uppercase">
          <span>BARKONTEN</span>
          <span className="tabular-nums font-normal">{formatCurrency(totalCashCents)}</span>
        </div>

        <div className="space-y-0.5">
          {cashAccounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => onSelectAccount(acc.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#1b241e] text-[#f1f5f2] border-l-2 border-[#adebb3]'
                    : 'text-[#8c9e91] hover:bg-[#141a16] hover:text-[#f1f5f2]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {acc.isFavorite && <Star className="w-3 h-3 text-[#adebb3] fill-[#adebb3]" />}
                  <span className="truncate">{acc.nickname}</span>
                </div>
                <span className="tabular-nums font-mono text-[11px] text-[#f1f5f2]">
                  {formatCurrency(acc.workingBalanceCents)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Account Button */}
        <button
          onClick={onOpenAddAccount}
          className="w-full mt-4 flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-[#232e26] text-xs text-[#8c9e91] hover:text-[#adebb3] hover:border-[#adebb3]/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Konto hinzufügen</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#232e26] flex items-center justify-between text-xs text-[#8c9e91]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#adebb3]" />
          <span className="text-[11px]">Lokal (Offline)</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="hover:text-[#adebb3] transition-colors p-1 rounded"
          title="Einstellungen"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

