# Run repository contracts in Node and on Android

Define repository contract scenarios independently of a test runner and execute the same behavior through two adapters: `better-sqlite3` under Jest for fast SQL, constraint, repository, and migration feedback, and the production `expo-sqlite` adapter inside a dedicated non-production Android build. Expo SQLite's Node implementation is a no-op stub, while a Node SQLite driver cannot prove native bridge, WAL, locking, serialization, or exclusive-transaction behavior; the two executions cover complementary risks without pretending either is sufficient alone.

Use `jest-expo` and React Native Testing Library for JavaScript and component tests. Keep native-only concurrency, backup, serialization, and interruption checks in the Android suite, and exclude its test harness entirely from production builds.
