import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayIsoDate } from '@/domain/allowance';
import { formatPeso, parsePesoInput } from '@/domain/money';
import {
  useAllowanceData,
  useClearAllowanceErrorOnBlur,
} from '@/features/allowance/allowance-data-provider';
import {
  ActionButton,
  ChoiceChips,
  EventList,
  FormField,
  GroupLane,
  PeriodFlow,
  Section,
  StatusBanner,
} from '@/features/allowance/allowance-ui';

export default function HomeScreen() {
  useClearAllowanceErrorOnBlur();
  const router = useRouter();
  const { snapshot, isLoading, isSaving, errorMessage, clearError, recordEvent } =
    useAllowanceData();
  const period = snapshot?.activePeriod ?? null;
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const categoryOptions = useMemo(
    () =>
      period?.groups
        .flatMap((group) =>
          group.categories.map((category) => ({
            value: category.categoryId,
            label: category.categoryName,
          })),
        )
        .filter((category) =>
          category.label.toLocaleLowerCase().includes(categorySearch.trim().toLocaleLowerCase()),
        ) ?? [],
    [categorySearch, period],
  );

  async function submitUse() {
    if (!period || categoryId === null) return;
    const amountCents = parsePesoInput(amount);
    if (amountCents === null) return;
    try {
      await recordEvent({
        periodId: period.id,
        type: 'use',
        amountCents,
        categoryId,
        effectiveDate: todayIsoDate(),
        note,
      });
      setAmount('');
      setNote('');
      setShowForm(false);
    } catch {
      // The provider exposes a contextual error banner.
    }
  }

  if (isLoading && !snapshot) {
    return (
      <ScreenFrame title="Allowance" description="Loading your local money plan…">
        <StateMessage
          kind="loading"
          title="Opening your allowance"
          message="Your data stays on this device."
        />
      </ScreenFrame>
    );
  }

  if (!period) {
    return (
      <ScreenFrame title="Allowance" description="Plan what you give, then see where it goes.">
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <StateMessage
          kind="empty"
          title={snapshot?.draftPeriod ? 'Your draft is ready' : 'Set up your sister’s allowance'}
          message={
            snapshot?.draftPeriod
              ? 'Review and activate it in Plan.'
              : 'Choose a two-week or monthly cycle and split it across Needs, Wants, and Savings.'
          }
          actionLabel="Open plan"
          onAction={() => router.push('/budget')}
        />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      title="Allowance"
      description="Follow the money from your plan to what was actually used."
      floatingAction={
        <ActionButton
          label={showForm ? 'Close entry' : 'Log allowance use'}
          onPress={() => {
            clearError();
            setShowForm((shown) => !shown);
          }}
          tone={showForm ? 'secondary' : 'primary'}
        />
      }>
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      <PeriodFlow period={period} />
      {period.sisterHeldCents < 0 ? (
        <StatusBanner message="Logged uses are higher than the net amount given. Check whether another disbursement is missing." />
      ) : null}
      <Modal
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
        presentationStyle="pageSheet"
        visible={showForm}>
        <ThemedView style={styles.modalScreen}>
          <SafeAreaView style={styles.modalSafeArea}>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <View style={styles.modalTitle}>
                  <ThemedText type="section" accessibilityRole="header">
                    Log allowance use
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">
                    Spending and money set aside in Savings both belong here.
                  </ThemedText>
                </View>
                <ActionButton label="Close" tone="secondary" onPress={() => setShowForm(false)} />
              </View>
              {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
              <FormField
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="₱0.00"
              />
              <FormField
                label="Find category"
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="Type a category name"
              />
              <ChoiceChips
                label="Category"
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
              />
              {categoryOptions.length === 0 ? (
                <StatusBanner message="No categories match that search." />
              ) : null}
              <FormField
                label="Note (optional)"
                value={note}
                onChangeText={setNote}
                placeholder="What was this for?"
              />
              <ActionButton
                label={isSaving ? 'Saving…' : 'Save allowance use'}
                disabled={isSaving || parsePesoInput(amount) === null || categoryId === null}
                onPress={() => void submitUse()}
              />
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
      <Section title="Needs, wants, savings">
        {period.groups.map((group) => (
          <GroupLane key={group.groupKey} group={group} />
        ))}
      </Section>
      <Section title="Allowance-derived savings">
        {snapshot?.categories
          .filter((category) => category.groupKey === 'savings')
          .map((category) => (
            <View
              key={category.id}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText>{category.name}</ThemedText>
              <ThemedText type="money">{formatPeso(category.savedBalanceCents)}</ThemedText>
            </View>
          ))}
      </Section>
      <Section title="Recent activity">
        <EventList events={snapshot?.recentEvents.slice(0, 5) ?? []} />
      </Section>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  modalScreen: { flex: 1 },
  modalSafeArea: { flex: 1 },
  modalContent: { gap: Spacing.three, padding: Spacing.four, paddingBottom: Spacing.six },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  modalTitle: { flex: 1, gap: Spacing.one },
});
