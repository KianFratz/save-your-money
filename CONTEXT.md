# Save Your Money

Save Your Money is a private, single-user budgeting context organized around calendar-month plans and the financial events measured against them.

## Language

**Category**:
A stable classification for financial events that can be renamed, regrouped, or archived for future planning without changing its identity.
_Avoid_: Tag, expense type

**Monthly category snapshot**:
The category name and budget group retained by a monthly budget so later category changes cannot rewrite that month's meaning.
_Avoid_: Category version, category history

**Portable backup**:
A user-created, passphrase-encrypted recovery artifact containing the complete state needed to restore Save Your Money independently of an installation or device.
_Avoid_: Export, Android-managed backup

**Backup passphrase**:
The user-held secret required to open a portable backup; Save Your Money neither stores it nor provides a recovery mechanism for it.
_Avoid_: PIN, account password, recovery key

**Android-managed backup**:
A best-effort copy managed and restored by Android as a secondary recovery mechanism, without replacing a portable backup.
_Avoid_: Portable backup, authoritative backup
