import { expect, jest, test } from '@jest/globals';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import TabLayout from '@/app/_layout';
import BudgetScreen from '@/app/budget/index';
import HomeScreen from '@/app/index';
import ReportsScreen from '@/app/reports';
import SettingsScreen from '@/app/settings';
import ActivityScreen from '@/app/transactions';
import WebTabs from '@/components/app-tabs.web';
import { StateMessage } from '@/components/state-message';

jest.mock('expo-sqlite', () => ({
  SQLiteProvider: ({ children }: PropsWithChildren) => children,
}));

const emptySnapshot = { budgets: [], records: [], categories: [] };

jest.mock('@/features/budget/budget-data-provider', () => ({
  BudgetDataProvider: ({ children }: PropsWithChildren) => children,
  useClearBudgetErrorOnBlur: jest.fn(),
  useBudgetData: () => ({
    snapshot: emptySnapshot,
    isLoading: false,
    isSaving: false,
    errorMessage: null,
    refresh: jest.fn(),
    clearError: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    setAllocation: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    removeEmpty: jest.fn(),
    saveRecord: jest.fn(),
    removeRecord: jest.fn(),
    createCategory: jest.fn(),
  }),
}));

const routes = {
  _layout: TabLayout,
  index: HomeScreen,
  'budget/index': BudgetScreen,
  transactions: ActivityScreen,
  reports: ReportsScreen,
  settings: SettingsScreen,
};

test.each([
  ['/', 'Your money', 'Start with a budget'],
  ['/budget', 'Budgets', 'Create your first budget'],
  ['/transactions', 'Activity', 'Ledger'],
  ['/reports', 'Reports', 'No report yet'],
  ['/settings', 'Settings', 'Your data stays on this device'],
])('opens %s without an account', async (path, title, message) => {
  const { getPathname } = await renderRouter(routes, { initialUrl: path });

  expect(getPathname()).toBe(path);
  expect(screen.getByRole('header', { name: title })).toBeTruthy();
  expect(screen.getByText(message)).toBeTruthy();
});

test('switches tabs through the web shell', async () => {
  const { getPathname } = await renderRouter({ ...routes, _layout: WebTabs }, { initialUrl: '/' });

  for (const [label, path, header] of [
    ['Budget', '/budget', 'Budgets'],
    ['Activity', '/transactions', 'Activity'],
    ['Reports', '/reports', 'Reports'],
    ['Settings', '/settings', 'Settings'],
    ['Home', '/', 'Your money'],
  ]) {
    await fireEvent.press(screen.getByRole('tab', { name: `${label} tab` }));
    expect(getPathname()).toBe(path);
    expect(screen.getByRole('header', { name: header })).toBeTruthy();
  }
});

test('a routed recoverable state explains the problem and offers retry', async () => {
  const onRetry = jest.fn();
  const { getPathname } = await renderRouter({
    index: () => (
      <StateMessage
        kind="recoverable-error"
        title="Could not load the overview"
        message="Try again to load your overview."
        actionLabel="Try again"
        onAction={onRetry}
      />
    ),
  });

  expect(getPathname()).toBe('/');
  expect(screen.getByText('Something went wrong')).toBeTruthy();
  expect(screen.getByText('Try again to load your overview.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
