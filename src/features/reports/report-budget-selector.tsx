import { StateMessage } from '@/components/state-message';
import { formatBudgetIdentity } from '@/domain/budget';
import type { Budget } from '@/domain/budget-types';
import { BudgetListFilterControls } from '@/features/budget/budget-list-filter-controls';
import { ChoiceChips, Section, TextAction } from '@/features/budget/budget-ui';
import { useBudgetListControls } from '@/features/budget/use-budget-list-controls';

type ReportBudgetSelectorProps = {
  budgets: readonly Budget[];
  selectedBudgetId: number;
  onSelectBudget: (budgetId: number) => void;
};

export function ReportBudgetSelector({
  budgets,
  selectedBudgetId,
  onSelectBudget,
}: ReportBudgetSelectorProps) {
  const controls = useBudgetListControls({ budgets, pinnedBudgetId: selectedBudgetId });

  return (
    <Section
      title="Budget"
      action={<TextAction label={controls.filterActionLabel} onPress={controls.toggleFilters} />}>
      {controls.showFilters ? (
        <BudgetListFilterControls
          yearOptions={controls.yearOptions}
          yearFilter={controls.yearFilter}
          cadenceFilter={controls.cadenceFilter}
          showResetAction={controls.filtersActive && controls.visibleBudgets.length > 0}
          onChangeYear={controls.setYearFilter}
          onChangeCadence={controls.setCadenceFilter}
          onReset={controls.resetFilters}
        />
      ) : null}

      {controls.visibleBudgets.length > 0 ? (
        <ChoiceChips
          label="Choose a budget"
          options={controls.visibleBudgets.map((budget) => ({
            value: budget.id,
            label: formatBudgetIdentity(budget.cadence, budget.startDate, budget.endDate),
          }))}
          value={selectedBudgetId}
          onChange={onSelectBudget}
        />
      ) : (
        <StateMessage
          kind="empty"
          title="No matching budgets"
          message="No budgets match these filters."
          actionLabel="Reset filters"
          onAction={controls.resetFilters}
        />
      )}

      {controls.canExpand ? (
        <TextAction
          label={controls.showAll ? 'Show less' : 'View all'}
          onPress={controls.toggleShowAll}
        />
      ) : null}
    </Section>
  );
}
