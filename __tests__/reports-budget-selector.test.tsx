import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import ReportsScreen from '@/app/reports';
import type { Budget, BudgetGroupKey, BudgetSnapshot, GroupSummary } from '@/domain/budget-types';

let mockSnapshot: BudgetSnapshot;

jest.mock('@/features/budget/budget-data-provider', () => ({
  useClearBudgetErrorOnBlur: jest.fn(),
  useBudgetData: () => ({
    snapshot: mockSnapshot,
    isLoading: false,
    errorMessage: null,
  }),
}));

beforeEach(() => {
  mockSnapshot = { budgets: [], records: [], categories: [] };
});

test('shows two report budgets and keeps an older selection visible when collapsed', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createBudget(1, '2026-10-01', '2026-10-14', 'past'),
      createBudget(3, '2026-12-01', '2026-12-14', 'upcoming'),
      createBudget(2, '2026-11-07', '2026-11-20', 'current'),
      createBudget(4, '2027-01-01', '2027-01-31', 'upcoming', 'monthly'),
    ],
  };

  await renderReportsScreen();

  expect(screen.getByRole('radio', { name: 'Monthly · Jan 1 – Jan 31, 2027' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Biweekly · Nov 7 – Nov 20, 2026' })).toBeTruthy();
  expect(screen.queryByRole('radio', { name: 'Biweekly · Dec 1 – Dec 14, 2026' })).toBeNull();
  expect(screen.queryByRole('radio', { name: 'Biweekly · Oct 1 – Oct 14, 2026' })).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'View all' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Biweekly · Oct 1 – Oct 14, 2026' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Show less' }));

  expect(screen.getByRole('radio', { name: 'Biweekly · Oct 1 – Oct 14, 2026' })).toBeTruthy();
  expect(screen.queryByRole('radio', { name: 'Biweekly · Nov 7 – Nov 20, 2026' })).toBeNull();
});

test('filters the complete report budget list by start year and cadence', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createBudget(5, '2026-11-07', '2026-11-20', 'current'),
      createBudget(4, '2025-12-15', '2026-01-14', 'past', 'monthly'),
      createBudget(3, '2025-10-01', '2025-10-31', 'past', 'monthly'),
      createBudget(2, '2025-09-01', '2025-09-14', 'past'),
      createBudget(1, '2024-08-01', '2024-08-31', 'past', 'monthly'),
    ],
  };

  await renderReportsScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Filter' }));
  await fireEvent.press(screen.getByRole('radio', { name: '2025' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Monthly' }));

  expect(screen.getByRole('radio', { name: 'Monthly · Dec 15 – Jan 14, 2026' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Monthly · Oct 1 – Oct 31, 2025' })).toBeTruthy();
  expect(screen.queryByRole('radio', { name: 'Biweekly · Sep 1 – Sep 14, 2025' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'View all' })).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));

  expect(screen.getByRole('radio', { name: 'Biweekly · Nov 7 – Nov 20, 2026' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'View all' })).toBeTruthy();
});

async function renderReportsScreen() {
  return renderRouter({ reports: ReportsScreen }, { initialUrl: '/reports' });
}

function createBudget(
  id: number,
  startDate: string,
  endDate: string,
  timing: Budget['timing'],
  cadence: Budget['cadence'] = 'biweekly',
): Budget {
  return {
    id,
    cadence,
    startDate,
    endDate,
    receivedCents: 100000,
    archived: false,
    legacyPeriodId: null,
    needsPercentage: 50,
    wantsPercentage: 30,
    savingsPercentage: 20,
    spentCents: 0,
    remainingCents: 100000,
    timing,
    groups: [createGroup('needs', 50), createGroup('wants', 30), createGroup('savings', 20)],
  };
}

function createGroup(groupKey: BudgetGroupKey, percentage: number): GroupSummary {
  const allocatedCents = percentage * 1000;
  return {
    groupKey,
    percentage,
    allocatedCents,
    spentCents: 0,
    remainingCents: allocatedCents,
    categories: [],
  };
}
