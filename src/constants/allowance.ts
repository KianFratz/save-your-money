import type {
  AccountType,
  AllowanceCadence,
  BudgetGroupKey,
  CategorySeed,
  FinancialEventType,
} from '@/domain/allowance-types';

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

export const DEFAULT_ACCOUNT_NAMES = ['Cash', 'GCash'] as const;

export const WARNING_THRESHOLD = 0.8;

export const CADENCE_OPTIONS: readonly { value: AllowanceCadence; label: string }[] = [
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

export const ACCOUNT_TYPE_OPTIONS: readonly { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'ewallet', label: 'E-wallet' },
];

export const EVENT_TYPE_LABELS: Readonly<Record<FinancialEventType, string>> = {
  disbursement: 'Give allowance',
  return: 'Money returned',
  use: 'Log allowance use',
  refund: 'Log refund',
  saved_money_use: 'Use saved money',
  leftover_application: 'Apply held allowance',
};

export const EVENT_TYPE_OPTIONS: readonly { value: FinancialEventType; label: string }[] = [
  { value: 'use', label: EVENT_TYPE_LABELS.use },
  { value: 'disbursement', label: EVENT_TYPE_LABELS.disbursement },
  { value: 'return', label: EVENT_TYPE_LABELS.return },
  { value: 'refund', label: EVENT_TYPE_LABELS.refund },
  { value: 'saved_money_use', label: EVENT_TYPE_LABELS.saved_money_use },
];
