import type { BudgetGroupKey, CategorySeed } from '@/domain/allowance-types';

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
