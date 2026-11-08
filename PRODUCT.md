# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Save Your Money is a private, single-user budgeting app. The user manually creates a budget whenever they receive money and records their own spending; there is no shared access or synchronization.

## Product Purpose

Save Your Money turns each received amount into an independent biweekly or monthly Budget. Success means the user can create as many overlapping Budgets as needed, see how Needs, Wants, and Savings are progressing, and keep every expenditure or refund attached to the correct Budget.

## Positioning

The product is a lightweight offline budget ledger, not an account tracker. It prioritizes truthful period-by-period records and a cumulative view of money placed into Savings categories.

## Operating Context

The app is used for quick manual entry on an Android phone. On payday, the user creates a Budget, confirms its date range and group percentages, then records expenditures as they happen. The app remains fully useful offline.

## Capabilities and Constraints

- One configured currency: Philippine pesos.
- Unlimited manually created Budgets; periods may overlap.
- Biweekly Budgets cover 14 inclusive days from the selected start date.
- Monthly Budgets run from the selected start date through the day before the matching date next month, clamped for shorter months.
- Fixed Needs, Wants, and Savings groups with whole-number percentages totaling 100 percent.
- Categories classify records without requiring their own budgets; group progress and non-blocking overspending warnings remain visible.
- Expenditures, refunds, and periodless Savings withdrawals; no account or disbursement workflow.
- Savings places such as GoTyme, MariBank, GCash, and Stocks are categories, not linked financial accounts.
- Budget timing is derived as Upcoming, Current, or Past. Archiving hides a Budget without deleting its history.
- Existing compatible allowance data migrates into Budgets. Legacy account-only tables remain stored but are not shown in the new UI.
- SQLite is the offline source of truth. Money uses integer centavos and dates use local calendar dates.
- No application account, backend, analytics, advertisements, bank synchronization, multiple users, reminders, investment pricing, or advanced analytics in the first version.

## Brand Commitments

The product name is Save Your Money. Interface language uses the domain terms recorded in `CONTEXT.md` and favors direct, non-judgmental guidance over gamification or shame.

## Evidence on Hand

The confirmed product interview and domain decisions are recorded in `CONTEXT.md` and `docs/adr/`. ADR 0009 records the transition from the legacy allowance workflow to independent Budgets.

## Product Principles

- Keep every expenditure attached to one clear Budget.
- Preserve truthful history instead of silently rolling or rewriting it.
- Make current money and the next useful action visible at a glance.
- Record reality even when it exceeds the plan; warn without blocking.
- Keep private financial data local and useful without a network.

## Accessibility & Inclusion

Support Android font scaling, screen readers, 48 dp touch targets, light and dark color schemes, and non-color indicators for warnings and status.
