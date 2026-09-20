import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { StateMessage, type StateKind } from '@/components/state-message';

test.each<[StateKind, string]>([
  ['empty', 'Empty'],
  ['loading', 'Loading'],
  ['validation', 'Check your entry'],
  ['warning', 'Warning'],
  ['recoverable-error', 'Something went wrong'],
  ['unrecoverable-error', 'Cannot continue'],
])('%s state explains itself in text', (kind, label) => {
  render(<StateMessage kind={kind} title="Example title" message="Example explanation" />);

  expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Example title' })).toBeTruthy();
  expect(screen.getByText('Example explanation')).toBeTruthy();
});

test('recoverable state offers a named retry action', () => {
  const onRetry = jest.fn();
  render(
    <StateMessage
      kind="recoverable-error"
      title="Could not load"
      message="Try again when ready."
      actionLabel="Try again"
      onAction={onRetry}
    />,
  );

  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
