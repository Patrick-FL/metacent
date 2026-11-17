import { Category, Target, TargetType } from '../types';
import { formatCurrency } from './currency';
import { calculateRemainingMonths } from './targetCalculations';

export const FORBIDDEN_MORALIZING_WORDS = [
  'überflüssig',
  'verschwendung',
  'sündigen',
  'schlecht investiert',
  'disziplinlos',
  'du musst',
  'du sollst',
  'du darfst nicht',
  'hör auf mit',
  'schuld',
];

/**
 * Validates that an agent's response adheres strictly to the non-patronizing guidelines.
 */
export function validateAdvisoryTone(text: string): {
  isCompliant: boolean;
  flaggedWords: string[];
} {
  const lower = text.toLowerCase();
  const flaggedWords: string[] = [];

  for (const word of FORBIDDEN_MORALIZING_WORDS) {
    if (lower.includes(word)) {
      flaggedWords.push(word);
    }
  }

  return {
    isCompliant: flaggedWords.length === 0,
    flaggedWords,
  };
}

export interface SmartTargetDraft {
  categoryName: string;
  targetType: TargetType;
  amountCents: number;
  dueDate: string | null;
  monthlyQuotaCents: number;
  explanation: string;
}

/**
 * Helper to formulate a SMART target proposal from conversational user input.
 */
export function draftSmartTarget(
  userInput: string,
  currentMonthKey: string
): SmartTargetDraft | null {
  const lower = userInput.toLowerCase();

  let categoryName = 'Neues Sparziel';
  let amountCents = 150000; // 1.500,00 € default
  let monthsHorizon = 6;
  let targetType: TargetType = 'custom';

  if (lower.includes('urlaub') || lower.includes('reise') || lower.includes('sommer')) {
    categoryName = 'Urlaub & Reisen';
    amountCents = 180000; // 1.800 €
    monthsHorizon = 8;
  } else if (lower.includes('bike') || lower.includes('fahrrad') || lower.includes('rad')) {
    categoryName = 'Gravelbike / E-Bike';
    amountCents = 160000; // 1.600 €
    monthsHorizon = 6;
  } else if (lower.includes('notgroschen') || lower.includes('puffer') || lower.includes('rücklage')) {
    categoryName = 'Notgroschen-Puffer';
    amountCents = 300000; // 3.000 €
    monthsHorizon = 12;
  } else if (lower.includes('auto') || lower.includes('kfz') || lower.includes('inspektion')) {
    categoryName = 'Kfz-Wartung & Reparaturen';
    amountCents = 80000; // 800 €
    monthsHorizon = 5;
    targetType = 'yearly';
  } else if (lower.includes('laptop') || lower.includes('computer') || lower.includes('pc')) {
    categoryName = 'Technik & Laptop';
    amountCents = 120000; // 1.200 €
    monthsHorizon = 6;
  }

  // Parse custom amount if mentioned in input (e.g. 1500 €, 2000 euro)
  const amountMatch = userInput.match(/(\d+(?:[.,]\d+)?)\s*(?:€|eur|euro)/i);
  if (amountMatch) {
    const rawNum = parseFloat(amountMatch[1].replace(',', '.'));
    if (!isNaN(rawNum) && rawNum > 0) {
      amountCents = Math.round(rawNum * 100);
    }
  }

  // Calculate target due date
  const [curY, curM] = currentMonthKey.split('-').map(Number);
  let dueM = curM + monthsHorizon;
  let dueY = curY;
  while (dueM > 12) {
    dueM -= 12;
    dueY += 1;
  }
  const dueDateStr = `${dueY}-${dueM < 10 ? '0' + dueM : dueM}-28`;

  const monthlyQuotaCents = Math.round(amountCents / Math.max(1, monthsHorizon));

  return {
    categoryName,
    targetType,
    amountCents,
    dueDate: dueDateStr,
    monthlyQuotaCents,
    explanation: `Auf Basis deiner Angabe haben wir das Ziel strukturiert: Zielsumme ${formatCurrency(amountCents)} bis ${dueDateStr} (${monthsHorizon} Monate). Das entspricht einer monatlichen Sparrate von ${formatCurrency(monthlyQuotaCents)}.`,
  };
}

