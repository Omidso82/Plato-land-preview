# Production migration ledger

Last reconciled: 2026-11-01.

- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- The 49 SQL files in `supabase/migrations/` have version prefixes matching 48 migrations recorded as applied in the primary database.
- The primary database has 68 applied migrations. Twenty earlier applied migrations are not present as SQL files in this repository; their source must be recovered or reconstructed before treating this directory as a complete bootstrap history.
- Do not run `supabase db push` or replay historical migrations against the primary database until the missing baseline history is reconciled.
- Four new migrations for Series 1 privacy, safe public tournament reads, and anonymous privilege reduction are included with their exact production version IDs.

Two historical SQL files that are not present in the primary migration ledger have been moved to `supabase/migrations_reviewed_not_applied/`. Their target objects/policies already exist in the primary database. They are retained for audit context only and must not be run against the primary database as duplicates.

For every future schema change:
1. Inspect the primary migration ledger first.
2. Create one new migration using the Supabase CLI.
3. Apply it once to the primary project only after reviewing its SQL.
4. Commit the exact generated versioned filename and update this ledger.
5. Never replay an applied migration or create a second database for testing.
