import React, { useState, useRef } from 'react';
import { Account } from '../../types';
import { storage } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import { parseCsvFile } from '../../services/csvParser';
import { categorizeWithOllama } from '../../services/ollama';
import { X, Upload, Sparkles, Check, FileSpreadsheet } from 'lucide-react';

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
  matchType: 'rule' | 'ollama' | 'manual';
  ruleInfo?: string;
  fitid?: string;
  isDuplicate: boolean;
  isUserModified?: boolean;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  account,
  onClose,
  onSuccess,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('prof-trade-republic');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewRows, setPreviewRows] = useState<ParsedRowPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profiles = storage.getImportProfiles(account.id);
  const categories = storage.getCategories();

  if (!isOpen) return null;

  const activeProfile =
    profiles.find((p) => p.id === selectedProfileId) ||
    profiles[0] || {
      id: 'default',
      accountId: account.id,
      profileName: 'Standard CSV',
      delimiter: ';',
      dateFormat: 'DD.MM.YYYY',
      decimalSeparator: ',',
      thousandsSeparator: '.',
      headerRowIndex: 0,
      fieldMappings: {
        date: 'Datum',
        payee: 'Bezeichnung',
        amount: 'Betrag',
        type: 'Typ',
      },
      categoryMatchRules: [
        { sourceField: 'Typ', pattern: 'Zinsen', targetCategoryId: 'cat-notgroschen' },
        { sourceField: 'Bezeichnung', pattern: 'Supermarkt', targetCategoryId: 'cat-lebensmittel' },
      ],
    };

  const handleProcessCsvText = async (text: string) => {
    setIsProcessing(true);

    // Auto-detect profile if Trade Republic header or matching fields found
    let effectiveProfile = activeProfile;
    const firstLine = text.split(/\r?\n/)[0] || '';
    if (firstLine.includes('Bezeichnung') && firstLine.includes('Betrag') && firstLine.includes('Saldo')) {
      const trProfile = profiles.find((p) => p.profileName.toLowerCase().includes('trade republic'));
      if (trProfile) {
        effectiveProfile = trProfile;
        setSelectedProfileId(trProfile.id);
      }
    }

    const parsed = parseCsvFile(text, effectiveProfile);

    const rows: ParsedRowPreview[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      const fitid = item.fitid || `fitid-${item.date}-${item.payee}-${item.amountCents}`;
      const isDuplicate = storage.isDuplicateTransaction(
        account.id,
        fitid,
        item.date,
        item.payee,
        item.amountCents
      );

      let catId = item.suggestedCategoryId;
      let matchType: 'rule' | 'ollama' | 'manual' = item.suggestedCategoryId ? 'rule' : 'manual';
      let ruleInfo = item.matchRuleName;

      if (!catId && !isDuplicate) {
        const aiMatch = await categorizeWithOllama(item.payee, item.memo, item.amountCents, categories);
        if (aiMatch) {
          catId = aiMatch.categoryId;
          matchType = 'ollama';
          ruleInfo = `KI-Modell: ${aiMatch.model}`;
        }
      }

      const finalCat = catId || categories[0]?.id || '';

      rows.push({
        id: `row-${i}-${Date.now()}`,
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
      });
    }

    setPreviewRows(rows);
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) handleProcessCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleSimulateSample = () => {
    const sampleTradeRepublicCsv = `Datum;Typ;Bezeichnung;Betrag;Saldo
24.10.2026;Zinsen;Zinsgutschrift Trade Republic;41,20;1250,50
22.10.2026;Kartenzahlung;Bäckerei Müller München;-7,40;1209,30
20.10.2026;Kartenzahlung;Spotify AB Stockholm;-12,99;1216,70
18.10.2026;Kartenzahlung;Apotheke am Markt;-24,50;1229,69`;

    handleProcessCsvText(sampleTradeRepublicCsv);
  };

  const handleCommitImport = () => {
    for (const row of previewRows) {
      if (row.isDuplicate) continue;

      if (row.isUserModified && row.suggestedCategoryId !== row.originalSuggestedCategoryId) {
        storage.learnCategoryRule(account.id, row.payee, row.suggestedCategoryId);
      }

      storage.addTransaction({
        accountId: account.id,
        date: row.date,
        payee: row.payee,
        categoryId: row.suggestedCategoryId,
        memo: row.memo || `Importiert via ${activeProfile.profileName}`,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-2xl w-full p-6 text-[var(--nothing-text)] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#D71921]" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">STATEMENT // IMPORT</p>
              <h3 className="font-bold text-base text-[var(--nothing-text)]">
                Kontoauszug importieren ({account.nickname})
              </h3>
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

        {/* Profile Selector */}
        <div className="mb-4 bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="block font-mono text-[9px] font-semibold text-[var(--nothing-muted)] uppercase tracking-wider">
              Aktive Import-Vorlage
            </span>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="bg-transparent font-mono text-xs font-bold text-[var(--nothing-text)] focus:outline-none cursor-pointer mt-0.5"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-[var(--nothing-surface)] text-[var(--nothing-text)]">
                  {p.profileName}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right font-mono text-[10px] text-[var(--nothing-muted)]">
            <span>Trennzeichen: (;) • Format: DD.MM.YYYY</span>
          </div>
        </div>

        {/* Upload Zone */}
        {previewRows.length === 0 ? (
          <div className="flex flex-col gap-3 my-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.ofx,.qfx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--nothing-border)] hover:border-[var(--nothing-border-hover)] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[var(--nothing-subsurface)]/50"
            >
              <Upload className="w-8 h-8 text-[#D71921] mb-3" />
              <p className="font-mono text-xs uppercase tracking-wider font-semibold text-[var(--nothing-text)]">
                CSV- oder OFX-Datei hier ablegen oder klicken
              </p>
              <p className="font-mono text-[10px] text-[var(--nothing-muted)] mt-1">
                Client-seitig verarbeitet — 100% offline
              </p>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSimulateSample}
                className="font-mono text-xs uppercase tracking-wider text-[var(--nothing-text)] hover:underline inline-flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D71921]" />
                <span>Trade Republic Test-Auszug laden</span>
              </button>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 font-mono text-xs text-[var(--nothing-text)] py-2">
                <Sparkles className="w-4 h-4 animate-spin text-[#D71921]" />
                <span>Ollama SLM analysiert Buchungen lokal...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto my-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--nothing-muted)] font-semibold">
                {previewRows.length} Buchungen erkannt:
              </span>
              <button
                type="button"
                onClick={() => setPreviewRows([])}
                className="font-mono text-xs text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] cursor-pointer"
              >
                Andere Datei wählen
              </button>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] uppercase font-mono text-[10px] border-b border-[var(--nothing-border)]">
                <tr>
                  <th className="py-2 px-3">Datum</th>
                  <th className="py-2 px-3">Empfänger</th>
                  <th className="py-2 px-3 text-right">Betrag</th>
                  <th className="py-2 px-3">Kategorie</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[var(--nothing-border)] ${
                      row.isDuplicate ? 'opacity-50 bg-[var(--nothing-subsurface)]' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-[var(--nothing-muted)]">{row.date}</td>
                    <td className="py-2 px-3 font-medium text-[var(--nothing-text)]">{row.payee}</td>
                    <td
                      className={`py-2 px-3 text-right font-mono tabular-nums font-semibold ${
                        row.amountCents < 0 ? 'text-[#D71921]' : 'text-[var(--nothing-sage)]'
                      }`}
                    >
                      {formatCurrency(row.amountCents)}
                    </td>
                    <td className="py-2 px-3">
                      {row.isDuplicate ? (
                        <span className="font-mono text-[10px] bg-[#D71921]/15 border border-[#D71921]/30 text-[#D71921] px-2 py-0.5 rounded-full uppercase">
                          Duplikat
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={row.suggestedCategoryId}
                            onChange={(e) => {
                              const newRows = [...previewRows];
                              newRows[idx].suggestedCategoryId = e.target.value;
                              newRows[idx].matchType = 'manual';
                              newRows[idx].isUserModified = true;
                              setPreviewRows(newRows);
                            }}
                            className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-2 py-0.5 text-xs text-[var(--nothing-text)] font-sans"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          {row.matchType === 'ollama' && (
                            <span
                              className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[var(--nothing-text)] flex items-center gap-1"
                              title={row.ruleInfo}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-[#D71921]" /> KI
                            </span>
                          )}
                          {row.matchType === 'rule' && (
                            <span
                              className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)]"
                              title={row.ruleInfo}
                            >
                              Regel
                            </span>
                          )}
                          {row.isUserModified && (
                            <span
                              className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-surface)] text-[var(--nothing-text)] font-semibold"
                            >
                              Gelernt
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--nothing-border)] mt-auto">
          <span className="font-mono text-[10px] text-[var(--nothing-muted)] uppercase tracking-wider">
            100% lokal verarbeitet
          </span>
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
              disabled={previewRows.filter((r) => !r.isDuplicate).length === 0}
              onClick={handleCommitImport}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                previewRows.filter((r) => !r.isDuplicate).length > 0
                  ? 'bg-[#D71921] text-white hover:opacity-90'
                  : 'bg-[var(--nothing-subsurface)] text-[var(--nothing-muted)] border border-[var(--nothing-border)] cursor-not-allowed opacity-50'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {previewRows.filter((r) => !r.isDuplicate).length} Übernehmen
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
