# Production migration ledger

Last reconciled: 2026-11-01.

- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- The primary database has **80 applied migrations**.
- The repository contains **60 SQL files** in `supabase/migrations/`; all 60 version/name pairs match entries in the primary database migration ledger.
- **20 earlier applied baseline migrations** are not present as SQL files in this repository. Recover or reconstruct their source before treating this directory as a complete bootstrap history.
- Do not run `supabase db push` or replay historical migrations against the primary database until the missing baseline history is reconciled.
- Two historical SQL files not present in the primary ledger are archived under `supabase/migrations_reviewed_not_applied/`. Their target effects were already present in the primary database; do not execute them.

## Changes represented by the latest implementation phase

The 15 migrations added during this implementation phase cover Series 1 privacy, safe public reads, anonymous privilege reduction, public policy consolidation, tournament-manager section permissions, assigned-manager role inference, confirmed-participant reads, foreign-key indexing, atomic manager assignment, Storage evidence cleanup and notification policy hardening. The exact latest manager-related migration IDs are listed in `docs/TECHNICAL_HANDOVER_v2.7_2026-11-01.md`.

## Safe procedure for future schema changes

1. Inspect the primary database migration ledger first.
2. Create a new migration with the Supabase CLI; do not invent a version prefix.
3. Review the SQL before applying it.
4. Apply only the new migration once to the primary project.
5. Commit the exact generated versioned SQL file and update this ledger.
6. Never replay an applied migration or create a second database for testing.

## Tournament-manager permission model — 1 November 2026

- Per-tournament grants use `public.tournament_manager_section_permissions`; legacy `public.user_admin_permissions` remains a separate global permission table.
- `public.tournament_manager_access.permissions_configured` distinguishes legacy assignments from explicitly configured grants. Existing assignments with false retain legacy access until the owner reviews and saves them.
- Allowed keys: `registrations`, `groups`, `schedule`, `results`.
- `private.can_manage_tournament_section(uuid,text)` enforces grants in RLS and relevant registration RPCs.
- Group/schedule/results managers may read only confirmed, non-reserve participant data; pending requests and private evidence remain restricted to registrations managers.
- Owner UI allows at most two managers per tournament.
- `public.current_user_role()` infers `tournament_admin` from an active assignment; it does not grant owner access.
- The owner saves assignments through `public.save_tournament_manager_access(uuid,jsonb)`, a SECURITY INVOKER RPC. It is atomic, checks owner authorization, and relies on owner-only RLS.
- A transaction-scoped groups-only test verified role inference, positive groups permission and denial of registrations/schedule/results; transaction rolled back and left no assignment.
- Migration `20261101004817_restore_registration_evidence_cleanup_for_scoped_managers` restores scoped Storage evidence cleanup after registration metadata deletion.
- Migration `20261101004832_scope_notification_inserts_to_authorized_manager_sections` consolidates notification INSERT: self-notification or manager notification only with registrations/schedule/results permission for the participant's tournament.

## Current implementation verification

- Latest branch HEAD at reconciliation: `c5bc7d89d9eb3fec265dacaa4b68a5437970ef23`.
- GitHub Actions run `41258556282` for workflow `Build and typecheck` completed successfully on that HEAD.
- No migration was replayed as a duplicate; no operational data was intentionally deleted or rewritten.
