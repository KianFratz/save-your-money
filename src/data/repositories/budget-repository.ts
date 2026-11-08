import type { SQLiteDatabase } from 'expo-sqlite';

import { BUDGET_GROUPS } from '@/constants/budget';
import {
  allocateByLargestRemainder,
  getBudgetBounds,
  getBudgetTiming,
  isValidIsoDate,
  todayIsoDate,
  validateGroupPercentages,
} from '@/domain/budget';
import type {
  Budget,
  BudgetCadence,
  BudgetGroupKey,
  BudgetRecord,
  BudgetRecordType,
  BudgetSnapshot,
  Category,
  CategoryAllocation,
  CreateBudgetInput,
  GroupSummary,
  SaveBudgetRecordInput,
  UpdateBudgetInput,
} from '@/domain/budget-types';

type CategoryRow = {
  id: number;
  name: string;
  group_key: BudgetGroupKey;
  display_order: number;
  archived: number;
  saved_balance_cents: number;
};

type BudgetRow = {
  id: number;
  cadence: BudgetCadence;
  start_date: string;
  end_date: string;
  received_cents: number;
  archived: number;
  legacy_period_id: number | null;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  spent_cents: number;
};

type AllocationRow = {
  budget_id: number;
  category_id: number;
  category_name_snapshot: string;
  group_key_snapshot: BudgetGroupKey;
  allocated_cents: number;
  display_order: number;
  spent_cents: number;
};

type RecordRow = {
  id: number;
  budget_id: number | null;
  type: BudgetRecordType;
  amount_cents: number;
  effective_date: string;
  category_id: number;
  category_name: string;
  group_key: BudgetGroupKey;
  savings_source_category_id: number | null;
  savings_source_category_name: string | null;
  linked_record_id: number | null;
  description: string | null;
  budget_cadence: BudgetCadence | null;
  budget_start_date: string | null;
  budget_end_date: string | null;
};

export async function loadBudgetSnapshot(db: SQLiteDatabase): Promise<BudgetSnapshot> {
  const [categoryRows, budgetRows, allocationRows, recordRows] = await Promise.all([
    db.getAllAsync<CategoryRow>(CATEGORIES_QUERY),
    db.getAllAsync<BudgetRow>(BUDGETS_QUERY),
    db.getAllAsync<AllocationRow>(ALLOCATIONS_QUERY),
    db.getAllAsync<RecordRow>(RECORDS_QUERY),
  ]);
  const allocationsByBudget = groupAllocationsByBudget(allocationRows);
  return {
    categories: categoryRows.map(mapCategory),
    budgets: budgetRows.map((row) => mapBudget(row, allocationsByBudget.get(row.id) ?? [])),
    records: recordRows.map(mapRecord),
  };
}

