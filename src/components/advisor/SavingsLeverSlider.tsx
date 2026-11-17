import React from 'react';
import { formatCurrency } from '../../services/currency';
import { Sliders, Shield, RotateCcw } from 'lucide-react';

interface SavingsLeverSliderProps {
  categoryName: string;
  currentMonthlyAverageCents: number;
  maxLeverCents: number;
  valueCents: number;
  onChange: (valueCents: number) => void;
  isProtected?: boolean;
  onToggleProtected?: () => void;
}

export const SavingsLeverSlider: React.FC<SavingsLeverSliderProps> = ({
  categoryName,
  currentMonthlyAverageCents,
  maxLeverCents,
  valueCents,
  onChange,
  isProtected = false,
  onToggleProtected,
}) => {
  const stepCents = 500; // 5,00 € steps
  const maxPossible = Math.max(stepCents, Math.min(maxLeverCents, currentMonthlyAverageCents));

  return (
    <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-4 space-y-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Sliders className="w-3.5 h-3.5 text-[#D71921] shrink-0" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--nothing-text)] truncate">
            {categoryName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleProtected && (
            <button
              type="button"
              onClick={onToggleProtected}
              title={isProtected ? 'Schutz aufheben' : 'Als geschützte Lebensqualität markieren'}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 border transition-colors cursor-pointer ${
                isProtected
                  ? 'bg-[#ADEBB3]/15 text-[#1e612a] dark:text-[#ADEBB3] border-[#ADEBB3]/30 font-semibold'
                  : 'bg-[var(--nothing-surface)] text-[var(--nothing-muted)] border-[var(--nothing-border)] hover:text-[var(--nothing-text)]'
              }`}
            >
              <Shield className="w-2.5 h-2.5" />
              <span>{isProtected ? 'Geschützt' : 'Schützen'}</span>
            </button>
          )}

          {valueCents > 0 && (
            <button
              type="button"
              onClick={() => onChange(0)}
              title="Zurücksetzen"
              className="text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] p-1 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">
          Monatlicher Schnitt: {formatCurrency(currentMonthlyAverageCents)}
        </span>
        <div className="text-right">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)]">
            Sparhebel:{' '}
          </span>
          <span className="font-mono font-bold text-xs tabular-nums text-[#1e612a] dark:text-[#ADEBB3]">
            {valueCents > 0 ? `-${formatCurrency(valueCents)}/Monat` : '0,00 €'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={maxPossible}
          step={stepCents}
          value={valueCents}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          disabled={isProtected}
          className="w-full accent-[#D71921] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--nothing-muted)]">
          <span>0 €</span>
          <span>Max: -{formatCurrency(maxPossible)}</span>
        </div>
      </div>

      {valueCents > 0 && (
        <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl px-3 py-2 text-[11px] font-mono flex items-center justify-between">
          <span className="text-[var(--nothing-muted)]">Neues Monatsbudget:</span>
          <span className="font-semibold text-[var(--nothing-text)] tabular-nums">
            {formatCurrency(Math.max(0, currentMonthlyAverageCents - valueCents))}
          </span>
        </div>
      )}
    </div>
  );
};
