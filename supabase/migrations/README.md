# Production migration ledger

Last reconciled: 2026-11-01.

- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- The 55 SQL files in `supabase/migrations/` have version prefixes matching 55 migrations recorded as applied in the primary database.
- The primary database has 75 applied migrations. Twenty earlier applied migrations are not present as SQL files in this repository; their source must be recovered or reconstructed before treating this directory as a complete bootstrap history.
- Do not run `supabase db push` or replay historical migrations against the primary database until the missing baseline history is reconciled.
- Nine migrations added during this implementation phase cover Series 1 privacy, safe public reads, anonymous privilege reduction, public-policy consolidation, tournament-manager section permissions, assigned-manager role inference, confirmed-participant reads, and foreign-key indexing. All nine exact production version IDs are committed.

Two historical SQL files that are not present in the primary migration ledger have been moved to `supabase/migrations_reviewed_not_applied/`. Their target objects/policies already exist in the primary database. They are retained for audit context only and must not be run against the primary database as duplicates.

For every future schema change:
1. Inspect the primary migration ledger first.
2. Create one new migration using the Supabase CLI.
3. Apply it once to the primary project only after reviewing its SQL.
4. Commit the exact generated versioned filename and update this ledger.
5. Never replay an applied migration or create a second database for testing.


## Tournament manager permission model — 1 November 2026

- The primary database uses `public.tournament_manager_section_permissions` for per-tournament manager permissions. The legacy `public.user_admin_permissions` remains a separate global permission table and is not reused for tournament-scoped grants.
- `public.tournament_manager_access.permissions_configured` distinguishes legacy assignments from explicitly configured permissions. Existing assignments with this flag false retain their previous access until the owner reviews and saves the assignment. New assignments are explicitly configured.
- The allowed section keys are `registrations`, `groups`, `schedule`, and `results`.
- `private.can_manage_tournament_section(uuid,text)` enforces these grants in RLS and in the registration-review/removal RPCs.
- Group, schedule and results managers may read only confirmed, non-reserve participant data; pending registration requests, evidence rows and signed evidence files remain restricted to registration managers.
- The owner may assign at most two managers per tournament through the owner UI.
- A manager's site role is inferred from an active tournament assignment by `public.current_user_role()`; no global owner role is granted to a manager.
- The new table is protected by RLS. Only the owner can change grants; a manager can read only their own scoped grants.
- A transaction-scoped SQL test using a temporary non-owner profile verified that a manager with only the `groups` grant receives the manager role, can manage groups, and is denied registrations, schedule and results. The transaction was rolled back; no manager assignments or permission rows were persisted.
