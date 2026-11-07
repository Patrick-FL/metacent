import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { X, Plus } from 'lucide-react';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [groupName, setGroupName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    storage.addCategoryGroup(groupName.trim());
    setGroupName('');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-sm w-full p-5 text-[#f1f5f2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <h3 className="font-semibold text-sm text-[#f1f5f2]">
            Neue Kategoriegruppe erstellen
          </h3>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8c9e91] mb-1.5">
              Gruppenbezeichnung
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="z.B. Abonnements & Verträge"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#0d110e] border border-[#232e26] focus:border-[#adebb3] rounded-md px-3 py-2 text-sm text-[#f1f5f2] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232e26]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8c9e91] hover:text-[#f1f5f2]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#adebb3] text-[#0d110e] font-semibold text-xs rounded hover:bg-[#adebb3]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gruppe anlegen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

