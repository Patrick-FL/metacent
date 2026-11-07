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
        // Run AI categorization via Ollama
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
      if (row.isDuplicate) continue; // Skip duplicates (Scenario 5)

      // Learning loop: if user modified category, learn rule for future imports (Scenario 4)
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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-2xl w-full p-6 text-[#f1f5f2] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#adebb3]" />
            <h3 className="font-semibold text-base text-[#f1f5f2]">
              Kontoauszug importieren ({account.nickname})
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Selector */}
        <div className="mb-4 bg-[#0d110e] border border-[#232e26] p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-semibold text-[#8c9e91] uppercase tracking-wider">
              Aktive Import-Vorlage
            </span>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#adebb3] focus:outline-none cursor-pointer mt-0.5"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#141a16] text-[#f1f5f2]">
                  {p.profileName}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right text-[11px] text-[#8c9e91]">
            <span>Trennzeichen: Semikolon (;) • Format: DD.MM.YYYY</span>
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
              className="border-2 border-dashed border-[#232e26] hover:border-[#adebb3]/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0d110e]/40"
            >
              <Upload className="w-8 h-8 text-[#adebb3] mb-3" />
              <p className="text-sm font-medium text-[#f1f5f2]">
                Echte CSV- oder OFX-Datei hier ablegen oder klicken
              </p>
              <p className="text-xs text-[#8c9e91] mt-1">
                Wird client-seitig verarbeitet — keine Daten verlassen deinen Rechner
              </p>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSimulateSample}
                className="text-xs text-[#adebb3] hover:underline inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Oder Trade Republic Test-Kontoauszug laden</span>
              </button>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#adebb3] py-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Ollama SLM kategorisiert Buchungen lokal...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto my-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8c9e91]">
                {previewRows.length} Buchungen erkannt — Vorschau & KI-Zuordnung:
              </span>
              <button
                onClick={() => setPreviewRows([])}
                className="text-xs text-[#8c9e91] hover:text-[#f1f5f2]"
              >
                Andere Datei wählen
              </button>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#0d110e] text-[#8c9e91] uppercase text-[10px] border-b border-[#232e26]">
                <tr>
                  <th className="py-2 px-3">Datum</th>
                  <th className="py-2 px-3">Empfänger</th>
                  <th className="py-2 px-3 text-right">Betrag</th>
                  <th className="py-2 px-3">Kategorie-Vorschlag</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[#232e26]/50 ${
                      row.isDuplicate ? 'opacity-50 bg-[#1b241e]/20' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-[#8c9e91]">{row.date}</td>
                    <td className="py-2 px-3 font-medium text-[#f1f5f2]">{row.payee}</td>
                    <td
                      className={`py-2 px-3 text-right font-mono tabular-nums ${
                        row.amountCents < 0 ? 'text-[#e8706d]' : 'text-[#adebb3]'
                      }`}
                    >
                      {formatCurrency(row.amountCents)}
                    </td>
                    <td className="py-2 px-3">
                      {row.isDuplicate ? (
                        <span className="text-[10px] bg-[#e8706d]/15 border border-[#e8706d]/30 text-[#e8706d] px-2 py-0.5 rounded font-mono">
                          Duplikat - Übersprungen
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={row.suggestedCategoryId}
                            onChange={(e) => {
                              const newRows = [...previewRows];
                              newRows[idx].suggestedCategoryId = e.target.value;
                              newRows[idx].matchType = 'manual';
                              newRows[idx].isUserModified = true;
                              setPreviewRows(newRows);
                            }}
                            className="bg-[#0d110e] border border-[#232e26] rounded px-2 py-0.5 text-xs text-[#f1f5f2]"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          {row.matchType === 'ollama' && (
                            <span
                              className="text-[10px] bg-[#adebb3]/15 text-[#adebb3] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                              title={row.ruleInfo}
                            >
                              <Sparkles className="w-2.5 h-2.5" /> KI
                            </span>
                          )}
                          {row.matchType === 'rule' && (
                            <span
                              className="text-[10px] bg-[#232e26] text-[#8c9e91] px-1.5 py-0.5 rounded font-medium"
                              title={row.ruleInfo}
                            >
                              Regel
                            </span>
                          )}
                          {row.isUserModified && (
                            <span
                              className="text-[10px] bg-[#adebb3]/20 text-[#adebb3] px-1 py-0.5 rounded font-mono"
                              title="Wird für zukünftige Importe gelernt"
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
        <div className="flex items-center justify-between pt-4 border-t border-[#232e26] mt-auto">
          <span className="text-xs text-[#8c9e91]">
            100% lokal verarbeitet • Keine Bankverbindungen erforderlich
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8c9e91] hover:text-[#f1f5f2]"
            >
              Abbrechen
            </button>
            <button
              disabled={previewRows.filter((r) => !r.isDuplicate).length === 0}
              onClick={handleCommitImport}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                previewRows.filter((r) => !r.isDuplicate).length > 0
                  ? 'bg-[#adebb3] text-[#0d110e] hover:bg-[#adebb3]/90'
                  : 'bg-[#232e26] text-[#4c5950] cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {previewRows.filter((r) => !r.isDuplicate).length} Buchungen übernehmen
                {previewRows.filter((r) => r.isDuplicate).length > 0 &&
                  ` (${previewRows.filter((r) => r.isDuplicate).length} übersprungen)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
