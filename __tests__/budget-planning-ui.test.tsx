import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { CreateBudgetInput, GroupSummary } from '@/domain/budget-types';
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
        categoryAllocations: [],
      }),
    ),
  );
  expect(screen.queryByText(/category allocation/i)).toBeNull();
});

test('describes categories without allocations as having no budget set', async () => {
  const group: GroupSummary = {
    groupKey: 'needs',
    percentage: 50,
    allocatedCents: 100000,
    categoryAllocatedCents: 0,
    spentCents: 50000,
    remainingCents: 50000,
    unallocatedCents: 100000,
    categories: [
      {
        categoryId: 1,
        categoryName: 'Food',
        groupKey: 'needs',
        allocatedCents: 0,
        spentCents: 50000,
        remainingCents: -50000,
        displayOrder: 0,
      },
      {
        categoryId: 2,
        categoryName: 'Fare',
        groupKey: 'needs',
        allocatedCents: 0,
        spentCents: 0,
        remainingCents: 0,
        displayOrder: 1,
      },
    ],
  };

  await render(<GroupLane group={group} expanded />);

  expect(screen.getByText('₱500.00 spent · No budget set')).toBeTruthy();
  expect(screen.getByText('No budget set')).toBeTruthy();
});