export async function createBudget(db: SQLiteDatabase, input: CreateBudgetInput): Promise<number> {
  validateBudgetInput(input);
  const { startDate, endDate } = getBudgetBounds(input.cadence, input.startDate);
  const categories = await loadActiveCategoryRows(db);
  const allocations = validateCategoryAllocations(input, categories);
  let budgetId = 0;

  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO budgets (
        cadence, start_date, end_date, received_cents,
        needs_percentage, wants_percentage, savings_percentage
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      input.cadence,
      startDate,
      endDate,
      input.receivedCents,
      input.needsPercentage,
      input.wantsPercentage,
      input.savingsPercentage,
    );
    budgetId = result.lastInsertRowId;

    for (const category of categories) {
      await db.runAsync(
        `INSERT INTO budget_category_allocations (
          budget_id, category_id, category_name_snapshot, group_key_snapshot,
          allocated_cents, display_order
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        budgetId,
        category.id,
        category.name,
        category.group_key,
        allocations.get(category.id) ?? 0,
        category.display_order,
      );
    }
  });

  return budgetId;
}

export async function updateBudget(db: SQLiteDatabase, input: UpdateBudgetInput): Promise<void> {
  validateBudgetInput({ ...input, categoryAllocations: [] });
  const { startDate, endDate } = getBudgetBounds(input.cadence, input.startDate);
  const budget = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM budgets WHERE id = ?',
    input.budgetId,
  );
  if (!budget) throw new Error('This budget no longer exists.');

  const recordDates = await db.getFirstAsync<{
    first_date: string | null;
    last_date: string | null;
  }>(
    `SELECT MIN(effective_date) AS first_date, MAX(effective_date) AS last_date
     FROM budget_records WHERE budget_id = ?`,
    input.budgetId,
  );
  if (
    (recordDates?.first_date && recordDates.first_date < startDate) ||
    (recordDates?.last_date && recordDates.last_date > endDate)
  ) {
    throw new Error('The new dates would exclude an existing record.');
  }

  const groupAllocations = allocateByLargestRemainder(input.receivedCents, percentagesFrom(input));
  const totals = await db.getAllAsync<{ group_key: BudgetGroupKey; total: number }>(
    `SELECT group_key_snapshot AS group_key, SUM(allocated_cents) AS total
     FROM budget_category_allocations WHERE budget_id = ? GROUP BY group_key_snapshot`,
    input.budgetId,
  );
  for (const row of totals) {
    if (row.total > groupAllocations[row.group_key]) {
      throw new Error(`Reduce ${row.group_key} category allocations before changing this budget.`);
    }
  }

  await db.runAsync(
    `UPDATE budgets SET cadence = ?, start_date = ?, end_date = ?, received_cents = ?,
      needs_percentage = ?, wants_percentage = ?, savings_percentage = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    input.cadence,
    startDate,
    endDate,
    input.receivedCents,
    input.needsPercentage,
    input.wantsPercentage,
    input.savingsPercentage,
    input.budgetId,
  );
}

export async function setBudgetArchived(
  db: SQLiteDatabase,
  budgetId: number,
  archived: boolean,
): Promise<void> {
  const result = await db.runAsync(
    'UPDATE budgets SET archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    archived ? 1 : 0,
    budgetId,
  );
  if (result.changes !== 1) throw new Error('This budget no longer exists.');
}

export async function deleteEmptyBudget(db: SQLiteDatabase, budgetId: number): Promise<void> {
  const recordCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM budget_records WHERE budget_id = ?',
    budgetId,
  );
  if ((recordCount?.count ?? 0) > 0) {
    throw new Error('Archive a budget with financial records instead of deleting it.');
  }
  const result = await db.runAsync('DELETE FROM budgets WHERE id = ?', budgetId);
  if (result.changes !== 1) throw new Error('This budget no longer exists.');
}

export async function saveBudgetRecord(
  db: SQLiteDatabase,
  input: SaveBudgetRecordInput,
): Promise<void> {
  validateRecordInput(input);
  await db.withTransactionAsync(async () => {
    await validateRecordContext(db, input);
    if (input.id === undefined) {
      await db.runAsync(
        `INSERT INTO budget_records (
          budget_id, type, amount_cents, effective_date, category_id,
          savings_source_category_id, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        input.type === 'savings_withdrawal' ? null : (input.budgetId ?? null),
        input.type,
        input.amountCents,
        input.effectiveDate,
        input.categoryId,
        input.savingsSourceCategoryId ?? null,
        input.description?.trim() || null,
      );
    } else {
      const result = await db.runAsync(
        `UPDATE budget_records SET budget_id = ?, type = ?, amount_cents = ?,
          effective_date = ?, category_id = ?, savings_source_category_id = ?,
          description = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        input.type === 'savings_withdrawal' ? null : (input.budgetId ?? null),
        input.type,
        input.amountCents,
        input.effectiveDate,
        input.categoryId,
        input.savingsSourceCategoryId ?? null,
        input.description?.trim() || null,
        input.id,
      );
      if (result.changes !== 1) throw new Error('This record no longer exists.');
    }
    await assertSavingsBalances(db);
  });
}

export async function deleteBudgetRecord(db: SQLiteDatabase, recordId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync('DELETE FROM budget_records WHERE id = ?', recordId);
    if (result.changes !== 1) throw new Error('This record no longer exists.');
    await assertSavingsBalances(db);
  });
}

