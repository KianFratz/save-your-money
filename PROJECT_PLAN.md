# Save Your Money — Product and Engineering Plan

Status: Approved plan; the Expo SDK 57 scaffold and EAS project configuration exist, but product implementation has not started. Ticket-blocking architecture decisions are recorded in `docs/adr/`.

## 1. Product definition

Save Your Money is a private, single-user Android budget tracker. It helps the user record spending quickly, divide a monthly budget into Needs, Wants, and Savings, and understand what remains before making another purchase.

The application must remain fully useful without a network connection. It has no application account, backend, bank connection, advertisements, analytics, or remote telemetry.

### Success criteria

After one month, the product is successful when the user can:

- Record at least 90% of spending without another tracking tool.
- Record a typical expense in under ten seconds.
- See the remaining monthly, group, and category budgets before spending.
- Confirm whether the planned savings were actually transferred.
- Review past months without restoring a backup.
- Recover data after reinstalling or replacing the phone.

### Target environment

- Primary device: Realme 8i, model RMX3151.
- Primary operating system: Android 13.
- Development: a computer running the TypeScript toolchain and a physical Android phone.
- Normal development client: Expo Go, connected by QR code.
- Native/release validation: EAS-built development and preview APKs installed on the physical phone.
- Android Studio and an emulator are not part of the workflow.

Android 13 on the primary phone is the supported v1 baseline. Supporting more devices or Android versions requires separate validation.

## 2. Scope

### Included in v1

- Guided first-time setup.
- One configurable currency for the entire database.
- Multiple cash, bank, e-wallet, and savings accounts.
- Account opening balances that do not count as income.
- Monthly available-to-budget amount.
- Editable Needs, Wants, and Savings percentages, defaulting to 50/30/20.
- Custom categories within those three groups.
- Category-level allocations and visible unallocated amounts.
- Income, expenses, account transfers, savings transfers, and refunds.
- Fast manual expense entry.
- Budget threshold and overspending warnings.
- Confirmed recurring transactions and local reminders.
- Monthly closing, historical review, and explicit reopening.
- Search and transaction filters.
- Planned-versus-actual and recent-month reports.
- Android-managed backup as a secondary recovery mechanism.
- Passphrase-encrypted manual backup and restore.
- Plain CSV transaction export with a privacy warning.
- Light and dark modes, dynamic text, screen-reader labels, and non-color status cues.
- Signed APK installation and in-place updates.

### Explicitly deferred

- Application accounts, owned servers, and device synchronization.
- Multiple users or household sharing.
- Bank connections and automatic transaction downloads.
- Credit-card and debt-management behavior.
- Receipt images and OCR.
- Multiple currencies or exchange rates.
- Dedicated savings goals beyond net savings transfers.
- Forecasting, investments, and advanced analytics.
- Web and iPhone versions.
- Play Store publication.
- User-selectable themes and dashboard customization.
- Exact-alarm reminders when ordinary inexact reminders are sufficient.

Deferred features must not shape the v1 schema or interface unless doing so clearly reduces irreversible migration risk.

## 3. Domain language

- **Available to budget:** The amount the user intentionally plans for a calendar month. It is independent of the sum of recorded income.
- **Budget group:** One of Needs, Wants, or Savings.
- **Group percentage:** A month's share of available-to-budget assigned to a group. All three percentages must total exactly 100%.
- **Group allocation:** The money amount derived from a group percentage.
- **Category allocation:** An amount assigned to a category within one group for one month.
- **Unallocated amount:** Group allocation not yet assigned to categories.
- **Actual spending:** Net expenses after linked refunds for a category and month.
- **Savings progress:** Net qualifying transfers into designated savings accounts during a month.
- **Account balance:** Opening balance plus all finalized entries affecting the account.
- **Recurring rule:** A schedule that creates a due task and notification, not an automatic financial entry.
- **Backup:** A portable, encrypted recovery artifact containing complete restorable state.
- **CSV export:** A readable, unencrypted reporting artifact that is not a complete backup.

These terms should appear consistently in code, tests, documentation, and interface copy.

## 4. Financial rules and invariants

### Money representation

- Store money as signed integer minor units, never floating-point numbers.
- Store the database currency as an ISO 4217 code selected during setup.
- Format values according to the device locale while preserving the selected currency.
- Reject values outside documented safe integer and SQLite ranges.
- Use explicit deterministic allocation rounding. When percentage calculations leave minor-unit remainders, distribute them using a stable largest-remainder method so group allocations add exactly to available-to-budget.

