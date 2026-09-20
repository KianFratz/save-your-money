import { expect, jest, test } from '@jest/globals';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabLayout from '@/app/_layout';
import BudgetScreen from '@/app/budget';
import HomeScreen from '@/app/index';
import ReportsScreen from '@/app/reports';
import SettingsScreen from '@/app/settings';
import TransactionsScreen from '@/app/transactions';
import WebTabs from '@/components/app-tabs.web';
import { StateMessage } from '@/components/state-message';

const routes = {
  _layout: TabLayout,
  index: HomeScreen,
  budget: BudgetScreen,
  transactions: TransactionsScreen,
  reports: ReportsScreen,
  settings: SettingsScreen,
};

test.each([
  ['/', 'Home', 'Nothing to show yet'],
  ['/budget', 'Budget', 'No monthly budget yet'],
  ['/transactions', 'Transactions', 'No transactions yet'],
  ['/reports', 'Reports', 'No report available yet'],
  ['/settings', 'Settings', 'Your data stays on this device'],
])('opens %s without an account', (path, title, message) => {
  const { getPathname } = renderRouter(routes, { initialUrl: path });

  expect(getPathname()).toBe(path);
  expect(screen.getByRole('header', { name: title })).toBeTruthy();
  expect(screen.getByText(message)).toBeTruthy();
});

test('switches tabs through the web shell', () => {
  const { getPathname } = renderRouter({ ...routes, _layout: WebTabs }, { initialUrl: '/' });

  for (const [label, path] of [
    ['Budget', '/budget'],
    ['Transactions', '/transactions'],
    ['Reports', '/reports'],
    ['Settings', '/settings'],
    ['Home', '/'],
  ]) {
    fireEvent.press(screen.getByRole('tab', { name: `${label} tab` }));
    expect(getPathname()).toBe(path);
    expect(screen.getByRole('header', { name: label })).toBeTruthy();
  }
});

test('a routed recoverable state explains the problem and offers retry', () => {
  const onRetry = jest.fn();
  const { getPathname } = renderRouter({
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
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
