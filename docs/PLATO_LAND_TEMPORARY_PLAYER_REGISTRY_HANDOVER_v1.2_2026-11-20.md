# PLATO LAND – Temporary Player Registry & Player Bank
Version 1.2 | 2026-11-20

## Scope
Temporary Projects only: Series 2 and Series 3. No Main Website `profiles` or unrelated tables were modified.
Repository: `Omidso82/Plato-land-preview`
Owner panel: `/series2-slides-manager/`
Primary Supabase: `dfrppbapaaydbjeflozw`

## Implemented UI
- `src/TemporaryPlayerBank.tsx` added and mounted from `src/Series2SlidesManager.tsx`.
- Available from the existing Owner panel as “بانک دائمی بازیکنان”.
- Search Plato ID; show player record, first/last seen, Series 2/3 registration history/status, match history, opponent, stage, scores, result status, and per-event totals.
- Read-only data access. No mutation of registration, fixture, progression, or result source records.
- Different Plato IDs are not merged.
- The UI derives counts from the protected match ledger; it does not query the event stats view.

## Database and security hardening
Initial registry migrations:
- `20261120104404_plato_land_temporary_player_registry_and_history`
- `20261120104438_plato_land_temporary_player_match_history_sync`

Security fix applied to primary Supabase and added to the branch:
- `20261120123200_plato_land_temp_player_stats_view_security_invoker`
- Sets `security_invoker = true` on `public.plato_land_temp_player_event_stats`.

Read-back verification:
- Stats view `reloptions` contains `security_invoker=true`.
- Registry, entries and match tables all have RLS enabled.
- Owner-only SELECT policies exist on all three tables.
- Test as `authenticated` with a non-owner UUID returned 0 rows from the stats view and 0 rows from each base table.
- This is a role simulation using a non-owner UUID; it is not a live browser/session test for the actual Owner account.

## Backfill counts previously verified
- 71 unique player identities.
- 32 Series 2 registration entries.
- 59 Series 3 registration entries.
- 20 normalized Plato IDs present in both series.
- 64 Series 2 match records.
- 72 Series 3 group fixtures, pending at the last verified import.

## GitHub / release
PR: https://github.com/Omidso82/Plato-land-preview/pull/243
Branch: `feature/temporary-player-registry-history`
- New UI, manager integration, and security migration are committed on the branch.
- PR remains draft/open/unmerged.
- No deployment or live panel update is claimed.
- Workflow lookup returned no PR workflow runs. No build/typecheck result is available yet.
- No independent iPhone visual QA has been completed.

## Remaining validation
1. Run repository build and TypeScript typecheck.
2. Test login as the actual Owner account and verify the Player Bank loads.
3. Perform iPhone layout QA.
4. Review PR and explicitly approve before merge/deployment.

## Version history
- v1.2 — 2026-11-20: Sets stats view to invoker security, verifies non-owner RLS behavior, and records remaining QA.
- v1.1 — 2026-11-20: Adds owner-facing Player Bank UI inside existing management panel.
- v1.0 — 2026-11-20: Initial persistent registry and match-history database foundation.