### Dates and months

- Budget periods are calendar months.
- Every financial event has an explicit local effective date in `YYYY-MM-DD` form.
- Capture an audit timestamp separately in UTC.
- The effective date determines the budget month; the creation timestamp does not.
- Backdating into a closed month requires explicitly reopening that month.

### Budget rules

- A month moves through `draft`, `active`, and `closed` states.
- Only one month may be active.
- Creating a month copies the prior month's planning values into a draft; it never activates silently.
- Needs, Wants, and Savings percentages must total exactly 100%.
- Percentages and derived group amounts are stored as monthly snapshots.
- Category allocations may leave part of a group unallocated.
- Category allocations may not exceed their group's allocation.
- Recording actual income never silently changes the monthly budget.
- Changing a template affects only future drafts, never historical months.
- Closing a month locks changes but does not delete or archive it out of sight.
- Reopening a month allows correction and recalculates all affected reports.

### Transaction rules

- An expense requires amount, category, account, and effective date.
- Income requires amount, receiving account, and effective date.
- A transfer changes two account balances atomically and is neither income nor expense.
- A refund should link to an original expense when possible, reduce that category's net spending, and increase the receiving account without counting as income.
- Savings progress is the net value transferred from non-savings accounts into designated savings accounts during the month.
- Transfers out of designated savings accounts reduce that month's savings progress.
- Editing or deleting a financial event must update every dependent balance and report atomically.
- Deletion requires confirmation and offers a short undo window.
- Historical categories are archived, not deleted or rewritten.

### Warning rules

- Reject invalid plans whose percentages do not total 100%.
- Reject category allocations exceeding their parent group.
- Warn when actual category spending reaches 80% of its allocation.
- Warn when a transaction would put its category or group over budget.
- Show category overspending even when its parent group remains within budget.
- Warn when spending threatens the planned savings amount.
- Warnings never prevent recording a real transaction.

## 5. Primary user flows

### First-time setup

1. Select the database currency.
2. Create accounts and opening balances.
3. Mark any savings accounts.
4. Enter the first month's available-to-budget amount.
5. Review or edit the 50/30/20 percentages.
6. Review starter categories and add, rename, archive, or remove unused categories.
7. Allocate category amounts within each group.
8. Preview and activate the first budget.
9. Optionally enable notifications when the first recurrence is created.

### Record an expense

1. Tap the persistent quick-add action.
2. Enter the amount using a numeric keypad.
3. Select or accept the suggested category.
4. Select or accept the most recently used account.
5. Optionally enter merchant and notes.
6. Confirm the effective date and save.
7. Show the resulting category balance and any warning without blocking the save.

### Start a new month

1. Generate a draft from the previous month.
2. Update available-to-budget, percentages, categories, and allocations.
3. Resolve any over-allocation.
4. Preview the new plan.
5. Close the prior month after review.
6. Activate the new month.

### Handle a recurring item

1. Schedule an ordinary local notification for the due date, defaulting to 9:00 a.m.
2. When due, display an overdue task until handled.
3. Opening the reminder shows a prefilled transaction.
4. The user confirms, edits, skips, or reschedules it.
5. Only confirmation creates a financial entry.

### Browse history

1. Select a historical month from History or Reports.
2. View its original budget, percentages, allocations, actuals, and transactions.
3. Do not require backup restoration.
4. To correct it, explicitly reopen it and explain that reports will be recalculated.

### Back up and restore

1. Show the last successful external backup timestamp.
2. Ask for and confirm a backup passphrase.
3. Create a consistent database snapshot.
4. Encrypt and authenticate the versioned backup.
5. Let the user select a destination through Android's file picker.
6. Reopen, decrypt, and validate the written artifact before reporting success.
7. During restore, validate the file and passphrase before changing live data.
8. Create a pre-restore local snapshot.
9. Restore transactionally and verify key counts and invariants.
10. Preserve the prior data if any step fails.

## 6. Information architecture

### Home

- Total remaining for the active month.
- Needs, Wants, and Savings progress.
- Categories near or over their targets.
- Overdue recurring tasks.
- Recent transactions.
- Compact account-balance summary.
- Persistent quick-add expense action.

