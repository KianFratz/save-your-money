export type BudgetGroupKey = 'needs' | 'wants' | 'savings';
export type BudgetCadence = 'monthly' | 'biweekly';
export type BudgetTiming = 'upcoming' | 'current' | 'past';
export type BudgetRecordType = 'expenditure' | 'refund' | 'savings_withdrawal';

export type CategorySeed = {
  name: string;
  groupKey: BudgetGroupKey;
};

export type Category = {
  id: number;
  name: string;
  groupKey: BudgetGroupKey;
  displayOrder: number;
  archived: boolean;
  savedBalanceCents: number;
};

export type PeriodCategorySummary = {
  categoryId: number;
  categoryName: string;
  groupKey: BudgetGroupKey;
  spentCents: number;
  displayOrder: number;
};

export type GroupSummary = {
  groupKey: BudgetGroupKey;
  percentage: number;
  allocatedCents: number;
  spentCents: number;
  remainingCents: number;
  categories: PeriodCategorySummary[];
};

export type Budget = {
  id: number;
  cadence: BudgetCadence;
  startDate: string;
  endDate: string;
  receivedCents: number;
  archived: boolean;
  legacyPeriodId: number | null;
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
  spentCents: number;
  remainingCents: number;
  timing: BudgetTiming;
  groups: GroupSummary[];
};

export type BudgetRecord = {
  id: number;
  budgetId: number | null;
  type: BudgetRecordType;
  amountCents: number;
  effectiveDate: string;
  categoryId: number;
  categoryName: string;
  groupKey: BudgetGroupKey;
  savingsSourceCategoryId: number | null;
  savingsSourceCategoryName: string | null;
  linkedRecordId: number | null;
  description: string | null;
  budgetCadence: BudgetCadence | null;
  budgetStartDate: string | null;
  budgetEndDate: string | null;
};

export type BudgetSnapshot = {
  budgets: Budget[];
  records: BudgetRecord[];
  categories: Category[];
};

export type CreateBudgetInput = {
  cadence: BudgetCadence;
  startDate: string;
  receivedCents: number;
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
};

export type UpdateBudgetInput = CreateBudgetInput & {
  budgetId: number;
};

export type SaveBudgetRecordInput = {
  id?: number;
  budgetId?: number;
  type: BudgetRecordType;
  amountCents: number;
  effectiveDate: string;
  categoryId: number;
  savingsSourceCategoryId?: number;
  description?: string;
};
