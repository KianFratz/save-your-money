# Use a linear SQLite schema history

Use `PRAGMA user_version` as the sole database schema-version authority, with ordered migration files and preserved fixtures for every released version. Do not duplicate version state in `app_settings` or a `schema_migrations` table: a linear embedded database gains little from multiple authorities, while disagreement between them would make recovery unsafe. Migrations may be squashed before the first signed schema-v1 baseline only; afterward they are immutable, and an application that encounters a newer database must fail closed.

Portable-backup restoration uses the same migration chain: decrypt into a temporary database, migrate and validate it, and replace live state only after success.
