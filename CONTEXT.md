# Save Your Money

Save Your Money is a private, single-user budgeting context for planning received money and measuring expenditures against independently created budget periods.

## Language

**Budget**:
A manually created spending plan for one received amount over a monthly or biweekly period; it owns its allocations and expenditure records.
_Avoid_: Recurring plan, template, allowance

**Category**:
A stable classification for expenditures that can be renamed, regrouped, or archived for future planning without changing its identity.
_Avoid_: Tag, expense type

**Budget period**:
The time covered by one manually created budget: 14 consecutive days for a biweekly budget, or from the selected start date through the day before the same date in the following month for a monthly budget. A monthly boundary that does not exist is clamped to the following month's last valid day.
_Avoid_: Allowance period, recurring plan

**Budget timing**:
A date-derived classification of a budget as upcoming before its period, current during its period, or past after its period; it is not a manually controlled lifecycle state.
_Avoid_: Active status, closed status

**Archived budget**:
A budget withdrawn from current use without deleting its financial history; it can later be restored.
_Avoid_: Deleted budget, closed budget

**Received amount**:
The money available to a budget before expenditures; it is entered when the budget is created.
_Avoid_: Account balance, allowance

**Budget group**:
One of the three fixed purposes—Needs, Wants, or Savings—to which a percentage of a budget's received amount is assigned.
_Avoid_: Category, tag

**Group percentage**:
The whole-number share of a budget's received amount assigned to one budget group; the three group percentages total exactly 100 percent.
_Avoid_: Category allocation, group balance

**Expenditure**:
A record of money used from one budget for a Needs, Wants, or Savings category; it reduces the budget's remaining amounts.
_Avoid_: Allowance use, account transaction

**Savings category**:
A category within the Savings group that identifies where budgeted money is set aside, such as GoTyme, MariBank, GCash, or Stocks.
_Avoid_: Savings destination, bank tag, account

**Budget-derived savings balance**:
The cumulative amount recorded as saved to a Savings category across budgets, less later withdrawals; it is not the actual balance of the named bank, wallet, or investment.
_Avoid_: Account balance, investment value

**Savings withdrawal**:
A record that reduces one budget-derived savings balance and classifies what the saved money funded without charging another budget.
_Avoid_: Expenditure, account withdrawal

**Refund**:
Money returned by a merchant for an expenditure, restoring the affected category and budget amounts without counting as new received money.
_Avoid_: Income, received amount

**Period category snapshot**:
The category name and budget group retained by a budget period so later category changes cannot rewrite that period's meaning.
_Avoid_: Monthly category snapshot, category version, category history

**Portable backup**:
A user-created, passphrase-encrypted recovery artifact containing the complete state needed to restore Save Your Money independently of an installation or device.
_Avoid_: Export, Android-managed backup

**Backup passphrase**:
The user-held secret required to open a portable backup; Save Your Money neither stores it nor provides a recovery mechanism for it.
_Avoid_: PIN, account password, recovery key

**Android-managed backup**:
A best-effort copy managed and restored by Android as a secondary recovery mechanism, without replacing a portable backup.
_Avoid_: Portable backup, authoritative backup
