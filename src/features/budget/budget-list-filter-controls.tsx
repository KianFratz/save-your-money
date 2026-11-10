import { StyleSheet, View } from 'react-native';

import { BUDGET_CADENCE_FILTER_OPTIONS } from '@/constants/budget';
import { Spacing } from '@/constants/theme';

import { ChoiceChips, TextAction } from './budget-ui';
import type { BudgetCadenceFilter, BudgetYearFilter } from './use-budget-list-controls';

type BudgetListFilterControlsProps = {
  yearOptions: readonly { value: BudgetYearFilter; label: string }[];
  yearFilter: BudgetYearFilter;
  cadenceFilter: BudgetCadenceFilter;
  showResetAction: boolean;
  onChangeYear: (year: BudgetYearFilter) => void;
  onChangeCadence: (cadence: BudgetCadenceFilter) => void;
  onReset: () => void;
};

export function BudgetListFilterControls({
  yearOptions,
  yearFilter,
  cadenceFilter,
  showResetAction,
  onChangeYear,
  onChangeCadence,
  onReset,
}: BudgetListFilterControlsProps) {
  return (
    <View style={styles.filters}>
      <ChoiceChips label="Year" options={yearOptions} value={yearFilter} onChange={onChangeYear} />
      <ChoiceChips
        label="Cadence"
        options={BUDGET_CADENCE_FILTER_OPTIONS}
        value={cadenceFilter}
        onChange={onChangeCadence}
      />
      {showResetAction ? <TextAction label="Reset filters" onPress={onReset} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { gap: Spacing.three },
});
