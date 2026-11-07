import type {
  BudgetCadence,
  BudgetGroupKey,
  BudgetRecordType,
  BudgetTiming,
  CategorySeed,
} from '@/domain/budget-types';

export const BUDGET_GROUPS: readonly BudgetGroupKey[] = ['needs', 'wants', 'savings'];

export const DEFAULT_GROUP_PERCENTAGES: Readonly<Record<BudgetGroupKey, number>> = {
  needs: 50,
  wants: 30,
  savings: 20,
};

export const BUDGET_GROUP_LABELS: Readonly<Record<BudgetGroupKey, string>> = {
  needs: 'Needs',
  wants: 'Wants',
  savings: 'Savings',
};

export const BUDGET_GROUP_OPTIONS = BUDGET_GROUPS.map((value) => ({
  value,
  label: BUDGET_GROUP_LABELS[value],
}));

export const STARTER_CATEGORIES: readonly CategorySeed[] = [
  { name: 'Fare', groupKey: 'needs' },
  { name: 'Food', groupKey: 'needs' },
  { name: 'Essential subscriptions', groupKey: 'needs' },
  { name: 'Cravings', groupKey: 'wants' },
  { name: 'Shopping', groupKey: 'wants' },
  { name: 'Entertainment', groupKey: 'wants' },
  { name: 'GoTyme', groupKey: 'savings' },
  { name: 'MariBank', groupKey: 'savings' },
  { name: 'GCash', groupKey: 'savings' },
  { name: 'Stocks', groupKey: 'savings' },
];

export const WARNING_THRESHOLD = 0.8;

export const CADENCE_OPTIONS: readonly { value: BudgetCadence; label: string }[] = [
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const BUDGET_TIMING_LABELS: Readonly<Record<BudgetTiming, string>> = {
  current: 'Current',
  upcoming: 'Upcoming',
  past: 'Past',
};

export const RECORD_TYPE_LABELS: Readonly<Record<BudgetRecordType, string>> = {
  expenditure: 'Expenditure',
  refund: 'Refund',
  savings_withdrawal: 'Savings withdrawal',
};

export const RECORD_TYPE_OPTIONS: readonly { value: BudgetRecordType; label: string }[] = [
  { value: 'expenditure', label: RECORD_TYPE_LABELS.expenditure },
  { value: 'refund', label: RECORD_TYPE_LABELS.refund },
  { value: 'savings_withdrawal', label: RECORD_TYPE_LABELS.savings_withdrawal },
];
