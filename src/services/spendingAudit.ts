import {
  AiAuditRun,
  AiRecommendation,
  Category,
  Transaction,
  MonthlyCategoryRollup,
} from '../types';
import { formatCurrency } from './currency';
import { searchMarketAlternatives } from './marketResearch';

export interface AuditEngineOptions {
  lookbackMonths?: number; // 3, 6, 12 (default 6)
  selectedMonth: string; // YYYY-MM
  budgetId: string;
  categories: Category[];
  transactions: Transaction[];
  rollups: Record<string, MonthlyCategoryRollup>;
}

/**
 * Helper to compute month keys going back N months from currentMonth.
 */
function getLookbackMonthKeys(currentMonth: string, count: number): string[] {
  const [yearStr, monthStr] = currentMonth.split('-');
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10);

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const mm = m < 10 ? `0${m}` : `${m}`;
    result.unshift(`${y}-${mm}`);
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return result;
}

/**
 * Runs a comprehensive, non-patronizing spending audit.
 * Analyzes transaction history and monthly category rollups to identify
 * real savings opportunities and fuel user goals.
 */
export async function runSpendingAudit(options: AuditEngineOptions): Promise<AiAuditRun> {
  const {
    lookbackMonths = 6,
    selectedMonth,
    budgetId,
    categories,
    transactions,
  } = options;

  const monthKeys = getLookbackMonthKeys(selectedMonth, lookbackMonths);
  const now = Date.now();
  const auditId = `audit-${now}-${Math.random().toString(36).substr(2, 6)}`;

  // Filter transactions within the lookback window
  const startDate = `${monthKeys[0]}-01`;
  const endDate = `${monthKeys[monthKeys.length - 1]}-31`;

  const windowTransactions = transactions.filter(
    (t) => t.date >= startDate && t.date <= endDate && t.amountCents < 0
  );

  const totalAnalyzedCents = windowTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amountCents),
    0
  );

  const recommendations: AiRecommendation[] = [];
  let totalIdentifiedMonthlySavingsCents = 0;

  // 1. Group transactions by category to examine monthly averages and patterns
  for (const cat of categories) {
    // If the category is marked as "Geschützte Lebensqualität", strictly skip savings proposals!
    if (cat.isProtected) {
      continue;
    }

    const catTx = windowTransactions.filter((t) => t.categoryId === cat.id);
    if (catTx.length === 0) continue;

    // Calculate monthly spending for this category
    const monthlyTotals: Record<string, number> = {};
    for (const m of monthKeys) monthlyTotals[m] = 0;
    for (const tx of catTx) {
      const m = tx.date.substring(0, 7);
      if (monthlyTotals[m] !== undefined) {
        monthlyTotals[m] += Math.abs(tx.amountCents);
      }
    }

    const activeMonthsCount = Object.values(monthlyTotals).filter((v) => v > 0).length || 1;
    const totalSpentCents = Object.values(monthlyTotals).reduce((sum, v) => sum + v, 0);
    const averageMonthlyCents = Math.round(totalSpentCents / activeMonthsCount);

    const lowerName = cat.name.toLowerCase();

    // Check Candidate A: Utility / Telecom / Contract optimization
    const hasWord = (w: string) => new RegExp(`\\b${w}\\b`, 'i').test(lowerName);

    if (
      lowerName.includes('mobil') ||
      lowerName.includes('handy') ||
      lowerName.includes('telefon') ||
      lowerName.includes('dsl') ||
      lowerName.includes('internet') ||
      lowerName.includes('glasfaser') ||
      lowerName.includes('strom') ||
      lowerName.includes('erdgas') ||
      lowerName.includes('gastarif') ||
      hasWord('gas') ||
      lowerName.includes('versicherung')
    ) {
      if (averageMonthlyCents >= 2000) { // >= 20 €
        // Find dominant payee
        const payeeCounts: Record<string, number> = {};
        for (const t of catTx) {
          payeeCounts[t.payee] = (payeeCounts[t.payee] || 0) + 1;
        }
        const topPayee = Object.keys(payeeCounts).sort(
          (a, b) => payeeCounts[b] - payeeCounts[a]
        )[0] || cat.name;

        // Perform sanitized market lookup
        const research = await searchMarketAlternatives({
          categoryName: cat.name,
          payee: topPayee,
          currentMonthlyCostCents: averageMonthlyCents,
          categoryId: cat.id,
        });

        // Top alternative potential
        const topAlt = research.alternatives[0];
        const potentialSavingsCents = topAlt
          ? Math.max(0, averageMonthlyCents - topAlt.monthlyPriceCents)
          : Math.round(averageMonthlyCents * 0.3);

        if (potentialSavingsCents > 500) { // at least 5 €/month
          totalIdentifiedMonthlySavingsCents += potentialSavingsCents;
          recommendations.push({
            id: `rec-${now}-${recommendations.length}`,
            auditRunId: auditId,
            categoryId: cat.id,
            categoryName: cat.name,
            type: 'rate_optimization',
            title: `${cat.name}: Tarif-Optimierung (${topPayee})`,
            description: `Dein monatlicher Durchschnitt liegt bei ${formatCurrency(averageMonthlyCents)}. Am Markt sind vergleichbare Angebote ab ${topAlt ? formatCurrency(topAlt.monthlyPriceCents) : 'günstiger'} verfügbar. Ein Wechsel oder Nachverhandeln könnte dir zusätzlichen monatlichen Spielraum verschaffen.`,
            potentialMonthlySavingsCents: potentialSavingsCents,
            currentMonthlyAverageCents: averageMonthlyCents,
            suggestedMonthlyTargetCents: averageMonthlyCents - potentialSavingsCents,
            confidence: 0.92,
            status: 'pending',
            createdAt: now,
            researchCategory: research.report.categoryType,
            marketAlternatives: research.alternatives,
          });
        }
      }
    }

    // Check Candidate B: Discretionary / Lifestyle flexible spending (Dining out, Entertainment, Shopping)
    else if (
      lowerName.includes('gastro') ||
      lowerName.includes('restaurant') ||
      lowerName.includes('freizeit') ||
      lowerName.includes('unterhaltung') ||
      lowerName.includes('shopping') ||
      lowerName.includes('kleidung') ||
      lowerName.includes('café') ||
      lowerName.includes('cafe') ||
      cat.priorityTier === 'discretionary' ||
      cat.priorityTier === 'luxury'
    ) {
      if (averageMonthlyCents >= 5000) { // >= 50 €
        // A gentle lever (e.g. 15-20% trim)
        const proposedLeverCents = Math.round((averageMonthlyCents * 0.18) / 100) * 100; // round to full euros
        totalIdentifiedMonthlySavingsCents += proposedLeverCents;

        recommendations.push({
          id: `rec-${now}-${recommendations.length}`,
          auditRunId: auditId,
          categoryId: cat.id,
          categoryName: cat.name,
          type: 'discretionary_trim',
          title: `Sparhebel: ${cat.name}`,
          description: `In den letzten Monaten lag der Schnitt bei ${formatCurrency(averageMonthlyCents)}. Wenn du hier einen moderaten Hebel von z.B. ${formatCurrency(proposedLeverCents)}/Monat ansetzt, kannst du deine aktiven Sparziele spürbar beschleunigen – ohne auf deine Lieblingsausgaben verzichten zu müssen.`,
          potentialMonthlySavingsCents: proposedLeverCents,
          currentMonthlyAverageCents: averageMonthlyCents,
          suggestedMonthlyTargetCents: averageMonthlyCents - proposedLeverCents,
          confidence: 0.85,
          status: 'pending',
          createdAt: now,
        });
      }
    }

    // Check Candidate C: Subscriptions (Streaming, Gym, Software)
    else if (
      lowerName.includes('abo') ||
      lowerName.includes('streaming') ||
      lowerName.includes('fitness') ||
      lowerName.includes('software')
    ) {
      if (averageMonthlyCents >= 1500) {
        const potentialSavingsCents = Math.round(averageMonthlyCents * 0.25);
        totalIdentifiedMonthlySavingsCents += potentialSavingsCents;

        recommendations.push({
          id: `rec-${now}-${recommendations.length}`,
          auditRunId: auditId,
          categoryId: cat.id,
          categoryName: cat.name,
          type: 'recurring_subscription',
          title: `Abonnements prüfen: ${cat.name}`,
          description: `Laufende Abos summieren sich auf ${formatCurrency(averageMonthlyCents)}/Monat. Durch Umstellung auf Jahreszahler oder Prüfung selten genutzter Dienste lassen sich im Schnitt ${formatCurrency(potentialSavingsCents)}/Monat freisetzen.`,
          potentialMonthlySavingsCents: potentialSavingsCents,
          currentMonthlyAverageCents: averageMonthlyCents,
          suggestedMonthlyTargetCents: averageMonthlyCents - potentialSavingsCents,
          confidence: 0.88,
          status: 'pending',
          createdAt: now,
        });
      }
    }
  }

  // Count protected categories
  const protectedCount = categories.filter((c) => c.isProtected).length;

  // Build objective, supportive summary markdown
  let summaryMarkdown = `In der Analyse der letzten ${lookbackMonths} Monate (${monthKeys[0]} bis ${monthKeys[monthKeys.length - 1]}) wurden insgesamt **${formatCurrency(totalAnalyzedCents)}** an Ausgaben ausgewertet.`;

  if (recommendations.length > 0) {
    summaryMarkdown += `\n\nEs wurden **${recommendations.length} konkrete Stellhebel** identifiziert, die zusammen ein monatliches Einsparpotenzial von bis zu **${formatCurrency(totalIdentifiedMonthlySavingsCents)}** bieten. Diese Mittel können gezielt zur Beschleunigung deiner persönlichen Sparziele eingesetzt werden.`;
  } else {
    summaryMarkdown += `\n\nDeine Ausgabenstruktur ist sehr effizient und solide aufgestellt. Aktuell sind keine auffälligen Ausgabenabweichungen vorhanden.`;
  }

  if (protectedCount > 0) {
    summaryMarkdown += `\n\n🛡️ *Hinweis: ${protectedCount} ${protectedCount === 1 ? 'Kategorie ist' : 'Kategorien sind'} als „Geschützte Lebensqualität“ markiert und wurden für Einsparungsvorschläge nicht angetastet.*`;
  }

  return {
    id: auditId,
    budgetId,
    dateRangeStart: startDate,
    dateRangeEnd: endDate,
    totalAnalyzedCents,
    identifiedMonthlySavingsCents: totalIdentifiedMonthlySavingsCents,
    summaryMarkdown,
    modelUsed: 'local-deterministic-audit-engine-v1',
    recommendations,
    createdAt: now,
  };
}
