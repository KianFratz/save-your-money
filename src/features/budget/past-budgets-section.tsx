import { StateMessage } from '@/components/state-message';
import type { Budget } from '@/domain/budget-types';

import { BudgetListFilterControls } from './budget-list-filter-controls';
import { BudgetCard, Section, TextAction } from './budget-ui';
import { useBudgetListControls } from './use-budget-list-controls';

type PastBudgetsSectionProps = {
  budgets: readonly Budget[];
  onOpenBudget: (budgetId: number) => void;
};

export function PastBudgetsSection({ budgets, onOpenBudget }: PastBudgetsSectionProps) {
  const controls = useBudgetListControls({ budgets });

  return (
    <Section
      title="Past"
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
        controls.visibleBudgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} onPress={() => onOpenBudget(budget.id)} />
        ))
      ) : (
        <StateMessage
          kind="empty"
          title="No matching budgets"
          message="No past budgets match these filters."
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
