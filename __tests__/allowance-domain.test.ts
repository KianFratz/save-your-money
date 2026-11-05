import { describe, expect, test } from '@jest/globals';

import {
  allocateByLargestRemainder,
  getNextPeriodAnchor,
  getPeriodBounds,
  isValidIsoDate,
  validateGroupPercentages,
} from '@/domain/allowance';
import { formatPesoInput, parsePesoInput } from '@/domain/money';

describe('allowance money rules', () => {
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

describe('allowance period boundaries', () => {
  test('uses calendar month boundaries for monthly allowance', () => {
    expect(getPeriodBounds('monthly', '2028-02-14')).toEqual({
      startDate: '2028-02-01',
      endDate: '2028-02-29',
    });
  });

  test('uses exactly 14 inclusive days for a biweekly allowance', () => {
    expect(getPeriodBounds('biweekly', '2026-11-06')).toEqual({
      startDate: '2026-11-06',
      endDate: '2026-11-19',
    });
  });

  test('starts the next allowance on the day after the prior period', () => {
    expect(getNextPeriodAnchor('2026-12-31')).toBe('2027-01-01');
  });

  test('rejects impossible dates', () => {
    expect(() => getPeriodBounds('monthly', '2026-02-30')).toThrow('valid calendar date');
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-02-28')).toBe(true);
  });
});
