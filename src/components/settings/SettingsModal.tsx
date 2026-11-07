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
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-2xl w-full p-6 text-[#f1f5f2] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#adebb3]" />
            <h3 className="font-semibold text-base text-[#f1f5f2]">Einstellungen</h3>
          </div>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#232e26] pb-3 mb-4 text-xs">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'ai'
                ? 'bg-[#1b241e] text-[#adebb3] border border-[#adebb3]/30 font-medium'
                : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>KI & Ollama</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'backup'
                ? 'bg-[#1b241e] text-[#adebb3] border border-[#adebb3]/30 font-medium'
                : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Backup & Daten</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'budget'
                ? 'bg-[#1b241e] text-[#adebb3] border border-[#adebb3]/30 font-medium'
                : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Budget-Regeln</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'info'
                ? 'bg-[#1b241e] text-[#adebb3] border border-[#adebb3]/30 font-medium'
                : 'text-[#8c9e91] hover:text-[#f1f5f2]'
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
                <label className="block text-[#8c9e91] mb-1 font-medium">Ollama Server-URL</label>
                <input
                  type="text"
                  value={settings.ollamaEndpoint}
                  onChange={(e) => setSettings({ ...settings, ollamaEndpoint: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full bg-[#0d110e] border border-[#232e26] rounded px-3 py-2 text-[#f1f5f2] focus:outline-none focus:border-[#adebb3]"
                />
                <span className="text-[11px] text-[#8c9e91] mt-1 block">
                  Lokale SLMs laufen vollständig offline auf deinem Rechner ohne Cloud-Abhängigkeit.
                </span>
              </div>

              <div>
                <label className="block text-[#8c9e91] mb-1 font-medium">Standard-Modell für Kategorisierung</label>
                <input
                  type="text"
                  value={settings.ollamaModel}
                  onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="llama3.2:3b"
                  className="w-full bg-[#0d110e] border border-[#232e26] rounded px-3 py-2 text-[#f1f5f2] focus:outline-none focus:border-[#adebb3]"
                />
                <span className="text-[11px] text-[#8c9e91] mt-1 block">
                  Empfohlene schlanke Modelle: llama3.2:3b, qwen2.5:3b, phi3.5, mistral:7b
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={ollamaStatus === 'testing'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b241e] border border-[#232e26] hover:border-[#adebb3]/40 rounded text-xs text-[#adebb3] transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ollamaStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Verbindung testen</span>
                </button>

                {ollamaStatus !== 'idle' && (
                  <div
                    className={`mt-2 p-2 rounded text-xs flex items-start gap-2 ${
                      ollamaStatus === 'success'
                        ? 'bg-[#adebb3]/10 border border-[#adebb3]/30 text-[#adebb3]'
                        : ollamaStatus === 'error'
                        ? 'bg-[#e8706d]/10 border border-[#e8706d]/30 text-[#e8706d]'
                        : 'bg-[#1b241e] text-[#8c9e91]'
                    }`}
                  >
                    {ollamaStatus === 'success' && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                    {ollamaStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{ollamaStatusMsg}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#232e26]">
                <label className="block text-[#8c9e91] mb-1 font-medium">
                  OpenRouter API-Schlüssel (Optionaler Entscheidungsmodell-Fallback)
                </label>
                <input
                  type="password"
                  value={settings.openRouterApiKey}
                  onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-[#0d110e] border border-[#232e26] rounded px-3 py-2 text-[#f1f5f2] focus:outline-none focus:border-[#adebb3]"
                />
                <span className="text-[11px] text-[#8c9e91] mt-1 block">
                  Optional: Falls kein lokales Modell installiert ist oder komplexe Entscheidungsmodelle via OpenRouter gewünscht sind.
                </span>
              </div>
            </div>
          )}

          {/* Backup & Data Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-[#0d110e] border border-[#232e26] p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#f1f5f2]">Vollständiges Budget-Backup erstellen</h4>
                    <p className="text-[11px] text-[#8c9e91]">
                      Sichert alle Konten, Buchungen, Kategorien, Zielbeträge und Importprofile in einer JSON-Datei.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#adebb3] text-[#0d110e] font-semibold rounded hover:bg-[#adebb3]/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportieren</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#0d110e] border border-[#232e26] p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#f1f5f2]">Budget aus Backup wiederherstellen</h4>
                    <p className="text-[11px] text-[#8c9e91]">
                      Ersetzt den aktuellen Stand durch ein zuvor exportiertes Backup.
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
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#232e26] text-[#8c9e91] hover:text-[#f1f5f2] hover:border-[#adebb3]/40 rounded transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Wiederherstellen</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#0d110e] border border-[#e8706d]/20 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-[#e8706d]">Datenbank zurücksetzen</h4>
                <p className="text-[11px] text-[#8c9e91]">
                  Löscht alle erstellten Buchungen und stellt die ursprünglichen Demodaten wieder her.
                </p>
                <button
                  onClick={handleResetDemoData}
                  className="px-3 py-1.5 border border-[#e8706d]/30 text-[#e8706d] hover:bg-[#e8706d]/10 rounded transition-colors text-xs"
                >
                  Demodaten wiederherstellen
                </button>
              </div>
            </div>
          )}

          {/* Budget Rules Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[#8c9e91] mb-2 font-medium">
                  Behandlung negativer Kategorie-Salden (Überziehung)
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 bg-[#0d110e] p-3 rounded border border-[#232e26] cursor-pointer hover:border-[#adebb3]/40">
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
                      className="mt-0.5 accent-[#adebb3]"
                    />
                    <div>
                      <span className="font-medium text-[#f1f5f2] block">
                        Vom Folgemonat abziehen (Empfohlen nach YNAB-Methode)
                      </span>
                      <span className="text-[11px] text-[#8c9e91]">
                        Überzogene Kategorien werden auf 0 gesetzt und verringern den Betrag „Bereit zur Zuweisung“ im nächsten Monat.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 bg-[#0d110e] p-3 rounded border border-[#232e26] cursor-pointer hover:border-[#adebb3]/40">
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
                      className="mt-0.5 accent-[#adebb3]"
                    />
                    <div>
                      <span className="font-medium text-[#f1f5f2] block">
                        In Kategorie übertragen (Negativer Saldovortrag)
                      </span>
                      <span className="text-[11px] text-[#8c9e91]">
                        Das Minus bleibt in der jeweiligen Kategorie bestehen und muss dort im Folgemonat ausgeglichen werden.
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
              <div className="bg-[#0d110e] border border-[#232e26] p-4 rounded-lg space-y-2">
                <div className="flex justify-between py-1 border-b border-[#232e26]">
                  <span className="text-[#8c9e91]">Anwendung</span>
                  <span className="text-[#adebb3] font-bold font-sans">metacent 0.1.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#232e26]">
                  <span className="text-[#8c9e91]">Betriebssystem</span>
                  <span className="text-[#f1f5f2]">Linux Mint OS / Cross-Platform</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#232e26]">
                  <span className="text-[#8c9e91]">Standardwährung</span>
                  <span className="text-[#f1f5f2]">EUR (€) in Minor Integer Cents (i64)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#232e26]">
                  <span className="text-[#8c9e91]">Datenspeicherung</span>
                  <span className="text-[#f1f5f2]">100% Offline (SQLite / Local Engine)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#232e26]">
                  <span className="text-[#8c9e91]">Bankverbindungen</span>
                  <span className="text-[#adebb3]">Keine externen Logins / 100% Privatsphäre</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8c9e91]">Kategorie-Design</span>
                  <span className="text-[#f1f5f2]">Typografie & Monochrome (Keine Emojis)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div
            className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-[#adebb3]/10 border border-[#adebb3]/30 text-[#adebb3]'
                : 'bg-[#e8706d]/10 border border-[#e8706d]/30 text-[#e8706d]'
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
        <div className="pt-4 border-t border-[#232e26] mt-4 flex justify-between items-center text-xs">
          <span className="text-[#8c9e91]">Änderungen werden lokal gespeichert.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-[#232e26] text-[#8c9e91] hover:text-[#f1f5f2] rounded transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-1.5 bg-[#adebb3] text-[#0d110e] font-semibold rounded hover:bg-[#adebb3]/90 transition-colors"
            >
              Einstellungen speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

