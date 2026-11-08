import { beforeEach, expect, jest, test } from '@jest/globals';
import { renderRouter, screen } from 'expo-router/testing-library';

import BudgetScreen from '@/app/budget/index';
import HomeScreen from '@/app/index';
import type { Budget, BudgetSnapshot, Category } from '@/domain/budget-types';

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
    saveRecord: jest.fn(),
  }),
}));

beforeEach(() => {
  mockSnapshot = {
    budgets: [],
    records: [],
    categories: [createSavingsCategory(0)],
  };
});

test('shows one current budget without a duplicate aggregate summary', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createBudget({
        id: 1,
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        receivedCents: 100000,
        spentCents: 20000,
        remainingCents: 80000,
      }),
    ],
    categories: [createSavingsCategory(25000)],
  };

  await renderHome();

  expect(screen.getByRole('header', { name: 'Budget covering today' })).toBeTruthy();
  expect(screen.queryByText(/Across 1 budget/)).toBeNull();
  expect(screen.getByRole('header', { name: 'Savings set aside' })).toBeTruthy();
  expect(screen.getByText('₱250.00')).toBeTruthy();
  expect(screen.getByText('Across all budgets, after withdrawals')).toBeTruthy();
});

test('summarizes overlapping budgets without hiding an over-plan budget', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createBudget({
        id: 1,
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        receivedCents: 100000,
        spentCents: 20000,
        remainingCents: 80000,
      }),
      createBudget({
        id: 2,
        startDate: '2026-11-05',
        endDate: '2026-11-14',
        receivedCents: 50000,
        spentCents: 60000,
        remainingCents: -10000,
      }),
    ],
  };

  await renderHome();

  expect(screen.getByRole('header', { name: 'Budgets covering today' })).toBeTruthy();
  expect(screen.getByText('Across 2 budgets')).toBeTruthy();
  expect(screen.getByText('₱700.00 remaining')).toBeTruthy();
  expect(screen.getByText('₱1,500.00 received · ₱800.00 spent')).toBeTruthy();
  expect(screen.getByText('1 budget is over plan')).toBeTruthy();

  const budgetLinks = screen.getAllByRole('button', { name: /^Open / });
  expect(budgetLinks[0]?.props.accessibilityLabel).toContain('Nov 5 – Nov 14, 2026');
  expect(budgetLinks[1]?.props.accessibilityLabel).toContain('Nov 1 – Nov 30, 2026');
});

test('shows only the nearest upcoming budget when no budget covers today', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createBudget({
        id: 1,
        timing: 'past',
        startDate: '2026-09-01',
        endDate: '2026-09-14',
      }),
      createBudget({
        id: 2,
        timing: 'upcoming',
        startDate: '2026-12-15',
        endDate: '2026-12-28',
      }),
      createBudget({
        id: 3,
        timing: 'upcoming',
        startDate: '2026-12-01',
        endDate: '2026-12-14',
      }),
    ],
  };

  await renderHome();

  expect(screen.getByText('No budget covers today')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Next budget' })).toBeTruthy();
  const budgetLinks = screen.getAllByRole('button', { name: /^Open / });
  expect(budgetLinks).toHaveLength(1);
  expect(budgetLinks[0]?.props.accessibilityLabel).toContain('Dec 1 – Dec 14, 2026');
  expect(screen.queryByText('Create budget')).toBeNull();
});

test('offers budget creation when only past budgets remain', async () => {
  mockSnapshot = {
    ...mockSnapshot,
    budgets: [
      createBudget({
        id: 1,
        timing: 'past',
        startDate: '2026-09-01',
        endDate: '2026-09-14',
      }),
    ],
  };

  await renderHome();

  expect(screen.getByText('No budget covers today')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Create budget' })).toBeTruthy();
  expect(screen.queryByRole('header', { name: 'Next budget' })).toBeNull();
});

test('describes unarchived budgets without calling them active', async () => {
  await renderRouter({ 'budget/index': BudgetScreen }, { initialUrl: '/budget' });

  expect(screen.getByRole('radio', { name: 'Budgets' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Archived' })).toBeTruthy();
  expect(screen.queryByText('Active')).toBeNull();
});

async function renderHome() {
  return renderRouter({ index: HomeScreen }, { initialUrl: '/' });
}

function createBudget(overrides: Partial<Budget>): Budget {
  return {
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
    groups: [],
    ...overrides,
  };
}

function createSavingsCategory(savedBalanceCents: number): Category {
  return {
    id: 1,
    name: 'GoTyme',
    groupKey: 'savings',
    displayOrder: 0,
    archived: false,
    savedBalanceCents,
  };
}
