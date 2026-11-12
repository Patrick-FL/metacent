import { useState, useEffect } from 'react';
import { Wallet, Plus, X } from 'lucide-react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { PlanView } from './components/plan/PlanView';
import { RegisterView } from './components/register/RegisterView';
import { ReflectView } from './components/reflect/ReflectView';
import { AddAccountModal } from './components/accounts/AddAccountModal';
import { EditAccountModal } from './components/accounts/EditAccountModal';
import { ReconciliationModal } from './components/accounts/ReconciliationModal';
import { FileImportModal } from './components/import/FileImportModal';
import { ProfileEditorModal } from './components/import/ProfileEditorModal';
import { ShortcutsHelpModal } from './components/layout/ShortcutsHelpModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { storage } from './services/storage';

export function App() {
  const [currentView, setCurrentView] = useState<'plan' | 'reflect' | 'accounts'>('plan');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
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
    ? accounts.find((a) => a.id === selectedAccountId) || accounts[0]
    : accounts[0];

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
            <PlanView onUpdate={triggerRefresh} />
          )}

          {(currentView === 'accounts' || selectedAccountId) && selectedAccount && (
            <RegisterView
              account={selectedAccount}
              onUpdate={triggerRefresh}
              onOpenFileImport={() => setIsFileImportOpen(true)}
              onOpenReconcile={() => setIsReconcileOpen(true)}
              onOpenEditAccount={() => setIsEditAccountOpen(true)}
            />
          )}

          {(currentView === 'accounts' || selectedAccountId) && !selectedAccount && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--nothing-bg)] select-none">
              <div className="w-16 h-16 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] flex items-center justify-center mb-4 text-[var(--nothing-muted)]">
                <Wallet className="w-8 h-8" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D71921] mb-1 font-semibold">
                LEDGER // BEREIT
              </p>
              <h2 className="text-xl font-bold text-[var(--nothing-text)] mb-2 font-sans">
                Keine Konten vorhanden
              </h2>
              <p className="max-w-md font-mono text-xs text-[var(--nothing-muted)] mb-6 leading-relaxed">
                Erstelle dein erstes Bankkonto (z. B. Girokonto, Tagesgeld, Sparbuch, Kreditkarte oder Bargeld), um Buchungen zu erfassen und dein Budget zu steuern.
              </p>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--nothing-text)] text-[var(--nothing-bg)] font-mono text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Erstes Konto hinzufügen</span>
              </button>
            </div>
          )}

          {currentView === 'reflect' && <ReflectView />}
        </main>
      </div>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSuccess={triggerRefresh}
      />

      {selectedAccount && (
        <>
          <EditAccountModal
            isOpen={isEditAccountOpen}
            account={selectedAccount}
            onClose={() => setIsEditAccountOpen(false)}
            onSuccess={triggerRefresh}
            onOpenTemplates={() => setIsProfileEditorOpen(true)}
          />

          <ReconciliationModal
            isOpen={isReconcileOpen}
            account={selectedAccount}
            onClose={() => setIsReconcileOpen(false)}
            onSuccess={triggerRefresh}
          />

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
