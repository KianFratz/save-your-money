import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BUDGET_GROUP_LABELS, EVENT_TYPE_LABELS, WARNING_THRESHOLD } from '@/constants/allowance';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { formatPeriodLabel } from '@/domain/allowance';
import type { AllowancePeriod, FinancialEvent, GroupSummary } from '@/domain/allowance-types';
import { formatPeso } from '@/domain/money';
import { useTheme } from '@/hooks/use-theme';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
};

export function ActionButton({ label, onPress, disabled, tone = 'primary' }: ActionButtonProps) {
  const theme = useTheme();
  const backgroundColor =
    tone === 'primary'
      ? theme.primary
      : tone === 'danger'
        ? theme.errorContainer
        : theme.backgroundElement;
  const color =
    tone === 'primary' ? theme.onPrimary : tone === 'danger' ? theme.onErrorContainer : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: theme.outlineVariant },
        (pressed || disabled) && styles.faded,
      ]}>
      <ThemedText type="smallBold" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type Choice<T extends string | number> = { value: T; label: string };

export function ChoiceChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.fieldGroup} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.primaryContainer : theme.backgroundElement,
                  borderColor: selected ? theme.primary : theme.outlineVariant,
                },
              ]}>
              <ThemedText type="smallBold">{option.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.text,
            borderColor: theme.outline,
            backgroundColor: theme.backgroundElement,
          },
        ]}
        value={value}
      />
    </View>
  );
}

export function Section({
  title,
  action,
  children,
}: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="section" accessibilityRole="header">
          {title}
        </ThemedText>
        {action}
      </View>
      {children}
    </View>
  );
}

export function StatusBanner({
  message,
  tone = 'warning',
}: {
  message: string;
  tone?: 'warning' | 'error' | 'success';
}) {
  const theme = useTheme();
  const colors =
    tone === 'error'
      ? { background: theme.errorContainer, foreground: theme.onErrorContainer }
      : tone === 'success'
        ? { background: theme.successContainer, foreground: theme.onSuccessContainer }
        : { background: theme.warningContainer, foreground: theme.onWarningContainer };
  return (
    <View
      style={[styles.banner, { backgroundColor: colors.background }]}
      accessibilityLiveRegion="polite">
      <ThemedText type="smallBold" style={{ color: colors.foreground }}>
        {message}
      </ThemedText>
    </View>
  );
}

export function PeriodFlow({ period }: { period: AllowancePeriod }) {
  const theme = useTheme();
  const fundedProgress = Math.min(period.fundedCents / period.plannedCents, 1);
  return (
    <ThemedView type="backgroundElement" style={styles.flow}>
      <View style={styles.flowHeader}>
        <View>
          <ThemedText type="label" themeColor="textSecondary">
            {period.cadence === 'biweekly' ? 'Every 2 weeks' : 'Monthly'} ·{' '}
            {period.state[0]?.toUpperCase()}
            {period.state.slice(1)}
          </ThemedText>
          <ThemedText type="section">
            {formatPeriodLabel(period.startDate, period.endDate)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.amountFlow}>
        <View style={styles.amountBlock}>
          <ThemedText type="label" themeColor="textSecondary">
            Planned
          </ThemedText>
          <ThemedText type="money">{formatPeso(period.plannedCents)}</ThemedText>
        </View>
        <ThemedText type="section" themeColor="textSecondary">
          →
        </ThemedText>
        <View style={[styles.amountBlock, styles.amountBlockRight]}>
          <ThemedText type="label" themeColor="textSecondary">
            Funded
          </ThemedText>
          <ThemedText type="money">{formatPeso(period.fundedCents)}</ThemedText>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: theme.outlineVariant }]}>
        <View
          style={[
            styles.trackFill,
            { width: `${fundedProgress * 100}%`, backgroundColor: theme.primary },
          ]}
        />
      </View>
      <View style={styles.flowFooter}>
        <ThemedText type="small" themeColor="textSecondary">
          Net newly given {formatPeso(period.netGivenCents)}
          {period.leftoverAppliedCents > 0
            ? ` · held money ${formatPeso(period.leftoverAppliedCents)}`
            : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Used {formatPeso(period.usedCents)}
        </ThemedText>
        {period.returnedCents > 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Returned {formatPeso(period.returnedCents)}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          Held by sister {formatPeso(period.sisterHeldCents)}
        </ThemedText>
        <ThemedText type="smallBold">Plan left {formatPeso(period.remainingCents)}</ThemedText>
      </View>
    </ThemedView>
  );
}

