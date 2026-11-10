import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { StateMessage } from '@/components/state-message';
import { PAST_BUDGET_CADENCE_FILTER_OPTIONS, PAST_BUDGET_PREVIEW_LIMIT } from '@/constants/budget';
import { Spacing } from '@/constants/theme';
import type { Budget, BudgetCadence } from '@/domain/budget-types';

import { BudgetCard, ChoiceChips, Section, TextAction } from './budget-ui';

type CadenceFilter = BudgetCadence | 'all';
type YearFilter = number | 'all';

type PastBudgetsSectionProps = {
  budgets: readonly Budget[];
  onOpenBudget: (budgetId: number) => void;
};

export function PastBudgetsSection({ budgets, onOpenBudget }: PastBudgetsSectionProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [cadenceFilter, setCadenceFilter] = useState<CadenceFilter>('all');

  const resetPastBudgetView = useCallback(() => {
    setShowFilters(false);
    setShowAll(false);
    setYearFilter('all');
    setCadenceFilter('all');
  }, []);

  useFocusEffect(useCallback(() => resetPastBudgetView, [resetPastBudgetView]));

  const sortedBudgets = [...budgets].sort(
    (left, right) => right.startDate.localeCompare(left.startDate) || right.id - left.id,
  );
  const yearOptions = getYearFilterOptions(sortedBudgets);
  const activeFilterCount = Number(yearFilter !== 'all') + Number(cadenceFilter !== 'all');
  const filtersActive = activeFilterCount > 0;
  const filteredBudgets = sortedBudgets.filter((budget) => {
    if (yearFilter !== 'all' && getBudgetStartYear(budget) !== yearFilter) return false;
    if (cadenceFilter !== 'all' && budget.cadence !== cadenceFilter) return false;
    return true;
  });
  const visibleBudgets =
    filtersActive || showAll
      ? filteredBudgets
      : filteredBudgets.slice(0, PAST_BUDGET_PREVIEW_LIMIT);
  const canExpand = !filtersActive && sortedBudgets.length > PAST_BUDGET_PREVIEW_LIMIT;
  const filterActionLabel = showFilters
    ? 'Hide filters'
    : filtersActive
      ? `Filters (${activeFilterCount})`
      : 'Filter';

  function resetFilters() {
    setShowAll(false);
    setYearFilter('all');
    setCadenceFilter('all');
  }

  return (
    <Section
      title="Past"
      action={
        <TextAction
          label={filterActionLabel}
          onPress={() => setShowFilters((filtersAreVisible) => !filtersAreVisible)}
        />
      }>
      {showFilters ? (
        <View style={styles.filters}>
          <ChoiceChips
            label="Year"
            options={yearOptions}
            value={yearFilter}
            onChange={setYearFilter}
          />
          <ChoiceChips
            label="Cadence"
            options={PAST_BUDGET_CADENCE_FILTER_OPTIONS}
            value={cadenceFilter}
            onChange={setCadenceFilter}
          />
          {filtersActive && visibleBudgets.length > 0 ? (
            <TextAction label="Reset filters" onPress={resetFilters} />
          ) : null}
        </View>
      ) : null}

      {visibleBudgets.length > 0 ? (
        visibleBudgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} onPress={() => onOpenBudget(budget.id)} />
        ))
      ) : (
        <StateMessage
          kind="empty"
          title="No matching budgets"
          message="No past budgets match these filters."
          actionLabel="Reset filters"
          onAction={resetFilters}
        />
      )}

      {canExpand ? (
        <TextAction
          label={showAll ? 'Show less' : 'View all'}
          onPress={() => setShowAll((allBudgetsAreVisible) => !allBudgetsAreVisible)}
        />
      ) : null}
    </Section>
  );
}

function getYearFilterOptions(budgets: readonly Budget[]) {
  const years = [...new Set(budgets.map(getBudgetStartYear))].sort((left, right) => right - left);
  return [
    { value: 'all' as const, label: 'All years' },
    ...years.map((year) => ({ value: year, label: String(year) })),
  ];
}

function getBudgetStartYear(budget: Budget): number {
  return Number(budget.startDate.slice(0, 4));
}

const styles = StyleSheet.create({
  filters: { gap: Spacing.three },
});
