import { BUDGET_GROUPS } from '@/constants/allowance';
import type { AllowanceCadence, BudgetGroupKey } from '@/domain/allowance-types';

type GroupPercentages = Readonly<Record<BudgetGroupKey, number>>;

export function validateGroupPercentages(percentages: GroupPercentages): boolean {
  return (
    BUDGET_GROUPS.every((groupKey) => Number.isInteger(percentages[groupKey])) &&
    BUDGET_GROUPS.every((groupKey) => percentages[groupKey] >= 0) &&
    BUDGET_GROUPS.reduce((sum, groupKey) => sum + percentages[groupKey], 0) === 100
  );
}

export function allocateByLargestRemainder(
  totalCents: number,
  percentages: GroupPercentages,
): Record<BudgetGroupKey, number> {
  if (!validateGroupPercentages(percentages)) {
    throw new Error('Group percentages must be whole numbers totaling 100%.');
  }

  const allocations = {} as Record<BudgetGroupKey, number>;
  const remainders = BUDGET_GROUPS.map((groupKey, index) => {
    const exactNumerator = totalCents * percentages[groupKey];
    allocations[groupKey] = Math.floor(exactNumerator / 100);
    return { groupKey, remainder: exactNumerator % 100, index };
  });

  let centsLeft = totalCents - BUDGET_GROUPS.reduce((sum, key) => sum + allocations[key], 0);
  remainders.sort((left, right) => right.remainder - left.remainder || left.index - right.index);

  for (const item of remainders) {
    if (centsLeft === 0) {
      break;
    }
    allocations[item.groupKey] += 1;
    centsLeft -= 1;
  }

  return allocations;
}

export function getPeriodBounds(cadence: AllowanceCadence, anchorDate: string) {
  const anchor = parseIsoDate(anchorDate);

  if (cadence === 'monthly') {
    const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
    const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0));
    return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
  }

  const end = new Date(anchor);
  end.setUTCDate(end.getUTCDate() + 13);
  return { startDate: formatIsoDate(anchor), endDate: formatIsoDate(end) };
}

export function todayIsoDate(): string {
  const today = new Date();
  const local = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return formatIsoDate(local);
}

export function formatPeriodLabel(startDate: string, endDate: string): string {
  const dateFormatter = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' });
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const startLabel = dateFormatter.format(start);
  const endLabel = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

export function getNextPeriodAnchor(endDate: string): string {
  const next = parseIsoDate(endDate);
  next.setUTCDate(next.getUTCDate() + 1);
  return formatIsoDate(next);
}

export function isValidIsoDate(value: string): boolean {
  try {
    parseIsoDate(value);
    return true;
  } catch {
    return false;
  }
}

function parseIsoDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Use a date in YYYY-MM-DD format.');
  }

  const parts = value.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error('Use a date in YYYY-MM-DD format.');
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Enter a valid calendar date.');
  }
  return date;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
