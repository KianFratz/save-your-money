import { expect, jest, test } from '@jest/globals';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import TabLayout from '@/app/_layout';
import BudgetScreen from '@/app/budget';
import HomeScreen from '@/app/index';
import ReportsScreen from '@/app/reports';
import SettingsScreen from '@/app/settings';
import TransactionsScreen from '@/app/transactions';
import WebTabs from '@/components/app-tabs.web';
import { StateMessage } from '@/components/state-message';

jest.mock('expo-sqlite', () => ({
  SQLiteProvider: ({ children }: PropsWithChildren) => children,
}));

jest.mock('@/features/allowance/allowance-data-provider', () => ({
  AllowanceDataProvider: ({ children }: PropsWithChildren) => children,
  useClearAllowanceErrorOnBlur: jest.fn(),
  useAllowanceData: () => ({
    snapshot: {
      activePeriod: null,
      draftPeriod: null,
      recentEvents: [],
      accounts: [],
      categories: [],
      periods: [],
    },
    isLoading: false,
    isSaving: false,
    errorMessage: null,
    refresh: jest.fn(),
    clearError: jest.fn(),
    createDraft: jest.fn(),
    activate: jest.fn(),
    close: jest.fn(),
    reopen: jest.fn(),
    setCategoryAllocation: jest.fn(),
    recordEvent: jest.fn(),
    applyLeftover: jest.fn(),
    createAccount: jest.fn(),
    createCategory: jest.fn(),
  }),
}));

const routes = {
  _layout: TabLayout,
  index: HomeScreen,
  budget: BudgetScreen,
  transactions: TransactionsScreen,
  reports: ReportsScreen,
  settings: SettingsScreen,
};

test.each([
  ['/', 'Allowance', 'Set up your sister’s allowance'],
  ['/budget', 'Plan', 'New allowance'],
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
    ['Budget', '/budget', 'Plan'],
    ['Transactions', '/transactions', 'Activity'],
    ['Reports', '/reports', 'Reports'],
    ['Settings', '/settings', 'Settings'],
    ['Home', '/', 'Allowance'],
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
