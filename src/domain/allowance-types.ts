export type BudgetGroupKey = 'needs' | 'wants' | 'savings';
export type AllowanceCadence = 'monthly' | 'biweekly';
export type AllowancePeriodState = 'draft' | 'active' | 'closed';
export type AccountType = 'cash' | 'bank' | 'ewallet';
export type FinancialEventType =
  | 'disbursement'
  | 'return'
  | 'use'
  | 'refund'
  | 'saved_money_use';

export type CategorySeed = {
  name: string;
  groupKey: BudgetGroupKey;
};

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  openingBalanceCents: number;
  balanceCents: number;
  archived: boolean;
};

export type Category = {
  id: number;
  name: string;
  groupKey: BudgetGroupKey;
  displayOrder: number;
  archived: boolean;
  savedBalanceCents: number;
};

export type CategoryAllocation = {
  categoryId: number;
  categoryName: string;
  groupKey: BudgetGroupKey;
  allocatedCents: number;
  usedCents: number;
  remainingCents: number;
  displayOrder: number;
};

export type GroupSummary = {
  groupKey: BudgetGroupKey;
  percentage: number;
  allocatedCents: number;
  categoryAllocatedCents: number;
  usedCents: number;
  remainingCents: number;
  unallocatedCents: number;
  categories: CategoryAllocation[];
};

export type AllowancePeriod = {
  id: number;
  cadence: AllowanceCadence;
  startDate: string;
  endDate: string;
  plannedCents: number;
  state: AllowancePeriodState;
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
  givenCents: number;
  returnedCents: number;
  netGivenCents: number;
  usedCents: number;
  remainingCents: number;
  sisterHeldCents: number;
  groups: GroupSummary[];
};

export type FinancialEvent = {
  id: number;
  periodId: number | null;
  type: FinancialEventType;
  amountCents: number;
  effectiveDate: string;
  accountId: number | null;
  accountName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  groupKey: BudgetGroupKey | null;
  savingsSourceCategoryId: number | null;
  savingsSourceCategoryName: string | null;
  linkedEventId: number | null;
  note: string | null;
};

export type AllowanceSnapshot = {
  activePeriod: AllowancePeriod | null;
  draftPeriod: AllowancePeriod | null;
  recentEvents: FinancialEvent[];
  accounts: Account[];
  categories: Category[];
  periods: AllowancePeriod[];
};

export type CreatePeriodInput = {
  cadence: AllowanceCadence;
  anchorDate: string;
  plannedCents: number;
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
};

export type RecordEventInput = {
  periodId?: number;
  type: FinancialEventType;
  amountCents: number;
  effectiveDate: string;
  accountId?: number;
  categoryId?: number;
  savingsSourceCategoryId?: number;
  linkedEventId?: number;
  note?: string;
};
