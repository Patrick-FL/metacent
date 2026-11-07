import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { formatCurrency } from '../../services/currency';
import { X, Copy, Check, ArrowRight } from 'lucide-react';

interface CopyPreviousMonthModalProps {
  isOpen: boolean;
  currentMonth: string; // YYYY-MM
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export const CopyPreviousMonthModal: React.FC<CopyPreviousMonthModalProps> = ({
  isOpen,
  currentMonth,
  onClose,
  onSuccess,
}) => {
  const [overwriteExisting, setOverwriteExisting] = useState(true);

  if (!isOpen) return null;

  // Calculate previous month
  const [yearStr, monthStr] = currentMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  const previousMonth = `${year}-${month.toString().padStart(2, '0')}`;

  const formatMonthTitle = (monthKey: string) => {
    const [y, m] = monthKey.split('-');
    const monthNames = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
    return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
  };

  const categories = storage.getCategories();
  const categoriesToCopy = categories
    .map((c) => {
      const prevRollup = storage.getMonthlyRollup(previousMonth, c.id);
      const currRollup = storage.getMonthlyRollup(currentMonth, c.id);
      return {
        category: c,
        prevAssignedCents: prevRollup.assignedCents,
        currAssignedCents: currRollup.assignedCents,
      };
    })
    .filter((item) => item.prevAssignedCents > 0);

  const totalPreviousCents = categoriesToCopy.reduce((sum, item) => sum + item.prevAssignedCents, 0);
  const currentMonthHasAssignments = categories.some(
    (c) => storage.getMonthlyRollup(currentMonth, c.id).assignedCents > 0
  );

  const handleConfirm = () => {
    const result = storage.copyAssignedFromMonth(previousMonth, currentMonth, {
      overwriteExisting,
    });
    onSuccess(
      `${result.count} Zuweisungen aus ${formatMonthTitle(previousMonth)} übernommen (${formatCurrency(result.totalCents)})`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl max-w-md w-full p-6 text-[var(--nothing-text)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--nothing-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-[#D71921]" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--nothing-muted)]">ROLLOVER // ASSIGNMENT</p>
              <h3 className="font-bold text-base text-[var(--nothing-text)]">
                Vormonat übernehmen
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

        {/* Content */}
        {categoriesToCopy.length === 0 ? (
          <div className="py-6 text-center space-y-3 font-mono">
            <p className="text-xs text-[var(--nothing-muted)]">
              Im Vormonat ({formatMonthTitle(previousMonth)}) wurden keine Zuweisungen getätigt.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Schließen
            </button>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Month Transfer Flow Banner */}
            <div className="flex items-center justify-between bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-3 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[9px] text-[var(--nothing-muted)] uppercase tracking-wider block">Quelle</span>
                <span className="font-bold text-[var(--nothing-text)]">{formatMonthTitle(previousMonth)}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#D71921]" />
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-[var(--nothing-muted)] uppercase tracking-wider block">Ziel</span>
                <span className="font-bold text-[var(--nothing-text)]">{formatMonthTitle(currentMonth)}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-3">
                <div className="text-[9px] text-[var(--nothing-muted)] uppercase">Kategorien</div>
                <div className="text-base font-bold text-[var(--nothing-text)] mt-0.5 tabular-nums">
                  {categoriesToCopy.length}
                </div>
              </div>
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-3">
                <div className="text-[9px] text-[var(--nothing-muted)] uppercase">Gesamtsumme</div>
                <div className="text-base font-bold text-[var(--nothing-text)] mt-0.5 tabular-nums">
                  {formatCurrency(totalPreviousCents)}
                </div>
              </div>
            </div>

            {/* Overwrite Option if target month already has data */}
            {currentMonthHasAssignments && (
              <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-3 space-y-2">
                <span className="text-xs font-semibold text-[var(--nothing-text)] block font-mono">
                  Bestehende Zuweisungen in {formatMonthTitle(currentMonth)}
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]">
                  <input
                    type="radio"
                    name="overwrite"
                    checked={overwriteExisting}
                    onChange={() => setOverwriteExisting(true)}
                    className="accent-[#D71921]"
                  />
                  <span>Alle Kategorien mit Werten aus Vormonat überschreiben</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]">
                  <input
                    type="radio"
                    name="overwrite"
                    checked={!overwriteExisting}
                    onChange={() => setOverwriteExisting(false)}
                    className="accent-[#D71921]"
                  />
                  <span>Nur unbesetzte Kategorien befüllen</span>
                </label>
              </div>
            )}

            {/* Preview List */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--nothing-muted)] block">
                Vorschau ({categoriesToCopy.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-[var(--nothing-border)] rounded-2xl p-2.5 bg-[var(--nothing-subsurface)]">
                {categoriesToCopy.map(({ category, prevAssignedCents, currAssignedCents }) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[var(--nothing-surface)] transition-colors"
                  >
                    <span className="truncate text-[var(--nothing-text)] font-medium">{category.name}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                      {currAssignedCents > 0 && overwriteExisting && (
                        <span className="text-[var(--nothing-muted)] line-through">
                          {formatCurrency(currAssignedCents)}
                        </span>
                      )}
                      <span className="font-bold text-[var(--nothing-text)]">
                        {formatCurrency(prevAssignedCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--nothing-border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D71921] text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Übernehmen</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