export async function addCategory(
  db: SQLiteDatabase,
  input: { name: string; groupKey: BudgetGroupKey },
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error('Enter a category name.');
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

function validateBudgetInput(
  input: Omit<CreateBudgetInput, 'categoryAllocations'> & { categoryAllocations?: unknown },
): void {
  if (!validateGroupPercentages(percentagesFrom(input))) {
    throw new Error('Needs, Wants, and Savings must total exactly 100%.');
  }
  if (!Number.isSafeInteger(input.receivedCents) || input.receivedCents <= 0) {
    throw new Error('Enter a received amount greater than zero.');
  }
  if (!isValidIsoDate(input.startDate)) {
    throw new Error('Enter a valid start date in YYYY-MM-DD format.');
  }
}

function validateCategoryAllocations(input: CreateBudgetInput, categories: CategoryRow[]) {
  const allocationMap = new Map(
    input.categoryAllocations.map((allocation) => [
      allocation.categoryId,
      allocation.allocatedCents,
    ]),
  );
  for (const [categoryId, allocatedCents] of allocationMap) {
    if (!categories.some((category) => category.id === categoryId)) {
      throw new Error('A selected category is no longer available.');
    }
    if (!Number.isSafeInteger(allocatedCents) || allocatedCents < 0) {
      throw new Error('Category allocations cannot be negative.');
    }
  }

  const groupAllocations = allocateByLargestRemainder(input.receivedCents, percentagesFrom(input));
  for (const groupKey of BUDGET_GROUPS) {
    const allocated = categories
      .filter((category) => category.group_key === groupKey)
      .reduce((sum, category) => sum + (allocationMap.get(category.id) ?? 0), 0);
    if (allocated > groupAllocations[groupKey]) {
      throw new Error(`${groupKey} category allocations exceed the group allocation.`);
    }
  }
  return allocationMap;
}

function validateRecordInput(input: SaveBudgetRecordInput): void {
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('Enter an amount greater than zero.');
  }
  if (!isValidIsoDate(input.effectiveDate)) {
    throw new Error('Enter a valid date in YYYY-MM-DD format.');
  }
  if (input.effectiveDate > todayIsoDate()) throw new Error('Future entries are not allowed.');
  if (input.type !== 'savings_withdrawal' && input.budgetId === undefined) {
    throw new Error('Select a budget.');
  }
  if (input.type === 'savings_withdrawal' && input.savingsSourceCategoryId === undefined) {
    throw new Error('Select a savings source.');
  }
}

async function validateRecordContext(
  db: SQLiteDatabase,
  input: SaveBudgetRecordInput,
): Promise<void> {
  const excludedId = input.id ?? -1;
  if (input.type === 'savings_withdrawal') {
    const source = await db.getFirstAsync<{ group_key: BudgetGroupKey }>(
      'SELECT group_key FROM categories WHERE id = ?',
      input.savingsSourceCategoryId ?? -1,
    );
    if (!source || source.group_key !== 'savings') {
      throw new Error('Select a Savings category as the source.');
    }
    const balance = await getSavingsBalance(db, input.savingsSourceCategoryId ?? -1, excludedId);
    if (balance < input.amountCents) {
      throw new Error('This Savings category does not have enough saved money.');
    }
    return;
  }

  const budget = await db.getFirstAsync<{ start_date: string; end_date: string; archived: number }>(
    'SELECT start_date, end_date, archived FROM budgets WHERE id = ?',
    input.budgetId ?? -1,
  );
  if (!budget) throw new Error('Select a budget.');
  if (budget.archived === 1) throw new Error('Restore this budget before adding records.');
  if (input.effectiveDate < budget.start_date || input.effectiveDate > budget.end_date) {
    throw new Error(`Choose a date from ${budget.start_date} to ${budget.end_date}.`);
  }
  const allocation = await db.getFirstAsync<{ category_id: number }>(
    `SELECT category_id FROM budget_category_allocations
     WHERE budget_id = ? AND category_id = ?`,
    input.budgetId ?? -1,
    input.categoryId,
  );
  if (!allocation) throw new Error('That category is not part of this budget.');

  if (input.type === 'refund') {
    const spending = await db.getFirstAsync<{ net_spent: number }>(
      `SELECT COALESCE(SUM(CASE
        WHEN type = 'expenditure' THEN amount_cents
        WHEN type = 'refund' THEN -amount_cents
        ELSE 0 END), 0) AS net_spent
       FROM budget_records
       WHERE budget_id = ? AND category_id = ? AND id != ?`,
      input.budgetId ?? -1,
      input.categoryId,
      excludedId,
    );
    if ((spending?.net_spent ?? 0) < input.amountCents) {
      throw new Error('A refund cannot exceed spending in this category.');
    }
  }
}

