# Save Your Money — Allowance Tracker Plan

## Product definition

Save Your Money is a private, offline Android app for one user to plan the allowance they give their sister and understand how it is used. It separates the user's real accounts from the sister's later spending so the same money is never deducted twice.

## Confirmed scope

- One local user; no login, sync, sharing, reminders, or live investment prices.
- One allowance cadence at a time: calendar monthly or consecutive 14-day periods.
- Fixed Needs, Wants, and Savings groups with whole-number percentages totaling 100%.
- Category-level allocations and use tracking. Categories may remain partly unallocated.
- Cash, bank, and e-wallet accounts for the user's actual money.
- Partial allowance disbursements, allowance returns, uses, refunds, saved-money uses, and explicit use of sister-held money in a later period.
- Draft, active, and closed allowance periods with explicit reopening.
- Per-period reports and cumulative allowance-derived Savings balances.

See `CONTEXT.md` for canonical terms and `docs/adr/` for the decisions behind the model.

## Core rules

### Periods

- A monthly period begins on the first and ends on the last calendar day of its month.
- A biweekly period contains exactly 14 inclusive calendar days from its selected anchor.
- Only one period may be active and only one may be a draft.
- Closing preserves the period as history. Recording more period activity requires reopening it.
- A new period can copy the prior cadence, amount, percentages, and next boundary only after user confirmation.

### Planning

- Needs, Wants, and Savings percentages are non-negative whole numbers totaling exactly 100%.
- Integer cents are allocated with deterministic largest-remainder rounding.
- Category allocations cannot exceed their group's allocation.
- A group may have visible unallocated money.
- Spending may exceed a category, group, amount given, or period plan; the interface warns rather than blocking the use.
- Warnings begin at 80% and become explicit overspending states above 100%.

### Money movement

- Creating an allowance plan does not change an account.
- A disbursement reduces one selected user account and increases the amount funded for the period.
- A later allowance use reduces the period/category remaining amount but does not affect the user's account again.
- An allowance return increases a selected user account and reduces the net new money given.
- A merchant refund restores the original category and period amount; it is not income.
- Dates must belong to the selected active period and cannot be in the future.

### Savings

- A use in a Savings category increases that category's cumulative allowance-derived balance.
- A refund in that Savings category reduces the balance.
- A saved-money use selects both the Savings source and what it funded.
- Saved-money use reduces the cumulative Savings balance and appears in activity, but does not charge the current allowance.
- Savings balances are not claims about actual bank, wallet, stock, or investment values.

### Sister-held money

- Net disbursements not yet used or returned remain held by the sister when a period closes.
- Held money does not silently enlarge the next plan.
- The user can explicitly apply held money from a closed period to the active period.
- Applying held money reduces the new cash still needed and never changes a user account.

## Information architecture

### Allowance

- Active period and date range.
- Planned-to-funded flow, with new disbursements and applied held money explained separately.
- Used and remaining totals.
- Needs, Wants, and Savings lanes with threshold warnings.
- Fast spending entry and recent activity.

### Plan

- Cadence, anchor date, amount, and percentage setup.
- Copy-last-plan confirmation.
- Draft review and activation.
- Category allocation editing with visible usage and unallocated amounts.
- Active-period close confirmation.

### Activity

- Give allowance, money returned, spending, refund, and saved-money use entry modes.
- Explicit held-money application from a closed period.
- Date, account/category/source selection, amount, and optional note.
- Unified recent ledger.

### Reports

- Planned, funded, used, and remaining totals.
- Group and category plan-versus-actual detail.
- Period history and closed-period reopening when no period is active.

### Settings

- User accounts with computed available balances.
- Categories grouped under Needs, Wants, and Savings.
- Offline/local-data explanation.

## Storage model

SQLite is the local source of truth.

- `accounts`: stable account identity, type, and opening balance.
- `categories`: stable category identity, current group, order, and archive state.
- `allowance_periods`: cadence, boundaries, plan, group percentages, and lifecycle state.
- `category_allocations`: immutable period category name/group snapshot plus allocated cents.
- `financial_events`: disbursement, return, use, refund, and saved-money-use records.
- `leftover_applications`: explicit movement of sister-held money from a source period into a target period.

All monetary values are stored as integer cents. Historical reporting resolves category meaning through the period snapshot.

## Verification

- TypeScript strict mode passes without `any`.
- ESLint runs with zero warnings.
- Route tests cover every tab without external accounts or network access.
- Domain tests cover peso parsing, percentage validation, exact-cent allocation, calendar boundaries, 14-day boundaries, and next-period calculation.
- Repository validation rejects future dates, activity outside the active period, over-refunds, excessive returns, and excessive held-money applications.
- Android verification covers setup, activation, partial disbursement, use, Savings, refund, close/reopen, next-period copy, held-money application, dark mode, and larger font size.

## Delivery sequence

1. Domain language and decisions.
2. SQLite schema, migration, calculations, and repository validation.
3. Shared local data provider and refresh semantics.
4. Flow-of-Funds interface across the five tabs.
5. Automated checks and Android visual/interaction verification.
6. Portable encrypted backup and restore as a separate follow-up feature.
