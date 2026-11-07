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
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
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
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-[#141a16] border border-[#232e26] rounded-xl max-w-md w-full p-5 text-[#f1f5f2] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232e26] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-[#adebb3]" />
            <h3 className="font-semibold text-sm text-[#f1f5f2]">
              Zuweisungen aus Vormonat übernehmen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8c9e91] hover:text-[#f1f5f2] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {categoriesToCopy.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-[#8c9e91]">
              Im Vormonat (<strong className="text-[#f1f5f2]">{formatMonthTitle(previousMonth)}</strong>) wurden bisher keine Zuweisungen getätigt.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#232e26] text-xs text-[#f1f5f2] rounded hover:bg-[#2c3a30] transition-colors"
            >
              Schließen
            </button>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Month Transfer Flow Banner */}
            <div className="flex items-center justify-between bg-[#0d110e] border border-[#232e26] rounded-lg p-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#8c9e91] uppercase tracking-wider block">Quelle</span>
                <span className="font-semibold text-[#f1f5f2]">{formatMonthTitle(previousMonth)}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#adebb3]" />
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-[#8c9e91] uppercase tracking-wider block">Ziel</span>
                <span className="font-semibold text-[#adebb3]">{formatMonthTitle(currentMonth)}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0d110e] border border-[#232e26] rounded-lg p-2.5">
                <div className="text-[10px] text-[#8c9e91] uppercase">Kategorien</div>
                <div className="text-sm font-semibold font-mono text-[#f1f5f2] mt-0.5">
                  {categoriesToCopy.length}
                </div>
              </div>
              <div className="bg-[#0d110e] border border-[#232e26] rounded-lg p-2.5">
                <div className="text-[10px] text-[#8c9e91] uppercase">Gesamtsumme</div>
                <div className="text-sm font-semibold font-mono text-[#adebb3] mt-0.5">
                  {formatCurrency(totalPreviousCents)}
                </div>
              </div>
            </div>

            {/* Overwrite Option if target month already has data */}
            {currentMonthHasAssignments && (
              <div className="bg-[#0d110e] border border-[#232e26] rounded-lg p-3 space-y-2">
                <span className="text-[11px] font-semibold text-[#f1f5f2] block">
                  Bestehende Zuweisungen in {formatMonthTitle(currentMonth)}
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8c9e91] hover:text-[#f1f5f2]">
                  <input
                    type="radio"
                    name="overwrite"
                    checked={overwriteExisting}
                    onChange={() => setOverwriteExisting(true)}
                    className="accent-[#adebb3]"
                  />
                  <span>Alle Kategorien mit Vormonatswerten überschreiben</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8c9e91] hover:text-[#f1f5f2]">
                  <input
                    type="radio"
                    name="overwrite"
                    checked={!overwriteExisting}
                    onChange={() => setOverwriteExisting(false)}
                    className="accent-[#adebb3]"
                  />
                  <span>Nur unbesetzte (0,00 €) Kategorien befüllen</span>
                </label>
              </div>
            )}

            {/* Preview List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9e91] block">
                Vorschau ({categoriesToCopy.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-[#232e26] rounded-lg p-2 bg-[#0d110e]/70">
                {categoriesToCopy.map(({ category, prevAssignedCents, currAssignedCents }) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-[#141a16]"
                  >
                    <span className="truncate text-[#f1f5f2] font-medium">{category.name}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      {currAssignedCents > 0 && overwriteExisting && (
                        <span className="text-[#8c9e91] line-through">
                          {formatCurrency(currAssignedCents)}
                        </span>
                      )}
                      <span className="text-[#adebb3]">
                        {formatCurrency(prevAssignedCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232e26]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#8c9e91] hover:text-[#f1f5f2] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#adebb3] text-[#0d110e] font-semibold text-xs rounded hover:bg-[#adebb3]/90 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Zuweisungen übernehmen</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