### Budget

- Available-to-budget amount.
- Editable monthly percentages while draft or reopened.
- Derived group allocations.
- Category allocations, actuals, and remaining amounts.
- Visible unallocated amounts.
- Draft, activate, close, and reopen actions with appropriate safeguards.

### Transactions

- Unified chronological list.
- Text search.
- Filters for month/date range, category, account, and event type.
- Separate Expense, Income, Transfer, and Refund entry modes.
- Edit, delete, and short undo behavior.

### Reports

- Planned versus actual by group and category.
- Income, expenses, net savings transfers, and remaining budget for a selected month.
- Recent-month spending trend.
- Access to closed months.

### Settings

- Accounts and opening-balance history.
- Categories and archived categories.
- Recurring rules and notification preferences.
- Currency display.
- Android backup explanation.
- Encrypted backup, restore, and CSV export.
- Last external backup timestamp.
- Local diagnostic report.
- Destructive reset with typed confirmation.

## 7. Data model

The physical schema should be finalized during the storage milestone, but it must represent these concepts explicitly:

- `app_settings`: currency, locale-related preferences, and setup state.
- `accounts`: stable ID, name, type, savings designation, opening balance, archived state, and timestamps.
- `categories`: stable ID, name, default group, display order, archived state, and timestamps.
- `monthly_budgets`: month, available amount, lifecycle state, template provenance, and timestamps.
- `monthly_group_allocations`: budget, group key, percentage units, and derived money amount.
- `monthly_category_allocations`: budget, category, group snapshot, allocated money amount, and display order.
- `financial_events`: type, effective date, amount, source/destination accounts as applicable, category, payee, note, linked original event, and timestamps.
- `recurring_rules`: event template, cadence, next due date, notification time, active state, and timestamps.
- `recurring_occurrences`: rule, due date, status, and linked confirmed event.
- `backup_history`: successful external-backup timestamp and non-sensitive verification metadata.

Required database constraints include foreign keys, nonzero positive input amounts, valid event-field combinations, unique month records, unique allocations per budget/category, and atomic transfer updates.

`PRAGMA user_version` is the sole authority for the current schema version. Ordered migration files and released database fixtures form the schema history; they may be squashed only before the first signed APK containing schema v1 becomes an upgrade baseline. After that baseline, migration numbers, behavior, and fixtures are immutable. A database newer than the running application must fail closed without being modified.

Every monthly budget snapshots the display name and budget group of each category available to that month, including categories with zero allocation. Financial events retain the category's stable ID, while historical reports use the corresponding monthly snapshot. Renaming, regrouping, or archiving a category affects future drafts only and never rewrites an existing month's meaning.

## 8. Architecture

### Stack

- Expo and React Native.
- Strict TypeScript.
- Expo Router.
- `expo-sqlite` as the source of truth.
- `expo-notifications` for local reminders.
- `expo-file-system` and `expo-document-picker` for backup and export flows.
- `expo-crypto` AES-256-GCM plus asynchronous scrypt from `@noble/hashes` for passphrase-based authenticated encryption.
- React Context only for small transient application state.
- No Redux or network data-cache framework in v1.

### Module boundaries

- `domain`: money types, percentage allocation, budget calculations, savings calculations, date rules, and invariants. No React Native imports.
- `data`: migrations, repositories, transaction boundaries, SQLite mapping, snapshots, import, and export.
- `features`: setup, accounts, budget, transactions, recurring, reports, backup, and settings.
- `platform`: notifications, document picking, Android backup configuration, and diagnostic capabilities.
- `ui`: reusable accessible controls, formatting, themes, and navigation shell.

Screens call feature use cases rather than issuing SQL directly. Financial calculations live in pure domain functions. Repositories own persistence and transaction boundaries. Platform modules isolate Expo APIs so domain and feature tests do not need a phone.

### Suggested project shape

```text
app/                     Expo Router routes
src/
  domain/
  data/
    migrations/
    repositories/
  features/
    accounts/
    backup/
    budget/
    recurring/
    reports/
    setup/
    transactions/
  platform/
  ui/
tests/
docs/
```

## 9. Privacy, security, and recovery

### On-device data