async function assertSavingsBalances(db: SQLiteDatabase): Promise<void> {
  const negative = await db.getFirstAsync<{ id: number }>(
    `SELECT c.id
     FROM categories c
     WHERE c.group_key = 'savings'
       AND (
         COALESCE((SELECT SUM(amount_cents) FROM budget_records
           WHERE type = 'expenditure' AND category_id = c.id), 0)
         - COALESCE((SELECT SUM(amount_cents) FROM budget_records
           WHERE type = 'refund' AND category_id = c.id), 0)
         - COALESCE((SELECT SUM(amount_cents) FROM budget_records
           WHERE type = 'savings_withdrawal' AND savings_source_category_id = c.id), 0)
       ) < 0
     LIMIT 1`,
  );
  if (negative) {
    throw new Error('This change would use more saved money than is available.');
  }
}

async function getSavingsBalance(
  db: SQLiteDatabase,
  categoryId: number,
  excludedRecordId: number,
): Promise<number> {
  const row = await db.getFirstAsync<{ balance: number }>(
    `SELECT
      COALESCE(SUM(CASE WHEN br.type = 'expenditure' AND br.category_id = ? THEN br.amount_cents ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN br.type = 'refund' AND br.category_id = ? THEN br.amount_cents ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN br.type = 'savings_withdrawal' AND br.savings_source_category_id = ? THEN br.amount_cents ELSE 0 END), 0)
      AS balance
     FROM budget_records br WHERE br.id != ?`,
    categoryId,
    categoryId,
    categoryId,
    excludedRecordId,
  );
  return row?.balance ?? 0;
}

async function loadActiveCategoryRows(db: SQLiteDatabase): Promise<CategoryRow[]> {
  return db.getAllAsync<CategoryRow>(
    `SELECT id, name, group_key, display_order, archived, 0 AS saved_balance_cents
     FROM categories WHERE archived = 0 ORDER BY display_order, id`,
  );
}

function percentagesFrom(input: {
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
}) {
  return {
    needs: input.needsPercentage,
    wants: input.wantsPercentage,
    savings: input.savingsPercentage,
  };
}

function groupAllocationsByBudget(rows: AllocationRow[]): Map<number, AllocationRow[]> {
  const grouped = new Map<number, AllocationRow[]>();
  for (const row of rows) {
    const budgetRows = grouped.get(row.budget_id) ?? [];
    budgetRows.push(row);
    grouped.set(row.budget_id, budgetRows);
  }
  return grouped;
}

