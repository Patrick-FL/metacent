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

export interface CsvInspection {
  delimiter: string;
  headerRowIndex: number;
  headers: string[];
  suggestedMappings: ImportProfile['fieldMappings'];
  suggestedDateFormat: string;
  totalLines: number;
  dataLinesCount: number;
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
    let payee = (rowObj[payeeField] || '').trim();
    if (!payee && profile.fieldMappings.memo && rowObj[profile.fieldMappings.memo]) {
      payee = rowObj[profile.fieldMappings.memo].trim();
    }
    if (!payee && profile.fieldMappings.type && rowObj[profile.fieldMappings.type]) {
      payee = rowObj[profile.fieldMappings.type].trim();
    }
    if (!payee) {
      payee = 'Unbekannter Empfänger';
    }

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
export function splitCsvLine(line: string, delimiter: string): string[] {
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
 * Detects whether semicolon, comma or tab is used.
 */
export function detectCsvDelimiter(content: string): string {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ';';

  const delimiters = [';', ',', '\t'];
  let bestDelimiter = ';';
  let maxCols = 0;

  for (const d of delimiters) {
    const colCount = splitCsvLine(lines[0], d).length;
    if (colCount > maxCols) {
      maxCols = colCount;
      bestDelimiter = d;
    }
  }

  return maxCols > 1 ? bestDelimiter : ';';
}

/**
 * Scans up to 12 lines to find the true table header row.
 */
export function detectHeaderRow(lines: string[], delimiter: string): { headerRowIndex: number; headers: string[] } {
  const maxScan = Math.min(lines.length, 12);
  const keywords = [
    'datum', 'date', 'buchung', 'valuta', 'wertstellung',
    'betrag', 'amount', 'empfänger', 'empfaenger', 'bezeichnung',
    'payee', 'saldo', 'verwendungszweck', 'umsatz'
  ];

  for (let i = 0; i < maxScan; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    if (cols.length >= 2) {
      const matchCount = cols.filter((col) => {
        const lower = col.toLowerCase();
        return keywords.some((k) => lower.includes(k));
      }).length;

      if (matchCount >= 2) {
        return { headerRowIndex: i, headers: cols };
      }
    }
  }

  // Fallback to row 0
  const firstRowCols = lines.length > 0 ? splitCsvLine(lines[0], delimiter) : [];
  return { headerRowIndex: 0, headers: firstRowCols };
}

/**
 * Autodetects column field mappings from header names.
 */
export function autoDetectMappings(headers: string[]): ImportProfile['fieldMappings'] {
  const mappings: ImportProfile['fieldMappings'] = {
    date: '',
    payee: '',
  };

  const findBest = (patterns: string[]): string => {
    for (const pat of patterns) {
      const found = headers.find((h) => h.toLowerCase().includes(pat));
      if (found) return found;
    }
    return '';
  };

  // Date
  mappings.date = findBest(['buchungstag', 'datum', 'transaktionsdatum', 'valuta', 'date', 'wertstellung']) || headers[0] || '';

  // Payee / Partner
  mappings.payee = findBest([
    'beguenstigter',
    'begünstigter',
    'empfaenger',
    'empfänger',
    'zahlungsempfaenger',
    'zahlungsempfänger',
    'auftraggeber',
    'bezeichnung',
    'partner',
    'payee',
    'name',
  ]) || (headers.length > 1 ? headers[1] : '');

  // Amount
  const amtCol = findBest(['betrag', 'amount', 'umsatz in eur', 'umsatz', 'wert']);
  if (amtCol) {
    mappings.amount = amtCol;
  } else {
    // Check separate inflow/outflow
    const outflowCol = findBest(['soll', 'ausgabe', 'outflow', 'debit', 'belastung']);
    const inflowCol = findBest(['haben', 'einnahme', 'inflow', 'credit', 'gutschrift']);
    if (outflowCol || inflowCol) {
      mappings.outflow = outflowCol;
      mappings.inflow = inflowCol;
    } else if (headers.length > 2) {
      mappings.amount = headers[2];
    }
  }

  // Memo / Verwendungszweck
  const memoCol = findBest(['verwendungszweck', 'buchungstext', 'memo', 'hinweis', 'notiz', 'details', 'info']);
  if (memoCol) {
    mappings.memo = memoCol;
  }

  // Type
  const typeCol = findBest(['typ', 'type', 'vorgang', 'transaktionstyp']);
  if (typeCol) {
    mappings.type = typeCol;
  }

  return mappings;
}

/**
 * Detects date format from sample date strings.
 */
export function detectDateFormat(sampleDates: string[]): string {
  for (const dateStr of sampleDates) {
    const cleaned = (dateStr || '').trim();
    if (!cleaned) continue;
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cleaned) || /^\d{1,2}\.\d{1,2}\.\d{2}$/.test(cleaned)) {
      return 'DD.MM.YYYY';
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return 'YYYY-MM-DD';
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
      return 'MM/DD/YYYY';
    }
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
      return 'DD-MM-YYYY';
    }
  }
  return 'DD.MM.YYYY';
}

/**
 * Comprehensive inspection of CSV content to give instant live-detection feedback.
 */
export function inspectCsv(content: string): CsvInspection {
  if (!content || !content.trim()) {
    return {
      delimiter: ';',
      headerRowIndex: 0,
      headers: [],
      suggestedMappings: { date: '', payee: '' },
      suggestedDateFormat: 'DD.MM.YYYY',
      totalLines: 0,
      dataLinesCount: 0,
    };
  }

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const delimiter = detectCsvDelimiter(content);
  const { headerRowIndex, headers } = detectHeaderRow(lines, delimiter);
  const suggestedMappings = autoDetectMappings(headers);

  // Sample dates from first few rows
  const sampleDates: string[] = [];
  if (suggestedMappings.date) {
    const dateIdx = headers.indexOf(suggestedMappings.date);
    if (dateIdx >= 0) {
      for (let i = headerRowIndex + 1; i < Math.min(lines.length, headerRowIndex + 6); i++) {
        const cols = splitCsvLine(lines[i], delimiter);
        if (cols[dateIdx]) sampleDates.push(cols[dateIdx]);
      }
    }
  }
  const suggestedDateFormat = detectDateFormat(sampleDates);

  return {
    delimiter,
    headerRowIndex,
    headers,
    suggestedMappings,
    suggestedDateFormat,
    totalLines: lines.length,
    dataLinesCount: Math.max(0, lines.length - headerRowIndex - 1),
  };
}

/**
 * Converts dates like "24.10.2026", "24.10.26" or "2026-10-24" into standard "YYYY-MM-DD".
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

  // German format DD.MM.YYYY or DD.MM.YY
  if (format === 'DD.MM.YYYY' || /^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(cleaned)) {
    const parts = cleaned.split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) {
        year = `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }
  }

  // Format DD-MM-YYYY
  if (format === 'DD-MM-YYYY' || /^\d{1,2}-\d{1,2}-\d{4}$/.test(cleaned)) {
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }

  // US format MM/DD/YYYY
  if (format === 'MM/DD/YYYY' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
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
