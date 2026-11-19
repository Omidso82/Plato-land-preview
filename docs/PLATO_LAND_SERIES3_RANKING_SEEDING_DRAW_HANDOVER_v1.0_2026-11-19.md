# PLATO LAND – Series 3 Ranking, Seeding & Group Draw Handover

**Version:** 1.0  
**Date:** 2026-11-19  
**Project:** PLATO LAND – Temporary Projects  
**Event:** Series 3 Backgammon League  
**Status:** Primary database table created and verified; implementation in Draft PR; not merged or production-deployed.

## 1. Scope and approved outcome

This work covers only the Series 3 temporary management panel and only the requested stage:
1. Rank all 48 active players by win percentage.
2. Split ranks 1–12, 13–24, 25–36 and 37–48 into four seeding pots.
3. Randomly form 12 groups (A–L), with exactly one player from each pot in every group.

No match schedule, fixtures, later tournament stages, Series 2 changes or Main Website changes are included.

## 2. Confirmed source data

Primary Supabase project: `dfrppbapaaydbjeflozw` (EU region; ACTIVE_HEALTHY).

Read-only audit immediately before implementation:
- Main roster: 32.
- Waitlist: 16.
- Active main + waitlist players with valid statistics: 48.
- Active players with missing or invalid statistics: 0.
- One additional statistics row belongs to a withdrawn registration and is excluded from the 48-player ranking.

Win percentage: `games_won / games_played * 100`.

Approved tie-break order:
1. Higher win percentage.
2. Fewer games played.
3. More games won.
4. Plato ID alphabetical order.

## 3. Database change

Migration version: `20261119221550`  
Migration name: `series3_persistent_seeding_and_group_draw`  
Table: `public.plato_land_series3_seeding_draws`

Columns:
- `id`: UUID primary key.
- `event_key`: fixed to `series3`, unique.
- `ranking_snapshot`: immutable-at-application ranking snapshot (JSONB array).
- `pots_snapshot`: four seeding pots (JSONB array).
- `groups_snapshot`: 12 groups (JSONB array).
- `stats_fingerprint`: SHA-256 fingerprint of the source roster/statistics.
- `created_by`: owner user UUID.
- `created_at`: database timestamp.

Security and verification:
- RLS enabled.
- Two policies: owner-only SELECT and owner-only INSERT, using the existing `private.has_role(ARRAY['owner','مالک کل'])` helper.
- `anon` has no table access.
- `authenticated` has SELECT and INSERT grants; no UPDATE or DELETE grants.
- Unique `event_key` prevents a second draw from being inserted.
- Post-migration verification confirmed RLS enabled, two policies, zero saved draw rows, no anonymous SELECT, and no authenticated UPDATE/DELETE privilege.
- The security advisor returned pre-existing findings on unrelated tables/functions; no unrelated finding was changed.

No existing registration, player-statistics, Series 2, Scanner, Storage or Main Website table was modified. No ranking, seeding or draw result has been inserted yet.

## 4. Application implementation

Repository: `Omidso82/Plato-land-preview`  
Base production commit: `61f71e4cabd92564a8ea14fccb43d8fdea30aebf`  
Branch: `feature/series3-ranking-seeding-draw`  
Latest implementation commit at handover: `fbf2c1f414024636be0576ec5c267d209d783355`  
PR: [#217](https://github.com/Omidso82/Plato-land-preview/pull/217) — Open / Draft / Unmerged.

Changed files:
- `src/Series3SeedingManager.tsx`
- `supabase/migrations/20261119221550_series3_persistent_seeding_and_group_draw.sql`
- This handover document.

The existing statistics editor is retained in its own collapsible card. The three requested sections are separate collapsible cards and use mobile-first player cards.

Before drawing, the component re-reads the active registrations and statistics. If the fresh fingerprint differs from the loaded snapshot, drawing is aborted and the panel refreshes. The draw uses a Fisher–Yates shuffle independently within each pot, then places one member from each pot into each group. It inserts one snapshot row; refresh and reopening read the stored result rather than generating a new one.

If current statistics later differ from the saved fingerprint, the panel flags the draw as stale but preserves and displays the original ranking, pots and groups. No automatic redraw or silent replacement is performed.

## 5. CI and preview status

For commit `fbf2c1f414024636be0576ec5c267d209d783355`:
- GitHub Actions Build and typecheck run `44627199973`: SUCCESS.
  - TypeScript typecheck: SUCCESS.
  - Vite production build: SUCCESS.
  - Existing Deno tests and Edge Function typecheck: SUCCESS.
- GitHub Actions website build run `44627200262`: SUCCESS.
  - TypeScript verification, production build and Pages artifact preparation/upload: SUCCESS.
  - This PR workflow did not deploy to the production site.

Cloudflare PR bot reported a successful branch preview for earlier commit `f8ba5ab`, with branch URL:
`https://feature-series3-ranking-seed.plato-land-preview.pages.dev`

The latest PR commit is `fbf2c1f`; a deployment of that exact commit has not yet been confirmed. Fetching the branch-preview admin route returned `login_required`. Authenticated iPhone/Safari visual and functional QA is therefore still outstanding.

## 6. Release and operational boundaries

- PR #217 remains Draft and unmerged.
- No production merge or deployment has been authorized for this change.
- The primary database migration is applied, but the draw table remains empty.
- No draw has been executed.
- No new match schedule or later tournament phase has been implemented.
- No changes were made to PLATO LAND – Main Website or Series 2.

## 7. Next steps

1. Confirm Cloudflare preview corresponds to the latest PR commit.
2. Owner signs in and checks the existing temporary admin panel on iPhone/Safari.
3. Verify ranking order, 4 × 12 seeding pots, 12 groups and saved-draw persistence using the owner session. Do not trigger a real draw during preview QA.
4. After visual/functional acceptance, obtain separate explicit approval before merging PR #217 and publishing to the production site.
5. After release, verify the live panel and persistence from the real owner account. Only then may release and runtime success be recorded.

## 8. Version history

- v1.0 — 2026-11-19: Records approved scope, primary DB migration, RLS/grant verification, Series 3 implementation, CI success, Draft PR #217 and outstanding preview/owner QA.
