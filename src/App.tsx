import { useState, useEffect } from 'react';
import { Wallet, X } from 'lucide-react';
import { Account } from './types';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { PlanView } from './components/plan/PlanView';
import { RegisterView } from './components/register/RegisterView';
import { ReflectView } from './components/reflect/ReflectView';
import { AdvisorView } from './components/advisor/AdvisorView';
import { AccountsOverviewView } from './components/accounts/AccountsOverviewView';
import { AddAccountModal } from './components/accounts/AddAccountModal';
import { EditAccountModal } from './components/accounts/EditAccountModal';
import { ReconciliationModal } from './components/accounts/ReconciliationModal';
import { FileImportModal } from './components/import/FileImportModal';
import { ProfileEditorModal } from './components/import/ProfileEditorModal';
import { ShortcutsHelpModal } from './components/layout/ShortcutsHelpModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { storage } from './services/storage';

export function App() {
  const [currentView, setCurrentView] = useState<'plan' | 'reflect' | 'accounts' | 'advisor'>('plan');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountToReconcile, setAccountToReconcile] = useState<Account | null>(null);
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDemoBannerDismissed, setIsDemoBannerDismissed] = useState(false);

  const [, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const accounts = storage.getAccounts();
  const isDemo = storage.isDemoData();
  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId) || null
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes open modals
      if (e.key === 'Escape') {
        setIsAddAccountOpen(false);
        setIsEditAccountOpen(false);
        setIsReconcileOpen(false);
        setIsFileImportOpen(false);
        setIsProfileEditorOpen(false);
        setIsShortcutsHelpOpen(false);
        setIsSettingsOpen(false);
      }

      // Help Modal: ?
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
      }

      // Universal Undo: Ctrl+Z
      if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (storage.undo()) triggerRefresh();
      }

      // Universal Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) || (e.ctrlKey && (e.key === 'y' || e.key === 'Y'))) {
        e.preventDefault();
        if (storage.redo()) triggerRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--nothing-bg)] text-[var(--nothing-text)] transition-colors">
      {/* Frameless Desktop Window Title Bar */}
      <TitleBar onOpenShortcuts={() => setIsShortcutsHelpOpen(true)} />

      {/* Production Readiness / Demo Notification Banner */}
      {isDemo && !isDemoBannerDismissed && (
        <div className="bg-[var(--nothing-surface)] border-b border-[#D71921]/40 px-6 py-2 flex items-center justify-between text-xs font-mono shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#D71921] animate-pulse" />
            <span className="font-bold text-[var(--nothing-text)] uppercase tracking-wider">
              DEMO-MODUS:
            </span>
            <span className="text-[var(--nothing-muted)]">
              Beispieldaten geladen (Girokonto mit 800,00 €).
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Möchtest du die Beispieldaten jetzt entfernen und mit deinem leeren Produktions-Budget starten?\n\nDeine Kategoriestruktur bleibt als Vorlage erhalten.'
                  )
                ) {
                  storage.resetToEmptyProductionData();
                  triggerRefresh();
                }
              }}
              className="px-3.5 py-1 bg-[#D71921] text-white rounded-full text-[11px] uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              Echtes Budget starten (Demodaten entfernen)
            </button>
            <button
              type="button"
              onClick={() => setIsDemoBannerDismissed(true)}
              className="p-1 rounded-full text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] hover:bg-[var(--nothing-subsurface)] transition-colors cursor-pointer"
              title="Banner ausblenden"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          selectedAccountId={selectedAccountId}
          accounts={accounts}
          onSelectView={(view) => {
            setCurrentView(view);
            setSelectedAccountId(null);
          }}
          onSelectAccount={(accId) => {
            setSelectedAccountId(accId);
            setCurrentView('accounts');
          }}
          onOpenAddAccount={() => setIsAddAccountOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--nothing-bg)]">
          {currentView === 'plan' && !selectedAccountId && (
            <PlanView
              onUpdate={triggerRefresh}
              onOpenAdvisor={() => {
                setCurrentView('advisor');
                setSelectedAccountId(null);
              }}
            />
          )}

          {currentView === 'accounts' && !selectedAccountId && (
            <AccountsOverviewView
              onSelectAccount={(accId) => {
                setSelectedAccountId(accId);
                setCurrentView('accounts');
              }}
              onOpenAddAccount={() => setIsAddAccountOpen(true)}
              onOpenEditAccount={(acc) => {
                setAccountToEdit(acc);
                setIsEditAccountOpen(true);
              }}
              onOpenReconcile={(acc) => {
                setAccountToReconcile(acc);
                setIsReconcileOpen(true);
              }}
              onUpdate={triggerRefresh}
            />
          )}

          {selectedAccountId && selectedAccount && (
            <RegisterView
              account={selectedAccount}
              onUpdate={triggerRefresh}
              onOpenFileImport={() => setIsFileImportOpen(true)}
              onOpenReconcile={() => {
                setAccountToReconcile(selectedAccount);
                setIsReconcileOpen(true);
              }}
              onOpenEditAccount={() => {
                setAccountToEdit(selectedAccount);
                setIsEditAccountOpen(true);
              }}
            />
          )}

          {selectedAccountId && !selectedAccount && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--nothing-bg)] select-none">
              <div className="w-16 h-16 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] flex items-center justify-center mb-4 text-[var(--nothing-muted)]">
                <Wallet className="w-8 h-8" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D71921] mb-1 font-semibold">
                LEDGER // HINWEIS
              </p>
              <h2 className="text-xl font-bold text-[var(--nothing-text)] mb-2 font-sans">
                Konto nicht gefunden
              </h2>
              <p className="max-w-md font-mono text-xs text-[var(--nothing-muted)] mb-6 leading-relaxed">
                Das ausgewählte Konto existiert nicht mehr oder wurde entfernt.
              </p>
              <button
                type="button"
                onClick={() => setSelectedAccountId(null)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--nothing-text)] text-[var(--nothing-bg)] font-mono text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                <span>Zur Kontenübersicht</span>
              </button>
            </div>
          )}

          {currentView === 'reflect' && <ReflectView />}

          {currentView === 'advisor' && (
            <AdvisorView
              onNavigateToPlan={() => {
                setCurrentView('plan');
                setSelectedAccountId(null);
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={triggerRefresh}
      />

      {(accountToEdit || selectedAccount) && (
        <EditAccountModal
          isOpen={isEditAccountOpen}
          account={accountToEdit || selectedAccount!}
          onClose={() => {
            setIsEditAccountOpen(false);
            setAccountToEdit(null);
          }}
          onSuccess={() => {
            triggerRefresh();
            const currentAccs = storage.getAccounts();
            if (selectedAccountId && !currentAccs.some((a) => a.id === selectedAccountId)) {
              setSelectedAccountId(null);
            }
          }}
          onOpenTemplates={() => setIsProfileEditorOpen(true)}
        />
      )}

      {(accountToReconcile || selectedAccount) && (
        <ReconciliationModal
          isOpen={isReconcileOpen}
          account={accountToReconcile || selectedAccount!}
          onClose={() => {
            setIsReconcileOpen(false);
            setAccountToReconcile(null);
          }}
          onSuccess={triggerRefresh}
        />
      )}

      {selectedAccount && (
        <>
          <FileImportModal
            isOpen={isFileImportOpen}
            account={selectedAccount}
            onClose={() => setIsFileImportOpen(false)}
            onSuccess={triggerRefresh}
          />

          <ProfileEditorModal
            isOpen={isProfileEditorOpen}
            account={selectedAccount}
            onClose={() => setIsProfileEditorOpen(false)}
            onSuccess={triggerRefresh}
          />
        </>
      )}

      <ShortcutsHelpModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}

export default App;