- Rely on Android's app sandbox, device encryption, and screen lock for the live v1 database.
- Do not use SQLCipher in v1 unless a tested portable key-recovery design is added.
- Never place amounts, account names, merchants, notes, passphrases, or decrypted backup contents in logs.
- Do not add application telemetry, crash-reporting SDKs, advertisements, or bank/network integrations.
- Disable EAS Update for the release unless the offline/network policy is intentionally revised.
- Review the final Android manifest and generated application behavior for network access and unexpected permissions.

### Backup layers

1. The primary SQLite database handles normal persistence and historical browsing.
2. A rotating local snapshot protects against a failed migration or local database corruption.
3. Android-managed backup is a convenient secondary safety net, not a recovery guarantee.
4. A passphrase-encrypted external backup is the authoritative portable recovery path.

The portable format must include a magic identifier, format version, database schema version, creation timestamp, key-derivation parameters, random salt, random nonce, and authenticated ciphertext. The passphrase or an irreplaceable key must never be stored only in Android SecureStore because uninstalling or changing devices would make the backup unreadable.

New backup passphrases must contain at least 12 Unicode code points. Do not trim or impose composition rules. Normalize to NFC, encode as UTF-8, cap encoded input at 256 bytes, and record the normalization version in the authenticated envelope. Confirm the passphrase twice and explain that it cannot be recovered. Restore remains compatible with valid supported backups that predate the current creation minimum.

Use asynchronous scrypt behind a `PasswordKdf` port and derive 32 bytes for the Expo Crypto AES key. Generate a 16-byte salt with Expo Crypto. Benchmark fixed profiles in a release-mode build on the Realme 8i, starting with `N=2^16`, `r=8`, and `p=1` (approximately 64 MiB of scrypt working memory); fall back to `N=2^15` if the stronger profile cannot complete within two seconds without unacceptable UI freezing or memory pressure while the database and ciphertext buffers coexist. Store the selected parameters in the envelope, enforce strict allowlisted resource caps before derivation, and never tune parameters independently on each device.

The encryption implementation needs a focused security review and the real-phone performance calibration before its format is frozen.

### Destructive actions

- Archive referenced accounts and categories rather than deleting them.
- Require reassignment or archival before deletion when historical references exist.
- Require confirmation for financial-event deletion and provide short undo.
- Require typed confirmation for full database reset.
- Recommend a verified external backup before reset, risky migration, or restore.
- Never reset automatically after detecting corruption.

## 10. Notification policy

- Request notification permission only when the user creates the first reminder.
- Use ordinary inexact local scheduling unless testing proves that a stronger guarantee is essential.
- Default reminders to 9:00 a.m. on the due date and allow per-rule overrides.
- Restore or reschedule reminders after reboot and after rules change.
- Keep an in-app overdue list so a delayed or disabled notification cannot hide the task.
- Test normal mode, battery saver, reboot, permission denial, and Realme background-management behavior in a signed APK.

## 11. Development and build workflow

### Daily loop

1. Run the local Expo development server.
2. Scan the QR code using Expo Go on the Realme 8i.
3. Develop interface, domain rules, ordinary SQLite behavior, file-picker flows, encryption flows, and basic local reminders.
4. Run type checking, linting, and automated tests before committing a milestone.

### Native checkpoints

Use EAS cloud builds when custom Android configuration or standalone behavior must be tested:

- Development APK for native configuration while retaining the Metro development loop.
- Internal preview APK for cold starts, airplane mode, reboot behavior, backup rules, file restoration, and release-like testing.
- Successive APK versions with the same package ID and signing key for in-place upgrade tests.

Preview builds used for update testing must receive monotonically increasing Android version codes. Run a two-APK signing and identity smoke test during M0, repeat with representative schema-v1 data during M2, then repeat before accepting each later schema migration and for release candidates or changes to storage or native backup configuration.

Expo Go data is disposable development data. It does not demonstrate that the standalone application's Android backup, signing identity, package updates, or restore behavior works.

### Identity and signing

- Visible name: Save Your Money.
- Android package: `com.kianfratz.saveyourmoney`.
- Use monotonically increasing Android version codes.
- Preserve the same package identifier and signing certificate for all updates.
- Replace the scaffold's placeholder Android identity before producing the first signed upgrade baseline.
- Use an EAS-managed Android keystore. Before treating an APK as an upgrade baseline, verify durable ownership of the linked EAS project, export the keystore and credentials to two recoverable locations outside the repository, and record the signing-certificate fingerprint privately.

