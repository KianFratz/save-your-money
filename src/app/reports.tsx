import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';
import { ARCHIVE_REPORT_OPTIONS } from '@/constants/budget';
import { groupBudgetRecords } from '@/domain/budget';
import { useBudgetData, useClearBudgetErrorOnBlur } from '@/features/budget/budget-data-provider';
import { ChoiceChips, StatusBanner } from '@/features/budget/budget-ui';
import { ReportBudgetSelector } from '@/features/reports/report-budget-selector';
import { BudgetReport } from '@/features/reports/report-ui';

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
      ) : selectedBudget ? (
        <>
          <ReportBudgetSelector
            budgets={budgets}
            selectedBudgetId={selectedBudget.id}
            onSelectBudget={setSelectedBudgetId}
          />
          <BudgetReport
            key={selectedBudget.id}
            budget={selectedBudget}
            recordsByGroup={recordsByGroup}
            onViewAll={(groupKey) =>
              router.push({
                pathname: '/transactions',
                params: {
                  budgetId: String(selectedBudget.id),
                  group: groupKey,
                },
              })
            }
          />
        </>
      ) : null}
    </ScreenFrame>
  );
}
