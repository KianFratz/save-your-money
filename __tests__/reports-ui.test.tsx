import { expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import type { Budget, BudgetGroupKey, BudgetRecord, GroupSummary } from '@/domain/budget-types';
import { BudgetReport } from '@/features/reports/report-ui';

test('shows group plans and net category activity without category caps', async () => {
  const budget = createBudget({
    spentCents: 60000,
    remainingCents: 40000,
    groups: [
      createGroup('needs', {
        spentCents: 55000,
        remainingCents: -5000,
        categories: [
          {
            categoryId: 1,
            categoryName: 'Food',
            groupKey: 'needs',
            spentCents: 30000,
            displayOrder: 0,
          },
          {
            categoryId: 3,
            categoryName: 'Unused category',
            groupKey: 'needs',
            spentCents: 0,
            displayOrder: 2,
          },
        ],
      }),
      createGroup('wants'),
      createGroup('savings', {
        spentCents: 5000,
        remainingCents: 15000,
        categories: [
          {
            categoryId: 4,
            categoryName: 'GoTyme',
            groupKey: 'savings',
            spentCents: 5000,
            displayOrder: 0,
          },
        ],
      }),
    ],
  });
  const recordsByGroup = createRecordsByGroup({
    needs: [
      createRecord(1, 1, 'Food', 35000, 'Groceries'),
      createRecord(2, 1, 'Food', 5000, 'Partial refund', { type: 'refund' }),
      createRecord(3, 2, 'Fare', 25000, 'Commute'),
    ],
    savings: [createRecord(4, 4, 'GoTyme', 5000, 'Payday transfer', { groupKey: 'savings' })],
  });

  await render(
    <BudgetReport budget={budget} recordsByGroup={recordsByGroup} onViewAll={jest.fn()} />,
  );

  expect(
    screen.getByRole('image', {
      name: /Planned allocation\. Needs 50 percent, ₱500\.00; Wants 30 percent, ₱300\.00/,
    }),
  ).toBeTruthy();
  expect(
    screen.getByRole('progressbar', {
      name: 'Needs spending: ₱550.00 of ₱500.00',
    }),
  ).toBeTruthy();
  expect(
    screen.getByRole('progressbar', {
      name: 'Savings saving: ₱50.00 of ₱200.00',
    }),
  ).toBeTruthy();
  expect(screen.getByText('₱50.00 over this group plan')).toBeTruthy();
  expect(screen.getByText('₱300.00 spent')).toBeTruthy();
  expect(screen.getByText('₱250.00 spent')).toBeTruthy();
  expect(screen.getByText('₱50.00 saved')).toBeTruthy();
  expect(screen.getByText('Fare')).toBeTruthy();
  expect(screen.getByText('GoTyme')).toBeTruthy();
  expect(screen.queryByText('No allocation')).toBeNull();
  expect(screen.queryByText('Unused category')).toBeNull();
  expect(screen.queryByText('Unallocated')).toBeNull();
  expect(screen.queryByText('Not assigned to a Category')).toBeNull();
  expect(screen.queryByRole('progressbar', { name: /Food/ })).toBeNull();
  expect(screen.getByText('Groceries')).toBeTruthy();
  expect(screen.getByText('Commute')).toBeTruthy();
});

test('keeps the chart structure visible before spending starts', async () => {
  const budget = createBudget();

  await render(
    <BudgetReport budget={budget} recordsByGroup={createRecordsByGroup()} onViewAll={jest.fn()} />,
  );

  expect(
    screen.getByRole('progressbar', { name: 'Overall spending: ₱0.00 of ₱1,000.00' }),
  ).toBeTruthy();
  expect(screen.getAllByText('No spending recorded yet.')).toHaveLength(3);
  expect(screen.getByText('No saving recorded yet.')).toBeTruthy();
  expect(screen.getAllByText('No category activity yet.')).toHaveLength(3);
});

function createBudget(overrides: Partial<Budget> = {}): Budget {
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
    groups: [createGroup('needs'), createGroup('wants'), createGroup('savings')],
    ...overrides,
  };
}

function createGroup(
  groupKey: BudgetGroupKey,
  overrides: Partial<GroupSummary> = {},
): GroupSummary {
  const percentage = groupKey === 'needs' ? 50 : groupKey === 'wants' ? 30 : 20;
  const allocatedCents = percentage * 1000;
  return {
    groupKey,
    percentage,
    allocatedCents,
    spentCents: 0,
    remainingCents: allocatedCents,
    categories: [],
    ...overrides,
  };
}

function createRecordsByGroup(
  overrides: Partial<Record<BudgetGroupKey, BudgetRecord[]>> = {},
): Record<BudgetGroupKey, BudgetRecord[]> {
  return {
    needs: [],
    wants: [],
    savings: [],
    ...overrides,
  };
}

function createRecord(
  id: number,
  categoryId: number,
  categoryName: string,
  amountCents: number,
  description: string,
  overrides: Partial<Pick<BudgetRecord, 'groupKey' | 'type'>> = {},
): BudgetRecord {
  return {
    id,
    budgetId: 1,
    type: 'expenditure',
    amountCents,
    effectiveDate: '2026-11-09',
    categoryId,
    categoryName,
    groupKey: 'needs',
    savingsSourceCategoryId: null,
    savingsSourceCategoryName: null,
    linkedRecordId: null,
    description,
    budgetCadence: 'biweekly',
    budgetStartDate: '2026-11-01',
    budgetEndDate: '2026-11-14',
    ...overrides,
  };
}
