import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { BUDGET_LIST_PREVIEW_LIMIT } from '@/constants/budget';
import type { Budget, BudgetCadence } from '@/domain/budget-types';

export type BudgetCadenceFilter = BudgetCadence | 'all';
export type BudgetYearFilter = number | 'all';

type BudgetListControlsInput = {
  budgets: readonly Budget[];
  pinnedBudgetId?: number;
};

export function useBudgetListControls({ budgets, pinnedBudgetId }: BudgetListControlsInput) {
  const [showFilters, setShowFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [yearFilter, setYearFilter] = useState<BudgetYearFilter>('all');
  const [cadenceFilter, setCadenceFilter] = useState<BudgetCadenceFilter>('all');

  const resetBudgetListView = useCallback(() => {
    setShowFilters(false);
    setShowAll(false);
    setYearFilter('all');
    setCadenceFilter('all');
  }, []);

  useFocusEffect(useCallback(() => resetBudgetListView, [resetBudgetListView]));

  const sortedBudgets = [...budgets].sort(
    (left, right) => right.startDate.localeCompare(left.startDate) || right.id - left.id,
  );
  const yearOptions = getBudgetYearFilterOptions(sortedBudgets);
  const activeFilterCount = Number(yearFilter !== 'all') + Number(cadenceFilter !== 'all');
  const filtersActive = activeFilterCount > 0;
  const filteredBudgets = sortedBudgets.filter((budget) => {
    if (yearFilter !== 'all' && getBudgetStartYear(budget) !== yearFilter) return false;
    if (cadenceFilter !== 'all' && budget.cadence !== cadenceFilter) return false;
    return true;
  });
  const visibleBudgets =
    filtersActive || showAll ? filteredBudgets : getBudgetPreview(filteredBudgets, pinnedBudgetId);
  const canExpand = !filtersActive && sortedBudgets.length > BUDGET_LIST_PREVIEW_LIMIT;
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

  return {
    cadenceFilter,
    canExpand,
    filterActionLabel,
    filtersActive,
    resetFilters,
    setCadenceFilter,
    setYearFilter,
    showAll,
    showFilters,
    toggleFilters: () => setShowFilters((filtersAreVisible) => !filtersAreVisible),
    toggleShowAll: () => setShowAll((allBudgetsAreVisible) => !allBudgetsAreVisible),
    visibleBudgets,
    yearFilter,
    yearOptions,
  };
}

function getBudgetPreview(budgets: readonly Budget[], pinnedBudgetId?: number): Budget[] {
  const preview = budgets.slice(0, BUDGET_LIST_PREVIEW_LIMIT);
  if (!pinnedBudgetId || preview.some((budget) => budget.id === pinnedBudgetId)) return preview;

  const pinnedBudget = budgets.find((budget) => budget.id === pinnedBudgetId);
  if (!pinnedBudget) return preview;

  return [...preview.slice(0, BUDGET_LIST_PREVIEW_LIMIT - 1), pinnedBudget];
}

function getBudgetYearFilterOptions(budgets: readonly Budget[]) {
  const years = [...new Set(budgets.map(getBudgetStartYear))].sort((left, right) => right - left);
  return [
    { value: 'all' as const, label: 'All years' },
    ...years.map((year) => ({ value: year, label: String(year) })),
  ];
}

function getBudgetStartYear(budget: Budget): number {
  return Number(budget.startDate.slice(0, 4));
}
