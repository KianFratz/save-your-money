import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { useState } from 'react';
import { formatPeriodLabel } from '@/domain/allowance';
import { formatPeso } from '@/domain/money';
import {
  useAllowanceData,
  useClearAllowanceErrorOnBlur,
} from '@/features/allowance/allowance-data-provider';
import {
  ActionButton,
  ChoiceChips,
  GroupLane,
  PeriodFlow,
  Section,
  StatusBanner,
} from '@/features/allowance/allowance-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';

export default function ReportsScreen() {
  useClearAllowanceErrorOnBlur();
  const { snapshot, isLoading, isSaving, errorMessage, reopen } = useAllowanceData();
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const defaultPeriod = snapshot?.activePeriod ?? snapshot?.periods[0] ?? null;
  const current =
    snapshot?.periods.find((period) => period.id === selectedPeriodId) ?? defaultPeriod;
  const periodOptions =
    snapshot?.periods.map((period) => ({
      value: period.id,
      label: `${formatPeriodLabel(period.startDate, period.endDate)} · ${formatState(period.state)}`,
    })) ?? [];
  if (isLoading && !snapshot) {
    return (
      <ScreenFrame title="Reports" description="Loading allowance history…">
        <StateMessage kind="loading" title="Building report" message="One moment." />
      </ScreenFrame>
    );
  }
  if (!current) {
    return (
      <ScreenFrame title="Reports" description="Compare plans with actual spending.">
        <StateMessage
          kind="empty"
          title="No report yet"
          message="Create an allowance period and start logging entries."
        />
      </ScreenFrame>
    );
  }
  return (
    <ScreenFrame
      title="Reports"
      description="See planned, given, and used money by allowance period.">
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      <ChoiceChips
        label="Report period"
        options={periodOptions}
        value={current.id}
        onChange={setSelectedPeriodId}
      />
      <PeriodFlow period={current} />
      <Section title="Category breakdown">
        {current.groups.map((group) => (
          <GroupLane key={group.groupKey} group={group} expanded />
        ))}
      </Section>
      <Section title="Period history">
        {snapshot?.periods.map((period) => (
          <ThemedView key={period.id} type="backgroundElement" style={styles.period}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <ThemedText type="smallBold">
                  {formatPeriodLabel(period.startDate, period.endDate)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatState(period.state)} ·{' '}
                  {period.cadence === 'biweekly' ? 'Every 2 weeks' : 'Monthly'}
                </ThemedText>
              </View>
              <ThemedText type="smallBold">{formatPeso(period.usedCents)} used</ThemedText>
            </View>
            {period.state === 'closed' && !snapshot.activePeriod ? (
              <ActionButton
                label={isSaving ? 'Reopening…' : 'Reopen period'}
                disabled={isSaving}
                tone="secondary"
                onPress={() => void reopen(period.id)}
              />
            ) : null}
          </ThemedView>
        ))}
      </Section>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  period: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  copy: { flex: 1, gap: Spacing.one },
});

function formatState(state: string): string {
  return `${state[0]?.toUpperCase() ?? ''}${state.slice(1)}`;
}
