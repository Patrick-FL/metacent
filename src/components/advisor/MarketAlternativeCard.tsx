import React, { useState } from 'react';
import { AiMarketAlternative } from '../../types';
import { formatCurrency } from '../../services/currency';
import { ExternalLink, ShieldCheck, Check, Info } from 'lucide-react';

interface MarketAlternativeCardProps {
  alternative: AiMarketAlternative;
  onSelectAlternative?: (alt: AiMarketAlternative) => void;
}

export const MarketAlternativeCard: React.FC<MarketAlternativeCardProps> = ({
  alternative,
  onSelectAlternative,
}) => {
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  return (
    <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-4 space-y-3 transition-all hover:border-[var(--nothing-text)]/40 flex flex-col justify-between">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--nothing-muted)] block">
              {alternative.providerName}
            </span>
            <h4 className="font-mono text-xs font-semibold text-[var(--nothing-text)]">
              {alternative.offerTitle}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
            title="Datenschutz-Abfrage prüfen"
            className="text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] p-1 rounded transition-colors shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Privacy Inspection Note (Collapsible) */}
        {showPrivacyInfo && (
          <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-xl p-2.5 text-[10px] font-mono space-y-1 text-[var(--nothing-muted)]">
            <div className="flex items-center gap-1.5 text-[#1e612a] dark:text-[#ADEBB3] font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>100% anonymisierte Web-Abfrage:</span>
            </div>
            <p className="text-[var(--nothing-text)] break-all bg-[var(--nothing-subsurface)] p-1.5 rounded border border-[var(--nothing-border)]">
              "{alternative.sanitizedQuery}"
            </p>
            <p className="text-[9px]">
              Keine IBAN, keine Personennamen und keine Kontodaten wurden an das Internet übertragen.
            </p>
          </div>
        )}

        {/* Pricing & Savings Badge */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="font-mono text-base font-bold tabular-nums text-[var(--nothing-text)]">
              {formatCurrency(alternative.monthlyPriceCents)}
            </span>
            <span className="font-mono text-[10px] text-[var(--nothing-muted)]">/Monat</span>
          </div>
          {alternative.estimatedAnnualSavingsCents > 0 && (
            <div className="bg-[#ADEBB3]/15 border border-[#ADEBB3]/30 px-2 py-0.5 rounded-full text-right">
              <span className="font-mono text-[10px] font-bold text-[#1e612a] dark:text-[#ADEBB3]">
                +{formatCurrency(alternative.estimatedAnnualSavingsCents)}/Jahr Ersparnis
              </span>
            </div>
          )}
        </div>

        {/* Features bullet list */}
        <ul className="space-y-1 pt-1 border-t border-[var(--nothing-border)]">
          {alternative.featuresSummary.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-1.5 text-[11px] text-[var(--nothing-text)]">
              <Check className="w-3 h-3 text-[#1e612a] dark:text-[#ADEBB3] shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--nothing-border)]">
        <a
          href={alternative.directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--nothing-muted)] hover:text-[var(--nothing-text)] transition-colors"
        >
          <span>Tarif ansehen</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>

        {onSelectAlternative && (
          <button
            type="button"
            onClick={() => onSelectAlternative(alternative)}
            className="px-3 py-1 bg-[var(--nothing-surface)] hover:bg-[var(--nothing-border)] text-[var(--nothing-text)] border border-[var(--nothing-border)] rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer"
          >
            Wechsel vormerken
          </button>
        )}
      </div>
    </div>
  );
};
