import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-2xl w-full p-6 text-[#f1f5f2] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#adebb3]" />
            <h3 className="font-semibold text-base text-[#f1f5f2]">
              Tastatur-Kurzbefehle (Keyboard Shortcuts)
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8c9e91] hover:text-[#f1f5f2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Universal */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#adebb3] uppercase tracking-wider text-[11px]">
              Universell
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Hilfe öffnen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#adebb3]">?</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Rückgängig (Undo)</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">Ctrl + Z</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Wiederholen (Redo)</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">Ctrl + Shift + Z</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Auswahl aufheben / Schließen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">Escape</kbd>
              </div>
            </div>

            <h4 className="font-semibold text-[#adebb3] uppercase tracking-wider text-[11px] pt-3">
              Planung
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Gruppe ein-/ausklappen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">Ctrl + ↑ / ↓</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Zwischen Zeilen springen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">↑ / ↓</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Mehrere Kategorien markieren</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">Shift + ↑ / ↓</kbd>
              </div>
            </div>
          </div>

          {/* Account / Register */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#adebb3] uppercase tracking-wider text-[11px]">
              Kontobuch & Buchungen
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Neue Buchung anlegen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#adebb3]">Shift + N</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Konto abstimmen (Reconcile)</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#adebb3]">Shift + E</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Bestätigt umschalten (Cleared)</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">C</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Ausgewählte Buchung löschen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#e8706d]">Delete</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Buchung duplizieren</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">Shift + D</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Split-Buchung aufteilen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">S</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Suche fokussieren</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">Ctrl + Shift + F</kbd>
              </div>
            </div>

            <h4 className="font-semibold text-[#adebb3] uppercase tracking-wider text-[11px] pt-3">
              Datumsschnellauswahl
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Ein Tag vor / zurück</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">+ / -</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#232e26]/50">
                <span className="text-[#8c9e91]">Heute auswählen</span>
                <kbd className="px-2 py-0.5 bg-[#0d110e] border border-[#232e26] rounded font-mono text-[11px] text-[#f1f5f2]">T</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#232e26] mt-4 flex justify-between items-center text-xs text-[#8c9e91]">
          <span>Tipp: Drücke jederzeit <kbd className="text-[#adebb3]">?</kbd> zum Öffnen</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#adebb3] text-[#0d110e] rounded text-xs font-semibold"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
