import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyInput } from '../currency';

describe('Currency Utilities (Minor Units / Integer Cents)', () => {
  it('formats integer cents into German Euro strings', () => {
    expect(formatCurrency(80000)).toBe('800,00 €');
    expect(formatCurrency(123456)).toBe('1.234,56 €');
    expect(formatCurrency(50)).toBe('0,50 €');
    expect(formatCurrency(0)).toBe('0,00 €');
  });

  it('formats negative currency correctly', () => {
    expect(formatCurrency(-70000)).toBe('-700,00 €');
    expect(formatCurrency(-150)).toBe('-1,50 €');
  });

  it('parses German decimal comma strings into integer cents', () => {
    expect(parseCurrencyInput('800,00')).toBe(80000);
    expect(parseCurrencyInput('1.234,56')).toBe(123456);
    expect(parseCurrencyInput('50,20 €')).toBe(5020);
    expect(parseCurrencyInput('-700,00')).toBe(-70000);
    expect(parseCurrencyInput('0')).toBe(0);
    expect(parseCurrencyInput('')).toBe(0);
  });
});

