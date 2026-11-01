# Production migration ledger

Last reconciled: 2026-11-01.

- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- The primary database has **81 applied migrations**.
- The repository contains **61 SQL files** in `supabase/migrations/`; all 61 version/name pairs match entries in the primary database migration ledger.
- **20 earlier applied baseline migrations** are not present as SQL files in this repository. Recover or reconstruct their source before treating this directory as a complete bootstrap history.
- Do not run `supabase db push` or replay historical migrations against the primary database until the missing baseline history is reconciled.
- Two historical SQL files not present in the primary ledger are archived under `supabase/migrations_reviewed_not_applied/`. Their target effects were already present in the primary database; do not execute them.

## Latest additive migration

- `20261101203114_create_plato_land_semifinal_prediction_votes.sql` creates a separate table for the two Series 1 semifinal predictions.
- The earlier champion-prediction table and all existing rows remain unchanged.
- The new table has RLS enabled, denies direct anon/authenticated table access, and grants backend service-role access only.

## Safe procedure for future schema changes

1. Inspect the primary database migration ledger first.
2. Create a new migration with the Supabase CLI; do not invent a version prefix.
3. Review the SQL before applying it.
4. Apply only the new migration once to the primary project.
5. Commit the exact generated versioned SQL file and update this ledger.
6. Never replay an applied migration or create a second database for testing.
