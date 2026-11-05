import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { CADENCE_OPTIONS, DEFAULT_GROUP_PERCENTAGES } from '@/constants/allowance';
import { Spacing } from '@/constants/theme';
import { getNextPeriodAnchor, isValidIsoDate, todayIsoDate } from '@/domain/allowance';
import type { AllowanceCadence, CategoryAllocation } from '@/domain/allowance-types';
import { formatPeso, formatPesoInput, parsePesoInput } from '@/domain/money';
import { ThemedText } from '@/components/themed-text';
import {
  useAllowanceData,
  useClearAllowanceErrorOnBlur,
} from '@/features/allowance/allowance-data-provider';
import {
  ActionButton,
  ChoiceChips,
  FormField,
  GroupLane,
  PeriodFlow,
  Section,
  StatusBanner,
} from '@/features/allowance/allowance-ui';

export default function BudgetScreen() {
  useClearAllowanceErrorOnBlur();
  const {
    snapshot,
    isLoading,
    isSaving,
    errorMessage,
    createDraft,
    activate,
    close,
    setCategoryAllocation,
  } = useAllowanceData();
  const period = snapshot?.activePeriod ?? snapshot?.draftPeriod ?? null;
  const [cadence, setCadence] = useState<AllowanceCadence>('biweekly');
  const [amount, setAmount] = useState('');
  const [anchorDate, setAnchorDate] = useState(todayIsoDate());
  const [needs, setNeeds] = useState(String(DEFAULT_GROUP_PERCENTAGES.needs));
  const [wants, setWants] = useState(String(DEFAULT_GROUP_PERCENTAGES.wants));
  const [savings, setSavings] = useState(String(DEFAULT_GROUP_PERCENTAGES.savings));

  async function submitDraft() {
    const plannedCents = parsePesoInput(amount);
    if (plannedCents === null) return;
    try {
      await createDraft({
        cadence,
        anchorDate,
        plannedCents,
        needsPercentage: Number(needs),
        wantsPercentage: Number(wants),
        savingsPercentage: Number(savings),
      });
    } catch {
      // The provider exposes a contextual error banner.
    }
  }

  function confirmCopyLastPlan() {
    const previous = snapshot?.periods[0];
    if (!previous) return;
    Alert.alert(
      'Copy the last allowance plan?',
      'The amount, schedule, and percentages will be copied. You can review everything before creating the draft.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy plan',
          onPress: () => {
            setCadence(previous.cadence);
            setAmount(formatPesoInput(previous.plannedCents));
            setAnchorDate(getNextPeriodAnchor(previous.endDate));
            setNeeds(String(previous.needsPercentage));
            setWants(String(previous.wantsPercentage));
            setSavings(String(previous.savingsPercentage));
          },
        },
      ],
    );
  }

  function confirmClose() {
    if (!period) return;
    Alert.alert(
      'Close this allowance period?',
      `Given, used, and unassigned amounts will stay in its history.${period.remainingCents !== 0 ? ' This plan still has a remaining balance.' : ''}`,
      [
        { text: 'Keep open', style: 'cancel' },
        { text: 'Close period', style: 'destructive', onPress: () => void close(period.id) },
      ],
    );
  }

  if (isLoading && !snapshot) {
    return (
      <ScreenFrame title="Plan" description="Loading your allowance plan…">
        <StateMessage kind="loading" title="Loading plan" message="One moment." />
      </ScreenFrame>
    );
  }

  if (!period) {
    const total = Number(needs) + Number(wants) + Number(savings);
    return (
      <ScreenFrame title="Plan" description="Set the cycle, total, and spending split.">
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        {snapshot?.periods[0] ? (
          <ActionButton label="Copy last plan" tone="secondary" onPress={confirmCopyLastPlan} />
        ) : null}
        <Section title="New allowance">
          <ChoiceChips
            label="Schedule"
            options={CADENCE_OPTIONS}
            value={cadence}
            onChange={setCadence}
          />
          <FormField
            label="Allowance amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="₱0.00"
          />
          <FormField
            label={cadence === 'monthly' ? 'Month date' : 'First day of the 14-day cycle'}
            value={anchorDate}
            onChangeText={setAnchorDate}
            placeholder="YYYY-MM-DD"
          />
          {!isValidIsoDate(anchorDate) ? (
            <StatusBanner message="Enter a valid calendar date." />
          ) : null}
        </Section>
        <Section title="Split the plan">
          <View style={styles.percentages}>
            <View style={styles.percentage}>
              <FormField
                label="Needs %"
                value={needs}
                onChangeText={setNeeds}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.percentage}>
              <FormField
                label="Wants %"
                value={wants}
                onChangeText={setWants}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.percentage}>
              <FormField
                label="Savings %"
                value={savings}
                onChangeText={setSavings}
                keyboardType="number-pad"
              />
            </View>
          </View>
          {total !== 100 ? (
            <StatusBanner message={`The split is ${total}%. It must total exactly 100%.`} />
          ) : null}
          <ActionButton
            label={isSaving ? 'Creating…' : 'Create draft'}
            disabled={
              isSaving ||
              total !== 100 ||
              parsePesoInput(amount) === null ||
              !isValidIsoDate(anchorDate)
            }
            onPress={() => void submitDraft()}
          />
        </Section>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      title="Plan"
      description={
        period.state === 'draft'
          ? 'Review the draft before money starts moving.'
          : 'Your active allowance rules and category plan.'
      }>
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      <PeriodFlow period={period} />
      <Section title="Category plan">
        {period.groups.map((group) => (
          <View key={group.groupKey} style={styles.groupEditor}>
            <GroupLane group={group} />
            {group.categories.map((category) => (
              <AllocationEditor
                key={category.categoryId}
                category={category}
                disabled={isSaving}
                onSave={(allocatedCents) =>
                  setCategoryAllocation(period.id, category.categoryId, allocatedCents)
                }
              />
            ))}
          </View>
        ))}
      </Section>
      {period.state === 'draft' ? (
        <ActionButton
          label={isSaving ? 'Activating…' : 'Activate allowance'}
          disabled={isSaving}
          onPress={() => void activate(period.id)}
        />
      ) : (
        <ActionButton
          label="Close allowance period"
          tone="danger"
          disabled={isSaving}
          onPress={confirmClose}
        />
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  percentages: { gap: Spacing.two },
  percentage: { flex: 1 },
  groupEditor: { gap: Spacing.two },
  allocation: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  allocationHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
});

function AllocationEditor({
  category,
  disabled,
  onSave,
}: {
  category: CategoryAllocation;
  disabled: boolean;
  onSave: (allocatedCents: number) => Promise<void>;
}) {
  const [value, setValue] = useState(formatPesoInput(category.allocatedCents));
  const [localError, setLocalError] = useState<string | null>(null);
  const cents = parsePesoInput(value);
  async function saveAllocation() {
    if (cents === null) return;
    setLocalError(null);
    try {
      await onSave(cents);
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : 'Could not save this allocation.');
    }
  }
  return (
    <View style={styles.allocation}>
      <View style={styles.allocationHeader}>
        <ThemedText type="smallBold">{category.categoryName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Used {formatPeso(category.usedCents)}
        </ThemedText>
      </View>
      <FormField
        label="Category allocation"
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
      />
      <ActionButton
        label="Save allocation"
        tone="secondary"
        disabled={disabled || cents === null || cents === category.allocatedCents}
        onPress={() => void saveAllocation()}
      />
      {localError ? <StatusBanner tone="error" message={localError} /> : null}
    </View>
  );
}
