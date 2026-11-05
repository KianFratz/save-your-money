import type { SQLiteDatabase } from 'expo-sqlite';

import {
  allocateByLargestRemainder,
  getPeriodBounds,
  isValidIsoDate,
  todayIsoDate,
  validateGroupPercentages,
} from '@/domain/allowance';
import type {
  Account,
  AccountType,
  ApplyLeftoverInput,
  AllowancePeriod,
  AllowanceSnapshot,
  BudgetGroupKey,
  Category,
  CategoryAllocation,
  CreatePeriodInput,
  FinancialEvent,
  FinancialEventType,
  GroupSummary,
  RecordEventInput,
} from '@/domain/allowance-types';

type AccountRow = {
  id: number;
  name: string;
  type: AccountType;
  opening_balance_cents: number;
  archived: number;
  balance_cents: number;
};

type CategoryRow = {
  id: number;
  name: string;
  group_key: BudgetGroupKey;
  display_order: number;
  archived: number;
  saved_balance_cents: number;
};

type PeriodRow = {
  id: number;
  cadence: 'monthly' | 'biweekly';
  start_date: string;
  end_date: string;
  planned_cents: number;
  state: 'draft' | 'active' | 'closed';
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  given_cents: number;
  returned_cents: number;
  used_cents: number;
  leftover_applied_cents: number;
  leftover_committed_cents: number;
};

type LeftoverRow = {
  id: number;
  source_period_id: number;
  target_period_id: number;
  amount_cents: number;
  effective_date: string;
  note: string | null;
};

type AllocationRow = {
  period_id: number;
  category_id: number;
  category_name_snapshot: string;
  group_key_snapshot: BudgetGroupKey;
  allocated_cents: number;
  display_order: number;
  used_cents: number;
};

type EventRow = {
  id: number;
  period_id: number | null;
  type: FinancialEventType;
  amount_cents: number;
  effective_date: string;
  account_id: number | null;
  account_name: string | null;
  category_id: number | null;
  category_name: string | null;
  group_key: BudgetGroupKey | null;
  savings_source_category_id: number | null;
  savings_source_category_name: string | null;
  linked_event_id: number | null;
  note: string | null;
};

export async function loadAllowanceSnapshot(db: SQLiteDatabase): Promise<AllowanceSnapshot> {
  const [accountRows, categoryRows, periodRows, allocationRows, eventRows, leftoverRows] =
    await Promise.all([
      db.getAllAsync<AccountRow>(ACCOUNTS_QUERY),
      db.getAllAsync<CategoryRow>(CATEGORIES_QUERY),
      db.getAllAsync<PeriodRow>(PERIODS_QUERY),
      db.getAllAsync<AllocationRow>(ALLOCATIONS_QUERY),
      db.getAllAsync<EventRow>(EVENTS_QUERY, 100),
      db.getAllAsync<LeftoverRow>(LEFTOVER_EVENTS_QUERY),
    ]);

  const allocationsByPeriod = groupAllocationsByPeriod(allocationRows);
  const periods = periodRows.map((periodRow) =>
    mapPeriod(periodRow, allocationsByPeriod.get(periodRow.id) ?? []),
  );

  return {
    activePeriod: periods.find((period) => period.state === 'active') ?? null,
    draftPeriod: periods.find((period) => period.state === 'draft') ?? null,
    recentEvents: [...eventRows.map(mapEvent), ...leftoverRows.map(mapLeftoverEvent)]
      .sort(
        (left, right) =>
          right.effectiveDate.localeCompare(left.effectiveDate) || right.id - left.id,
      )
      .slice(0, 100),
    accounts: accountRows.map(mapAccount),
    categories: categoryRows.map(mapCategory),
    periods,
  };
}

