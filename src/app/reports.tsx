import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ARCHIVE_REPORT_OPTIONS } from '@/constants/budget';
import { formatBudgetIdentity, groupBudgetRecords } from '@/domain/budget';
import { useBudgetData, useClearBudgetErrorOnBlur } from '@/features/budget/budget-data-provider';
import {
  BudgetSummary,
  ChoiceChips,
  GroupLane,
  Section,
  StatusBanner,
} from '@/features/budget/budget-ui';

export default function ReportsScreen() {
  const { snapshot, isLoading, errorMessage } = useBudgetData();
  const [archiveMode, setArchiveMode] = useState<'hide' | 'show'>('hide');
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  useClearBudgetErrorOnBlur();
  const budgets = useMemo(
    () => (snapshot?.budgets ?? []).filter((budget) => archiveMode === 'show' || !budget.archived),
    [archiveMode, snapshot?.budgets],
  );
  const defaultBudget =
    budgets.find((budget) => budget.timing === 'current') ??
    budgets.find((budget) => !budget.archived) ??
    budgets[0];
  const selectedBudget = budgets.find((budget) => budget.id === selectedBudgetId) ?? defaultBudget;
  const recordsByGroup = useMemo(
    () => groupBudgetRecords(snapshot?.records ?? [], selectedBudget?.id ?? -1),
    [selectedBudget?.id, snapshot?.records],
  );

  return (
    <ScreenFrame title="Reports" description="Inspect one budget at a time without mixing periods.">
      {errorMessage ? <StatusBanner tone="error" message={errorMessage} /> : null}
      {isLoading && !snapshot ? (
        <StateMessage kind="loading" title="Loading reports" message="Reading your budgets." />
      ) : null}
      <ChoiceChips
        label="Archived budgets"
        options={ARCHIVE_REPORT_OPTIONS}
        value={archiveMode}
        onChange={setArchiveMode}
      />
      {budgets.length === 0 ? (
        <StateMessage
          kind="empty"
          title="No report yet"
          message="Create a budget and add activity to see its report."
        />
      ) : (
        <>
          <ChoiceChips
            label="Budget"
            options={budgets.map((budget) => ({
              value: budget.id,
              label: formatBudgetIdentity(budget.cadence, budget.startDate, budget.endDate),
            }))}
            value={selectedBudget?.id ?? null}
            onChange={setSelectedBudgetId}
          />
          {selectedBudget ? (
            <>
              <BudgetSummary budget={selectedBudget} />
              <Section title="Group performance">
                {selectedBudget.groups.map((group) => (
                  <GroupLane
                    key={group.groupKey}
                    group={group}
                    records={recordsByGroup[group.groupKey]}
                    onViewAll={() =>
                      router.push({
                        pathname: '/transactions',
                        params: {
                          budgetId: String(selectedBudget.id),
                          group: group.groupKey,
                        },
                      })
                    }
                  />
                ))}
              </Section>
            </>
          ) : null}
        </>
      )}
    </ScreenFrame>
  );
}
