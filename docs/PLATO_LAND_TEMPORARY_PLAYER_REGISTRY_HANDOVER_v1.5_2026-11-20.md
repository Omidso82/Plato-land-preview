# PLATO LAND – Temporary Player Registry & Player Bank
Version 1.5 | 2026-11-20 | Status: merged, deployed, and owner-verified on iPhone

## 1. Scope
Temporary Projects only. This update changes the existing player-file modal in the Temporary Player Bank. The PLATO LAND – Main Website project, its `profiles` table, and its game catalog are out of scope and were not changed.

Repository: `Omidso82/Plato-land-preview`
Primary Supabase project: `dfrppbapaaydbjeflozw` (eu-west-3)
Owner panel: `/series2-slides-manager/`
Implementation PR: https://github.com/Omidso82/Plato-land-preview/pull/264
Implementation merge commit: `73619f556425fda3ceb27c0000096c3e7f54071e`

## 2. Approved design
- The player file first shows game-type cards, not separate cards for tournament Series 2 and Series 3.
- Selecting a game card opens that game's own statistics, registration history, and match history.
- Tournament series remain a separate dimension inside the selected game's history.
- Initially only Backgammon is active and visible.
- Cards are rendered from the dedicated Temporary Projects game-type catalog. When a new game is added to that catalog and its player entries/matches carry the matching `game_type_key`, its card appears automatically.
- Distinct Plato IDs remain distinct; no identity merging is performed.

## 3. Database changes
Migration: `20261120200503_temporary_player_bank_game_type_catalog`

New table:
- `public.plato_land_temp_game_types`
- Seed row: `backgammon` / `تخته‌نرد` / 🎲 / active
- RLS enabled; SELECT is owner-only. Public and authenticated default grants are revoked, then authenticated SELECT is granted subject to the owner RLS policy.
- This catalog is separate from the Main Website game catalog.

New columns:
- `public.plato_land_temp_player_entries.game_type_key`
- `public.plato_land_temp_player_matches.game_type_key`
- Both are non-null, default to `backgammon` for compatibility with existing Series 2/3 backgammon sync triggers, and reference the dedicated game catalog.
- Existing `event_key` remains unchanged and continues to distinguish `series2` from `series3`.
- Added player/game/event lookup indexes.
- Updated `plato_land_temp_player_event_stats` to group by both event and game type, retaining `security_invoker = true`.

No source registration or result tables were modified. No Main Website tables, profiles, or catalogs were modified.

## 4. Preserved data and verification
Read-back from the primary database after migration:
- 91 player-entry rows assigned to `backgammon`.
  - Series 2: 32
  - Series 3: 59
- 136 match-history rows assigned to `backgammon`.
  - Series 2: 64
  - Series 3: 72
- One active game catalog row exists: Backgammon.
- These counts match the pre-change counts; no source records were deleted or merged.

Security:
- The new catalog has RLS enabled and an owner-only SELECT policy.
- Security advisor was run. It showed pre-existing project-wide findings in unrelated scanner/prediction/Telegram tables and functions; no new finding for `plato_land_temp_game_types` was reported.

## 5. UI implementation
File: `src/TemporaryPlayerBank.tsx`
- Loads the active game catalog together with the player registry, entries, and matches.
- First modal view shows a card for each active game type.
- Each card shows that game's aggregate played/win/loss/pending counts and registration count.
- Selecting Backgammon opens its detail view with aggregate stats, Series 2/3 registration history, opponent, stage, scores, status, group and match date.
- Back navigation returns to the game-card view.
- No changes to player search, registry identity rules, or source registration/result records.

## 6. CI and release
- PR #264 merged successfully on 2026-11-20.
- Merge commit: `73619f556425fda3ceb27c0000096c3e7f54071e`.
- Temporary Player Bank validation workflow run `44808255823`: success (TypeScript typecheck and Vite production build).
- Build and typecheck workflow run `44808255678`: success, including repository Deno checks.
- Post-merge Build and typecheck run `44808395769`: success.
- Post-merge Deploy PLATO LAND website run `44808396284`: success.

## 7. Owner acceptance – iPhone visual and functional QA
On 2026-11-20 the owner explicitly confirmed the production Player Bank flow on iPhone:
- Player file opens and shows the Backgammon game-type card.
- Backgammon card displays the player's aggregate game/win/loss/pending and registration counts.
- Opening Backgammon history correctly displays both Series 2 and Series 3.
- The owner confirmed that results, registration history, and all related historical details for both series are correct.
- This acceptance is based on the owner's real-device visual/functional verification, not a claim of a separate automated end-to-end browser test.

Acceptance status: complete. No further player-bank UI verification is pending.

## 8. Future game onboarding
When adding a future game:
1. Add its row to `plato_land_temp_game_types`.
2. Ensure that game's Temporary Projects registration and match-history synchronization writes the corresponding `game_type_key`.
3. The UI card will then appear automatically.
The existing Series 2/3 triggers continue to default to Backgammon; they must not be reused unchanged for another game type.

## 9. Version history
- v1.5 — 2026-11-20: Records owner-confirmed iPhone visual/functional acceptance of the Backgammon card and correct Series 2/3 statistics, results, and registration history.
- v1.4 — 2026-11-20: Separates game type from event series, adds the Temporary Projects game catalog and per-record game type keys, groups the Player Bank modal by game type, records database read-back, CI success, and production deployment.
- v1.3 — 2026-11-20: CI workflow and pre-release status for the Player Bank.
- v1.2 — 2026-11-20: Stats view invoker security and non-owner RLS simulation.
- v1.1 — 2026-11-20: Player Bank UI in existing Owner panel.
- v1.0 — 2026-11-20: Persistent registry and match-history database foundation.
