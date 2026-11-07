import { ImportProfile } from '../types';
import { parseCurrencyInput } from './currency';

export interface ParsedCsvRow {
  date: string; // YYYY-MM-DD
  payee: string;
  amountCents: number;
  memo: string;
  suggestedCategoryId: string | null;
  matchRuleName?: string;
  fitid?: string;
  raw: Record<string, string>;
}

/**
 * Parses a CSV string according to an ImportProfile configuration.
 */
export function parseCsvFile(content: string, profile: ImportProfile): ParsedCsvRow[] {
  if (!content || content.trim() === '') return [];

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= profile.headerRowIndex) return [];

  const delimiter = profile.delimiter || ';';
  const headerLine = lines[profile.headerRowIndex];
  const headers = splitCsvLine(headerLine, delimiter);

  const results: ParsedCsvRow[] = [];

  for (let i = profile.headerRowIndex + 1; i < lines.length; i++) {
    const rawCols = splitCsvLine(lines[i], delimiter);
    if (rawCols.length < 2) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = rawCols[idx] || '';
    });

    // Resolve date
    const dateField = profile.fieldMappings.date;
    const rawDate = rowObj[dateField] || '';
    const isoDate = normalizeDateToIso(rawDate, profile.dateFormat);

    // Resolve payee
    const payeeField = profile.fieldMappings.payee;
    const payee = (rowObj[payeeField] || 'Unbekannter Empfänger').trim();

    // Resolve amount
    let amountCents = 0;
    if (profile.fieldMappings.amount && rowObj[profile.fieldMappings.amount]) {
      const rawAmt = rowObj[profile.fieldMappings.amount];
      amountCents = parseCurrencyInput(rawAmt);
    } else if (profile.fieldMappings.outflow && rowObj[profile.fieldMappings.outflow]) {
      amountCents = -Math.abs(parseCurrencyInput(rowObj[profile.fieldMappings.outflow]));
    } else if (profile.fieldMappings.inflow && rowObj[profile.fieldMappings.inflow]) {
      amountCents = Math.abs(parseCurrencyInput(rowObj[profile.fieldMappings.inflow]));
    }

    // Resolve memo
    const memoField = profile.fieldMappings.memo;
    const memo = memoField && rowObj[memoField] ? rowObj[memoField].trim() : '';

    // Resolve FITID (Financial Institution Transaction ID)
    const fitidField = profile.fieldMappings.fitid;
    const fitid = fitidField && rowObj[fitidField] ? rowObj[fitidField].trim() : undefined;

    // Apply deterministic category rules from profile
    let suggestedCategoryId: string | null = null;
    let matchRuleName: string | undefined = undefined;

    if (profile.categoryMatchRules) {
      for (const rule of profile.categoryMatchRules) {
        const sourceVal = rowObj[rule.sourceField] || (rule.sourceField === 'payee' ? payee : '');
        if (sourceVal.toLowerCase().includes(rule.pattern.toLowerCase())) {
          suggestedCategoryId = rule.targetCategoryId;
          matchRuleName = `Regel: "${rule.pattern}" in ${rule.sourceField}`;
          break;
        }
      }
    }

    results.push({
      date: isoDate,
      payee,
      amountCents,
      memo,
      suggestedCategoryId,
      matchRuleName,
      fitid,
      raw: rowObj,
    });
  }

  return results;
}

/**
 * Splits a CSV line taking quotes into account.
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Converts dates like "24.10.2026" or "2026-10-24" into standard "YYYY-MM-DD".
 */
export function normalizeDateToIso(dateStr: string, format: string = 'DD.MM.YYYY'): string {
  if (!dateStr || dateStr.trim() === '') {
    return new Date().toISOString().split('T')[0];
  }

  const cleaned = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // German format DD.MM.YYYY
  if (format === 'DD.MM.YYYY' || /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cleaned)) {
    const parts = cleaned.split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback to JS Date parser
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}
