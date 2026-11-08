import { router } from 'expo-router';
import { useState } from 'react';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { BUDGET_TIMING_LABELS } from '@/constants/budget';
import type { BudgetTiming, CreateBudgetInput } from '@/domain/budget-types';
import { NewBudgetForm } from '@/features/budget/budget-form';
import { useBudgetData, useClearBudgetErrorOnBlur } from '@/features/budget/budget-data-provider';
import {
  ActionButton,
  BudgetCard,
  ChoiceChips,
  ModalFrame,
  Section,
  StatusBanner,
} from '@/features/budget/budget-ui';

const ARCHIVE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
] as const;

export default function BudgetScreen() {
  const { snapshot, isLoading, isSaving, errorMessage, refresh, create } = useBudgetData();
  const [showCreate, setShowCreate] = useState(false);
  const [archiveView, setArchiveView] = useState<'active' | 'archived'>('active');
  useClearBudgetErrorOnBlur();

  const budgets = (snapshot?.budgets ?? []).filter((budget) =>
    archiveView === 'archived' ? budget.archived : !budget.archived,
  );

  async function createNewBudget(input: CreateBudgetInput) {
    const budgetId = await create(input);
    setShowCreate(false);
    router.push(`/budget/${budgetId}`);
  }

  return (
    <ScreenFrame
      title="Budgets"
      description="Create a budget each time you receive money, then track every expense inside it."
      floatingAction={
        <ActionButton
          label="New"
          accessibilityLabel="New budget"
          onPress={() => setShowCreate(true)}
        />
      }>
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      <ChoiceChips
        label="Budget view"
        options={ARCHIVE_OPTIONS}
        value={archiveView}
        onChange={setArchiveView}
      />
      {isLoading && !snapshot ? (
        <StateMessage
          kind="loading"
          title="Loading budgets"
          message="Reading your saved budgets."
        />
      ) : null}
      {!isLoading && budgets.length === 0 ? (
        <StateMessage
          kind="empty"
          title={archiveView === 'archived' ? 'No archived budgets' : 'Create your first budget'}
          message={
            archiveView === 'archived'
              ? 'Archived budgets will stay here with their full history.'
              : 'Choose biweekly or monthly, enter the amount you received, and set your allocations.'
          }
          actionLabel={archiveView === 'archived' ? undefined : 'New budget'}
          onAction={archiveView === 'archived' ? undefined : () => setShowCreate(true)}
        />
      ) : null}
      {archiveView === 'archived' ? (
        <Section title="Archived">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onPress={() => router.push(`/budget/${budget.id}`)}
            />
          ))}
        </Section>
      ) : (
        (['current', 'upcoming', 'past'] as const).map((timing: BudgetTiming) => {
          const group = budgets.filter((budget) => budget.timing === timing);
          return group.length > 0 ? (
            <Section key={timing} title={BUDGET_TIMING_LABELS[timing]}>
              {group.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onPress={() => router.push(`/budget/${budget.id}`)}
                />
              ))}
            </Section>
          ) : null;
        })
      )}
      <ModalFrame
        visible={showCreate}
        title="New budget"
        description="Set the received amount and how you want to divide it."
        onClose={() => setShowCreate(false)}>
        {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
        <NewBudgetForm isSaving={isSaving} onSubmit={createNewBudget} />
      </ModalFrame>
      {errorMessage && !snapshot ? (
        <StateMessage
          kind="recoverable-error"
          title="Could not load budgets"
          message={errorMessage}
          actionLabel="Try again"
          onAction={() => void refresh()}
        />
      ) : null}
    </ScreenFrame>
  );
}
