import type { PropsWithChildren, ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BUDGET_GROUP_LABELS,
  BUDGET_TIMING_LABELS,
  GROUP_ACTIVITY_PREVIEW_LIMIT,
  RECORD_TYPE_LABELS,
  WARNING_THRESHOLD,
} from '@/constants/budget';
import { MaxContentWidth, Spacing, type ThemeColor } from '@/constants/theme';
import { formatBudgetIdentity, formatBudgetPeriod } from '@/domain/budget';
import type { Budget, BudgetRecord, GroupSummary } from '@/domain/budget-types';
import { formatPeso } from '@/domain/money';
import { useTheme } from '@/hooks/use-theme';

type ActionButtonProps = {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
};

export function ActionButton({
  label,
  accessibilityLabel,
  onPress,
  disabled,
  tone = 'primary',
}: ActionButtonProps) {
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
      accessibilityLabel={accessibilityLabel ?? label}
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
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.primaryContainer : theme.backgroundElement,
                  borderColor: selected ? theme.primary : theme.outlineVariant,
                },
                pressed && styles.faded,
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

export function ModalFrame({
  title,
  description,
  visible,
  onClose,
  children,
}: PropsWithChildren<{
  title: string;
  description: string;
  visible: boolean;
  onClose: () => void;
}>) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}>
      <ThemedView style={styles.modalScreen}>
        <SafeAreaView style={styles.modalSafeArea}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <View style={styles.modalTitle}>
                <ThemedText type="section" accessibilityRole="header">
                  {title}
                </ThemedText>
                <ThemedText themeColor="textSecondary">{description}</ThemedText>
              </View>
              <ActionButton label="Close" tone="secondary" onPress={onClose} />
            </View>
            {children}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

