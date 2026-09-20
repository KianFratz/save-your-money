import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StateKind =
  'empty' | 'loading' | 'validation' | 'warning' | 'recoverable-error' | 'unrecoverable-error';

const stateLabels: Record<StateKind, string> = {
  empty: 'Empty',
  loading: 'Loading',
  validation: 'Check your entry',
  warning: 'Warning',
  'recoverable-error': 'Something went wrong',
  'unrecoverable-error': 'Cannot continue',
};

type StateMessageProps = {
  kind: StateKind;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateMessage({ kind, title, message, actionLabel, onAction }: StateMessageProps) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.container} accessibilityLiveRegion="polite">
      <ThemedText type="smallBold">{stateLabels[kind]}</ThemedText>
      <ThemedText type="smallBold" accessibilityRole="header">
        {title}
      </ThemedText>
      <ThemedText>{message}</ThemedText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={[styles.action, { borderColor: theme.text }]}>
          <ThemedText type="smallBold">{actionLabel}</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  action: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Spacing.two,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
});