export async function applyHeldAllowance(
  db: SQLiteDatabase,
  input: ApplyLeftoverInput,
): Promise<void> {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
  if (!isValidIsoDate(input.effectiveDate)) {
    throw new Error('Enter a valid date in YYYY-MM-DD format.');
  }
  if (input.effectiveDate > todayIsoDate()) {
    throw new Error('Future entries are not allowed.');
  }

  const source = await db.getFirstAsync<{
    state: 'draft' | 'active' | 'closed';
    available_cents: number;
  }>(SOURCE_HELD_BALANCE_QUERY, input.sourcePeriodId);
  if (!source || source.state !== 'closed') {
    throw new Error('Choose a closed period with allowance still held by your sister.');
  }
  if (source.available_cents < input.amountCents) {
    throw new Error('The applied amount is greater than the held balance from that period.');
  }

  const target = await db.getFirstAsync<{
    state: 'draft' | 'active' | 'closed';
    start_date: string;
    end_date: string;
  }>(
    'SELECT state, start_date, end_date FROM allowance_periods WHERE id = ?',
    input.targetPeriodId,
  );
  if (!target || target.state !== 'active') {
    throw new Error('Activate the new allowance period before applying held money.');
  }
  if (input.effectiveDate < target.start_date || input.effectiveDate > target.end_date) {
    throw new Error(`Choose a date from ${target.start_date} to ${target.end_date}.`);
  }

  await db.runAsync(
    `INSERT INTO leftover_applications
      (source_period_id, target_period_id, amount_cents, effective_date, note)
     VALUES (?, ?, ?, ?, ?)`,
    input.sourcePeriodId,
    input.targetPeriodId,
    input.amountCents,
    input.effectiveDate,
    input.note?.trim() || null,
  );
}

