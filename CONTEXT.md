# Save Your Money

Save Your Money is a private, single-user budgeting context for planning the allowance one user gives their sister and measuring financial events against each allowance period.

## Language

**Category**:
A stable classification for financial events that can be renamed, regrouped, or archived for future planning without changing its identity.
_Avoid_: Tag, expense type

**Allowance**:
The amount the user plans to give their sister for one allowance period; creating it does not itself change an account balance.
_Avoid_: Income, account balance

**Allowance period**:
The time covered by one allowance: either a calendar month or a 14-day interval calculated from a user-selected anchor date.
_Avoid_: Pay period, month

**Budget group**:
One of the three fixed purposes—Needs, Wants, or Savings—to which a percentage of an allowance is assigned.
_Avoid_: Category, tag

**Group percentage**:
The whole-number share of an allowance assigned to one budget group; the three group percentages total exactly 100 percent.
_Avoid_: Category allocation, group balance

**Account**:
A cash, bank, or e-wallet store of the user's actual money, changed by allowance disbursements and returns but not by the sister's later allowance uses.
_Avoid_: Savings category, payment tag

**Allowance disbursement**:
The financial event that records all or part of an allowance being given to the sister and reduces the user's selected account by that amount.
_Avoid_: Income, allowance use

**Allowance use**:
A record of how the sister uses part of an allowance for a Needs, Wants, or Savings category; it reduces the period's remaining amounts but does not change the user's account again.
_Avoid_: Allowance disbursement, account transaction

**Savings category**:
A category within the Savings group that identifies where allowance money is set aside, such as GoTyme, MariBank, GCash, or Stocks.
_Avoid_: Savings destination, bank tag, account

**Allowance-derived savings balance**:
The cumulative amount assigned to a Savings category across allowance periods, less later withdrawals; it is not the actual balance of the named bank, wallet, or investment.
_Avoid_: Account balance, investment value

**Saved-money use**:
A record that withdraws allowance-derived savings from one Savings category and classifies what it funded without charging the current allowance period.
_Avoid_: Allowance use, account withdrawal

**Sister-held allowance balance**:
Disbursed allowance not yet classified as an allowance use or returned to the user; it remains available across period boundaries without becoming part of a later period automatically.
_Avoid_: Unallocated amount, account balance, allowance-derived savings balance

**Leftover application**:
An explicit decision to fund part of a new allowance from the sister-held allowance balance, reducing the new money the user needs to disburse.
_Avoid_: Automatic rollover, allowance return

**Allowance return**:
Allowance money returned by the sister to the user, reducing the net amount given and increasing the user's selected account.
_Avoid_: Refund, income

**Refund**:
Money returned by a merchant for an allowance use, restoring the affected category and allowance amounts without counting as new allowance.
_Avoid_: Allowance return, income

**Allowance period state**:
The lifecycle position of an allowance period: draft before it starts, active while money and uses are recorded, or closed when preserved as history.
_Avoid_: Payment status, allowance status

**Period category snapshot**:
The category name and budget group retained by an allowance period so later category changes cannot rewrite that period's meaning.
_Avoid_: Monthly category snapshot, category version, category history

**Category allocation**:
The portion of a budget group's money assigned to one category for a specific allowance period.
_Avoid_: Category percentage, category balance

**Unallocated amount**:
The portion of a budget group's allowance not assigned to any category.
_Avoid_: Remaining amount, unspent amount

**Portable backup**:
A user-created, passphrase-encrypted recovery artifact containing the complete state needed to restore Save Your Money independently of an installation or device.
_Avoid_: Export, Android-managed backup

**Backup passphrase**:
The user-held secret required to open a portable backup; Save Your Money neither stores it nor provides a recovery mechanism for it.
_Avoid_: PIN, account password, recovery key

**Android-managed backup**:
A best-effort copy managed and restored by Android as a secondary recovery mechanism, without replacing a portable backup.
_Avoid_: Portable backup, authoritative backup
