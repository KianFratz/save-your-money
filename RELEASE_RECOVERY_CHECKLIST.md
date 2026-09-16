# Release and Recovery Checklist

Use this checklist for release candidates and any version that changes native configuration, storage, migrations, backups, notifications, or signing.

## Before creating a release build

- [ ] The target version and Android `versionCode` are higher than the installed release.
- [ ] The Android package remains `com.kianfratz.saveyourmoney`.
- [ ] The build uses the established signing credential.
- [ ] The signing credential has a verified offline backup.
- [ ] Type checking, linting, and all automated tests pass.
- [ ] Every new migration passes from preserved older database fixtures.
- [ ] A migration snapshot and rollback behavior have been tested.
- [ ] No deferred feature or unapproved scope change entered the release.
- [ ] Release notes describe user-visible changes and any data migration.

## Privacy and permissions

- [ ] No analytics, advertising, crash-reporting, or bank/network SDK was added.
- [ ] Logs contain no amounts, account names, merchant names, notes, passphrases, or decrypted backup contents.
- [ ] EAS Update remains disabled unless the offline policy was deliberately revised.
- [ ] The generated Android manifest has been reviewed for unexpected permissions.
- [ ] Notification permission is requested only in the reminder context.
- [ ] File access occurs through the user-selected Android document flow.
- [ ] The application works with airplane mode enabled.

## Core financial regression

- [ ] Create a draft budget and activate it.
- [ ] Confirm that Needs, Wants, and Savings total 100%.
- [ ] Confirm deterministic rounding produces allocations that exactly equal available-to-budget.
- [ ] Leave part of one group unallocated.
- [ ] Verify that category allocations cannot exceed their group.
- [ ] Record, edit, delete, and undo an expense.
- [ ] Record income without changing the active budget automatically.
- [ ] Transfer money between normal accounts without creating income or expense.
- [ ] Transfer money into and out of savings and verify net savings progress.
- [ ] Record a linked refund and verify spending and balances.
- [ ] Trigger 80% and over-budget warnings without blocking entry.
- [ ] Close a month, browse it, reopen it, and verify recalculated reports.
- [ ] Confirm historical percentages and categories did not change retroactively.

## Device and interface validation

- [ ] Test on the Realme 8i RMX3151 running Android 13.
- [ ] Test light and dark modes.
- [ ] Test increased system font size.
- [ ] Verify warnings use text or icons in addition to color.
- [ ] Verify interactive elements have screen-reader labels and sensible focus order.
- [ ] Record a normal expense in under ten seconds.
- [ ] Verify empty, loading, validation, and failure states are understandable.

## Notification validation

- [ ] Test permission denial and later permission grant.
- [ ] Schedule and receive a local reminder in the foreground and background.
- [ ] Restart the phone and verify scheduled-reminder behavior.
- [ ] Test with battery saver and Realme background restrictions enabled.
- [ ] Confirm an overdue item stays visible inside the app even if the notification is delayed.
- [ ] Confirm tapping a reminder opens a prefilled transaction that is not saved automatically.
- [ ] Confirm skip and reschedule behavior.

## Backup export validation

- [ ] Display the last successful external backup time accurately.
- [ ] Require and confirm a passphrase.
- [ ] Create a consistent database snapshot before export.
- [ ] Save the encrypted artifact to an off-device-capable destination.
- [ ] Reopen, decrypt, authenticate, and validate the written artifact before showing success.
- [ ] Confirm the artifact contains its format version, schema version, timestamp, salt, nonce, KDF parameters, and authenticated ciphertext.
- [ ] Confirm no passphrase or irreplaceable recovery key exists only in SecureStore.
- [ ] Reject an incorrect passphrase without changing live data.
- [ ] Reject a truncated, corrupted, or unsupported backup without changing live data.
- [ ] Show a privacy warning before plain CSV export.
- [ ] Open the exported CSV in a spreadsheet and verify columns and values.

## Manual restore drill

- [ ] Start with a verified encrypted backup stored outside the application container.
- [ ] Record expected account balances, transaction count, active month, and historical-month count.
- [ ] Create a pre-restore snapshot of the current database.
- [ ] Select the backup through Android's document picker.
- [ ] Validate the passphrase, envelope, authentication tag, and supported versions before applying changes.
- [ ] Restore transactionally.
- [ ] Verify account balances, transaction count, active month, historical months, category allocations, and recurring rules.
- [ ] Force-close and reopen the application; verify the restored state persists.
- [ ] Confirm that a failed restore preserves the pre-restore database.

## Android-managed backup drill

- [ ] Confirm the release contains the intended Android backup configuration.
- [ ] Confirm caches, logs, local rolling snapshots, and nonportable secrets are excluded.
- [ ] Exercise Android's documented backup/restore testing path on a signed build when available.
- [ ] Verify a restored SQLite database opens and passes integrity checks.
- [ ] Do not claim Android backup occurred based only on application state; it remains a best-effort secondary mechanism.

## In-place APK update drill

- [ ] Install the prior signed APK and create representative data.
- [ ] Export a verified encrypted backup before updating.
- [ ] Install the new APK over the old version without uninstalling.
- [ ] Confirm Android accepts the package identity and signing certificate.
- [ ] Launch the new version and complete migrations.
- [ ] Verify balances, transactions, budgets, history, recurring rules, and backup status.
- [ ] Force-close and reopen the application.
- [ ] Confirm no user data was lost or duplicated.

## Release acceptance

- [ ] Complete the entire critical flow in airplane mode.
- [ ] All v1 completion criteria in `PROJECT_PLAN.md` pass.
- [ ] A verified external backup exists before installing the release candidate over daily-use data.
- [ ] The final APK and signing-credential backup locations are recorded privately.
- [ ] The release can be rolled back or recovered without deleting the only good data copy.

## Recovery procedure for the user

### Existing installation still opens

1. Stop entering new transactions until recovery is complete.
2. Export a new encrypted backup of the current state, even if it may be damaged.
3. Note the visible account balances and latest transaction date.
4. Attempt the application's verified local-snapshot recovery if offered.
5. If needed, restore the latest known-good encrypted external backup.
6. Verify balances, history, and the latest transaction date before resuming use.

### Reinstalled or replacement phone

1. Install an APK signed with the established application identity.
2. Allow Android-managed restoration to complete if it is available.
3. Open the app and verify whether the expected history exists.
4. If it does not, choose Restore and select the latest encrypted external backup.
5. Enter the backup passphrase.
6. Verify balances, monthly history, recurring rules, and the active budget.
7. Create a new verified external backup after recovery.

### Forgotten backup passphrase

The encrypted backup cannot be recovered without its passphrase. Do not overwrite a working local database while attempting recovery. Preserve every backup artifact in case the correct passphrase is remembered later.
