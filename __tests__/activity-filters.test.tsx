import { expect, jest, test } from '@jest/globals';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import ActivityScreen from '@/app/transactions';
import type { BudgetRecord, BudgetSnapshot } from '@/domain/budget-types';

const records: BudgetRecord[] = [
  createRecord(2, 'Movie night', 'Entertainment', 'wants'),
  createRecord(1, 'Lunch', 'Food', 'needs'),
];

const mockSnapshot: BudgetSnapshot = {
  categories: [],
  records,
  budgets: [
    {
      id: 1,
      cadence: 'biweekly',
      startDate: '2026-11-01',
      endDate: '2026-11-14',
      receivedCents: 100000,
      archived: false,
      legacyPeriodId: null,
      needsPercentage: 50,
      wantsPercentage: 30,
      savingsPercentage: 20,
      spentCents: 2000,
      remainingCents: 98000,
      timing: 'current',
      groups: [],
    },
  ],
};

jest.mock('@/features/budget/budget-data-provider', () => ({
  useClearBudgetErrorOnBlur: jest.fn(),
  useBudgetData: () => ({
    snapshot: mockSnapshot,
    isLoading: false,
    isSaving: false,
    errorMessage: null,
    saveRecord: jest.fn(),
    removeRecord: jest.fn(),
  }),
}));

test('applies routed budget and group filters and lets the group filter be cleared', async () => {
  await renderRouter(
    { transactions: ActivityScreen },
    {
      initialUrl: '/transactions?budgetId=1&group=needs',
    },
  );

  expect(screen.getByText('Lunch')).toBeTruthy();
  expect(screen.queryByText('Movie night')).toBeNull();
  expect(screen.getByRole('radio', { name: 'Needs' }).props.accessibilityState).toEqual({
    selected: true,
  });

  await fireEvent.press(screen.getByRole('radio', { name: 'All groups' }));

  expect(screen.getByText('Movie night')).toBeTruthy();
});

function createRecord(
  id: number,
  description: string,
  categoryName: string,
  groupKey: BudgetRecord['groupKey'],
): BudgetRecord {
  return {
    id,
    budgetId: 1,
    type: 'expenditure',
    amountCents: 1000,
    effectiveDate: '2026-11-08',
    categoryId: id,
    categoryName,
    groupKey,
    savingsSourceCategoryId: null,
    savingsSourceCategoryName: null,
    linkedRecordId: null,
    description,
    budgetCadence: 'biweekly',
    budgetStartDate: '2026-11-01',
    budgetEndDate: '2026-11-14',
  };
}
