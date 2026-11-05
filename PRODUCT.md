# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

The sole user manages the allowance they give their sister. The sister does not use the app directly, and the first version has no shared access or synchronization.

## Product Purpose

Save Your Money plans monthly or biweekly allowance, records how much was actually given, and shows how the sister used or saved it. Success means the user can see planned, given, used, saved, returned, and remaining money without double-counting their own account balance.

## Positioning

The product separates the user's real account-affecting allowance disbursements from the sister's later allowance uses, while preserving a cumulative view of allowance-derived savings.

## Operating Context

The app is used for quick manual entry on an Android phone. The user prepares an allowance period, gives money in one or more disbursements, logs reported uses by category, and closes the period with a truthful summary. It must remain fully useful offline.

## Capabilities and Constraints

- One configured currency: Philippine pesos.
- Calendar-month or consecutive 14-day allowance periods from a selected anchor date; only one period is active.
- Fixed Needs, Wants, and Savings groups with whole-number percentages totaling 100 percent.
- Editable category allocations, visible unallocated amounts, and non-blocking overspending warnings.
- User-owned cash, bank, and e-wallet accounts with opening balances.
- Partial disbursements, allowance returns, allowance uses, merchant refunds, split uses, and saved-money uses.
- Savings places such as GoTyme, MariBank, GCash, and Stocks are categories, not linked financial accounts.
- Sister-held unused allowance and allowance-derived Savings balances persist across periods.
- Draft, active, and closed period states with explicit reopening for historical corrections.
- SQLite is the offline source of truth. Money uses integer centavos and dates use local calendar dates.
- No application account, backend, analytics, advertisements, bank synchronization, multiple users, reminders, investment pricing, or advanced analytics in the first version.

## Brand Commitments

The product name is Save Your Money. Interface language uses the domain terms recorded in `CONTEXT.md` and favors direct, non-judgmental guidance over gamification or shame.

## Evidence on Hand

The confirmed product interview and domain decisions are recorded in `CONTEXT.md` and `docs/adr/`. The repository contains an Expo SDK 57 shell and navigation, but no existing product data, customer claims, or mature visual identity to preserve.

## Product Principles

- Separate planned allowance, money actually given, and reported allowance use.
- Preserve truthful history instead of silently rolling or rewriting it.
- Make the next useful money decision visible at a glance.
- Record reality even when it exceeds the plan; warn without blocking.
- Keep private financial data local and useful without a network.

## Accessibility & Inclusion

Support Android font scaling, screen readers, 48 dp touch targets, light and dark color schemes, and non-color indicators for warnings and status.
