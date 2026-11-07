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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-xl w-full p-6 text-[#f1f5f2] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#adebb3]" />
            <h3 className="font-semibold text-base text-[#f1f5f2]">
              Import-Vorlage konfigurieren ({account.nickname})
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Profile Name & Delimiter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8c9e91] mb-1">
                Vorlagenname
              </label>
              <input
                type="text"
                value={activeProfile.profileName}
                onChange={(e) => setActiveProfile({ ...activeProfile, profileName: e.target.value })}
                className="w-full bg-[#0d110e] border border-[#232e26] rounded px-3 py-1.5 text-xs text-[#f1f5f2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8c9e91] mb-1">
                Trennzeichen (Delimiter)
              </label>
              <select
                value={activeProfile.delimiter}
                onChange={(e) => setActiveProfile({ ...activeProfile, delimiter: e.target.value })}
                className="w-full bg-[#0d110e] border border-[#232e26] rounded px-3 py-1.5 text-xs text-[#f1f5f2]"
              >
                <option value=";">Semikolon (;) — z.B. Trade Republic, DKB</option>
                <option value=",">Komma (,) — Standard CSV</option>
                <option value={"\t"}>Tabulator (\t)</option>
              </select>
            </div>
          </div>

          {/* Formats */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#8c9e91] mb-1">
                Datumsformat
              </label>
              <input
                type="text"
                value={activeProfile.dateFormat}
                onChange={(e) => setActiveProfile({ ...activeProfile, dateFormat: e.target.value })}
                className="w-full bg-[#0d110e] border border-[#232e26] rounded px-2.5 py-1 text-xs text-[#f1f5f2] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8c9e91] mb-1">
                Dezimaltrennzeichen
              </label>
              <input
                type="text"
                value={activeProfile.decimalSeparator}
                onChange={(e) => setActiveProfile({ ...activeProfile, decimalSeparator: e.target.value })}
                className="w-full bg-[#0d110e] border border-[#232e26] rounded px-2.5 py-1 text-xs text-[#f1f5f2] font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8c9e91] mb-1">
                Tausendertrennzeichen
              </label>
              <input
                type="text"
                value={activeProfile.thousandsSeparator}
                onChange={(e) => setActiveProfile({ ...activeProfile, thousandsSeparator: e.target.value })}
                className="w-full bg-[#0d110e] border border-[#232e26] rounded px-2.5 py-1 text-xs text-[#f1f5f2] font-mono text-center"
              />
            </div>
          </div>

          {/* Column Mappings */}
          <div className="bg-[#0d110e] border border-[#232e26] p-3 rounded-lg space-y-2">
            <span className="block text-xs font-semibold text-[#8c9e91] uppercase tracking-wider">
              Spalten-Zuordnung (CSV-Spaltenkopf)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#8c9e91] text-[11px]">Datum:</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.date}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, date: e.target.value },
                    })
                  }
                  className="w-full bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2]"
                />
              </div>
              <div>
                <span className="text-[#8c9e91] text-[11px]">Empfänger / Buchungstext:</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.payee}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, payee: e.target.value },
                    })
                  }
                  className="w-full bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2]"
                />
              </div>
              <div>
                <span className="text-[#8c9e91] text-[11px]">Betrag:</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.amount || ''}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, amount: e.target.value },
                    })
                  }
                  className="w-full bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2]"
                />
              </div>
              <div>
                <span className="text-[#8c9e91] text-[11px]">Typ / Transaktionsart (optional):</span>
                <input
                  type="text"
                  value={activeProfile.fieldMappings.type || ''}
                  onChange={(e) =>
                    setActiveProfile({
                      ...activeProfile,
                      fieldMappings: { ...activeProfile.fieldMappings, type: e.target.value },
                    })
                  }
                  className="w-full bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2]"
                />
              </div>
            </div>
          </div>

          {/* Category Matching Rules */}
          <div className="bg-[#0d110e] border border-[#232e26] p-3 rounded-lg space-y-3">
            <span className="block text-xs font-semibold text-[#8c9e91] uppercase tracking-wider">
              Automatische Kategorie-Regeln für dieses Konto
            </span>

            <div className="space-y-1.5">
              {activeProfile.categoryMatchRules.map((rule, idx) => {
                const cat = categories.find((c) => c.id === rule.targetCategoryId);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-[#141a16] border border-[#232e26] px-3 py-1.5 rounded"
                  >
                    <span>
                      Wenn <span className="text-[#adebb3]">{rule.sourceField}</span> enthält "
                      <span className="text-[#f1f5f2] font-semibold">{rule.pattern}</span>" →{' '}
                      <span className="text-[#adebb3] font-medium">{cat?.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-[#e8706d] hover:text-[#e8706d]/80 p-0.5"
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
                className="w-24 bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2]"
              />
              <input
                type="text"
                placeholder="Enthält Text..."
                value={newRulePattern}
                onChange={(e) => setNewRulePattern(e.target.value)}
                className="flex-1 bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2]"
              />
              <select
                value={newRuleCategory}
                onChange={(e) => setNewRuleCategory(e.target.value)}
                className="bg-[#141a16] border border-[#232e26] rounded px-2 py-1 text-xs text-[#f1f5f2]"
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
                className="px-2.5 py-1 bg-[#232e26] hover:bg-[#adebb3] hover:text-[#0d110e] text-[#f1f5f2] rounded text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#232e26] mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-[#8c9e91] hover:text-[#f1f5f2]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#adebb3] text-[#0d110e] font-semibold text-xs rounded hover:bg-[#adebb3]/90 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Vorlage speichern</span>
          </button>
        </div>
      </div>
    </div>
  );
};

