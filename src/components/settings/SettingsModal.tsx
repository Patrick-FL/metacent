import React, { useState, useRef } from 'react';
import { storage } from '../../services/storage';
import { AppSettings } from '../../types';
import {
  X,
  Settings,
  Bot,
  HardDrive,
  Sliders,
  Info,
  Check,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'backup' | 'budget' | 'info'>('ai');
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [ollamaStatusMsg, setOllamaStatusMsg] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    storage.updateSettings(settings);
    setFeedbackMsg({ type: 'success', text: 'Einstellungen erfolgreich gespeichert.' });
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 600);
  };

  const handleTestOllama = async () => {
    setOllamaStatus('testing');
    setOllamaStatusMsg('Verbindung zu Ollama wird getestet...');
    try {
      const res = await fetch(`${settings.ollamaEndpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name).join(', ');
        setOllamaStatus('success');
        setOllamaStatusMsg(`Erfolgreich verbunden! Verfügbare Modelle: ${models || 'Keine Modelle geladen'}`);
      } else {
        setOllamaStatus('error');
        setOllamaStatusMsg(`Ollama antwortete mit Status: ${res.status}`);
      }
    } catch {
      setOllamaStatus('error');
      setOllamaStatusMsg(
        'Verbindung fehlgeschlagen. Stelle sicher, dass Ollama lokal gestartet ist (ollama serve).'
      );
    }
  };

  const handleExportBackup = () => {
    const dataStr = storage.exportBudgetBackup();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metacent_budget_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMsg({ type: 'success', text: 'Backup-Datei heruntergeladen.' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = storage.importBudgetBackup(content);
        if (ok) {
          setFeedbackMsg({ type: 'success', text: 'Budget erfolgreich wiederhergestellt!' });
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        } else {
          setFeedbackMsg({ type: 'error', text: 'Ungültige Budget-Backup-Datei.' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    if (confirm('Möchtest du wirklich alle Daten auf die Ausgangs-Demodaten zurücksetzen?')) {
      storage.resetToDemoData();
      setFeedbackMsg({ type: 'success', text: 'Demodaten wurden wiederhergestellt.' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-2xl w-full p-6 text-[var(--nothing-text)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center text-[var(--nothing-text)]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">CONFIGURATION // PREFERENCES</p>
              <h3 className="font-bold text-base text-[var(--nothing-text)]">Einstellungen</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-[var(--nothing-border)] pb-3 mb-4 text-xs font-mono uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>KI & Ollama</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Backup & Daten</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Budget-Regeln</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>System & Info</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4">
          {/* AI / Ollama Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                  Ollama Server-URL
                </label>
                <input
                  type="text"
                  value={settings.ollamaEndpoint}
                  onChange={(e) => setSettings({ ...settings, ollamaEndpoint: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-2 text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                />
                <span className="font-mono text-[10px] text-[var(--nothing-muted)] mt-1 block">
                  Lokale SLMs laufen vollständig offline auf deinem Rechner ohne Cloud-Abhängigkeit.
                </span>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                  Standard-Modell für Kategorisierung
                </label>
                <input
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="llama3.2:3b"
                  className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-2 text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                />
                <span className="font-mono text-[10px] text-[var(--nothing-muted)] mt-1 block">
                  Empfohlene Modelle: llama3.2:3b, qwen2.5:3b, phi3.5, mistral:7b
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={ollamaStatus === 'testing'}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ollamaStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Verbindung testen</span>
                </button>

                {ollamaStatus !== 'idle' && (
                  <div
                    className={`mt-2 p-3 rounded-2xl text-xs font-mono flex items-start gap-2 border ${
                      ollamaStatus === 'success'
                        ? 'bg-[var(--nothing-sage)]/10 border-[var(--nothing-sage)]/30 text-[var(--nothing-sage)]'
                        : ollamaStatus === 'error'
                        ? 'bg-[#D71921]/10 border-[#D71921]/30 text-[#D71921]'
                        : 'bg-[var(--nothing-subsurface)] border-[var(--nothing-border)] text-[var(--nothing-muted)]'
                    }`}
                  >
                    {ollamaStatus === 'success' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                    {ollamaStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{ollamaStatusMsg}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--nothing-border)]">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                  OpenRouter API-Schlüssel (Optional)
                </label>
                <input
                  type="password"
                  value={settings.openRouterApiKey}
                  onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-2 text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                />
              </div>
            </div>
          )}

          {/* Backup & Data Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[var(--nothing-text)]">Budget-Backup erstellen</h4>
                    <p className="font-mono text-[10px] text-[var(--nothing-muted)]">
                      Sichert alle Konten, Buchungen und Kategorien als JSON.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportieren</span>
                  </button>
                </div>
              </div>

              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[var(--nothing-text)]">Backup wiederherstellen</h4>
                    <p className="font-mono text-[10px] text-[var(--nothing-muted)]">
                      Ersetzt den aktuellen Stand durch ein Backup.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Wiederherstellen</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--nothing-subsurface)] border border-[#D71921]/20 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-[#D71921]">Demodaten zurücksetzen</h4>
                <p className="font-mono text-[10px] text-[var(--nothing-muted)]">
                  Löscht alle Buchungen und setzt auf Standard-Demodaten zurück.
                </p>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="px-3.5 py-1.5 border border-[#D71921] text-[#D71921] hover:bg-[#D71921]/10 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                >
                  Zurücksetzen
                </button>
              </div>
            </div>
          )}

          {/* Budget Rules Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-2">
                  Behandlung negativer Salden (Überziehung)
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 bg-[var(--nothing-subsurface)] p-3.5 rounded-2xl border border-[var(--nothing-border)] cursor-pointer hover:border-[var(--nothing-border-hover)]">
                    <input
                      type="radio"
                      name="rollover"
                      value="deduct_from_ready_to_assign"
                      checked={settings.negativeBalanceRollover === 'deduct_from_ready_to_assign'}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          negativeBalanceRollover: 'deduct_from_ready_to_assign',
                        })
                      }
                      className="mt-0.5 accent-[#D71921]"
                    />
                    <div>
                      <span className="font-semibold text-[var(--nothing-text)] block">
                        Vom Folgemonat abziehen (Standard Zero-Based)
                      </span>
                      <span className="font-mono text-[10px] text-[var(--nothing-muted)]">
                        Überzogene Kategorien verringern den Betrag „Bereit zur Zuweisung“ im Folgemonat.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 bg-[var(--nothing-subsurface)] p-3.5 rounded-2xl border border-[var(--nothing-border)] cursor-pointer hover:border-[var(--nothing-border-hover)]">
                    <input
                      type="radio"
                      name="rollover"
                      value="rollover_into_category"
                      checked={settings.negativeBalanceRollover === 'rollover_into_category'}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          negativeBalanceRollover: 'rollover_into_category',
                        })
                      }
                      className="mt-0.5 accent-[#D71921]"
                    />
                    <div>
                      <span className="font-semibold text-[var(--nothing-text)] block">
                        In Kategorie übertragen
                      </span>
                      <span className="font-mono text-[10px] text-[var(--nothing-muted)]">
                        Das Minus bleibt in der jeweiligen Kategorie bestehen.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* System Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-4 rounded-2xl space-y-2">
                <div className="flex justify-between py-1 border-b border-[var(--nothing-border)]">
                  <span className="text-[var(--nothing-muted)] uppercase">Anwendung</span>
                  <span className="text-[var(--nothing-text)] font-bold">METACENT</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--nothing-border)]">
                  <span className="text-[var(--nothing-muted)] uppercase">Version</span>
                  <span className="text-[var(--nothing-text)] font-bold">1.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--nothing-border)]">
                  <span className="text-[var(--nothing-muted)] uppercase">Autor</span>
                  <span className="text-[var(--nothing-text)] font-bold">Patrick Flöß</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--nothing-border)]">
                  <span className="text-[var(--nothing-muted)] uppercase">Design Language</span>
                  <span className="text-[var(--nothing-text)] font-bold">Nothing OS Desktop (Swiss Minimalist)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--nothing-muted)] uppercase">Speicherung</span>
                  <span className="text-[var(--nothing-text)]">100% Offline (SQLite / Local Engine)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div
            className={`mt-3 p-2.5 rounded-full text-xs font-mono flex items-center gap-2 border ${
              feedbackMsg.type === 'success'
                ? 'bg-[var(--nothing-sage)]/10 border-[var(--nothing-sage)]/30 text-[var(--nothing-sage)]'
                : 'bg-[#D71921]/10 border-[#D71921]/30 text-[#D71921]'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--nothing-border)] mt-4 flex justify-end items-center text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-4 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
