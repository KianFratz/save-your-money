import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { BudgetRecord, CreateBudgetInput, GroupSummary } from '@/domain/budget-types';
import { NewBudgetForm } from '@/features/budget/budget-form';
import { GroupLane } from '@/features/budget/budget-ui';

test('creates a budget without assigning money to individual categories', async () => {
  const onSubmit = jest.fn(async (_input: CreateBudgetInput) => undefined);
  await render(<NewBudgetForm isSaving={false} onSubmit={onSubmit} />);

  await fireEvent.changeText(screen.getByLabelText('Received amount'), '1000');
  await fireEvent.press(screen.getByRole('button', { name: 'Create budget' }));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        receivedCents: 100000,
        needsPercentage: 50,
        wantsPercentage: 30,
        savingsPercentage: 20,
      }),
    ),
  );
  expect(screen.queryByText(/category allocation/i)).toBeNull();
});

test('shows the three newest group records instead of category allocation rows', async () => {
  const onViewAll = jest.fn();
  const group: GroupSummary = {
    groupKey: 'needs',
    percentage: 50,
    allocatedCents: 100000,
    spentCents: 50000,
    remainingCents: 50000,
    categories: [
      {
        categoryId: 1,
        categoryName: 'Food',
        groupKey: 'needs',
        spentCents: 50000,
        displayOrder: 0,
      },
      {
        categoryId: 2,
        categoryName: 'Fare',
        groupKey: 'needs',
        spentCents: 0,
        displayOrder: 1,
      },
    ],
  };
  const records: BudgetRecord[] = [
    createRecord(4, 'Lunch', 'Food', '2026-11-08'),
    createRecord(3, 'Bus fare', 'Fare', '2026-11-07'),
    { ...createRecord(2, 'Returned order', 'Food', '2026-11-06'), type: 'refund' },
    createRecord(1, 'Oldest expense', 'Food', '2026-11-05'),
  ];

  await render(<GroupLane group={group} records={records} onViewAll={onViewAll} />);

  expect(screen.getByText('Lunch')).toBeTruthy();
  expect(screen.getByText('Food · 2026-11-08')).toBeTruthy();
  expect(screen.getByText('Refund · Food · 2026-11-06')).toBeTruthy();
  expect(screen.queryByText('Oldest expense')).toBeNull();
  expect(screen.queryByText('₱500.00 spent · No budget set')).toBeNull();
  expect(screen.queryByText(/not assigned to a category/i)).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'View all Needs activity' }));
  expect(onViewAll).toHaveBeenCalledTimes(1);
});

test('explains an empty group without offering a redundant view-all action', async () => {
  const group: GroupSummary = {
    groupKey: 'wants',
    percentage: 30,
    allocatedCents: 30000,
    spentCents: 0,
    remainingCents: 30000,
    categories: [],
  };

  await render(<GroupLane group={group} records={[]} />);

  expect(screen.getByText('No expenses logged in this group yet.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'View all Wants activity' })).toBeNull();
});

test('labels Savings expenditures as saved money', async () => {
  const group: GroupSummary = {
    groupKey: 'savings',
    percentage: 20,
    allocatedCents: 20000,
    spentCents: 1000,
    remainingCents: 19000,
    categories: [],
  };
  const record = createRecord(1, 'Payday transfer', 'GoTyme', '2026-11-08', 'savings');

  await render(<GroupLane group={group} records={[record]} />);

  expect(screen.getByText('Payday transfer')).toBeTruthy();
  expect(screen.getByText('Saved money · GoTyme · 2026-11-08')).toBeTruthy();
});

function createRecord(
  id: number,
  description: string,
  categoryName: string,
  effectiveDate: string,
  groupKey: BudgetRecord['groupKey'] = 'needs',
): BudgetRecord {
  return {
    id,
    budgetId: 1,
    type: 'expenditure',
    amountCents: 1000,
    effectiveDate,
    categoryId: 1,
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
