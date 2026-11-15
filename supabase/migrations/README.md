# Production migration ledger

Last reconciled: 2026-11-15.

- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- The primary database has **105 applied migrations**.
- The repository contains **62 SQL files** in `supabase/migrations/`; the new Series 3 migration matches the primary database migration ledger. The repository does not contain SQL source for 43 applied historical migrations; do not replay or bootstrap from this folder.
- **20 earlier applied baseline migrations** are not present as SQL files in this repository. Recover or reconstruct their source before treating this directory as a complete bootstrap history.
- Do not run `supabase db push` or replay historical migrations against the primary database until the missing baseline history is reconciled.
- Two historical SQL files not present in the primary ledger are archived under `supabase/migrations_reviewed_not_applied/`. Their target effects were already present in the primary database; do not execute them.

## Latest additive migration

- `20261101203114_create_plato_land_semifinal_prediction_votes.sql` creates a separate table for the two Series 1 semifinal predictions.
- The earlier champion-prediction table and all existing rows remain unchanged.
- The new table has RLS enabled, denies direct anon/authenticated table access, and grants backend service-role access only.

## Latest additive migration\n\n- `20261115143405_series3_owner_registration_controls_and_waitlist.sql` adds owner-controlled Series 3 registration open/close, a 32-player main roster, ordered waitlist, soft withdrawal, and owner-approved waitlist promotion. Applied to the primary project `dfrppbapaaydbjeflozw` on 2026-11-15. Existing 27 registrations were preserved and initialized as `main`.\n\n## Safe procedure for future schema changes

1. Inspect the primary database migration ledger first.
2. Create a new migration with the Supabase CLI; do not invent a version prefix.
3. Review the SQL before applying it.
4. Apply only the new migration once to the primary project.
5. Commit the exact generated versioned SQL file and update this ledger.
6. Never replay an applied migration or create a second database for testing.
