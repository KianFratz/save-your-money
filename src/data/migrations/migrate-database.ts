import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_ACCOUNT_NAMES, STARTER_CATEGORIES } from '@/constants/allowance';

const DATABASE_VERSION = 1;

type DatabaseVersionRow = { user_version: number };

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<DatabaseVersionRow>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion > DATABASE_VERSION) {
    throw new Error('This database was created by a newer version of Save Your Money.');
  }

  if (currentVersion === DATABASE_VERSION) {
    return;
  }

  await db.withTransactionAsync(async () => {
    if (currentVersion === 0) {
      await createSchemaV1(db);
      await seedDefaults(db);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}

async function createSchemaV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet')),
      opening_balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (opening_balance_cents >= 0),
      archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      group_key TEXT NOT NULL CHECK (group_key IN ('needs', 'wants', 'savings')),
      display_order INTEGER NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE allowance_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cadence TEXT NOT NULL CHECK (cadence IN ('monthly', 'biweekly')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      planned_cents INTEGER NOT NULL CHECK (planned_cents > 0),
      state TEXT NOT NULL CHECK (state IN ('draft', 'active', 'closed')),
      needs_percentage INTEGER NOT NULL CHECK (needs_percentage BETWEEN 0 AND 100),
      wants_percentage INTEGER NOT NULL CHECK (wants_percentage BETWEEN 0 AND 100),
      savings_percentage INTEGER NOT NULL CHECK (savings_percentage BETWEEN 0 AND 100),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (needs_percentage + wants_percentage + savings_percentage = 100),
      CHECK (start_date <= end_date),
      UNIQUE (start_date, end_date)
    );

    CREATE UNIQUE INDEX one_active_allowance_period
      ON allowance_periods(state)
      WHERE state = 'active';

    CREATE UNIQUE INDEX one_draft_allowance_period
      ON allowance_periods(state)
      WHERE state = 'draft';

    CREATE TABLE category_allocations (
      period_id INTEGER NOT NULL REFERENCES allowance_periods(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      category_name_snapshot TEXT NOT NULL,
      group_key_snapshot TEXT NOT NULL CHECK (group_key_snapshot IN ('needs', 'wants', 'savings')),
      allocated_cents INTEGER NOT NULL DEFAULT 0 CHECK (allocated_cents >= 0),
      display_order INTEGER NOT NULL,
      PRIMARY KEY (period_id, category_id)
    );

    CREATE TABLE financial_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER REFERENCES allowance_periods(id),
      type TEXT NOT NULL CHECK (type IN ('disbursement', 'return', 'use', 'refund', 'saved_money_use')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      effective_date TEXT NOT NULL,
      account_id INTEGER REFERENCES accounts(id),
      category_id INTEGER REFERENCES categories(id),
      savings_source_category_id INTEGER REFERENCES categories(id),
      linked_event_id INTEGER REFERENCES financial_events(id),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (
        (type IN ('disbursement', 'return') AND period_id IS NOT NULL AND account_id IS NOT NULL)
        OR (type IN ('use', 'refund') AND period_id IS NOT NULL AND category_id IS NOT NULL)
        OR (type = 'saved_money_use' AND category_id IS NOT NULL AND savings_source_category_id IS NOT NULL)
      )
    );

    CREATE INDEX financial_events_period_date
      ON financial_events(period_id, effective_date DESC, id DESC);
    CREATE INDEX financial_events_category ON financial_events(category_id);
    CREATE INDEX financial_events_savings_source ON financial_events(savings_source_category_id);
  `);
}

async function seedDefaults(db: SQLiteDatabase): Promise<void> {
  for (const accountName of DEFAULT_ACCOUNT_NAMES) {
    const accountType = accountName === 'Cash' ? 'cash' : 'ewallet';
    await db.runAsync(
      'INSERT INTO accounts (name, type, opening_balance_cents) VALUES (?, ?, 0)',
      accountName,
      accountType,
    );
  }

  for (const [displayOrder, category] of STARTER_CATEGORIES.entries()) {
    await db.runAsync(
      'INSERT INTO categories (name, group_key, display_order) VALUES (?, ?, ?)',
      category.name,
      category.groupKey,
      displayOrder,
    );
  }
}
