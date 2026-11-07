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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-2xl w-full p-6 text-[var(--nothing-text)] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] flex items-center justify-center text-[var(--nothing-text)]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">SYSTEM // ERGONOMICS</p>
              <h3 className="font-bold text-base text-[var(--nothing-text)]">
                Tastatur-Kurzbefehle
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

        <div className="grid grid-cols-2 gap-6 overflow-y-auto flex-1 pr-1 text-xs">
          {/* Universal */}
          <div className="space-y-3">
            <h4 className="font-mono font-semibold text-[var(--nothing-text)] uppercase tracking-wider text-[11px]">
              Universell
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Hilfe öffnen</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  ?
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Rückgängig (Undo)</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  Ctrl + Z
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Wiederholen (Redo)</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  Ctrl + Shift + Z
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Schließen / Cancel</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  Escape
                </kbd>
              </div>
            </div>

            <h4 className="font-mono font-semibold text-[var(--nothing-text)] uppercase tracking-wider text-[11px] pt-3">
              Planung
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Gruppe ein-/ausklappen</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  Ctrl + ↑ / ↓
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Zwischen Zeilen springen</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  ↑ / ↓
                </kbd>
              </div>
            </div>
          </div>

          {/* Account / Register */}
          <div className="space-y-3">
            <h4 className="font-mono font-semibold text-[var(--nothing-text)] uppercase tracking-wider text-[11px]">
              Kontobuch & Register
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Neue Buchung</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[#D71921] font-bold uppercase tracking-wide">
                  Shift + N
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Konto abstimmen</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  Shift + E
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Bestätigt umschalten</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  C
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Buchung löschen</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[#D71921] uppercase tracking-wide">
                  Delete
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Buchung duplizieren</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  Shift + D
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Aufteilen (Split)</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  S
                </kbd>
              </div>
            </div>

            <h4 className="font-mono font-semibold text-[var(--nothing-text)] uppercase tracking-wider text-[11px] pt-3">
              Datumsschnellauswahl
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Tag +/-</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  + / -
                </kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[var(--nothing-border)]">
                <span className="text-[var(--nothing-muted)]">Heute wählen</span>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] font-mono text-[10px] text-[var(--nothing-text)] uppercase tracking-wide">
                  T
                </kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--nothing-border)] mt-4 flex justify-between items-center text-xs">
          <span className="font-mono text-[10px] text-[var(--nothing-muted)] uppercase tracking-wider">
            Tipp: Drücke jederzeit <kbd className="font-mono font-bold text-[var(--nothing-text)]">?</kbd> zum Öffnen
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#D71921] text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
