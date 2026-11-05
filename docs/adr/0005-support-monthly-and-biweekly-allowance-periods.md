# Support monthly and biweekly allowance periods

An allowance period uses either a calendar-month cadence or a biweekly cadence of consecutive 14-day intervals from a user-selected anchor date. Only one cadence is active, cadence changes begin with the next period, and historical periods retain their original boundaries and category snapshots. This supersedes ADR-0002's month-only boundary while preserving its decision that later category changes must not rewrite historical meaning; the added model complexity is accepted so the app can match how the user actually gives allowance.