export async function createPeriodDraft(
  db: SQLiteDatabase,
  input: CreatePeriodInput,
): Promise<number> {
  const percentages = {
    needs: input.needsPercentage,
    wants: input.wantsPercentage,
    savings: input.savingsPercentage,
  };
  if (!validateGroupPercentages(percentages)) {
    throw new Error('Needs, Wants, and Savings must total exactly 100%.');
  }
  if (!Number.isSafeInteger(input.plannedCents) || input.plannedCents <= 0) {
    throw new Error('Enter an allowance greater than zero.');
  }

  const { startDate, endDate } = getPeriodBounds(input.cadence, input.anchorDate);
  let periodId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO allowance_periods (
        cadence, start_date, end_date, planned_cents, state,
        needs_percentage, wants_percentage, savings_percentage
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
      input.cadence,
      startDate,
      endDate,
      input.plannedCents,
      input.needsPercentage,
      input.wantsPercentage,
      input.savingsPercentage,
    );
    periodId = result.lastInsertRowId;

    const categories = await db.getAllAsync<{
      id: number;
      name: string;
      group_key: BudgetGroupKey;
      display_order: number;
    }>('SELECT id, name, group_key, display_order FROM categories WHERE archived = 0');

    const groupAllocations = allocateByLargestRemainder(input.plannedCents, percentages);
    const categoriesByGroup = new Map<BudgetGroupKey, typeof categories>();
    for (const category of categories) {
      const groupCategories = categoriesByGroup.get(category.group_key) ?? [];
      groupCategories.push(category);
      categoriesByGroup.set(category.group_key, groupCategories);
    }

    for (const category of categories) {
      const groupCategories = categoriesByGroup.get(category.group_key) ?? [];
      const allocatedCents = distributeEvenly(
        groupAllocations[category.group_key],
        groupCategories.length,
        groupCategories.findIndex((candidate) => candidate.id === category.id),
      );
      await db.runAsync(
        `INSERT INTO category_allocations (
          period_id, category_id, category_name_snapshot, group_key_snapshot,
          allocated_cents, display_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        periodId,
        category.id,
        category.name,
        category.group_key,
        allocatedCents,
        category.display_order,
      );
    }
  });

  return periodId;
}

export async function activatePeriod(db: SQLiteDatabase, periodId: number): Promise<void> {
  const active = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM allowance_periods WHERE state = 'active'",
  );
  if (active) {
    throw new Error('Close the current allowance period before activating another one.');
  }

  const result = await db.runAsync(
    "UPDATE allowance_periods SET state = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND state = 'draft'",
    periodId,
  );
  if (result.changes !== 1) {
    throw new Error('Only a draft allowance period can be activated.');
  }
}

export async function closePeriod(db: SQLiteDatabase, periodId: number): Promise<void> {
  const result = await db.runAsync(
    "UPDATE allowance_periods SET state = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND state = 'active'",
    periodId,
  );
  if (result.changes !== 1) {
    throw new Error('Only the active allowance period can be closed.');
  }
}

export async function reopenPeriod(db: SQLiteDatabase, periodId: number): Promise<void> {
  const active = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM allowance_periods WHERE state = 'active'",
  );
  if (active) {
    throw new Error('Close the current allowance period before reopening a historical one.');
  }

  const result = await db.runAsync(
    "UPDATE allowance_periods SET state = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND state = 'closed'",
    periodId,
  );
  if (result.changes !== 1) {
    throw new Error('Only a closed allowance period can be reopened.');
  }
}

export async function updateCategoryAllocation(
  db: SQLiteDatabase,
  periodId: number,
  categoryId: number,
  allocatedCents: number,
): Promise<void> {
  if (!Number.isSafeInteger(allocatedCents) || allocatedCents < 0) {
    throw new Error('Category allocation cannot be negative.');
  }

  const row = await db.getFirstAsync<{
    group_key_snapshot: BudgetGroupKey;
    planned_cents: number;
    needs_percentage: number;
    wants_percentage: number;
    savings_percentage: number;
  }>(
    `SELECT ca.group_key_snapshot, p.planned_cents,
      p.needs_percentage, p.wants_percentage, p.savings_percentage
     FROM category_allocations ca
     JOIN allowance_periods p ON p.id = ca.period_id
     WHERE ca.period_id = ? AND ca.category_id = ? AND p.state IN ('draft', 'active')`,
    periodId,
    categoryId,
  );
  if (!row) {
    throw new Error('This category allocation cannot be edited.');
  }

  const percentages = {
    needs: row.needs_percentage,
    wants: row.wants_percentage,
    savings: row.savings_percentage,
  };
  const groupAllocation = allocateByLargestRemainder(row.planned_cents, percentages)[
    row.group_key_snapshot
  ];
  const otherTotal = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(allocated_cents), 0) AS total
     FROM category_allocations
     WHERE period_id = ? AND group_key_snapshot = ? AND category_id != ?`,
    periodId,
    row.group_key_snapshot,
    categoryId,
  );
  if ((otherTotal?.total ?? 0) + allocatedCents > groupAllocation) {
    throw new Error('Category allocations cannot exceed their group allocation.');
  }

  await db.runAsync(
    'UPDATE category_allocations SET allocated_cents = ? WHERE period_id = ? AND category_id = ?',
    allocatedCents,
    periodId,
    categoryId,
  );
}

export async function recordFinancialEvent(
  db: SQLiteDatabase,
  input: RecordEventInput,
): Promise<void> {
  validateRecordEventInput(input);

  await validateEventContext(db, input);

  if (input.type === 'saved_money_use') {
    await assertSavingsBalance(db, input.savingsSourceCategoryId, input.amountCents);
  }

  await db.runAsync(
    `INSERT INTO financial_events (
      period_id, type, amount_cents, effective_date, account_id, category_id,
      savings_source_category_id, linked_event_id, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.periodId ?? null,
    input.type,
    input.amountCents,
    input.effectiveDate,
    input.accountId ?? null,
    input.categoryId ?? null,
    input.savingsSourceCategoryId ?? null,
    input.linkedEventId ?? null,
    input.note?.trim() || null,
  );
}

export async function addAccount(
  db: SQLiteDatabase,
  input: { name: string; type: AccountType; openingBalanceCents: number },
): Promise<void> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Enter an account name.');
  }
  if (!Number.isSafeInteger(input.openingBalanceCents) || input.openingBalanceCents < 0) {
    throw new Error('Opening balance cannot be negative.');
  }

  await db.runAsync(
    'INSERT INTO accounts (name, type, opening_balance_cents) VALUES (?, ?, ?)',
    name,
    input.type,
    input.openingBalanceCents,
  );
}

export async function addCategory(
  db: SQLiteDatabase,
  input: { name: string; groupKey: BudgetGroupKey },
): Promise<void> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Enter a category name.');
  }

  const order = await db.getFirstAsync<{ next_order: number }>(
    'SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM categories',
  );
  await db.runAsync(
    'INSERT INTO categories (name, group_key, display_order) VALUES (?, ?, ?)',
    name,
    input.groupKey,
    order?.next_order ?? 0,
  );
}

function validateRecordEventInput(input: RecordEventInput): void {
  if (input.type === 'leftover_application') {
    throw new Error('Apply held allowance through its source and target periods.');
  }
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }

  if ((input.type === 'disbursement' || input.type === 'return') && !input.accountId) {
    throw new Error('Select the account used for this allowance payment.');
  }
  if (input.type !== 'saved_money_use' && !input.periodId) {
    throw new Error('Select an allowance period.');
  }
  if ((input.type === 'use' || input.type === 'refund') && !input.categoryId) {
    throw new Error('Select a category.');
  }
  if (input.type === 'saved_money_use' && (!input.categoryId || !input.savingsSourceCategoryId)) {
    throw new Error('Select both the savings source and what it funded.');
  }
  if (!isValidIsoDate(input.effectiveDate)) {
    throw new Error('Enter a valid date in YYYY-MM-DD format.');
  }
  if (input.effectiveDate > todayIsoDate()) {
    throw new Error('Future entries are not allowed.');
  }
}

async function validateEventContext(db: SQLiteDatabase, input: RecordEventInput): Promise<void> {
  if (input.type === 'saved_money_use') {
    return;
  }

  const periodId = input.periodId;
  if (periodId === undefined) {
    throw new Error('Select an allowance period.');
  }

  const period = await db.getFirstAsync<{
    state: 'draft' | 'active' | 'closed';
    start_date: string;
    end_date: string;
  }>('SELECT state, start_date, end_date FROM allowance_periods WHERE id = ?', periodId);
  if (!period) {
    throw new Error('Select an allowance period.');
  }
  if (period.state !== 'active') {
    throw new Error(
      period.state === 'closed'
        ? 'Reopen this period before adding an entry.'
        : 'Activate this draft before adding an entry.',
    );
  }
  if (input.effectiveDate < period.start_date || input.effectiveDate > period.end_date) {
    throw new Error(`Choose a date from ${period.start_date} to ${period.end_date}.`);
  }

  if ((input.type === 'use' || input.type === 'refund') && input.categoryId) {
    const allocation = await db.getFirstAsync<{ category_id: number }>(
      'SELECT category_id FROM category_allocations WHERE period_id = ? AND category_id = ?',
      periodId,
      input.categoryId,
    );
    if (!allocation) {
      throw new Error('That category is not part of this allowance period.');
    }
  }

  if (input.type === 'refund' && input.categoryId) {
    const spending = await db.getFirstAsync<{ net_used: number }>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'use' THEN amount_cents WHEN type = 'refund' THEN -amount_cents ELSE 0 END), 0) AS net_used
       FROM financial_events WHERE period_id = ? AND category_id = ?`,
      periodId,
      input.categoryId,
    );
    if ((spending?.net_used ?? 0) < input.amountCents) {
      throw new Error('A refund cannot be greater than the spending logged for this category.');
    }
  }

  if (input.type === 'return') {
    const funding = await db.getFirstAsync<{ net_given: number }>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'disbursement' THEN amount_cents WHEN type = 'return' THEN -amount_cents ELSE 0 END), 0) AS net_given
       FROM financial_events WHERE period_id = ?`,
      periodId,
    );
    if ((funding?.net_given ?? 0) < input.amountCents) {
      throw new Error('The returned amount cannot be greater than the allowance given.');
    }
  }
}

async function assertSavingsBalance(
  db: SQLiteDatabase,
  savingsSourceCategoryId: number | undefined,
  amountCents: number,
): Promise<void> {
  if (!savingsSourceCategoryId) {
    throw new Error('Select a savings source.');
  }
  const category = await db.getFirstAsync<CategoryRow>(
    CATEGORIES_QUERY + ' HAVING c.id = ?',
    savingsSourceCategoryId,
  );
  if (!category || category.group_key !== 'savings') {
    throw new Error('Select a Savings category as the source.');
  }
  if (category.saved_balance_cents < amountCents) {
    throw new Error('This Savings category does not have enough allowance-derived savings.');
  }
}

function groupAllocationsByPeriod(rows: AllocationRow[]): Map<number, AllocationRow[]> {
  const grouped = new Map<number, AllocationRow[]>();
  for (const row of rows) {
    const periodRows = grouped.get(row.period_id) ?? [];
    periodRows.push(row);
    grouped.set(row.period_id, periodRows);
  }
  return grouped;
}

function mapPeriod(row: PeriodRow, allocationRows: AllocationRow[]): AllowancePeriod {
  const percentages = {
    needs: row.needs_percentage,
    wants: row.wants_percentage,
    savings: row.savings_percentage,
  };
  const groupAllocations = allocateByLargestRemainder(row.planned_cents, percentages);
  const groups = (Object.keys(groupAllocations) as BudgetGroupKey[]).map<GroupSummary>(
    (groupKey) => {
      const categories = allocationRows
        .filter((allocation) => allocation.group_key_snapshot === groupKey)
        .map<CategoryAllocation>((allocation) => ({
          categoryId: allocation.category_id,
          categoryName: allocation.category_name_snapshot,
          groupKey,
          allocatedCents: allocation.allocated_cents,
          usedCents: allocation.used_cents,
          remainingCents: allocation.allocated_cents - allocation.used_cents,
          displayOrder: allocation.display_order,
        }));
      const categoryAllocatedCents = categories.reduce(
        (sum, category) => sum + category.allocatedCents,
        0,
      );
      const usedCents = categories.reduce((sum, category) => sum + category.usedCents, 0);
      return {
        groupKey,
        percentage: percentages[groupKey],
        allocatedCents: groupAllocations[groupKey],
        categoryAllocatedCents,
        usedCents,
        remainingCents: groupAllocations[groupKey] - usedCents,
        unallocatedCents: groupAllocations[groupKey] - categoryAllocatedCents,
        categories,
      };
    },
  );
  const netGivenCents = row.given_cents - row.returned_cents;
  const fundedCents = netGivenCents + row.leftover_applied_cents;

  return {
    id: row.id,
    cadence: row.cadence,
    startDate: row.start_date,
    endDate: row.end_date,
    plannedCents: row.planned_cents,
    state: row.state,
    needsPercentage: row.needs_percentage,
    wantsPercentage: row.wants_percentage,
    savingsPercentage: row.savings_percentage,
    givenCents: row.given_cents,
    returnedCents: row.returned_cents,
    netGivenCents,
    usedCents: row.used_cents,
    remainingCents: row.planned_cents - row.used_cents,
    leftoverAppliedCents: row.leftover_applied_cents,
    leftoverCommittedCents: row.leftover_committed_cents,
    fundedCents,
    sisterHeldCents: fundedCents - row.used_cents - row.leftover_committed_cents,
    groups,
  };
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    openingBalanceCents: row.opening_balance_cents,
    balanceCents: row.balance_cents,
    archived: row.archived === 1,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    groupKey: row.group_key,
    displayOrder: row.display_order,
    archived: row.archived === 1,
    savedBalanceCents: row.saved_balance_cents,
  };
}

function mapEvent(row: EventRow): FinancialEvent {
  return {
    id: row.id,
    periodId: row.period_id,
    type: row.type,
    amountCents: row.amount_cents,
    effectiveDate: row.effective_date,
    accountId: row.account_id,
    accountName: row.account_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    groupKey: row.group_key,
    savingsSourceCategoryId: row.savings_source_category_id,
    savingsSourceCategoryName: row.savings_source_category_name,
    linkedEventId: row.linked_event_id,
    sourcePeriodId: null,
    note: row.note,
  };
}

function mapLeftoverEvent(row: LeftoverRow): FinancialEvent {
  return {
    id: -row.id,
    periodId: row.target_period_id,
    type: 'leftover_application',
    amountCents: row.amount_cents,
    effectiveDate: row.effective_date,
    accountId: null,
    accountName: null,
    categoryId: null,
    categoryName: null,
    groupKey: null,
    savingsSourceCategoryId: null,
    savingsSourceCategoryName: null,
    linkedEventId: null,
    sourcePeriodId: row.source_period_id,
    note: row.note,
  };
}

function distributeEvenly(totalCents: number, count: number, index: number): number {
  if (count <= 0 || index < 0) {
    return 0;
  }
  const base = Math.floor(totalCents / count);
  return base + (index < totalCents % count ? 1 : 0);
}

const ACCOUNTS_QUERY = `
  SELECT a.id, a.name, a.type, a.opening_balance_cents, a.archived,
    a.opening_balance_cents
      - COALESCE(SUM(CASE WHEN fe.type = 'disbursement' THEN fe.amount_cents ELSE 0 END), 0)
      + COALESCE(SUM(CASE WHEN fe.type = 'return' THEN fe.amount_cents ELSE 0 END), 0)
      AS balance_cents
  FROM accounts a
  LEFT JOIN financial_events fe ON fe.account_id = a.id
  GROUP BY a.id
  ORDER BY a.archived, a.id`;

const CATEGORIES_QUERY = `
  SELECT c.id, c.name, c.group_key, c.display_order, c.archived,
    COALESCE(SUM(CASE WHEN fe.type = 'use' AND fe.category_id = c.id AND c.group_key = 'savings' THEN fe.amount_cents ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN fe.type = 'refund' AND fe.category_id = c.id AND c.group_key = 'savings' THEN fe.amount_cents ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN fe.type = 'saved_money_use' AND fe.savings_source_category_id = c.id THEN fe.amount_cents ELSE 0 END), 0)
      AS saved_balance_cents
  FROM categories c
  LEFT JOIN financial_events fe
    ON fe.category_id = c.id OR fe.savings_source_category_id = c.id
  GROUP BY c.id`;

const PERIODS_QUERY = `
  SELECT p.id, p.cadence, p.start_date, p.end_date, p.planned_cents, p.state,
    p.needs_percentage, p.wants_percentage, p.savings_percentage,
    COALESCE(SUM(CASE WHEN fe.type = 'disbursement' THEN fe.amount_cents ELSE 0 END), 0) AS given_cents,
    COALESCE(SUM(CASE WHEN fe.type = 'return' THEN fe.amount_cents ELSE 0 END), 0) AS returned_cents,
    COALESCE(SUM(CASE WHEN fe.type = 'use' THEN fe.amount_cents WHEN fe.type = 'refund' THEN -fe.amount_cents ELSE 0 END), 0) AS used_cents,
    COALESCE((SELECT SUM(amount_cents) FROM leftover_applications WHERE target_period_id = p.id), 0) AS leftover_applied_cents,
    COALESCE((SELECT SUM(amount_cents) FROM leftover_applications WHERE source_period_id = p.id), 0) AS leftover_committed_cents
  FROM allowance_periods p
  LEFT JOIN financial_events fe ON fe.period_id = p.id
  GROUP BY p.id
  ORDER BY p.start_date DESC, p.id DESC`;

const ALLOCATIONS_QUERY = `
  SELECT ca.period_id, ca.category_id, ca.category_name_snapshot,
    ca.group_key_snapshot, ca.allocated_cents, ca.display_order,
    COALESCE(SUM(CASE WHEN fe.type = 'use' THEN fe.amount_cents WHEN fe.type = 'refund' THEN -fe.amount_cents ELSE 0 END), 0) AS used_cents
  FROM category_allocations ca
  LEFT JOIN financial_events fe
    ON fe.period_id = ca.period_id AND fe.category_id = ca.category_id
  GROUP BY ca.period_id, ca.category_id
  ORDER BY ca.period_id, ca.display_order`;

const EVENTS_QUERY = `
  SELECT fe.id, fe.period_id, fe.type, fe.amount_cents, fe.effective_date,
    fe.account_id, a.name AS account_name, fe.category_id,
    COALESCE(ca.category_name_snapshot, c.name) AS category_name,
    COALESCE(ca.group_key_snapshot, c.group_key) AS group_key,
    fe.savings_source_category_id, source.name AS savings_source_category_name,
    fe.linked_event_id, fe.note
  FROM financial_events fe
  LEFT JOIN accounts a ON a.id = fe.account_id
  LEFT JOIN categories c ON c.id = fe.category_id
  LEFT JOIN category_allocations ca ON ca.period_id = fe.period_id AND ca.category_id = fe.category_id
  LEFT JOIN categories source ON source.id = fe.savings_source_category_id
  ORDER BY fe.effective_date DESC, fe.id DESC
  LIMIT ?`;

const LEFTOVER_EVENTS_QUERY = `
  SELECT id, source_period_id, target_period_id, amount_cents, effective_date, note
  FROM leftover_applications
  ORDER BY effective_date DESC, id DESC
  LIMIT 100`;

const SOURCE_HELD_BALANCE_QUERY = `
  SELECT p.state,
    COALESCE((SELECT SUM(CASE WHEN type = 'disbursement' THEN amount_cents WHEN type = 'return' THEN -amount_cents ELSE 0 END) FROM financial_events WHERE period_id = p.id), 0)
      - COALESCE((SELECT SUM(CASE WHEN type = 'use' THEN amount_cents WHEN type = 'refund' THEN -amount_cents ELSE 0 END) FROM financial_events WHERE period_id = p.id), 0)
      - COALESCE((SELECT SUM(amount_cents) FROM leftover_applications WHERE source_period_id = p.id), 0)
      AS available_cents
  FROM allowance_periods p
  WHERE p.id = ?`;
