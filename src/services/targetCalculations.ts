import { Target } from '../types';
import { formatCurrency } from './currency';

export interface TargetEvaluation {
  isFunded: boolean;
  monthlyQuotaCents: number;       // Sollsatz für diesen Monat
  neededThisMonthCents: number;    // In diesem Monat noch zuzuweisen
  overallNeededCents: number;      // Bis zum Gesamtziel noch fehlender Gesamtbetrag
  monthsRemaining: number | null;  // Verbleibende Monate inklusive aktuellem Monat
  progressRatio: number;           // 0.0 bis 1.0 (Fortschritt)
  statusDescription: string;       // Menschenlesbarer Status / Erklärung
  isOverdue: boolean;              // Stichtag überschritten und nicht voll finanziert
}

/**
 * Calculates remaining months between selectedMonth (YYYY-MM) and targetDueDate (YYYY-MM-DD or YYYY-MM).
 * Both inclusive: e.g. from 2026-11 to 2026-11 returns 1.
 * From 2026-11 to 2026-12 returns 2.
 * If targetDueDate is in the past relative to selectedMonth, returns <= 0.
 */
export function calculateRemainingMonths(selectedMonth: string, dueDate: string): number {
  const [selYearStr, selMonthStr] = selectedMonth.split('-');
  const selYear = parseInt(selYearStr, 10);
  const selMonth = parseInt(selMonthStr, 10);

  const [dueYearStr, dueMonthStr] = dueDate.split('-');
  const dueYear = parseInt(dueYearStr, 10);
  const dueMonth = parseInt(dueMonthStr, 10);

  if (isNaN(dueYear) || isNaN(dueMonth)) return 1;

  return (dueYear - selYear) * 12 + (dueMonth - selMonth) + 1;
}

/**
 * Evaluates target status based on rhythm (monthly, weekly, yearly, custom) and due date.
 */