## 12. Test strategy

### Automated tests

- Use Jest through `jest-expo` as the single JavaScript test runner and React Native Testing Library for components and routes. Confirm the compatible Testing Library major with a one-component installation spike before pinning it.
- Unit-test money parsing, formatting boundaries, percentage validation, deterministic rounding, category remaining values, warnings, refunds, transfers, and savings progress.
- Unit-test month lifecycle transitions and backdating restrictions.
- Define runner-neutral repository contract scenarios. Run them quickly through a thin `better-sqlite3` adapter, then run the same scenarios through the production `expo-sqlite` adapter in a dedicated non-production Android test build. Do not use Expo SQLite's Node stub as a persistence test.
- Keep WAL/locking behavior, exclusive-transaction behavior, serialization, backup, and interruption recovery in the native integration suite. Exclude the native test harness entirely from production builds.
- Test every schema migration from preserved older fixtures.
- Component-test setup, quick entry, budget editing, warnings, and destructive confirmations.
- Test backup envelope parsing, wrong passphrases, authentication failure, unsupported versions, corruption, and interrupted restoration.
- Run strict TypeScript checking and linting with the test suite.

### Physical-phone tests

- Complete every primary flow on the Realme 8i.
- Test layout with system font scaling and light/dark modes.
- Test denied and granted notification permissions.
- Test a reminder before and after reboot and under battery saver.
- Test encrypted export to at least one off-device destination and restore it.
- Test Android-managed restore separately; do not infer it from manual restore.
- Install a higher-version signed APK over an earlier APK and verify that all data remains.
- Complete the v1 acceptance run with airplane mode enabled.

Automated Android end-to-end testing is deferred because the approved workflow excludes Android Studio and emulators. Critical native paths therefore require a documented, repeatable physical-device checklist.

## 13. Milestones and exit gates

### M0 — Foundation

- Initialize Git and an Expo TypeScript project using npm.
- Establish strict TypeScript, lint, test, and formatting commands.
- Configure Expo Router and the accessible theme foundation.
- Replace the scaffold identity with `com.kianfratz.saveyourmoney`, verify EAS project ownership, establish and export the signing credential, and record its certificate fingerprint privately.
- Produce two successively versioned signed preview APKs and verify an in-place update on the physical phone.

Exit gate: the starter app opens through Expo Go, all automated checks pass, and the first commit is recoverable.

### M1 — Financial domain

- Implement branded money and identifier types.
- Implement percentage validation and deterministic allocation.
- Implement spending, refund, transfer, and savings calculations.
- Implement month lifecycle and warning policies.

Exit gate: domain behavior is exhaustively unit-tested with no React Native or SQLite dependency.

### M2 — Storage and migrations

- Design and review the physical SQLite schema.
- Implement migrations, repositories, foreign keys, and transactions.
- Implement consistent local snapshots and migration rollback behavior.
- Seed representative development data.
- Install a signed schema-v1 baseline containing representative data, upgrade it in place, and verify persistence. Do not invent a migration solely for this test; exercise the first real v1-to-v2 migration before accepting it.

Exit gate: repository contracts and migrations pass, failed writes leave no partial financial state, and data survives app restarts.

### M3 — Setup, accounts, and categories

- Build guided setup.
- Add accounts, opening balances, savings designations, and archival.
- Add starter and custom categories with archival.
- Create and preview the first monthly budget.

Exit gate: a fresh installation can reach a valid active budget without developer intervention.

### M4 — Transactions

- Build fast expense entry and separate income, transfer, and refund modes.
- Add recent history, editing, deletion confirmation, and undo.
- Add search and filters.

Exit gate: account balances and category actuals remain correct through create, edit, delete, refund, and transfer scenarios.

### M5 — Monthly budgeting

- Build group percentages, derived allocations, category allocations, and visible unallocated values.
- Add threshold and overspending warnings.
- Add explicit budget revision behavior.

Exit gate: all allocation invariants hold and a normal expense can be entered in under ten seconds on the target phone.

### M6 — Dashboard

- Add total remaining, group progress, category risks, overdue items, recent activity, and account summary.
- Add accessible loading, empty, warning, and error states.

Exit gate: the Home screen answers what remains and what needs attention without opening another screen.

### M7 — Month closing, history, and reports

