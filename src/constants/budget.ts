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

export const BUDGET_GROUP_FILTER_OPTIONS: readonly {
  value: BudgetGroupKey | 'all';
  label: string;
}[] = [{ value: 'all', label: 'All groups' }, ...BUDGET_GROUP_OPTIONS];

export const GROUP_ACTIVITY_PREVIEW_LIMIT = 3;

export const PAST_BUDGET_PREVIEW_LIMIT = 2;

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
  { name: 'Others', groupKey: 'wants' },
];

export const WARNING_THRESHOLD = 0.8;

export const CADENCE_OPTIONS: readonly { value: BudgetCadence; label: string }[] = [
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const PAST_BUDGET_CADENCE_FILTER_OPTIONS: readonly {
  value: BudgetCadence | 'all';
  label: string;
}[] = [{ value: 'all', label: 'All' }, ...CADENCE_OPTIONS];

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

export const RECORD_TYPE_FILTER_OPTIONS: readonly {
  value: BudgetRecordType | 'all';
  label: string;
}[] = [{ value: 'all', label: 'All types' }, ...RECORD_TYPE_OPTIONS];

export const ARCHIVE_REPORT_OPTIONS = [
  { value: 'hide', label: 'Hide archived' },
  { value: 'show', label: 'Include archived' },
] as const;

export const BUDGET_ARCHIVE_VIEW_OPTIONS = [
  { value: 'budgets', label: 'Budgets' },
  { value: 'archived', label: 'Archived' },
] as const;
