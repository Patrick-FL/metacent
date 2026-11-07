import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { X, Plus } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  groupId,
  groupName,
  onClose,
  onSuccess,
}) => {
  const [categoryName, setCategoryName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    storage.addCategory(groupId, categoryName.trim());
    setCategoryName('');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-sm w-full p-6 text-[var(--nothing-text)]">
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">CATEGORY // NEW</p>
            <h3 className="font-bold text-base text-[var(--nothing-text)] truncate max-w-[240px]">
              Kategorie zu "{groupName}"
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full aspect-square border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1.5">
              Kategoriename (Ohne Emojis)
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="z.B. Fitnessstudio, Bücher"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] focus:border-[var(--nothing-text)] rounded-xl px-3 py-2 text-xs text-[var(--nothing-text)] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--nothing-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D71921] text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hinzufügen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