- Add draft generation, activation, closing, reopening, and backdated-entry safeguards.
- Add planned-versus-actual and recent-month reporting.

Exit gate: historical months retain their original plan and remain available without backup restoration.

### M8 — Recurring reminders

- Add recurrence rules, due occurrences, confirmation, skip, and reschedule.
- Add local notification scheduling and permission flows.
- Validate on the Realme 8i in a development or preview APK.

Exit gate: reminders survive normal restarts and overdue items remain visible even when notification delivery is delayed.

### M9 — Backup, restore, and CSV

- Spike and calibrate asynchronous scrypt in a release build on the Realme 8i, then freeze the versioned encrypted-backup envelope after review.
- Add consistent export, passphrase confirmation, post-write verification, transactional restore, and failure recovery.
- Add Android backup rules and CSV export warnings.
- Add backup status and reminders.

Exit gate: an exported backup restores into a clean installation with matching totals, wrong/corrupt inputs are rejected safely, and CSV opens correctly in a spreadsheet.

### M10 — Hardening and signed release

- Complete accessibility, privacy, diagnostics, and failure-state review.
- Verify no unintended network behavior or sensitive logging.
- Complete the release and recovery checklist.
- Test an in-place APK upgrade while preserving data.
- Run the full acceptance test in airplane mode.

Exit gate: all v1 completion criteria pass on the Realme 8i and a rollback/recovery artifact exists.

## 14. v1 completion criteria

v1 is complete only when the user can:

1. Install a signed APK on the Realme 8i.
2. Complete setup and create an active monthly percentage budget.
3. Record income, expenses, transfers, refunds, and recurring confirmations.
4. See accurate account, group, category, and net-savings values.
5. Receive local reminders and find overdue tasks in the app.
6. Close, revisit, and deliberately reopen a month.
7. Search transactions and view the agreed reports.
8. Export and successfully restore an encrypted backup.
9. Export transaction CSV with an appropriate warning.
10. Install an update over the existing APK without losing data.
11. Pass the automated financial, migration, validation, and component suites.
12. Pass the physical-phone release checklist with airplane mode enabled.

## 15. Risks and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Expo Go differs from the standalone app | Native behavior fails late | Use EAS development builds at native milestones and preview APKs before release. |
| Realme battery management delays reminders | Recurring reminders arrive late | Keep an in-app overdue list and test reboot/battery modes on the real device. |
| Signing credentials are lost | Future APKs cannot update the installed app | Back up credentials offline and test an in-place update early. |
| Android backup never runs or restores | False confidence and data loss | Treat it only as secondary; maintain verified encrypted external backups. |
| User forgets the backup passphrase | Portable backup cannot be restored | Confirm the passphrase, explain non-recoverability, and test-decrypt every export. |
| Rounding or transfer bugs corrupt totals | Incorrect financial guidance | Use integer minor units, explicit invariants, atomic writes, and exhaustive tests. |
| A migration damages data | Historical loss | Snapshot before migration, test old fixtures, and never auto-reset. |
| Scope grows before daily use begins | Project never becomes useful | Enforce the deferred list and milestone exit gates. |
| EAS availability or quota delays a build | Native testing pauses | Reserve builds for native checkpoints and use Expo Go for normal iterations. |
| Android distribution rules change | Sideloading becomes harder | Re-check official Android guidance at release and preserve ADB/personal-distribution options. |

## 16. Decision policy during implementation

- Product changes that alter financial meaning, privacy, recovery, or v1 scope require explicit approval and an update to this plan.
- Implementation details may change without revisiting product decisions when tests preserve the documented behavior.
- A milestone does not begin until the prior milestone's exit gate passes or an explicit exception is recorded.
- No deferred feature should be added merely because a library makes it easy.
- No release is trusted until restore and in-place update have been exercised with real data fixtures on the physical phone.

## 17. Primary technical references

- [Expo SQLite — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Expo Notifications — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Expo FileSystem — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/)
- [Expo DocumentPicker — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/)
- [Expo Crypto — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [Android Auto Backup](https://developer.android.com/identity/data/autobackup)
- [Android app updates](https://developer.android.com/google/play/app-updates)
- [RFC 7914: scrypt](https://www.rfc-editor.org/rfc/rfc7914.html)
- [`@noble/hashes` scrypt](https://github.com/paulmillr/noble-hashes#scrypt)
