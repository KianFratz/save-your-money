import { expect, jest, test } from '@jest/globals';
import { renderRouter, screen } from 'expo-router/testing-library';

import BudgetDetailScreen from '@/app/budget/[id]';
import type { BudgetSnapshot } from '@/domain/budget-types';

const mockSnapshot: BudgetSnapshot = {
  records: [],
  categories: [],
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
      spentCents: 0,
      remainingCents: 100000,
      timing: 'current',
      groups: [
        {
          groupKey: 'needs',
          percentage: 50,
          allocatedCents: 50000,
          spentCents: 0,
          remainingCents: 50000,
          categories: [
            {
              categoryId: 1,
              categoryName: 'Fare',
              groupKey: 'needs',
              spentCents: 0,
              displayOrder: 0,
            },
          ],
        },
        {
          groupKey: 'wants',
          percentage: 30,
          allocatedCents: 30000,
          spentCents: 0,
          remainingCents: 30000,
          categories: [],
        },
        {
          groupKey: 'savings',
          percentage: 20,
          allocatedCents: 20000,
          spentCents: 0,
          remainingCents: 20000,
          categories: [],
        },
      ],
    },
  ],
};

jest.mock('@/features/budget/budget-data-provider', () => ({
  useBudgetData: () => ({
    snapshot: mockSnapshot,
    isLoading: false,
    isSaving: false,
    errorMessage: null,
    update: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    removeEmpty: jest.fn(),
    saveRecord: jest.fn(),
    removeRecord: jest.fn(),
  }),
}));

test('does not offer category allocation editing from budget details', async () => {
  await renderRouter({ 'budget/[id]': BudgetDetailScreen }, { initialUrl: '/budget/1' });

  expect(screen.getByRole('header', { name: 'Activity by group' })).toBeTruthy();
  expect(screen.getAllByText('No expenses logged in this group yet.')).toHaveLength(3);
  expect(screen.queryByText('Fare')).toBeNull();
  expect(screen.queryByRole('header', { name: 'Activity' })).toBeNull();
  expect(screen.queryByText(/Edit .* allocations/i)).toBeNull();
  expect(screen.queryByLabelText('Fare allocation')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Save allocation' })).toBeNull();
});