export function GroupLane({
  group,
  expanded = false,
}: {
  group: GroupSummary;
  expanded?: boolean;
}) {
  const theme = useTheme();
  const ratio = group.allocatedCents === 0 ? 0 : group.usedCents / group.allocatedCents;
  const groupColor = theme[group.groupKey as ThemeColor];
  return (
    <View
      style={[
        styles.lane,
        { borderLeftColor: groupColor, borderBottomColor: theme.outlineVariant },
      ]}>
      <View style={styles.laneTop}>
        <View>
          <ThemedText type="smallBold">
            {BUDGET_GROUP_LABELS[group.groupKey]} · {group.percentage}%
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPeso(group.usedCents)} of {formatPeso(group.allocatedCents)}
          </ThemedText>
        </View>
        <ThemedText type="money">{formatPeso(group.remainingCents)}</ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.outlineVariant }]}>
        <View
          style={[
            styles.trackFill,
            { width: `${Math.min(ratio, 1) * 100}%`, backgroundColor: groupColor },
          ]}
        />
      </View>
      {ratio >= WARNING_THRESHOLD ? (
        <ThemedText type="smallBold" themeColor={ratio > 1 ? 'error' : 'textSecondary'}>
          {ratio > 1 ? 'Over this group plan' : '80% of this group is already used'}
        </ThemedText>
      ) : null}
      {expanded
        ? group.categories.map((category) => (
            <View key={category.categoryId} style={styles.categoryRow}>
              <ThemedText type="small">{category.categoryName}</ThemedText>
              <ThemedText type="smallBold">
                {formatPeso(category.usedCents)} / {formatPeso(category.allocatedCents)}
              </ThemedText>
            </View>
          ))
        : null}
      {group.unallocatedCents > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {formatPeso(group.unallocatedCents)} not assigned to a category
        </ThemedText>
      ) : null}
    </View>
  );
}

export function EventList({
  events,
  emptyMessage = 'No activity yet.',
}: {
  events: FinancialEvent[];
  emptyMessage?: string;
}) {
  const theme = useTheme();
  if (events.length === 0) {
    return <ThemedText themeColor="textSecondary">{emptyMessage}</ThemedText>;
  }
  return (
    <View>
      {events.map((event) => (
        <View key={event.id} style={[styles.eventRow, { borderBottomColor: theme.outlineVariant }]}>
          <View style={styles.eventCopy}>
            <ThemedText type="smallBold">
              {event.type === 'use' && event.groupKey === 'savings'
                ? 'Set aside in Savings'
                : EVENT_TYPE_LABELS[event.type]}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {[event.categoryName ?? event.accountName, event.effectiveDate]
                .filter(Boolean)
                .join(' · ')}
            </ThemedText>
            {event.note ? <ThemedText type="small">{event.note}</ThemedText> : null}
          </View>
          <ThemedText type="smallBold">
            {event.type === 'leftover_application'
              ? '→'
              : event.type === 'use' && event.groupKey === 'savings'
                ? '→'
                : event.type === 'refund' || event.type === 'return'
                  ? '+'
                  : '−'}
            {formatPeso(event.amountCents)}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  faded: { opacity: 0.55 },
  fieldGroup: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 24,
    borderWidth: 1,
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  section: { gap: Spacing.three },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  banner: { borderRadius: 12, padding: Spacing.three },
  flow: { gap: Spacing.three, borderRadius: 28, padding: Spacing.four },
  flowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  amountFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  amountBlock: { flex: 1, gap: Spacing.one },
  amountBlockRight: { alignItems: 'flex-end' },
  flowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  lane: {
    borderLeftWidth: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  laneTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  eventRow: {
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  eventCopy: { flex: 1, gap: Spacing.one },
});
