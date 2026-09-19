# Save Your Money

Save Your Money is a planned offline-first Android budget tracker built around an editable Needs/Wants/Savings percentage budget.

The Expo application scaffold and foundation quality checks are in place. Other foundation work remains.

## Product constraints

- Single user and single device in v1.
- Android 13 on a Realme 8i is the initial target.
- Fully usable offline with no application account or backend.
- Expo Go for normal development and signed EAS APKs for native/release testing.
- No Android Studio or emulator in the approved workflow.
- SQLite is the source of truth; encrypted external backups provide portable recovery.

## Documents

- [Product and engineering plan](PROJECT_PLAN.md)
- [Release and recovery checklist](RELEASE_RECOVERY_CHECKLIST.md)
- [Android identity and update probe](docs/verification/android-identity.md)

## Planned stack

- Expo and React Native
- Strict TypeScript
- Expo Router
- Expo SQLite
- Expo Notifications
- Expo FileSystem and DocumentPicker
- Expo Crypto
- npm and Git

## Planned milestone order

1. Foundation
2. Financial domain
3. Storage and migrations
4. Setup, accounts, and categories
5. Transactions
6. Monthly budgeting
7. Dashboard
8. Month closing, history, and reports
9. Recurring reminders
10. Backup, restore, and CSV export
11. Hardening and signed release

Each milestone has a mandatory exit gate in `PROJECT_PLAN.md`.

## Commands

The foundation quality commands are:

```bash
npm ci
npm start
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Current next step

Continue the remaining M0 foundation work, including the physical-phone and signing gates in `PROJECT_PLAN.md`.
