import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { groupBudgetRecords, todayIsoDate } from '@/domain/budget';
import type { SaveBudgetRecordInput, UpdateBudgetInput } from '@/domain/budget-types';
import { EditBudgetForm } from '@/features/budget/budget-form';
import { useBudgetData } from '@/features/budget/budget-data-provider';
import { BudgetRecordForm } from '@/features/budget/budget-record-form';
import {
  ActionButton,
  BudgetSummary,
  GroupLane,
  ModalFrame,
  Section,
  StatusBanner,
} from '@/features/budget/budget-ui';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    snapshot,
    isLoading,
    isSaving,
    errorMessage,
    update,
    archive,
    restore,
    removeEmpty,
    saveRecord,
  } = useBudgetData();
  const budgetId = Number(id);
  const budget = snapshot?.budgets.find((candidate) => candidate.id === budgetId);
  const recordsByGroup = useMemo(
    () => groupBudgetRecords(snapshot?.records ?? [], budgetId),
    [budgetId, snapshot?.records],
  );
  const recordCount = Object.values(recordsByGroup).reduce(
    (count, groupRecords) => count + groupRecords.length,
    0,
  );
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);

  if (isLoading && !snapshot) {
    return (
      <ScreenFrame title="Budget" description="Loading budget details.">
        <StateMessage kind="loading" title="Loading budget" message="Reading this budget." />
      </ScreenFrame>
    );
  }
  if (!budget) {
    return (
      <ScreenFrame title="Budget" description="This budget is unavailable.">
        <ActionButton label="Back to budgets" onPress={() => router.replace('/budget')} />
      </ScreenFrame>
    );
  }
  const currentBudget = budget;

  async function saveEditedBudget(input: UpdateBudgetInput) {
    await update(input);
    setShowEditBudget(false);
  }

  async function saveActivity(input: SaveBudgetRecordInput) {
    await saveRecord(input);
    setShowRecordForm(false);
  }

  function confirmBudgetAction() {
    if (currentBudget.archived) {
      void restore(currentBudget.id);
      return;
    }
    if (recordCount > 0) {
      Alert.alert('Archive this budget?', 'Its records stay in your history and reports.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', onPress: () => void archive(currentBudget.id) },
      ]);
      return;
    }
    Alert.alert('Delete this empty budget?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void removeEmpty(currentBudget.id).then(() => router.replace('/budget')),
      },
    ]);
  }

  return (
    <ScreenFrame
      title="Budget details"
      description="Review the plan, adjust allocations, and log activity."
      floatingAction={
        !budget.archived && budget.startDate <= todayIsoDate() ? (
          <ActionButton
            label="Add"
            accessibilityLabel="Add expenditure"
            onPress={() => setShowRecordForm(true)}
          />
        ) : undefined
      }>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to budgets"
        onPress={() => router.back()}
        style={styles.backButton}>
        <ThemedText type="smallBold" themeColor="primary">
          ← Budgets
        </ThemedText>
      </Pressable>
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      {budget.archived ? <StatusBanner message="This budget is archived and read-only." /> : null}
      <BudgetSummary budget={budget} />
      <View style={styles.actions}>
        {!budget.archived ? (
          <ActionButton
            label="Edit budget"
            tone="secondary"
            onPress={() => setShowEditBudget(true)}
          />
        ) : null}
        <ActionButton
          label={
            budget.archived
              ? 'Restore budget'
              : recordCount > 0
                ? 'Archive budget'
                : 'Delete budget'
          }
          tone={budget.archived ? 'secondary' : 'danger'}
          onPress={confirmBudgetAction}
        />
      </View>
      <Section title="Activity by group">
        {budget.groups.map((group) => (
          <View key={group.groupKey} style={styles.groupBlock}>
            <GroupLane
              group={group}
              records={recordsByGroup[group.groupKey]}
              onViewAll={() =>
                router.push({
                  pathname: '/transactions',
                  params: { budgetId: String(budget.id), group: group.groupKey },
                })
              }
            />
          </View>
        ))}
      </Section>
      <ModalFrame
        visible={showEditBudget}
        title="Edit budget"
        description="Records must stay inside the new period."
        onClose={() => setShowEditBudget(false)}>
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <EditBudgetForm budget={budget} isSaving={isSaving} onSubmit={saveEditedBudget} />
      </ModalFrame>
      <ModalFrame
        visible={showRecordForm}
        title="Add budget activity"
        description="Expenditures reduce the budget; refunds put money back."
        onClose={() => {
          setShowRecordForm(false);
        }}>
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <BudgetRecordForm
          key="new"
          budgets={snapshot?.budgets ?? []}
          categories={snapshot?.categories ?? []}
          lockedBudget={budget}
          isSaving={isSaving}
          onSubmit={saveActivity}
        />
      </ModalFrame>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  backButton: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  groupBlock: { gap: Spacing.two },
});
