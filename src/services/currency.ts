// Currency utilities ensuring zero floating-point precision drift.
// All values are stored as integer cents (i64).

/**
 * Format integer minor units (cents) to German Euro string: 123456 -> "1.234,56 €"
 */
export function formatCurrency(cents: number, symbol: string = '€'): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const euros = Math.floor(absCents / 100);
  const remainderCents = absCents % 100;

  // Format with German thousands dots
  const eurosFormatted = euros.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centsFormatted = remainderCents.toString().padStart(2, '0');

  const formatted = `${eurosFormatted},${centsFormatted} ${symbol}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Parse a German or standard currency string into integer minor units (cents).
 * Supports: "1234,56", "1.234,56", "1234.56", "-50,00"
 */
export function parseCurrencyInput(input: string): number {
  if (!input || input.trim() === '') return 0;

  let cleaned = input.trim().replace(/\s/g, '').replace(/€/g, '');
  const isNegative = cleaned.startsWith('-') || cleaned.endsWith('-');
  cleaned = cleaned.replace(/-/g, '');

  // Detect decimal separator: if comma appears after dots or last separator is comma
  let normalized = cleaned;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Determine which is decimal: 1.234,56 vs 1,234.56
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // German format: dot is thousand, comma is decimal
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: comma is thousand, dot is decimal
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Only comma present: assume decimal (e.g. "50,20")
    normalized = cleaned.replace(',', '.');
  }

  const floatVal = parseFloat(normalized);
  if (isNaN(floatVal)) return 0;

  const cents = Math.round(floatVal * 100);
  return isNegative ? -cents : cents;
}

