import { expect, test } from '@jest/globals';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import TabLayout from '@/app/_layout';
import BudgetScreen from '@/app/budget';
import HomeScreen from '@/app/index';
import ReportsScreen from '@/app/reports';
import SettingsScreen from '@/app/settings';
import TransactionsScreen from '@/app/transactions';
import WebTabs from '@/components/app-tabs.web';

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

  fireEvent.press(screen.getByRole('tab', { name: 'Budget tab' }));
  expect(getPathname()).toBe('/budget');
});
