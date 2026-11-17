import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../services/storage';
import { runSpendingAudit } from '../../services/spendingAudit';
import { simulateTargetAcceleration } from '../../services/scenarioCalculations';
import { formatCurrency } from '../../services/currency';
import { AiAuditRun, Category } from '../../types';
import { SavingsLeverSlider } from './SavingsLeverSlider';
import { MarketAlternativeCard } from './MarketAlternativeCard';
import { GoalCopilotChat } from './GoalCopilotChat';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Target,
  CheckCircle2,
  Sliders,
  Compass,
} from 'lucide-react';

interface AdvisorViewProps {
  onNavigateToPlan?: () => void;
}

export const AdvisorView: React.FC<AdvisorViewProps> = ({ onNavigateToPlan }) => {
  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories());
  const [lookbackMonths, setLookbackMonths] = useState<number>(6);
  const [currentMonthKey] = useState<string>('2026-11');

  const [activeAudit, setActiveAudit] = useState<AiAuditRun | null>(() => storage.getLatestAuditRun());
  const [isAuditing, setIsAuditing] = useState(false);

  // Active savings lever values per category (categoryId -> leverCents)
  const [leverValues, setLeverValues] = useState<Record<string, number>>({});

  // Active target being accelerated in simulator
  const targetsList = useMemo(() => {
    return categories.filter((c) => c.target && c.target.amountCents > 0);
  }, [categories]);

  const [selectedTargetCategoryId, setSelectedTargetCategoryId] = useState<string>(() => {
    return targetsList[0]?.id || '';
  });

  // Keep selected target updated if list changes
  useEffect(() => {
    if (!selectedTargetCategoryId && targetsList.length > 0) {
      setSelectedTargetCategoryId(targetsList[0].id);
    }
  }, [targetsList, selectedTargetCategoryId]);

  const selectedTargetCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedTargetCategoryId) || targetsList[0];
  }, [categories, selectedTargetCategoryId, targetsList]);

  // Run audit on mount if no previous audit exists
  useEffect(() => {
    if (!activeAudit) {
      handleTriggerAudit();
    }
  }, []);

  const handleTriggerAudit = async () => {
    setIsAuditing(true);
    try {
      const audit = await runSpendingAudit({
        lookbackMonths,
        selectedMonth: currentMonthKey,
        budgetId: storage.getBudget().id,
        categories: storage.getCategories(),
        transactions: storage.getTransactions(),
        rollups: storage.getData().rollups,
      });

      storage.saveAuditRun(audit);
      setActiveAudit(audit);

      // Initialize default lever suggestions
      const initialLevers: Record<string, number> = {};
      for (const rec of audit.recommendations) {
        if (rec.categoryId && rec.potentialMonthlySavingsCents > 0) {
          initialLevers[rec.categoryId] = rec.potentialMonthlySavingsCents;
        }
      }
      setLeverValues(initialLevers);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleLeverChange = (categoryId: string, valCents: number) => {
    setLeverValues((prev) => ({
      ...prev,
      [categoryId]: valCents,
    }));
  };

  const handleToggleProtected = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const nextState = !cat.isProtected;
    storage.updateCategory(catId, { isProtected: nextState });

    // Refresh categories
    const updated = storage.getCategories();
    setCategories(updated);

    // If protected now, reset its lever to 0
    if (nextState) {
      setLeverValues((prev) => ({
        ...prev,
        [catId]: 0,
      }));
    }
  };

  // Total monthly savings levers active
  const totalMonthlyLeverCents = useMemo(() => {
    return Object.values(leverValues).reduce((sum, v) => sum + v, 0);
  }, [leverValues]);

  // Deterministic simulation result for the selected target
  const simulationResult = useMemo(() => {
    if (!selectedTargetCategory || !selectedTargetCategory.target) return null;

    // Look up rollup available
    const rollup = storage.getMonthlyRollup(currentMonthKey, selectedTargetCategory.id);
    const availableCents = rollup ? rollup.availableCents : 0;

    return simulateTargetAcceleration({
      target: selectedTargetCategory.target,
      currentAvailableCents: availableCents,
      baseMonthlyRateCents: 0,
      monthlyLeverCents: totalMonthlyLeverCents,
      currentMonthKey,
    });
  }, [selectedTargetCategory, totalMonthlyLeverCents, currentMonthKey]);

  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const handleApplyToBudget = () => {
    if (!selectedTargetCategory || totalMonthlyLeverCents <= 0) return;

    const scenarioId = `scen-${Date.now()}`;
    storage.saveGoalScenario({
      id: scenarioId,
      budgetId: storage.getBudget().id,
      targetCategoryId: selectedTargetCategory.id,
      scenarioName: `Sparhebel für ${selectedTargetCategory.name}`,
      monthlySavingsAllocatedCents: totalMonthlyLeverCents,
      baselineTargetMonth: simulationResult?.baselineTargetMonth || currentMonthKey,
      simulatedTargetMonth: simulationResult?.simulatedTargetMonth || currentMonthKey,
      monthsSaved: simulationResult?.monthsAccelerated || 0,
      isApplied: false,
      createdAt: Date.now(),
    });

    const success = storage.applyGoalScenario(scenarioId, '2026-12');
    if (success) {
      setAppliedFeedback(
        `Erfolgreich! ${formatCurrency(totalMonthlyLeverCents)}/Monat wurden als zusätzliche Sparrate für „${selectedTargetCategory.name}“ eingeplant.`
      );
      setCategories(storage.getCategories());
      setTimeout(() => setAppliedFeedback(null), 5000);
    }
  };

  // Market alternatives collected across recommendations
  const allAlternatives = useMemo(() => {
    if (!activeAudit) return [];
    return activeAudit.recommendations.flatMap((r) => r.marketAlternatives || []);
  }, [activeAudit]);

  const protectedCount = useMemo(() => {
    return categories.filter((c) => c.isProtected).length;
  }, [categories]);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--nothing-bg)] text-[var(--nothing-text)] p-6 space-y-6 transition-colors">
      {/* 1. Header Bento Banner */}
      <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold tracking-wider text-sm uppercase text-[var(--nothing-text)]">
              KI-FINANZBERATER & SPARZIEL-COPILOT
            </span>
            <span className="w-2 h-2 rounded-full bg-[#D71921]" />
          </div>
          <p className="font-mono text-xs text-[var(--nothing-muted)]">
            Lokal, interaktiv & partnerschaftlich • Echte Markt-Alternativen ohne Datenabfluss
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lookback Selector */}
          <div className="flex items-center bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-full p-0.5 text-[10px] font-mono">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLookbackMonths(m)}
                className={`px-3 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer ${
                  lookbackMonths === m
                    ? 'bg-[var(--nothing-text)] text-[var(--nothing-bg)] font-bold'
                    : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
                }`}
              >
                {m} Monate
              </button>
            ))}
          </div>

          {/* Trigger Audit Button */}
          <button
            type="button"
            onClick={handleTriggerAudit}
            disabled={isAuditing}
            className="px-4 py-2 bg-[#D71921] hover:opacity-90 disabled:opacity-50 text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold flex items-center gap-2 transition-opacity cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Analysiere...' : 'Ausgaben analysieren'}</span>
          </button>
        </div>
      </div>

      {/* Applied Feedback Banner */}
      {appliedFeedback && (
        <div className="bg-[#ADEBB3]/15 border border-[#ADEBB3]/40 rounded-2xl p-4 flex items-center justify-between font-mono text-xs text-[#1e612a] dark:text-[#ADEBB3]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{appliedFeedback}</span>
          </div>
          {onNavigateToPlan && (
            <button
              type="button"
              onClick={onNavigateToPlan}
              className="underline font-bold hover:opacity-80"
            >
              Zur Monatsplanung →
            </button>
          )}
        </div>
      )}

      {/* 2. Main 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Spending Audit & Sparhebel (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Box */}
          <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D71921]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                  Ausgaben-Audit & Potenzial-Analyse
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--nothing-muted)] bg-[var(--nothing-subsurface)] px-2.5 py-0.5 rounded-full border border-[var(--nothing-border)]">
                <ShieldCheck className="w-3 h-3 text-[#1e612a] dark:text-[#ADEBB3]" />
                <span>{protectedCount} Bereiche geschützt</span>
              </div>
            </div>

            {activeAudit ? (
              <div className="font-mono text-xs leading-relaxed text-[var(--nothing-text)] whitespace-pre-line bg-[var(--nothing-subsurface)] p-3.5 rounded-2xl border border-[var(--nothing-border)]">
                {activeAudit.summaryMarkdown}
              </div>
            ) : (
              <p className="font-mono text-xs text-[var(--nothing-muted)]">
                Klicke auf „Ausgaben analysieren“, um dein Buchungsverhalten der letzten Monate zu untersuchen.
              </p>
            )}
          </div>

          {/* Interactive Savings Levers (Sparhebel) */}
          <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D71921]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                  Interaktive Sparhebel
                </h3>
              </div>
              <div className="font-mono text-xs">
                <span className="text-[var(--nothing-muted)] text-[10px] uppercase tracking-wider">
                  Gesamter Hebel:{' '}
                </span>
                <span className="font-bold tabular-nums text-[#1e612a] dark:text-[#ADEBB3]">
                  +{formatCurrency(totalMonthlyLeverCents)}/Monat
                </span>
              </div>
            </div>

            {activeAudit && activeAudit.recommendations.length > 0 ? (
              <div className="space-y-3">
                {activeAudit.recommendations.map((rec) => {
                  const cat = categories.find((c) => c.id === rec.categoryId);
                  const isProt = cat?.isProtected || false;
                  return (
                    <SavingsLeverSlider
                      key={rec.id}
                      categoryName={rec.categoryName || rec.title}
                      currentMonthlyAverageCents={rec.currentMonthlyAverageCents}
                      maxLeverCents={rec.potentialMonthlySavingsCents * 2}
                      valueCents={leverValues[rec.categoryId || ''] || 0}
                      onChange={(val) => rec.categoryId && handleLeverChange(rec.categoryId, val)}
                      isProtected={isProt}
                      onToggleProtected={() => rec.categoryId && handleToggleProtected(rec.categoryId)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-[var(--nothing-subsurface)] border border-dashed border-[var(--nothing-border)] rounded-2xl p-6 text-center text-xs font-mono text-[var(--nothing-muted)]">
                Aktuell sind keine ungenutzten Einsparpotenziale offen. Du führst dein Budget sehr diszipliniert!
              </div>
            )}
          </div>

          {/* Market Alternatives & Price Comparison Bento */}
          {allAlternatives.length > 0 && (
            <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D71921]" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                    Geprüfte Markt- & Tarifalternativen
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[var(--nothing-muted)] uppercase tracking-wider">
                  Recherchiert & Anonymisiert
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAlternatives.slice(0, 4).map((alt) => (
                  <MarketAlternativeCard key={alt.id} alternative={alt} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Goal Acceleration Simulator & Copilot (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Acceleration Simulator Bento */}
          <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#D71921]" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--nothing-text)]">
                  Ziel-Beschleunigung (Was-wäre-wenn)
                </h3>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e612a] dark:bg-[#ADEBB3]" />
            </div>

            {targetsList.length > 0 ? (
              <div className="space-y-4">
                {/* Target Select Dropdown */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--nothing-muted)] mb-1">
                    Zu beschleunigendes Sparziel wählen
                  </label>
                  <select
                    value={selectedTargetCategoryId}
                    onChange={(e) => setSelectedTargetCategoryId(e.target.value)}
                    className="w-full bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--nothing-text)] focus:outline-none"
                  >
                    {targetsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCurrency(c.target?.amountCents || 0)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Details Card */}
                {selectedTargetCategory && selectedTargetCategory.target && simulationResult && (
                  <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[var(--nothing-muted)]">Noch benötigter Betrag:</span>
                      <span className="font-bold tabular-nums">
                        {formatCurrency(simulationResult.remainingNeededCents)}
                      </span>
                    </div>

                    {/* Timeline Comparison */}
                    <div className="space-y-2 pt-2 border-t border-[var(--nothing-border)]">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[var(--nothing-muted)]">Aktuelles Zieldatum:</span>
                        <span className="tabular-nums font-semibold">
                          {simulationResult.baselineTargetMonth} ({simulationResult.baselineMonths} Monate)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#1e612a] dark:text-[#ADEBB3] font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Mit Sparhebel (+{formatCurrency(totalMonthlyLeverCents)}):</span>
                        </span>
                        <span className="tabular-nums font-bold text-[#1e612a] dark:text-[#ADEBB3]">
                          {simulationResult.simulatedTargetMonth} ({simulationResult.simulatedMonths} Monate)
                        </span>
                      </div>

                      {simulationResult.monthsAccelerated > 0 && (
                        <div className="bg-[#ADEBB3]/15 border border-[#ADEBB3]/30 rounded-xl p-2.5 text-center font-mono text-xs font-bold text-[#1e612a] dark:text-[#ADEBB3]">
                          ⚡ {simulationResult.monthsAccelerated} Monate früher am Ziel!
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={handleApplyToBudget}
                      disabled={totalMonthlyLeverCents <= 0}
                      className="w-full py-2.5 bg-[#D71921] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full font-mono text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-opacity cursor-pointer mt-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>In Budget übernehmen</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[var(--nothing-subsurface)] border border-dashed border-[var(--nothing-border)] rounded-2xl p-6 text-center text-xs font-mono text-[var(--nothing-muted)]">
                Noch kein Sparziel angelegt. Nutze den Ziel-Copilot unten, um dein erstes Ziel zu erstellen!
              </div>
            )}
          </div>

          {/* Goal Copilot Conversational Chat */}
          <GoalCopilotChat
            categories={categories}
            currentMonthKey={currentMonthKey}
            onTargetCreated={() => setCategories(storage.getCategories())}
          />
        </div>
      </div>
    </div>
  );
};
