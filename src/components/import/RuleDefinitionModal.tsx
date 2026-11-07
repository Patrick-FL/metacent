import React, { useState, useMemo } from 'react';
import { Category, CategoryGroup, ImportProfile } from '../../types';
import { CategoryCombobox } from '../common/CategoryCombobox';
import { formatCurrency } from '../../services/currency';
import { X, BookmarkPlus, Check, Sliders, Info, Sparkles } from 'lucide-react';

export interface RuleDefinitionModalProps {
  isOpen: boolean;
  row: {
    id: string;
    date: string;
    payee: string;
    amountCents: number;
    memo: string;
    suggestedCategoryId: string;
    raw?: Record<string, string>;
  };
  activeProfile: ImportProfile;
  categories: Category[];
  groups: CategoryGroup[];
  previewRows: Array<{
    id: string;
    date: string;
    payee: string;
    amountCents: number;
    memo: string;
    suggestedCategoryId: string;
    raw?: Record<string, string>;
  }>;
  onClose: () => void;
  onSaveRule: (rule: { sourceField: string; pattern: string; targetCategoryId: string }) => void;
}

export const RuleDefinitionModal: React.FC<RuleDefinitionModalProps> = ({
  isOpen,
  row,
  activeProfile,
  categories,
  groups,
  previewRows,
  onClose,
  onSaveRule,
}) => {
  // Available source fields from fieldMappings or raw headers
  const availableSourceFields = useMemo(() => {
    const list: Array<{ key: string; label: string }> = [];

    const payeeField = activeProfile.fieldMappings.payee || 'Bezeichnung';
    list.push({ key: payeeField, label: `Empfänger / Text (${payeeField})` });

    if (activeProfile.fieldMappings.memo) {
      list.push({ key: activeProfile.fieldMappings.memo, label: `Verwendungszweck (${activeProfile.fieldMappings.memo})` });
    }

    if (activeProfile.fieldMappings.type) {
      list.push({ key: activeProfile.fieldMappings.type, label: `Buchungstyp (${activeProfile.fieldMappings.type})` });
    }

    // Add any remaining raw fields
    if (row.raw) {
      Object.keys(row.raw).forEach((k) => {
        if (!list.some((item) => item.key === k)) {
          list.push({ key: k, label: k });
        }
      });
    }

    return list;
  }, [activeProfile, row.raw]);

  const [selectedSourceField, setSelectedSourceField] = useState<string>(
    activeProfile.fieldMappings.payee || availableSourceFields[0]?.key || 'Bezeichnung'
  );

  // Initial pattern text
  const initialValue = useMemo(() => {
    if (row.raw && row.raw[selectedSourceField]) {
      return row.raw[selectedSourceField];
    }
    return row.payee || '';
  }, [row, selectedSourceField]);

  const [pattern, setPattern] = useState<string>(initialValue);
  const [targetCategoryId, setTargetCategoryId] = useState<string>(row.suggestedCategoryId || categories[0]?.id || '');

  // Calculate live matching rows
  const matchingRows = useMemo(() => {
    if (!pattern.trim()) return [];
    const q = pattern.trim().toLowerCase();

    return previewRows.filter((r) => {
      let val = '';
      if (r.raw && r.raw[selectedSourceField]) {
        val = r.raw[selectedSourceField];
      } else if (selectedSourceField === activeProfile.fieldMappings.payee) {
        val = r.payee;
      } else if (selectedSourceField === activeProfile.fieldMappings.memo) {
        val = r.memo;
      } else {
        val = r.payee;
      }
      return val.toLowerCase().includes(q);
    });
  }, [previewRows, selectedSourceField, pattern, activeProfile]);

  if (!isOpen) return null;

  const handleCleanNumbers = () => {
    // Remove numbers and typical noise like "Filiale 123", "GmbH", dates etc.
    const cleaned = pattern
      .replace(/\b\d+\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned) setPattern(cleaned);
  };

  const handleSave = () => {
    if (!pattern.trim()) {
      alert('Bitte geben Sie einen Suchtext ein.');
      return;
    }

    onSaveRule({
      sourceField: selectedSourceField,
      pattern: pattern.trim(),
      targetCategoryId,
    });
  };

  const targetCategory = categories.find((c) => c.id === targetCategoryId);

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-lg w-full p-6 text-[var(--nothing-text)] shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center">
              <BookmarkPlus className="w-4 h-4 text-[#D71921]" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">
                TEMPLATE // AUTOMATION RULE
              </p>
              <h3 className="font-bold text-sm text-[var(--nothing-text)]">
                Kategorie-Regel für Vorlage erstellen
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[var(--nothing-muted)]">
          <Info className="w-4 h-4 text-[#D71921] shrink-0 mt-0.5" />
          <div>
            Diese Regel wird in der Vorlage <strong className="text-[var(--nothing-text)]">"{activeProfile.profileName}"</strong> gespeichert und ordnet zukünftige Kontoauszüge dieser Bank vollautomatisch zu.
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-3.5 text-xs">
          {/* Source Field Select */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              Spalte / Quellfeld prüfen:
            </label>
            <select
              value={selectedSourceField}
              onChange={(e) => {
                const newField = e.target.value;
                setSelectedSourceField(newField);
                if (row.raw && row.raw[newField]) {
                  setPattern(row.raw[newField]);
                }
              }}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[#D71921]"
            >
              {availableSourceFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern Input (Contains) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">
                Enthält Text (Teilbegriff / contains):
              </label>
              <button
                type="button"
                onClick={handleCleanNumbers}
                className="font-mono text-[9px] uppercase tracking-wider text-[#D71921] hover:underline cursor-pointer flex items-center gap-1"
                title="Zahlen und Filialcodes aus dem Text entfernen"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Text kürzen / säubern</span>
              </button>
            </div>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="z.B. REWE oder Spotify"
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[#D71921]"
            />
            <p className="font-mono text-[9px] text-[var(--nothing-muted)] mt-1">
              Tipp: Filialnummern oder Endungen entfernen (z. B. aus "REWE Filiale 412" nur "REWE" machen).
            </p>
          </div>

          {/* Target Category */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
              Dann zuweisen zu Kategorie:
            </label>
            <div className="flex items-center gap-2">
              <CategoryCombobox
                categories={categories}
                groups={groups}
                value={targetCategoryId}
                onChange={(catId) => setTargetCategoryId(catId)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Live Matching Preview Section */}
        <div className="border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)]/50 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[var(--nothing-text)] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#D71921]" />
              <span>Sofort-Auswirkung im aktuellen Import:</span>
            </span>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                matchingRows.length > 0
                  ? 'bg-[var(--nothing-sage)]/15 text-[var(--nothing-sage)]'
                  : 'bg-[#D71921]/15 text-[#D71921]'
              }`}
            >
              {matchingRows.length} {matchingRows.length === 1 ? 'Treffer' : 'Treffer'}
            </span>
          </div>

          {matchingRows.length > 0 ? (
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {matchingRows.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-[11px] bg-[var(--nothing-surface)] border border-[var(--nothing-border)] px-2.5 py-1 rounded-lg font-mono"
                >
                  <span className="truncate max-w-[240px] text-[var(--nothing-text)]">
                    {m.payee}
                  </span>
                  <span
                    className={`font-semibold tabular-nums shrink-0 ${
                      m.amountCents < 0 ? 'text-[#D71921]' : 'text-[var(--nothing-sage)]'
                    }`}
                  >
                    {formatCurrency(m.amountCents)}
                  </span>
                </div>
              ))}
              {matchingRows.length > 4 && (
                <p className="text-[10px] font-mono text-[var(--nothing-muted)] text-center pt-0.5">
                  + {matchingRows.length - 4} weitere Buchungen werden automatisch zu "{targetCategory?.name}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] font-mono text-[var(--nothing-muted)] italic">
              Keine Buchung in der aktuellen Datei enthält "{pattern}".
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--nothing-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={!pattern.trim()}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D71921] text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Regel speichern ({matchingRows.length} aktualisieren)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