export interface TargetPriorityEvaluation {
  totalMonthlyNeededCents: number;
  unassignedCapacityCents: number;
  hasCapacityBottleneck: boolean;
  rankedTargets: Array<{
    category: Category;
    target: Target;
    priorityTier: number; // 1 (highest) to 4 (lowest)
    priorityLabel: string;
    monthlyQuotaCents: number;
    recommendedAction?: string;
  }>;
  supportiveAdviceMarkdown: string;
}

/**
 * Evaluates competing targets and generates empathetic, non-patronizing prioritization advice.
 */
export function evaluateTargetPriorities(
  categoriesWithTargets: Category[],
  unassignedMonthlyCapacityCents: number,
  selectedMonthKey: string
): TargetPriorityEvaluation {
  let totalMonthlyNeededCents = 0;

  const ranked = categoriesWithTargets
    .filter((c) => c.target && c.target.amountCents > 0)
    .map((c) => {
      const target = c.target!;
      let monthlyQuotaCents = 0;

      if (target.targetType === 'monthly') {
        monthlyQuotaCents = target.amountCents;
      } else if (target.dueDate) {
        const remaining = calculateRemainingMonths(selectedMonthKey, target.dueDate);
        monthlyQuotaCents = Math.round(target.amountCents / Math.max(1, remaining));
      } else {
        monthlyQuotaCents = Math.round(target.amountCents / 12);
      }

      totalMonthlyNeededCents += monthlyQuotaCents;

      // Classify priority tier based on nature of target
      const lower = c.name.toLowerCase();
      let priorityTier = 3;
      let priorityLabel = 'Mittelfristiges Lebensziel';

      if (lower.includes('notgroschen') || lower.includes('reserve') || lower.includes('schulden') || lower.includes('kredit')) {
        priorityTier = 1;
        priorityLabel = 'Existenz- & Notfallsicherung';
      } else if (lower.includes('miete') || lower.includes('strom') || lower.includes('reparatur') || lower.includes('auto') || lower.includes('zahn')) {
        priorityTier = 2;
        priorityLabel = 'Echte Ausgaben & Sinking Funds';
      } else if (lower.includes('hobby') || lower.includes('luxus') || lower.includes('gaming') || lower.includes('shopping')) {
        priorityTier = 4;
        priorityLabel = 'Wünsche & Komfort';
      }

      return {
        category: c,
        target,
        priorityTier,
        priorityLabel,
        monthlyQuotaCents,
      };
    })
    .sort((a, b) => a.priorityTier - b.priorityTier);

  const hasCapacityBottleneck = totalMonthlyNeededCents > unassignedMonthlyCapacityCents && unassignedMonthlyCapacityCents > 0;

  let supportiveAdviceMarkdown = '';

  if (hasCapacityBottleneck) {
    const deficitCents = totalMonthlyNeededCents - unassignedMonthlyCapacityCents;
    supportiveAdviceMarkdown = `Deine aktuellen Sparziele erfordern zusammen **${formatCurrency(totalMonthlyNeededCents)}/Monat**, während deine reguläre monatliche Spar-Kapazität bei ca. **${formatCurrency(unassignedMonthlyCapacityCents)}/Monat** liegt (Differenz: ${formatCurrency(deficitCents)}).\n\n` +
      `Es ist völlig normal, dass Wünsche und Vorsorge manchmal miteinander konkurrieren. Um entspannt und ohne Druck voranzukommen, empfiehlt sich folgende Staffelung:\n\n` +
      `1. **Basis zuerst absichern:** Töpfe wie *${ranked.filter((r) => r.priorityTier <= 2).map((r) => r.category.name).join(', ') || 'Notgroschen'}* voll besparen.\n` +
      `2. **Zieldaten strecken:** Ziele mit geringerer Dringlichkeit zeitlich um 2 bis 3 Monate nach hinten schieben, um die monatliche Rate spürbar zu entlasten.\n\n` +
      `Möchtest du, dass wir für ein bestimmtes Ziel den Zielmonat anpassen, damit alles harmonisch ins Budget passt?`;
  } else {
    supportiveAdviceMarkdown = `Hervorragend: Deine monatlichen Zielraten (${formatCurrency(totalMonthlyNeededCents)}) sind durch deine laufenden Mittel vollständig gedeckt. Deine Pläne sind mathematisch solide abgesichert.`;
  }

  return {
    totalMonthlyNeededCents,
    unassignedCapacityCents: unassignedMonthlyCapacityCents,
    hasCapacityBottleneck,
    rankedTargets: ranked,
    supportiveAdviceMarkdown,
  };
}