export function BudgetCard({ budget, onPress }: { budget: Budget; onPress: () => void }) {
  const theme = useTheme();
  const spentRatio = budget.receivedCents === 0 ? 0 : budget.spentCents / budget.receivedCents;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${formatBudgetIdentity(budget.cadence, budget.startDate, budget.endDate)}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.faded]}>
      <ThemedView type="backgroundElement" style={styles.budgetCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <ThemedText type="smallBold">
              {budget.cadence === 'biweekly' ? 'Biweekly' : 'Monthly'}
            </ThemedText>
            <ThemedText type="section">
              {formatBudgetPeriod(budget.startDate, budget.endDate)}
            </ThemedText>
          </View>
          <View style={[styles.timingPill, { backgroundColor: theme.primaryContainer }]}>
            <ThemedText type="smallBold">{BUDGET_TIMING_LABELS[budget.timing]}</ThemedText>
          </View>
        </View>
        <View style={styles.metrics}>
          <MetricLine label="Received" value={budget.receivedCents} />
          <MetricLine label="Spent" value={budget.spentCents} />
        </View>
        <View style={[styles.track, { backgroundColor: theme.outlineVariant }]}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${Math.min(Math.max(spentRatio, 0), 1) * 100}%`,
                backgroundColor: spentRatio > 1 ? theme.error : theme.primary,
              },
            ]}
          />
        </View>
        <View style={styles.cardFooter}>
          <ThemedText type="smallBold">{formatPeso(budget.remainingCents)} remaining</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Open details
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

export function BudgetSummary({ budget }: { budget: Budget }) {
  const theme = useTheme();
  const spentRatio = budget.receivedCents === 0 ? 0 : budget.spentCents / budget.receivedCents;
  return (
    <ThemedView type="backgroundElement" style={styles.summary}>
      <ThemedText type="label" themeColor="textSecondary">
        {formatBudgetIdentity(budget.cadence, budget.startDate, budget.endDate)}
      </ThemedText>
      <View style={styles.metrics}>
        <MetricLine label="Received" value={budget.receivedCents} prominent />
        <MetricLine label="Remaining" value={budget.remainingCents} prominent />
      </View>
      <View style={[styles.track, { backgroundColor: theme.outlineVariant }]}>
        <View
          style={[
            styles.trackFill,
            {
              width: `${Math.min(Math.max(spentRatio, 0), 1) * 100}%`,
              backgroundColor: spentRatio > 1 ? theme.error : theme.primary,
            },
          ]}
        />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {formatPeso(budget.spentCents)} spent
      </ThemedText>
    </ThemedView>
  );
}

function MetricLine({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: number;
  prominent?: boolean;
}) {
  return (
    <View style={styles.metricLine}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type={prominent ? 'money' : 'smallBold'}>{formatPeso(value)}</ThemedText>
    </View>
  );
}

export function GroupLane({
  group,
  records,
  onViewAll,
}: {
  group: GroupSummary;
  records: readonly BudgetRecord[];
  onViewAll?: () => void;
}) {
  const theme = useTheme();
  const ratio = group.allocatedCents === 0 ? 0 : group.spentCents / group.allocatedCents;
  const groupColor = theme[group.groupKey as ThemeColor];
  const groupLabel = BUDGET_GROUP_LABELS[group.groupKey];
  const previewRecords = records.slice(0, GROUP_ACTIVITY_PREVIEW_LIMIT);
  return (
    <View style={[styles.lane, { borderBottomColor: theme.outlineVariant }]}>
      <View style={styles.laneTop}>
        <View style={styles.groupTitle}>
          <View style={[styles.groupMarker, { backgroundColor: groupColor }]} />
          <View>
            <ThemedText type="smallBold">
              {groupLabel} · {group.percentage}%
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatPeso(group.spentCents)} of {formatPeso(group.allocatedCents)}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="money">{formatPeso(group.remainingCents)}</ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.outlineVariant }]}>
        <View
          style={[
            styles.trackFill,
            { width: `${Math.min(Math.max(ratio, 0), 1) * 100}%`, backgroundColor: groupColor },
          ]}
        />
      </View>
      {ratio >= WARNING_THRESHOLD ? (
        <ThemedText type="smallBold" themeColor={ratio > 1 ? 'error' : 'textSecondary'}>
          {ratio > 1 ? 'Over this group plan' : '80% of this group is already spent'}
        </ThemedText>
      ) : null}
      {group.unallocatedCents > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {formatPeso(group.unallocatedCents)} not assigned to a category
        </ThemedText>
      ) : null}
      <View style={styles.groupActivity}>
        <ThemedText type="label" themeColor="textSecondary">
          Recent activity
        </ThemedText>
        <RecordList
          records={previewRecords}
          emptyMessage="No expenses logged in this group yet."
          showBudgetIdentity={false}
        />
        {records.length > GROUP_ACTIVITY_PREVIEW_LIMIT && onViewAll ? (
          <TextAction label={`View all ${groupLabel} activity`} onPress={onViewAll} />
        ) : null}
      </View>
    </View>
  );
}

export function RecordList({
  records,
  onEdit,
  onDelete,
  emptyMessage = 'No activity yet.',
  showBudgetIdentity = true,
}: {
  records: readonly BudgetRecord[];
  onEdit?: (record: BudgetRecord) => void;
  onDelete?: (record: BudgetRecord) => void;
  emptyMessage?: string;
  showBudgetIdentity?: boolean;
}) {
  const theme = useTheme();
  if (records.length === 0) {
    return <ThemedText themeColor="textSecondary">{emptyMessage}</ThemedText>;
  }
  return (
    <View>
      {records.map((record) => (
        <View
          key={record.id}
          style={[styles.recordRow, { borderBottomColor: theme.outlineVariant }]}>
          <View style={styles.recordCopy}>
            <ThemedText type="smallBold">{record.description || record.categoryName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatRecordDetails(record)}
            </ThemedText>
            {showBudgetIdentity &&
            record.budgetCadence &&
            record.budgetStartDate &&
            record.budgetEndDate ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatBudgetIdentity(
                  record.budgetCadence,
                  record.budgetStartDate,
                  record.budgetEndDate,
                )}
              </ThemedText>
            ) : null}
            {onEdit || onDelete ? (
              <View style={styles.recordActions}>
                {onEdit ? <TextAction label="Edit" onPress={() => onEdit(record)} /> : null}
                {onDelete ? (
                  <TextAction label="Delete" danger onPress={() => onDelete(record)} />
                ) : null}
              </View>
            ) : null}
          </View>
          <ThemedText type="smallBold">
            {record.type === 'refund' ? '+' : '−'}
            {formatPeso(record.amountCents)}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function formatRecordDetails(record: BudgetRecord): string {
  const recordType =
    record.type === 'refund'
      ? RECORD_TYPE_LABELS.refund
      : record.type === 'savings_withdrawal'
        ? RECORD_TYPE_LABELS.savings_withdrawal
        : record.groupKey === 'savings'
          ? 'Saved money'
          : null;
  const details = [
    recordType,
    record.description ? record.categoryName : null,
    record.effectiveDate,
  ];
  return details.filter((detail): detail is string => detail !== null).join(' · ');
}

function TextAction({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.textAction, pressed && styles.faded]}>
      <ThemedText type="smallBold" themeColor={danger ? 'error' : 'primary'}>
        {label}
      </ThemedText>
    </Pressable>
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
  modalScreen: { flex: 1, alignItems: 'center' },
  modalSafeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  modalContent: { gap: Spacing.three, padding: Spacing.four, paddingBottom: Spacing.six },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  modalTitle: { flex: 1, gap: Spacing.one },
  budgetCard: { gap: Spacing.three, borderRadius: 16, padding: Spacing.four },
  summary: { gap: Spacing.three, borderRadius: 16, padding: Spacing.four },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  cardTitle: { flex: 1, gap: Spacing.one },
  timingPill: { borderRadius: 24, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  metrics: { gap: Spacing.two },
  metricLine: {
    minHeight: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4 },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  lane: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  laneTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  groupTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  groupMarker: { width: 10, height: 10, borderRadius: 5 },
  groupActivity: { gap: Spacing.one, paddingTop: Spacing.one },
  recordRow: {
    minHeight: 76,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  recordCopy: { flex: 1, gap: Spacing.one },
  recordActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  textAction: { minHeight: 48, minWidth: 48, alignSelf: 'flex-start', justifyContent: 'center' },
});
