import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayIsoDate } from '@/domain/budget';
import type { Budget, SaveBudgetRecordInput } from '@/domain/budget-types';
import { formatPeso } from '@/domain/money';
import { useBudgetData, useClearBudgetErrorOnBlur } from '@/features/budget/budget-data-provider';
import { BudgetRecordForm } from '@/features/budget/budget-record-form';
import {
  ActionButton,
  BudgetCard,
  ModalFrame,
  RecordList,
  Section,
  StatusBanner,
} from '@/features/budget/budget-ui';

export default function HomeScreen() {
  const { snapshot, isLoading, isSaving, errorMessage, refresh, saveRecord } = useBudgetData();
  const [showRecordForm, setShowRecordForm] = useState(false);
  useClearBudgetErrorOnBlur();
  const visibleBudgets = (snapshot?.budgets ?? []).filter((budget) => !budget.archived);
  const currentBudgets = visibleBudgets
    .filter((budget) => budget.timing === 'current')
    .sort(compareBudgetsByEndingSoonest);
  const nextBudget = visibleBudgets
    .filter((budget) => budget.timing === 'upcoming')
    .sort(compareBudgetsByStartingSoonest)[0];
  const saved = (snapshot?.categories ?? [])
    .filter((category) => category.groupKey === 'savings')
    .reduce((sum, category) => sum + category.savedBalanceCents, 0);
  const hasRecordableBudget = (snapshot?.budgets ?? []).some(
    (budget) => !budget.archived && budget.startDate <= todayIsoDate(),
  );

  async function saveActivity(input: SaveBudgetRecordInput) {
    await saveRecord(input);
    setShowRecordForm(false);
  }

  return (
    <ScreenFrame
      title="Your money"
      description="See what is available now and keep every expense tied to a budget."
      floatingAction={
        hasRecordableBudget ? (
          <ActionButton
            label="Add"
            accessibilityLabel="Add expenditure"
            onPress={() => setShowRecordForm(true)}
          />
        ) : undefined
      }>
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      {isLoading && !snapshot ? (
        <StateMessage
          kind="loading"
          title="Loading your money"
          message="Reading your saved data."
        />
      ) : null}
      {snapshot && snapshot.budgets.length === 0 ? (
        <StateMessage
          kind="empty"
          title="Start with a budget"
          message="When you receive money, create a biweekly or monthly budget and log spending inside it."
          actionLabel="Create budget"
          onAction={() => router.push('/budget')}
        />
      ) : null}
      {snapshot && snapshot.budgets.length > 0 ? (
        <>
          <CurrentBudgetsSection budgets={currentBudgets} nextBudget={nextBudget} />
          <Section title="Savings set aside">
            <ThemedView type="backgroundElement" style={styles.savingsSummary}>
              <ThemedText type="money">{formatPeso(saved)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Across all budgets, after withdrawals
              </ThemedText>
            </ThemedView>
          </Section>
          <Section title="Recent activity">
            <RecordList records={snapshot.records.slice(0, 5)} />
          </Section>
        </>
      ) : null}
      {errorMessage && !snapshot ? (
        <StateMessage
          kind="recoverable-error"
          title="Could not load your overview"
          message={errorMessage}
          actionLabel="Try again"
          onAction={() => void refresh()}
        />
      ) : null}
      <ModalFrame
        visible={showRecordForm}
        title="Add activity"
        description="Choose the budget that this record belongs to."
        onClose={() => setShowRecordForm(false)}>
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <BudgetRecordForm
          budgets={snapshot?.budgets ?? []}
          categories={snapshot?.categories ?? []}
          isSaving={isSaving}
          onSubmit={saveActivity}
        />
      </ModalFrame>
    </ScreenFrame>
  );
}

function CurrentBudgetsSection({
  budgets,
  nextBudget,
}: {
  budgets: readonly Budget[];
  nextBudget?: Budget;
}) {
  const currentBudget = budgets[0];
  if (budgets.length === 1 && currentBudget) {
    return (
      <Section title="Budget covering today">
        <BudgetLink budget={currentBudget} />
      </Section>
    );
  }

  if (budgets.length > 1) {
    const totals = budgets.reduce(
      (summary, budget) => ({
        receivedCents: summary.receivedCents + budget.receivedCents,
        spentCents: summary.spentCents + budget.spentCents,
        remainingCents: summary.remainingCents + budget.remainingCents,
        overPlanCount: summary.overPlanCount + (budget.remainingCents < 0 ? 1 : 0),
      }),
      { receivedCents: 0, spentCents: 0, remainingCents: 0, overPlanCount: 0 },
    );
    return (
      <Section title="Budgets covering today">
        <ThemedView type="backgroundElement" style={styles.combinedSummary}>
          <ThemedText type="smallBold">Across {budgets.length} budgets</ThemedText>
          <ThemedText type="money">{formatPeso(totals.remainingCents)} remaining</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPeso(totals.receivedCents)} received · {formatPeso(totals.spentCents)} spent
          </ThemedText>
          {totals.overPlanCount > 0 ? (
            <ThemedText type="smallBold" themeColor="error">
              {formatOverPlanMessage(totals.overPlanCount)}
            </ThemedText>
          ) : null}
        </ThemedView>
        <View style={styles.budgetList}>
          {budgets.map((budget) => (
            <BudgetLink key={budget.id} budget={budget} />
          ))}
        </View>
      </Section>
    );
  }

  return (
    <>
      <StateMessage
        kind="empty"
        title="No budget covers today"
        message={
          nextBudget ? 'Review the next budget below.' : 'Create a budget when you receive money.'
        }
        actionLabel={nextBudget ? undefined : 'Create budget'}
        onAction={nextBudget ? undefined : () => router.push('/budget')}
      />
      {nextBudget ? (
        <Section title="Next budget">
          <BudgetLink budget={nextBudget} />
        </Section>
      ) : null}
    </>
  );
}

function BudgetLink({ budget }: { budget: Budget }) {
  return <BudgetCard budget={budget} onPress={() => router.push(`/budget/${budget.id}`)} />;
}

function compareBudgetsByEndingSoonest(first: Budget, second: Budget): number {
  return (
    first.endDate.localeCompare(second.endDate) ||
    first.startDate.localeCompare(second.startDate) ||
    first.id - second.id
  );
}

function compareBudgetsByStartingSoonest(first: Budget, second: Budget): number {
  return (
    first.startDate.localeCompare(second.startDate) ||
    first.endDate.localeCompare(second.endDate) ||
    first.id - second.id
  );
}

function formatOverPlanMessage(count: number): string {
  return count === 1 ? '1 budget is over plan' : `${count} budgets are over plan`;
}

const styles = StyleSheet.create({
  combinedSummary: { gap: Spacing.two, borderRadius: 16, padding: Spacing.four },
  budgetList: { gap: Spacing.three },
  savingsSummary: { gap: Spacing.one, borderRadius: 16, padding: Spacing.four },
});
