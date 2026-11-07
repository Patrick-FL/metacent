import { useState, useEffect } from 'react';
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

  const [, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const accounts = storage.getAccounts();
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d110e] text-[#f1f5f2]">
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
      <main className="flex-1 flex flex-col h-full overflow-hidden">
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

        {currentView === 'reflect' && <ReflectView />}
      </main>

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