export function evaluateCategoryTarget(
  target: Target,
  assignedCents: number,
  availableCents: number,
  selectedMonth: string,
  startingBalanceCents: number = 0
): TargetEvaluation {
  const { targetType, amountCents, dueDate } = target;

  if (amountCents <= 0) {
    return {
      isFunded: true,
      monthlyQuotaCents: 0,
      neededThisMonthCents: 0,
      overallNeededCents: 0,
      monthsRemaining: null,
      progressRatio: 1,
      statusDescription: 'Kein Zielbetrag hinterlegt',
      isOverdue: false,
    };
  }

  // 1. MONTHLY TARGET (Monatliches Budgetziel)
  if (targetType === 'monthly') {
    const monthlyQuotaCents = amountCents;
    const neededThisMonthCents = Math.max(0, monthlyQuotaCents - assignedCents);
    const isFunded = assignedCents >= monthlyQuotaCents;
    const progressRatio = Math.min(1, Math.max(0, assignedCents / monthlyQuotaCents));

    return {
      isFunded,
      monthlyQuotaCents,
      neededThisMonthCents,
      overallNeededCents: neededThisMonthCents,
      monthsRemaining: null,
      progressRatio,
      statusDescription: isFunded
        ? 'Diesen Monat vollständig finanziert'
        : `${formatCurrency(neededThisMonthCents)} diesen Monat noch benötigt`,
      isOverdue: false,
    };
  }

  // 2. WEEKLY TARGET (Gemittelt: wöchentlicher Betrag * 52 / 12)
  if (targetType === 'weekly') {
    const monthlyQuotaCents = Math.round((amountCents * 52) / 12);
    const neededThisMonthCents = Math.max(0, monthlyQuotaCents - assignedCents);
    const isFunded = assignedCents >= monthlyQuotaCents;
    const progressRatio = Math.min(1, Math.max(0, assignedCents / monthlyQuotaCents));

    return {
      isFunded,
      monthlyQuotaCents,
      neededThisMonthCents,
      overallNeededCents: neededThisMonthCents,
      monthsRemaining: null,
      progressRatio,
      statusDescription: isFunded
        ? `Wochenschnitt erfüllt (${formatCurrency(amountCents)}/Woche)`
        : `${formatCurrency(neededThisMonthCents)} noch nötig (${formatCurrency(amountCents)}/Woche)`,
      isOverdue: false,
    };
  }

  // 3. YEARLY TARGET (Ratenlogik bis dueDate oder Jahresende)
  if (targetType === 'yearly') {
    const effectiveDueDate = dueDate && dueDate.trim() !== ''
      ? dueDate
      : `${selectedMonth.split('-')[0]}-12-31`;

    const monthsRemaining = calculateRemainingMonths(selectedMonth, effectiveDueDate);
    const existingSavedBeforeMonth = startingBalanceCents > 0
      ? startingBalanceCents
      : Math.max(0, availableCents - assignedCents);

    const remainingDeficit = Math.max(0, amountCents - existingSavedBeforeMonth);
    const isOverdue = monthsRemaining <= 0 && remainingDeficit > 0;

    let monthlyQuotaCents: number;
    if (monthsRemaining <= 1) {
      // Fälligkeitsmonat oder überfällig: Restbetrag voll fällig
      monthlyQuotaCents = remainingDeficit;
    } else {
      // Dynamische Ratenlogik: Restbetrag geteilt durch verbleibende Monate
      monthlyQuotaCents = Math.ceil(remainingDeficit / monthsRemaining);
    }

    const neededThisMonthCents = Math.max(0, monthlyQuotaCents - assignedCents);
    const totalFundedTowardsTarget = existingSavedBeforeMonth + assignedCents;
    const overallNeededCents = Math.max(0, amountCents - totalFundedTowardsTarget);
    const isFunded = assignedCents >= monthlyQuotaCents || overallNeededCents === 0;
    const progressRatio = Math.min(1, Math.max(0, totalFundedTowardsTarget / amountCents));

    let statusDescription: string;
    if (overallNeededCents === 0) {
      statusDescription = `Jahresziel vollständig erreicht (${formatCurrency(amountCents)})`;
    } else if (isOverdue) {
      statusDescription = `Überfällig: ${formatCurrency(overallNeededCents)} noch fällig`;
    } else if (isFunded) {
      statusDescription = `Monatsrate erfüllt (${formatCurrency(monthlyQuotaCents)}/Monat, noch ${monthsRemaining} Mon.)`;
    } else {
      statusDescription = `${formatCurrency(neededThisMonthCents)} Monatsrate noch nötig (noch ${monthsRemaining} Mon.)`;
    }

    return {
      isFunded,
      monthlyQuotaCents,
      neededThisMonthCents,
      overallNeededCents,
      monthsRemaining: Math.max(0, monthsRemaining),
      progressRatio,
      statusDescription,
      isOverdue,
    };
  }

  // 4. CUSTOM TARGET (Benutzerdefiniert mit oder ohne Fälligkeitsdatum)
  if (dueDate && dueDate.trim() !== '') {
    // Custom mit Fälligkeitsdatum -> Ratenlogik
    const monthsRemaining = calculateRemainingMonths(selectedMonth, dueDate);
    const existingSavedBeforeMonth = startingBalanceCents > 0
      ? startingBalanceCents
      : Math.max(0, availableCents - assignedCents);

    const remainingDeficit = Math.max(0, amountCents - existingSavedBeforeMonth);
    const isOverdue = monthsRemaining <= 0 && remainingDeficit > 0;

    let monthlyQuotaCents: number;
    if (monthsRemaining <= 1) {
      monthlyQuotaCents = remainingDeficit;
    } else {
      monthlyQuotaCents = Math.ceil(remainingDeficit / monthsRemaining);
    }

    const neededThisMonthCents = Math.max(0, monthlyQuotaCents - assignedCents);
    const totalFundedTowardsTarget = existingSavedBeforeMonth + assignedCents;
    const overallNeededCents = Math.max(0, amountCents - totalFundedTowardsTarget);
    const isFunded = assignedCents >= monthlyQuotaCents || overallNeededCents === 0;
    const progressRatio = Math.min(1, Math.max(0, totalFundedTowardsTarget / amountCents));

    let statusDescription: string;
    if (overallNeededCents === 0) {
      statusDescription = `Ziel erreicht (${formatCurrency(amountCents)})`;
    } else if (isOverdue) {
      statusDescription = `Überfällig: ${formatCurrency(overallNeededCents)} noch fällig`;
    } else if (isFunded) {
      statusDescription = `Monatsrate erfüllt (${formatCurrency(monthlyQuotaCents)}/Monat, noch ${monthsRemaining} Mon.)`;
    } else {
      statusDescription = `${formatCurrency(neededThisMonthCents)} noch nötig (noch ${monthsRemaining} Mon. bis zum Ziel)`;
    }

    return {
      isFunded,
      monthlyQuotaCents,
      neededThisMonthCents,
      overallNeededCents,
      monthsRemaining: Math.max(0, monthsRemaining),
      progressRatio,
      statusDescription,
      isOverdue,
    };
  }

  // Custom ohne Fälligkeitsdatum -> Reine Target Balance (Guthabenziel wie Notgroschen)
  const overallNeededCents = Math.max(0, amountCents - availableCents);
  const neededThisMonthCents = overallNeededCents;
  const isFunded = availableCents >= amountCents;
  const progressRatio = Math.min(1, Math.max(0, availableCents / amountCents));

  return {
    isFunded,
    monthlyQuotaCents: overallNeededCents,
    neededThisMonthCents,
    overallNeededCents,
    monthsRemaining: null,
    progressRatio,
    statusDescription: isFunded
      ? `Ziel-Guthaben erreicht (${formatCurrency(amountCents)})`
      : `${formatCurrency(overallNeededCents)} noch bis zum Zielguthaben`,
    isOverdue: false,
  };
}

