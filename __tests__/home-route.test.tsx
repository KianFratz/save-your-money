import { expect, jest, test } from '@jest/globals';
import { renderRouter, screen } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';

jest.mock('@/components/animated-icon', () => ({
  AnimatedIcon: () => null,
}));

test('renders the scaffold home screen at the index route', () => {
  const { getPathname } = renderRouter({ index: HomeScreen }, { initialUrl: '/' });

  expect(getPathname()).toBe('/');
  expect(screen.getByText('get started')).toBeTruthy();
});
