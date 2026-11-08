import { describe, expect, test } from '@jest/globals';

import {
  allocateByLargestRemainder,
  getBudgetBounds,
  getBudgetTiming,
  isValidIsoDate,
  validateGroupPercentages,
} from '@/domain/budget';
import { formatPesoInput, parsePesoInput } from '@/domain/money';

describe('budget money rules', () => {
  test('parses pesos into integer cents without floating-point math', () => {
    expect(parsePesoInput('1,234.50')).toBe(123450);
    expect(parsePesoInput('0.01')).toBe(1);
    expect(parsePesoInput('12.345')).toBeNull();
    expect(parsePesoInput('0')).toBeNull();
    expect(formatPesoInput(123450)).toBe('1234.50');
  });

  test('requires whole percentages that total exactly 100', () => {
    expect(validateGroupPercentages({ needs: 50, wants: 30, savings: 20 })).toBe(true);
    expect(validateGroupPercentages({ needs: 50, wants: 30, savings: 19 })).toBe(false);
    expect(validateGroupPercentages({ needs: 49.5, wants: 30.5, savings: 20 })).toBe(false);
  });

  test('allocates every cent deterministically', () => {
    const result = allocateByLargestRemainder(101, { needs: 50, wants: 30, savings: 20 });
    expect(result).toEqual({ needs: 51, wants: 30, savings: 20 });
    expect(result.needs + result.wants + result.savings).toBe(101);
  });
});

describe('budget period boundaries', () => {
  test('monthly budget starts on the selected payday and ends before the next matching date', () => {
    expect(getBudgetBounds('monthly', '2028-02-14')).toEqual({
      startDate: '2028-02-14',
      endDate: '2028-03-13',
    });
  });

  test('clamps a monthly boundary when the next month is shorter', () => {
    expect(getBudgetBounds('monthly', '2027-01-31')).toEqual({
      startDate: '2027-01-31',
      endDate: '2027-02-27',
    });
  });

  test('uses exactly 14 inclusive days for a biweekly budget', () => {
    expect(getBudgetBounds('biweekly', '2026-11-06')).toEqual({
      startDate: '2026-11-06',
      endDate: '2026-11-19',
    });
  });

  test('derives timing from dates', () => {
    expect(getBudgetTiming('2026-11-01', '2026-11-14', '2026-10-31')).toBe('upcoming');
    expect(getBudgetTiming('2026-11-01', '2026-11-14', '2026-11-07')).toBe('current');
    expect(getBudgetTiming('2026-11-01', '2026-11-14', '2026-11-15')).toBe('past');
  });

  test('rejects impossible dates', () => {
    expect(() => getBudgetBounds('monthly', '2026-02-30')).toThrow('valid calendar date');
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-02-28')).toBe(true);
  });
});
