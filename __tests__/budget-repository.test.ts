import { expect, jest, test } from '@jest/globals';
import type { SQLiteDatabase } from 'expo-sqlite';

import { updateBudget } from '@/data/repositories/budget-repository';

test('updates a migrated budget without enforcing legacy category allocations', async () => {
  const getFirstAsync = jest.fn(async (query: string) => {
    if (query.includes('FROM budgets WHERE id')) return { id: 1 };
    if (query.includes('MIN(effective_date)')) return { first_date: null, last_date: null };
    return null;
  });
  const runAsync = jest.fn(async () => ({ changes: 1, lastInsertRowId: 0 }));
  const database = { getFirstAsync, runAsync } as unknown as SQLiteDatabase;

  await updateBudget(database, {
    budgetId: 1,
    cadence: 'biweekly',
    startDate: '2026-11-01',
    receivedCents: 100000,
    needsPercentage: 50,
    wantsPercentage: 30,
    savingsPercentage: 20,
  });

  expect(getFirstAsync).toHaveBeenCalledTimes(2);
  expect(getFirstAsync.mock.calls.some(([query]) => query.includes('allocated_cents'))).toBe(false);
  expect(runAsync).toHaveBeenCalledTimes(1);
});
