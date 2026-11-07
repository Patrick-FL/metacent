import React, { useState } from 'react';
import { Account, ImportProfile } from '../../types';
import { storage } from '../../services/storage';
import { X, Plus, Trash2, Sliders, Check } from 'lucide-react';

interface ProfileEditorModalProps {
  isOpen: boolean;
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  isOpen,
  account,
  onClose,
  onSuccess,
}) => {
  const existingProfiles = storage.getImportProfiles(account.id);
  const categories = storage.getCategories();

  const [activeProfile, setActiveProfile] = useState<ImportProfile>(
    existingProfiles[0] || {
      id: `prof-${Date.now()}`,
      accountId: account.id,
      profileName: `${account.nickname} Vorlage`,
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
      ],
    }
  );

  const [newRuleField, setNewRuleField] = useState('Bezeichnung');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState(categories[0]?.id || '');

  if (!isOpen) return null;

  const handleAddRule = () => {
    if (!newRulePattern.trim()) return;
    setActiveProfile({
      ...activeProfile,
      categoryMatchRules: [
        ...activeProfile.categoryMatchRules,
        {
          sourceField: newRuleField,
          pattern: newRulePattern.trim(),
          targetCategoryId: newRuleCategory,
        },
      ],
    });
    setNewRulePattern('');
  };

  const handleRemoveRule = (index: number) => {
    const updated = [...activeProfile.categoryMatchRules];
    updated.splice(index, 1);
    setActiveProfile({ ...activeProfile, categoryMatchRules: updated });
  };

  const handleSave = () => {
    storage.saveImportProfile(activeProfile);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-xl w-full p-6 text-[var(--nothing-text)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#D71921]" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">IMPORT // PROFILES</p>
              <h3 className="font-bold text-base text-[var(--nothing-text)]">
                Import-Vorlage konfigurieren ({account.nickname})
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

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Profile Name & Delimiter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                Vorlagenname
              </label>
              <input
                type="text"
                value={activeProfile.profileName}
                onChange={(e) => setActiveProfile({ ...activeProfile, profileName: e.target.value })}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                Trennzeichen (Delimiter)
              </label>
              <select
                value={activeProfile.delimiter}
                onChange={(e) => setActiveProfile({ ...activeProfile, delimiter: e.target.value })}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)] font-mono"
              >
                <option value=";">Semikolon (;) — Trade Republic, DKB</option>
                <option value=",">Komma (,) — Standard CSV</option>
                <option value={"\t"}>Tabulator (\t)</option>
              </select>
            </div>
          </div>

          {/* Formats */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                Datumsformat
              </label>
              <input
                type="text"
                value={activeProfile.dateFormat}
                onChange={(e) => setActiveProfile({ ...activeProfile, dateFormat: e.target.value })}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                Dezimaltrenner
              </label>
              <input
                type="text"
                value={activeProfile.decimalSeparator}
                onChange={(e) => setActiveProfile({ ...activeProfile, decimalSeparator: e.target.value })}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono text-center focus:outline-none focus:border-[var(--nothing-text)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                Tausendertrenner
              </label>
              <input
                type="text"
                value={activeProfile.thousandsSeparator}
                onChange={(e) => setActiveProfile({ ...activeProfile, thousandsSeparator: e.target.value })}
                className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono text-center focus:outline-none focus:border-[var(--nothing-text)]"
              />
            </div>
          </div>

          {/* Column Mappings */}
          <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-4 rounded-2xl space-y-2">
            <span className="block font-mono text-[10px] font-semibold text-[var(--nothing-muted)] uppercase tracking-wider">
              Spalten-Zuordnung (CSV-Kopfzeile)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)]">Datum:</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.date}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, date: e.target.value },
                    })
                  }
                  className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                />
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)]">Empfänger / Text:</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.payee}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, payee: e.target.value },
                    })
                  }
                  className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                />
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)]">Betrag:</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.amount || ''}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, amount: e.target.value },
                    })
                  }
                  className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                />
              </div>
              <div>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)]">Typ (optional):</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.type || ''}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, type: e.target.value },
                    })
                  }
                  className="w-full bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
                />
              </div>
            </div>
          </div>

          {/* Category Matching Rules */}
          <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-4 rounded-2xl space-y-3">
            <span className="block font-mono text-[10px] font-semibold text-[var(--nothing-muted)] uppercase tracking-wider">
              Automatische Kategorie-Regeln
            </span>

            <div className="space-y-1.5">
              {activeProfile.categoryMatchRules.map((rule, idx) => {
                const cat = categories.find((c) => c.id === rule.targetCategoryId);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-[var(--nothing-surface)] border border-[var(--nothing-border)] px-3 py-1.5 rounded-xl font-mono"
                  >
                    <span>
                      Wenn <span className="text-[var(--nothing-text)] font-bold">{rule.sourceField}</span> enthält "
                      <span className="text-[var(--nothing-text)] font-bold">{rule.pattern}</span>" →{' '}
                      <span className="text-[var(--nothing-sage)] font-bold">{cat?.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-[#D71921] hover:opacity-80 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Rule Form */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Feld (z.B. Typ)"
                value={newRuleField}
                onChange={(e) => setNewRuleField(e.target.value)}
                className="w-24 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
              />
              <input
                type="text"
                placeholder="Enthält Text..."
                value={newRulePattern}
                onChange={(e) => setNewRulePattern(e.target.value)}
                className="flex-1 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] font-mono focus:outline-none focus:border-[var(--nothing-text)]"
              />
              <select
                value={newRuleCategory}
                onChange={(e) => setNewRuleCategory(e.target.value)}
                className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-2.5 py-1 text-xs text-[var(--nothing-text)] focus:outline-none focus:border-[var(--nothing-text)]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddRule}
                className="p-1.5 bg-[#D71921] text-white rounded-full aspect-square hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--nothing-border)] mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D71921] text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Vorlage speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
};
