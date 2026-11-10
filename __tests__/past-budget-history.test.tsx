import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import BudgetScreen from '@/app/budget/index';
import type { Budget, BudgetSnapshot } from '@/domain/budget-types';

let mockSnapshot: BudgetSnapshot;

jest.mock('@/features/budget/budget-data-provider', () => ({
  useClearBudgetErrorOnBlur: jest.fn(),
  useBudgetData: () => ({
    snapshot: mockSnapshot,
    isLoading: false,
    isSaving: false,
    errorMessage: null,
    refresh: jest.fn(),
    create: jest.fn(),
  }),
}));

beforeEach(() => {
  mockSnapshot = { budgets: [], records: [], categories: [] };
});

test('shows the two latest past budget periods and expands the full history inline', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createPastBudget(1, '2026-08-01', '2026-08-14'),
      createPastBudget(3, '2026-10-01', '2026-10-14'),
      createPastBudget(2, '2026-09-01', '2026-09-14'),
    ],
  };

  await renderBudgetScreen();

  expect(screen.getByText('Oct 1 – Oct 14, 2026')).toBeTruthy();
  expect(screen.getByText('Sep 1 – Sep 14, 2026')).toBeTruthy();
  expect(screen.queryByText('Aug 1 – Aug 14, 2026')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'View all' }));

  expect(screen.getByText('Aug 1 – Aug 14, 2026')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Show less' }));
  expect(screen.queryByText('Aug 1 – Aug 14, 2026')).toBeNull();
});

test('filters the complete past history by start year and cadence', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createPastBudget(5, '2026-10-01', '2026-10-31', 'monthly'),
      createPastBudget(4, '2026-09-01', '2026-09-14'),
      createPastBudget(3, '2025-12-15', '2026-01-14', 'monthly'),
      createPastBudget(2, '2025-10-01', '2025-10-31', 'monthly'),
      createPastBudget(1, '2025-08-01', '2025-08-31', 'monthly'),
    ],
  };

  await renderBudgetScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Filter' }));
  await fireEvent.press(screen.getByRole('radio', { name: '2025' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Monthly' }));

  expect(screen.getByText('Dec 15 – Jan 14, 2026')).toBeTruthy();
  expect(screen.getByText('Oct 1 – Oct 31, 2025')).toBeTruthy();
  expect(screen.getByText('Aug 1 – Aug 31, 2025')).toBeTruthy();
  expect(screen.queryByText('Oct 1 – Oct 31, 2026')).toBeNull();
  expect(screen.queryByRole('button', { name: 'View all' })).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));

  expect(screen.getByText('Oct 1 – Oct 31, 2026')).toBeTruthy();
  expect(screen.getByText('Sep 1 – Sep 14, 2026')).toBeTruthy();
  expect(screen.queryByText('Dec 15 – Jan 14, 2026')).toBeNull();
  expect(screen.getByRole('button', { name: 'View all' })).toBeTruthy();
});

test('offers one reset action when no past budgets match the filters', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createPastBudget(2, '2026-10-01', '2026-10-31', 'monthly'),
      createPastBudget(1, '2025-09-01', '2025-09-14'),
    ],
  };

  await renderBudgetScreen();
  expect(screen.queryByRole('button', { name: 'View all' })).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Filter' }));
  await fireEvent.press(screen.getByRole('radio', { name: '2026' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Biweekly' }));

  expect(screen.getByText('No past budgets match these filters.')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Reset filters' })).toHaveLength(1);

  await fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByText('Oct 1 – Oct 31, 2026')).toBeTruthy();
});

async function renderBudgetScreen() {
  return renderRouter({ 'budget/index': BudgetScreen }, { initialUrl: '/budget' });
}

function createPastBudget(
  id: number,
  startDate: string,
  endDate: string,
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
    timing: 'past',
    groups: [],
  };
}