function mapBudget(row: BudgetRow, allocationRows: AllocationRow[]): Budget {
  const percentages = percentagesFrom({
    needsPercentage: row.needs_percentage,
    wantsPercentage: row.wants_percentage,
    savingsPercentage: row.savings_percentage,
  });
  const groupAllocations = allocateByLargestRemainder(row.received_cents, percentages);
  const groups = BUDGET_GROUPS.map<GroupSummary>((groupKey) => {
    const categories = allocationRows
      .filter((allocation) => allocation.group_key_snapshot === groupKey)
      .map<CategoryAllocation>((allocation) => ({
        categoryId: allocation.category_id,
        categoryName: allocation.category_name_snapshot,
        groupKey,
        allocatedCents: allocation.allocated_cents,
        spentCents: allocation.spent_cents,
        remainingCents: allocation.allocated_cents - allocation.spent_cents,
        displayOrder: allocation.display_order,
      }));
    const categoryAllocatedCents = categories.reduce(
      (sum, category) => sum + category.allocatedCents,
      0,
    );
    const spentCents = categories.reduce((sum, category) => sum + category.spentCents, 0);
    return {
      groupKey,
      percentage: percentages[groupKey],
      allocatedCents: groupAllocations[groupKey],
      categoryAllocatedCents,
      spentCents,
      remainingCents: groupAllocations[groupKey] - spentCents,
      unallocatedCents: groupAllocations[groupKey] - categoryAllocatedCents,
      categories,
    };
  });
  return {
    id: row.id,
    cadence: row.cadence,
    startDate: row.start_date,
    endDate: row.end_date,
    receivedCents: row.received_cents,
    archived: row.archived === 1,
    legacyPeriodId: row.legacy_period_id,
    needsPercentage: row.needs_percentage,
    wantsPercentage: row.wants_percentage,
    savingsPercentage: row.savings_percentage,
    spentCents: row.spent_cents,
    remainingCents: row.received_cents - row.spent_cents,
    timing: getBudgetTiming(row.start_date, row.end_date),
    groups,
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

function mapRecord(row: RecordRow): BudgetRecord {
  return {
    id: row.id,
    budgetId: row.budget_id,
    type: row.type,
    amountCents: row.amount_cents,
    effectiveDate: row.effective_date,
    categoryId: row.category_id,
    categoryName: row.category_name,
    groupKey: row.group_key,
    savingsSourceCategoryId: row.savings_source_category_id,
    savingsSourceCategoryName: row.savings_source_category_name,
    linkedRecordId: row.linked_record_id,
    description: row.description,
    budgetCadence: row.budget_cadence,
    budgetStartDate: row.budget_start_date,
    budgetEndDate: row.budget_end_date,
  };
}

const CATEGORIES_QUERY = `
  SELECT c.id, c.name, c.group_key, c.display_order, c.archived,
    COALESCE((SELECT SUM(amount_cents) FROM budget_records
      WHERE type = 'expenditure' AND category_id = c.id), 0)
    - COALESCE((SELECT SUM(amount_cents) FROM budget_records
      WHERE type = 'refund' AND category_id = c.id), 0)
    - COALESCE((SELECT SUM(amount_cents) FROM budget_records
      WHERE type = 'savings_withdrawal' AND savings_source_category_id = c.id), 0)
    AS saved_balance_cents
  FROM categories c
  GROUP BY c.id
  ORDER BY c.archived, c.display_order, c.id`;

const BUDGETS_QUERY = `
  SELECT b.id, b.cadence, b.start_date, b.end_date, b.received_cents,
    b.archived, b.legacy_period_id, b.needs_percentage,
    b.wants_percentage, b.savings_percentage,
    COALESCE(SUM(CASE
      WHEN br.type = 'expenditure' THEN br.amount_cents
      WHEN br.type = 'refund' THEN -br.amount_cents
      ELSE 0 END), 0) AS spent_cents
  FROM budgets b
  LEFT JOIN budget_records br ON br.budget_id = b.id
  GROUP BY b.id
  ORDER BY b.start_date DESC, b.id DESC`;

const ALLOCATIONS_QUERY = `
  SELECT bca.budget_id, bca.category_id, bca.category_name_snapshot,
    bca.group_key_snapshot, bca.allocated_cents, bca.display_order,
    COALESCE(SUM(CASE
      WHEN br.type = 'expenditure' THEN br.amount_cents
      WHEN br.type = 'refund' THEN -br.amount_cents
      ELSE 0 END), 0) AS spent_cents
  FROM budget_category_allocations bca
  LEFT JOIN budget_records br
    ON br.budget_id = bca.budget_id AND br.category_id = bca.category_id
  GROUP BY bca.budget_id, bca.category_id
  ORDER BY bca.budget_id, bca.display_order`;

const RECORDS_QUERY = `
  SELECT br.id, br.budget_id, br.type, br.amount_cents, br.effective_date,
    br.category_id, COALESCE(bca.category_name_snapshot, c.name) AS category_name,
    COALESCE(bca.group_key_snapshot, c.group_key) AS group_key,
    br.savings_source_category_id, source.name AS savings_source_category_name,
    br.linked_record_id, br.description, b.cadence AS budget_cadence,
    b.start_date AS budget_start_date, b.end_date AS budget_end_date
  FROM budget_records br
  LEFT JOIN budgets b ON b.id = br.budget_id
  LEFT JOIN categories c ON c.id = br.category_id
  LEFT JOIN budget_category_allocations bca
    ON bca.budget_id = br.budget_id AND bca.category_id = br.category_id
  LEFT JOIN categories source ON source.id = br.savings_source_category_id
  ORDER BY br.effective_date DESC, br.id DESC`;
