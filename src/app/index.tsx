import { router } from 'expo-router';
import { useState } from 'react';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayIsoDate } from '@/domain/budget';
import type { SaveBudgetRecordInput } from '@/domain/budget-types';
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
  const currentBudgets = (snapshot?.budgets ?? []).filter(
    (budget) => !budget.archived && budget.timing === 'current',
  );
  const received = currentBudgets.reduce((sum, budget) => sum + budget.receivedCents, 0);
  const spent = currentBudgets.reduce((sum, budget) => sum + budget.spentCents, 0);
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
          <ThemedView
            type="backgroundElement"
            style={{ gap: Spacing.three, borderRadius: 16, padding: Spacing.four }}>
            <ThemedText type="label" themeColor="textSecondary">
              Current budgets
            </ThemedText>
            <ThemedText type="money">{formatPeso(received - spent)} remaining</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatPeso(received)} received · {formatPeso(spent)} spent
            </ThemedText>
            <ThemedText type="smallBold">{formatPeso(saved)} cumulative savings</ThemedText>
          </ThemedView>
          <Section title="Current budgets">
            {currentBudgets.length === 0 ? (
              <ThemedText themeColor="textSecondary">No budget covers today.</ThemedText>
            ) : (
              currentBudgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onPress={() => router.push(`/budget/${budget.id}`)}
                />
              ))
            )}
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
