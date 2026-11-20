# PLATO LAND – Temporary Player Registry & Player Bank
Version 1.1 | 2026-11-20

## Scope
This change belongs only to PLATO LAND – Temporary Projects and covers Series 2 and Series 3. It does not use or modify the Main Website `profiles`, `registrations`, `matches`, or other Main Website tables.

Repository: `Omidso82/Plato-land-preview`
Existing management route: `/series2-slides-manager/`
Existing manager component: `src/Series2SlidesManager.tsx`
Primary Supabase project: `dfrppbapaaydbjeflozw`

## Confirmed database foundation
The database registry and match-history implementation is documented in v1.0. Primary Supabase migrations:
- `20261120104404_plato_land_temporary_player_registry_and_history`
- `20261120104438_plato_land_temporary_player_match_history_sync`

Backfill counts verified at implementation:
- 71 unique player identities.
- 32 Series 2 registration entries.
- 59 Series 3 registration entries.
- 20 normalized Plato IDs shared across both series.
- 64 Series 2 match records.
- 72 Series 3 group fixtures, pending at verification time.

## Player Bank UI added to the existing panel
New component:
- `src/TemporaryPlayerBank.tsx`

Existing manager integration:
- `src/Series2SlidesManager.tsx`

The owner-only home menu now has a separate “بانک دائمی بازیکنان” tile. It opens inside the existing management route; no new route or parallel admin panel was created.

UI capabilities:
- Search by Plato ID, matching case-insensitively.
- List registry players and select a player profile.
- Show first/last seen timestamps.
- Show Series 2 and Series 3 participation entries and registration status.
- Show per-series played, wins, losses and pending match counts derived from the match ledger.
- Show match-by-match opponent, stage, score, result status and date.
- Refresh the read-only data.

The component reads only the three registry/history tables directly. It does not use the event-stats view. It does not write to registration, progression, fixture or result source tables. It does not merge different Plato IDs into a single person. Player aliases/names are not invented.

## Security / release boundaries
- The feature is mounted behind the existing manager's owner verification.
- The underlying registry/history tables have RLS owner-read policies; the component performs read-only selects.
- No changes were made to Main Website code or tables.
- No production deployment, PR merge or live panel update is claimed by this handover.
- PR #243 remains the implementation review vehicle and must be reviewed before merge.

## Important security follow-up
The existing `plato_land_temp_player_event_stats` view was created without an explicit `security_invoker = true` option, while SELECT was granted to authenticated. PostgreSQL views can bypass underlying RLS when created with default owner privileges. The Player Bank UI deliberately does not query this view; it derives stats from the owner-RLS-protected match table instead.

Before any merge/release, review and correct the view's security behavior (or revoke authenticated access if it is not needed), then verify with role-based tests. This is a database security follow-up, not performed as part of this UI-only step.

## Validation status
- GitHub branch commits for the component and manager integration were created successfully.
- GitHub Actions workflow-run lookup for the latest integration commit returned no workflow runs. Therefore build/typecheck and runtime behavior are not yet verified.
- No live iPhone visual acceptance has been performed.
- PR #243 remains open and unmerged; Production remains unchanged by this step.

## Version history
- v1.1 — 2026-11-20: Adds owner-facing Player Bank UI within the existing management panel and records validation/security follow-ups.
- v1.0 — 2026-11-20: Initial persistent player registry, participation, match-history projection and backfill.
