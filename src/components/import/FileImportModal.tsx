import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Account, ImportProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import {
  parseCsvFile,
  inspectCsv,
  detectHeaderRow,
} from '../../services/csvParser';
import { categorizeWithOllama, fallbackHeuristic, isOllamaAvailable } from '../../services/ollama';
import { CategoryCombobox } from '../common/CategoryCombobox';
import { RuleDefinitionModal } from './RuleDefinitionModal';
import {
  X,
  Upload,
  Sparkles,
  Check,
  FileSpreadsheet,
  ArrowLeft,
  Save,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  FileText,
  BookmarkPlus,
} from 'lucide-react';

interface FileImportModalProps {
  isOpen: boolean;
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRowPreview {
  id: string;
  date: string;
  payee: string;
  amountCents: number;
  memo: string;
  suggestedCategoryId: string;
  originalSuggestedCategoryId: string;
  matchType: 'rule' | 'ollama' | 'heuristic' | 'manual';
  ruleInfo?: string;
  fitid?: string;
  isDuplicate: boolean;
  isUserModified?: boolean;
  raw?: Record<string, string>;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  account,
  onClose,
  onSuccess,
}) => {
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [activeProfile, setActiveProfile] = useState<ImportProfile | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedRowPreview[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showSaveProfileModal, setShowSaveProfileModal] = useState<boolean>(false);
  const [saveProfileName, setSaveProfileName] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [editingRuleRow, setEditingRuleRow] = useState<ParsedRowPreview | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const profiles = useMemo(() => storage.getImportProfiles(account.id), [account.id, isOpen]);
  const categories = useMemo(() => storage.getCategories(), [isOpen]);
  const groups = useMemo(() => storage.getCategoryGroups(), [isOpen]);

  // Reset internal state when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setParseError(null);
      setSaveSuccessMsg(null);
      setEditingRuleRow(null);
      if (profiles.length > 0 && !selectedProfileId) {
        setSelectedProfileId(profiles[0].id);
      }
    } else {
      setRawContent(null);
      setFileName('');
      setPreviewRows([]);
      setDetectedHeaders([]);
      setActiveProfile(null);
      setShowSaveProfileModal(false);
      setEditingRuleRow(null);
    }
  }, [isOpen, profiles]);

  if (!isOpen) return null;

  /**
   * Core parsing function that updates rows whenever activeProfile or rawContent changes.
   */
  const recomputePreview = (content: string, profile: ImportProfile) => {
    try {
      setParseError(null);
      const parsed = parseCsvFile(content, profile);

      const rows: ParsedRowPreview[] = parsed.map((item, i) => {
        const fitid = item.fitid || `fitid-${item.date}-${item.payee}-${item.amountCents}`;
        const isDuplicate = storage.isDuplicateTransaction(
          account.id,
          fitid,
          item.date,
          item.payee,
          item.amountCents
        );

        let catId = item.suggestedCategoryId;
        let matchType: 'rule' | 'ollama' | 'heuristic' | 'manual' = item.suggestedCategoryId ? 'rule' : 'manual';
        let ruleInfo = item.matchRuleName;

        if (!catId && !isDuplicate) {
          const heur = fallbackHeuristic(item.payee, categories);
          if (heur) {
            catId = heur.categoryId;
            matchType = 'heuristic';
            ruleInfo = 'Heuristik';
          }
        }

        const finalCat = catId || categories[0]?.id || '';

        return {
          id: `row-${i}-${item.date}-${item.amountCents}`,
          date: item.date,
          payee: item.payee,
          amountCents: item.amountCents,
          memo: item.memo,
          suggestedCategoryId: finalCat,
          originalSuggestedCategoryId: finalCat,
          matchType,
          ruleInfo,
          fitid,
          isDuplicate,
          raw: item.raw,
        };
      });

      setPreviewRows(rows);
    } catch (err: any) {
      console.error('CSV Parsing Error:', err);
      setParseError(`Fehler beim Parsen der Datei: ${err?.message || 'Ungültiges CSV-Format'}`);
    }
  };

  /**
   * Handle initial ingestion of CSV text (from file upload, sample, or paste).
   */
  const handleLoadCsvContent = (content: string, name: string) => {
    setParseError(null);
    setFileName(name);
    setRawContent(content);

    try {
      const inspection = inspectCsv(content);
      setDetectedHeaders(inspection.headers);

      // Check if one of the existing profiles matches the headers
      let chosenProfile: ImportProfile | undefined = undefined;

      // 1. Check if user already had a selected profile that matches
      if (selectedProfileId) {
        const p = profiles.find((x) => x.id === selectedProfileId);
        if (p && inspection.headers.includes(p.fieldMappings.date)) {
          chosenProfile = { ...p };
        }
      }

      // 2. Check Trade Republic pattern
      if (!chosenProfile && content.includes('Bezeichnung') && content.includes('Betrag') && content.includes('Saldo')) {
        const tr = profiles.find((p) => p.profileName.toLowerCase().includes('trade republic'));
        if (tr) chosenProfile = { ...tr };
      }

      // 3. Fallback: Create dynamic live profile based on inspection
      if (!chosenProfile) {
        chosenProfile = {
          id: `prof-custom-${Date.now()}`,
          accountId: account.id,
          profileName: `${name.replace(/\.[^/.]+$/, '')} (Erkannt)`,
          delimiter: inspection.delimiter,
          dateFormat: inspection.suggestedDateFormat,
          decimalSeparator: ',',
          thousandsSeparator: '.',
          headerRowIndex: inspection.headerRowIndex,
          fieldMappings: {
            ...inspection.suggestedMappings,
          },
          categoryMatchRules: [
            { sourceField: 'Bezeichnung', pattern: 'Supermarkt', targetCategoryId: 'cat-lebensmittel' },
            { sourceField: 'Typ', pattern: 'Zinsen', targetCategoryId: 'cat-notgroschen' },
          ],
        };
      }

      setActiveProfile(chosenProfile);
      setSaveProfileName(chosenProfile.profileName);
      setSelectedProfileId(chosenProfile.id);

      recomputePreview(content, chosenProfile);
    } catch (err: any) {
      setParseError(`Datei konnte nicht analysiert werden: ${err?.message || 'Unbekannter Fehler'}`);
    }
  };

  /**
   * Live adjustment handler: when user modifies any mapping/delimiter in the UI.
   */
  const handleUpdateProfileSetting = (updater: (prev: ImportProfile) => ImportProfile) => {
    if (!activeProfile || !rawContent) return;
    const updated = updater(activeProfile);
    setActiveProfile(updated);

    // If delimiter changed, re-detect headers from raw content
    if (updated.delimiter !== activeProfile.delimiter) {
      const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const { headers } = detectHeaderRow(lines, updated.delimiter);
      setDetectedHeaders(headers);
    }

    recomputePreview(rawContent, updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleLoadCsvContent(text, file.name);
      }
    };
    reader.onerror = () => {
      setParseError('Fehler beim Lesen der lokalen Datei.');
    };
    reader.readAsText(file);
  };

  const handleLoadSampleTradeRepublic = () => {
    const sample = `Datum;Typ;Bezeichnung;Betrag;Saldo
24.10.2026;Zinsen;Zinsgutschrift Trade Republic;41,20;1250,50
22.10.2026;Kartenzahlung;Bäckerei Müller München;-7,40;1209,30
20.10.2026;Kartenzahlung;Spotify AB Stockholm;-12,99;1216,70
18.10.2026;Kartenzahlung;Apotheke am Markt;-24,50;1229,69
15.10.2026;Überweisung;Gehalt Arbeitgeber AG;2.450,00;3679,69`;
    handleLoadCsvContent(sample, 'Muster-Trade-Republic.csv');
  };

  const handleLoadSampleSparkasse = () => {
    const sample = `"Auftragskonto";"Buchungstag";"Valutadatum";"Buchungstext";"Verwendungszweck";"Beguenstigter/Zahlungspflichtiger";"Betrag";"Waehrung"
"DE12500105170123456789";"24.10.2026";"24.10.2026";"GUTSCHRIFT";"Gehalt Monat 10";"Arbeitgeber Digital GmbH";"2.850,00";"EUR"
"DE12500105170123456789";"22.10.2026";"22.10.2026";"KARTENZAHLUNG";"EC-Zahlung 22.10 14:32";"REWE Supermarkt Filiale 412";"-64,30";"EUR"
"DE12500105170123456789";"20.10.2026";"20.10.2026";"LASTSCHRIFT";"Stromabschlag Oktober";"Stadtwerke Energie AG";"-89,00";"EUR"
"DE12500105170123456789";"17.10.2026";"17.10.2026";"DAUERAUFTRAG";"Miete Oktober 2026";"Hausverwaltung Schmidt";"-850,00";"EUR"`;
    handleLoadCsvContent(sample, 'Muster-Sparkasse.csv');
  };

  const handleResetToStart = () => {
    setRawContent(null);
    setFileName('');
    setPreviewRows([]);
    setDetectedHeaders([]);
    setActiveProfile(null);
    setParseError(null);
    setEditingRuleRow(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Refine categories using local Ollama model (non-blocking, optional).
   */
  const handleEnhanceWithAi = async () => {
    if (!rawContent || previewRows.length === 0) return;
    setIsProcessingAi(true);

    try {
      const isOnline = await isOllamaAvailable();
      if (!isOnline) {
        alert('Lokaler Ollama-Daemon (Port 11434) antwortet nicht. Die Heuristik-Kategorisierung bleibt aktiv.');
        setIsProcessingAi(false);
        return;
      }

      const updated = [...previewRows];
      for (let i = 0; i < updated.length; i++) {
        const row = updated[i];
        if (row.matchType === 'heuristic' || row.matchType === 'manual') {
          const aiMatch = await categorizeWithOllama(row.payee, row.memo, row.amountCents, categories);
          if (aiMatch) {
            updated[i].suggestedCategoryId = aiMatch.categoryId;
            updated[i].matchType = 'ollama';
            updated[i].ruleInfo = `Ollama: ${aiMatch.model}`;
          }
        }
      }
      setPreviewRows(updated);
    } catch (e: any) {
      console.warn('AI enhancement issue:', e);
    } finally {
      setIsProcessingAi(false);
    }
  };

  /**
   * Save the current active live configuration as a reusable template.
   */
  const handleSaveAsProfile = () => {
    if (!activeProfile) return;
    const profileToSave: ImportProfile = {
      ...activeProfile,
      id: activeProfile.id.startsWith('prof-custom-')
        ? `prof-${Date.now()}`
        : activeProfile.id,
      accountId: account.id,
      profileName: saveProfileName.trim() || activeProfile.profileName,
    };
    storage.saveImportProfile(profileToSave);
    setActiveProfile(profileToSave);
    setSelectedProfileId(profileToSave.id);
    setShowSaveProfileModal(false);
    setSaveSuccessMsg(`Vorlage "${profileToSave.profileName}" erfolgreich gespeichert!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  /**
   * Adds and persists a new matching rule from the RuleDefinitionModal into activeProfile.
   * Immediately updates matching preview rows live.
   */
  const handleSaveRuleFromModal = (rule: { sourceField: string; pattern: string; targetCategoryId: string }) => {
    if (!activeProfile || !rawContent) return;

    const updatedProfile: ImportProfile = {
      ...activeProfile,
      categoryMatchRules: [
        ...(activeProfile.categoryMatchRules || []),
        rule,
      ],
    };

    // 1. Persist rule inside the template
    storage.saveImportProfile(updatedProfile);
    setActiveProfile(updatedProfile);

    // 2. Immediately apply to matching rows in current preview
    const q = rule.pattern.toLowerCase();
    let updatedCount = 0;

    const updatedRows = previewRows.map((r) => {
      let val = '';
      if (r.raw && r.raw[rule.sourceField]) {
        val = r.raw[rule.sourceField];
      } else if (rule.sourceField === activeProfile.fieldMappings.payee) {
        val = r.payee;
      } else if (rule.sourceField === activeProfile.fieldMappings.memo) {
        val = r.memo;
      } else {
        val = r.payee;
      }

      if (val.toLowerCase().includes(q)) {
        updatedCount++;
        return {
          ...r,
          suggestedCategoryId: rule.targetCategoryId,
          matchType: 'rule' as const,
          ruleInfo: `Regel: "${rule.pattern}" in ${rule.sourceField}`,
          isUserModified: false,
        };
      }
      return r;
    });

    setPreviewRows(updatedRows);
    setSaveSuccessMsg(`Regel für "${rule.pattern}" im Template gespeichert (${updatedCount} Buchungen aktualisiert).`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setEditingRuleRow(null);
  };

  /**
   * Commit verified rows into account transactions.
   */
  const handleCommitImport = () => {
    const validRows = previewRows.filter((r) => !r.isDuplicate);
    if (validRows.length === 0) return;

    for (const row of validRows) {
      // Auto-learn category rule if user modified it
      if (row.isUserModified && row.suggestedCategoryId !== row.originalSuggestedCategoryId) {
        storage.learnCategoryRule(account.id, row.payee, row.suggestedCategoryId);
      }

      storage.addTransaction({
        accountId: account.id,
        date: row.date,
        payee: row.payee || 'Unbekannt',
        categoryId: row.suggestedCategoryId,
        memo: row.memo || `Import (${fileName})`,
        amountCents: row.amountCents,
        clearedStatus: 'cleared',
        isApproved: true,
        flag: 0,
        transferAccountId: null,
        transferTransactionId: null,
        importFitid: row.fitid || `fitid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        aiSuggested: row.matchType === 'ollama',
      });
    }

    onSuccess();
    onClose();
  };

  const nonDuplicateCount = previewRows.filter((r) => !r.isDuplicate).length;
  const duplicateCount = previewRows.filter((r) => r.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-4xl w-full p-6 text-[var(--nothing-text)] flex flex-col max-h-[92vh] shadow-2xl transition-all">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-3">
          <div className="flex items-center gap-3">
            {rawContent ? (
              <button
                type="button"
                onClick={handleResetToStart}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-xs font-mono uppercase tracking-wider text-[var(--nothing-text)] cursor-pointer transition-colors"
                title="Zurück zum Start & andere Datei wählen"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Andere Datei</span>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-[#D71921]" />
              </div>
            )}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">
                STATEMENT // IMPORT & LIVE STUDIO
              </p>
              <h3 className="font-bold text-base text-[var(--nothing-text)] flex items-center gap-2">
                <span>{account.nickname}</span>
                {fileName && (
                  <span className="font-mono text-xs font-normal text-[var(--nothing-muted)] bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] px-2 py-0.5 rounded-full">
                    {fileName}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rawContent && activeProfile && (
              <button
                type="button"
                onClick={() => setShowSaveProfileModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-xs font-mono uppercase tracking-wider text-[var(--nothing-text)] cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-[#D71921]" />
                <span>Vorlage speichern</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center cursor-pointer transition-colors"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Save/Error feedback alerts */}
        {saveSuccessMsg && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-[var(--nothing-sage)]/10 border border-[var(--nothing-sage)]/30 text-[var(--nothing-sage)] font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {parseError && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-[#D71921]/10 border border-[#D71921]/30 text-[#D71921] font-mono text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
            <button
              type="button"
              onClick={handleResetToStart}
              className="underline text-[10px] uppercase font-semibold cursor-pointer"
            >
              Neu starten
            </button>
          </div>
        )}

        {/* STEP 1: INITIAL UPLOAD VIEW */}
        {!rawContent ? (
          <div className="flex flex-col gap-4 my-auto py-6">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.ofx,.qfx"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--nothing-border)] hover:border-[#D71921] rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[var(--nothing-subsurface)]/40 hover:bg-[var(--nothing-subsurface)] group"
            >
              <div className="w-14 h-14 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 text-[#D71921]" />
              </div>
              <p className="font-mono text-sm uppercase tracking-wider font-bold text-[var(--nothing-text)]">
                Kontoauszug hier ablegen oder durchsuchen
              </p>
              <p className="font-mono text-xs text-[var(--nothing-muted)] mt-1.5 max-w-md">
                Unterstützt CSV-Dateien aller Banken (Trade Republic, Sparkasse, DKB, ING, N26, Volksbank uvm.).
              </p>
              <span className="mt-4 font-mono text-[10px] uppercase tracking-widest text-[var(--nothing-muted)] bg-[var(--nothing-surface)] border border-[var(--nothing-border)] px-3 py-1 rounded-full">
                100% Client-seitig verarbeitet • Keine Server-Übertragung
              </span>
            </div>

            {/* Quick Test Samples */}
            <div className="border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] rounded-2xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-2 font-semibold">
                Sofort testen mit Beispieldaten:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleTradeRepublic}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] hover:border-[var(--nothing-border-hover)] font-mono text-xs text-[var(--nothing-text)] cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D71921]" />
                  <span>Trade Republic Auszug testen</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleSparkasse}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] hover:border-[var(--nothing-border-hover)] font-mono text-xs text-[var(--nothing-text)] cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D71921]" />
                  <span>Sparkasse Auszug testen</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: LIVE RECOGNITION STUDIO & INSTANT PREVIEW */
          <div className="flex flex-col flex-1 overflow-hidden gap-3">
            
            {/* Live Interactive Configuration Bento */}
            {activeProfile && (
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-3.5 rounded-2xl space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#D71921]" />
                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[var(--nothing-text)]">
                      Live-Erkennung & Spaltenzuordnung
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[var(--nothing-muted)]">
                      Vorlage wechseln:
                    </span>
                    <select
                      value={selectedProfileId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        setSelectedProfileId(targetId);
                        const found = profiles.find((p) => p.id === targetId);
                        if (found && rawContent) {
                          setActiveProfile({ ...found });
                          recomputePreview(rawContent, found);
                        }
                      }}
                      className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-lg px-2 py-0.5 text-xs font-mono text-[var(--nothing-text)] focus:outline-none cursor-pointer"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.profileName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary Column Selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* Datum-Spalte */}
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                      Datum-Spalte:
                    </label>
                    <select
                      value={activeProfile.fieldMappings.date || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateProfileSetting((prev) => ({
                          ...prev,
                          fieldMappings: { ...prev.fieldMappings, date: val },
                        }));
                      }}
                      className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[#D71921]"
                    >
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Empfänger-Spalte */}
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                      Empfänger-Spalte:
                    </label>
                    <select
                      value={activeProfile.fieldMappings.payee || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateProfileSetting((prev) => ({
                          ...prev,
                          fieldMappings: { ...prev.fieldMappings, payee: val },
                        }));
                      }}
                      className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[#D71921]"
                    >
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Betrag-Spalte */}
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                      Betrag-Spalte:
                    </label>
                    <select
                      value={activeProfile.fieldMappings.amount || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateProfileSetting((prev) => ({
                          ...prev,
                          fieldMappings: {
                            ...prev.fieldMappings,
                            amount: val,
                            inflow: undefined,
                            outflow: undefined,
                          },
                        }));
                      }}
                      className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[#D71921]"
                    >
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Verwendungszweck-Spalte */}
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                      Verwendungszweck:
                    </label>
                    <select
                      value={activeProfile.fieldMappings.memo || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateProfileSetting((prev) => ({
                          ...prev,
                          fieldMappings: { ...prev.fieldMappings, memo: val },
                        }));
                      }}
                      className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[#D71921]"
                    >
                      <option value="">(Keine / Leer)</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Secondary Format Options */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--nothing-border)] text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)]">
                        Trennzeichen:
                      </span>
                      <select
                        value={activeProfile.delimiter}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateProfileSetting((prev) => ({ ...prev, delimiter: val }));
                        }}
                        className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-lg px-2 py-0.5 text-xs font-mono text-[var(--nothing-text)] focus:outline-none"
                      >
                        <option value=";">Semikolon (;)</option>
                        <option value=",">Komma (,)</option>
                        <option value={"\t"}>Tabulator (\t)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)]">
                        Datumsformat:
                      </span>
                      <select
                        value={activeProfile.dateFormat}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateProfileSetting((prev) => ({ ...prev, dateFormat: val }));
                        }}
                        className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-lg px-2 py-0.5 text-xs font-mono text-[var(--nothing-text)] focus:outline-none"
                      >
                        <option value="DD.MM.YYYY">DD.MM.YYYY (z.B. 24.10.2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (z.B. 2026-10-24)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessingAi}
                      onClick={handleEnhanceWithAi}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] hover:border-[var(--nothing-border-hover)] font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-text)] cursor-pointer disabled:opacity-50"
                      title="Lokale Ollama-KI für Kategorien anfragen"
                    >
                      <Sparkles className={`w-3 h-3 text-[#D71921] ${isProcessingAi ? 'animate-spin' : ''}`} />
                      <span>{isProcessingAi ? 'KI analysiert...' : 'KI-Kategorisierung'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live Table Header & Summary */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--nothing-muted)] font-semibold">
                Live-Vorschau ({previewRows.length} Buchungen):
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                {duplicateCount > 0 && (
                  <span className="text-[#D71921]">
                    {duplicateCount} {duplicateCount === 1 ? 'Duplikat' : 'Duplikate'} erkannt
                  </span>
                )}
                <span className="text-[var(--nothing-sage)] font-semibold">
                  {nonDuplicateCount} bereit zum Import
                </span>
              </div>
            </div>

            {/* Live Parsed Data Table */}
            <div className="flex-1 overflow-y-auto border border-[var(--nothing-border)] rounded-2xl bg-[var(--nothing-subsurface)]/30">
              {previewRows.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-[var(--nothing-muted)]">
                  Keine Buchungen mit den aktuellen Spalteneinstellungen gefunden. Bitte prüfen Sie das Trennzeichen oder die Datums-Spalte.
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] uppercase font-mono text-[10px] border-b border-[var(--nothing-border)] z-10">
                    <tr>
                      <th className="py-2.5 px-3">Datum</th>
                      <th className="py-2.5 px-3">Empfänger</th>
                      <th className="py-2.5 px-3 text-right">Betrag</th>
                      <th className="py-2.5 px-3">Notiz / Zweck</th>
                      <th className="py-2.5 px-3">Kategorie & Regel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => {
                      const isAmountZero = row.amountCents === 0;
                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-[var(--nothing-border)] transition-colors hover:bg-[var(--nothing-subsurface)]/60 ${
                            row.isDuplicate ? 'opacity-50 bg-[var(--nothing-subsurface)]/40' : ''
                          }`}
                        >
                          {/* Date */}
                          <td className="py-2 px-3 font-mono whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] ${
                                row.date && row.date.length === 10
                                  ? 'text-[var(--nothing-text)]'
                                  : 'bg-[#D71921]/15 text-[#D71921]'
                              }`}
                            >
                              {row.date || 'Ungültig'}
                            </span>
                          </td>

                          {/* Payee */}
                          <td className="py-2 px-3 font-medium text-[var(--nothing-text)] max-w-[200px] truncate" title={row.payee}>
                            {row.payee || <span className="text-[var(--nothing-muted)] italic">Unbekannt</span>}
                          </td>

                          {/* Amount */}
                          <td
                            className={`py-2 px-3 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                              isAmountZero
                                ? 'text-amber-500'
                                : row.amountCents < 0
                                ? 'text-[#D71921]'
                                : 'text-[var(--nothing-sage)]'
                            }`}
                          >
                            {formatCurrency(row.amountCents)}
                            {isAmountZero && (
                              <span className="block text-[8px] font-normal text-amber-500 uppercase tracking-tight">
                                0 € prüfen
                              </span>
                            )}
                          </td>

                          {/* Memo */}
                          <td className="py-2 px-3 text-[var(--nothing-muted)] font-mono text-[10px] max-w-[140px] truncate" title={row.memo}>
                            {row.memo || '—'}
                          </td>

                          {/* Category with Quick-Search Combobox and Rule Definition */}
                          <td className="py-2 px-3">
                            {row.isDuplicate ? (
                              <span className="font-mono text-[9px] bg-[#D71921]/15 border border-[#D71921]/30 text-[#D71921] px-2 py-0.5 rounded-full uppercase">
                                Bereits gebucht
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <CategoryCombobox
                                  categories={categories}
                                  groups={groups}
                                  value={row.suggestedCategoryId}
                                  onChange={(newCatId) => {
                                    const newRows = [...previewRows];
                                    newRows[idx].suggestedCategoryId = newCatId;
                                    newRows[idx].matchType = 'manual';
                                    newRows[idx].isUserModified = true;
                                    setPreviewRows(newRows);
                                  }}
                                />

                                {/* Icon to define / customize rule */}
                                <button
                                  type="button"
                                  onClick={() => setEditingRuleRow(row)}
                                  className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                                    row.isUserModified
                                      ? 'border-[#D71921] bg-[#D71921]/15 text-[#D71921] hover:bg-[#D71921]/25 ring-1 ring-[#D71921]/40'
                                      : 'border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] hover:text-[#D71921] hover:border-[#D71921]/50'
                                  }`}
                                  title="Diesen Text als automatische Regel für die Vorlage definieren / verfeinern"
                                >
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                </button>

                                {/* Badges */}
                                {row.matchType === 'ollama' && (
                                  <span
                                    className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] flex items-center gap-1 shrink-0"
                                    title={row.ruleInfo}
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-[#D71921]" /> KI
                                  </span>
                                )}
                                {row.matchType === 'rule' && (
                                  <span
                                    className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] shrink-0"
                                    title={row.ruleInfo}
                                  >
                                    Regel
                                  </span>
                                )}
                                {row.isUserModified && (
                                  <span
                                    className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-full border border-[#D71921]/30 bg-[#D71921]/10 text-[#D71921] font-semibold shrink-0 cursor-pointer"
                                    onClick={() => setEditingRuleRow(row)}
                                    title="Klicken, um diese Zuordnung dauerhaft als Vorlagen-Regel zu speichern"
                                  >
                                    Manuell
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--nothing-border)] mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[var(--nothing-muted)] uppercase tracking-wider">
              {rawContent
                ? `${nonDuplicateCount} neue Buchungen zum Import ausgewählt`
                : 'Bereit zum Einlesen'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>

            {rawContent && (
              <button
                type="button"
                disabled={nonDuplicateCount === 0}
                onClick={handleCommitImport}
                className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                  nonDuplicateCount > 0
                    ? 'bg-[#D71921] text-white hover:opacity-90 shadow-sm'
                    : 'bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] border border-[var(--nothing-border)] cursor-not-allowed opacity-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {nonDuplicateCount} {nonDuplicateCount === 1 ? 'Buchung' : 'Buchungen'} übernehmen
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Rule Definition Modal Overlay */}
        {editingRuleRow && activeProfile && (
          <RuleDefinitionModal
            isOpen={true}
            row={editingRuleRow}
            activeProfile={activeProfile}
            categories={categories}
            groups={groups}
            previewRows={previewRows}
            onClose={() => setEditingRuleRow(null)}
            onSaveRule={handleSaveRuleFromModal}
          />
        )}

        {/* Mini Save Profile Dialog Overlay */}
        {showSaveProfileModal && activeProfile && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
              <h4 className="font-bold text-sm text-[var(--nothing-text)] font-mono uppercase tracking-wider">
                Vorlage speichern
              </h4>
              <p className="text-xs text-[var(--nothing-muted)]">
                Speichere diese Spalten-Zuordnung als wiederverwendbare Vorlage für zukünftige Kontoauszüge dieses Kontos:
              </p>
              <input
                type="text"
                value={saveProfileName}
                onChange={(e) => setSaveProfileName(e.target.value)}
                placeholder="z.B. Sparkasse Girokonto Vorlage"
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] focus:outline-none focus:border-[#D71921]"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveProfileModal(false)}
                  className="px-3 py-1 rounded-full border border-[var(--nothing-border)] text-xs font-mono text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsProfile}
                  className="px-4 py-1 rounded-full bg-[#D71921] text-white text-xs font-mono font-semibold hover:opacity-90 cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
