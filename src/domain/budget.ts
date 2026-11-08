import { BUDGET_GROUPS } from '@/constants/budget';
import type { BudgetCadence, BudgetGroupKey, BudgetTiming } from '@/domain/budget-types';

export type GroupPercentages = Readonly<Record<BudgetGroupKey, number>>;

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
    if (centsLeft === 0) break;
    allocations[item.groupKey] += 1;
    centsLeft -= 1;
  }

  return allocations;
}

export function getBudgetBounds(cadence: BudgetCadence, startDate: string) {
  const start = parseIsoDate(startDate);
  const end = new Date(start);

  if (cadence === 'biweekly') {
    end.setUTCDate(end.getUTCDate() + 13);
    return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
  }

  const nextMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const lastDayOfNextMonth = new Date(
    Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0),
  ).getUTCDate();
  nextMonth.setUTCDate(Math.min(start.getUTCDate(), lastDayOfNextMonth));
  end.setTime(nextMonth.getTime());
  end.setUTCDate(end.getUTCDate() - 1);
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
}

export function getBudgetTiming(
  startDate: string,
  endDate: string,
  referenceDate = todayIsoDate(),
): BudgetTiming {
  if (referenceDate < startDate) return 'upcoming';
  if (referenceDate > endDate) return 'past';
  return 'current';
}

export function formatBudgetPeriod(startDate: string, endDate: string): string {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const startFormatter = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' });
  const endFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startFormatter.format(start)} – ${endFormatter.format(end)}`;
}

export function formatBudgetIdentity(
  cadence: BudgetCadence,
  startDate: string,
  endDate: string,
): string {
  return `${cadence === 'biweekly' ? 'Biweekly' : 'Monthly'} · ${formatBudgetPeriod(startDate, endDate)}`;
}

export function todayIsoDate(): string {
  const today = new Date();
  return formatIsoDate(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
}

export function isValidIsoDate(value: string): boolean {
  try {
    parseIsoDate(value);
    return true;
  } catch {
    return false;
  }
}

export function parseIsoDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Use a date in YYYY-MM-DD format.');
  }
  const [year, month, day] = value.split('-').map(Number);
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
