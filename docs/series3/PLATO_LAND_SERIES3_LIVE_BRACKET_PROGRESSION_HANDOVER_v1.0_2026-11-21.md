# PLATO LAND – Series 3 Live Bracket Progression Handover

Version: 1.0  
Date: 2026-11-21  
Project: PLATO LAND – Temporary Projects  
Event: Series 3 Backgammon League  
Status: Draft implementation on PR #298; not merged, not deployed, and no new migration applied to primary Supabase.

## 1. Owner-approved bracket

The owner approved the complete randomized bracket path in this conversation:
- Round of 32 / یک‌شانزدهم نهایی: 16 exact pairings.
- Round of 16 / یک‌هشتم نهایی: 8 exact pairings.
- Quarterfinals: 4 pairings.
- Semifinals: 2 pairings.
- Third-place match: loser of SF-1 versus loser of SF-2.
- Final: winner of SF-1 versus winner of SF-2.

The approved R32, R16, QF, SF, final, and third-place pairings are encoded in `buildOwnerApprovedSeries3Bracket()` in `src/series3KnockoutBracket.ts`. A test asserts the exact R32 and R16 pairings and the loser-based third-place match.

The current primary database draw has NOT yet been replaced. It remains:
`7dbdd5ef-35aa-4a15-8ac0-f2841ae43fda`.

## 2. Automatic progression implementation

Feature branch adds:
- `src/series3BracketProgression.ts`: conservative group-position locking and recursive winner/loser slot resolution.
- Group first/second positions are exposed only when their position cannot be changed by any remaining pending fixture. The resolver uses strict points bounds while fixtures remain; ties are not decided alphabetically. Once a group is complete, points, set difference, and sets won are used; an unresolved tie affecting first/second stops for owner review.
- Saved knockout result participant IDs are checked against the official resolved bracket slots before a result can be saved.
- Winner and loser references are resolved recursively from completed result rows. The third-place match receives the two semifinal losers; the final receives the two semifinal winners.
- Group-result updates in the existing unified manager recompute the live bracket.
- After all 72 group fixtures have valid completed scores, third-place qualification runs automatically when the official tie/playoff resolver returns ready and no knockout results have yet been recorded. If a playoff is required, the workflow waits for the saved playoff result. If a multi-way tie or a later group correction conflicts with already-entered knockout results, it stops for owner review rather than silently rewriting the bracket.
- Public dashboard reads a public-safe knockout-result projection and subscribes to Realtime updates for group and knockout results.

## 3. Database migration — branch only

New migration:
`supabase/migrations/20261121193000_series3_public_knockout_results_projection.sql`

It creates `public.plato_land_series3_public_knockout_results` with only display-safe match fields, RLS, explicit read grants for anon/authenticated, and a trigger that mirrors source knockout result changes. It adds the public-safe group/knockout projection tables and owner playoff source table to the Realtime publication only if they are not already present.

**This migration has not been applied to the primary database.** Public dashboard code that queries the new table must not be deployed before the migration is applied and verified.

## 4. Current primary database snapshot (read-only, 2026-11-21)

- Group fixtures: 72 total; 22 completed; 50 pending.
- Knockout results: 0.
- Active draw ID: `7dbdd5ef-35aa-4a15-8ac0-f2841ae43fda`.
- Public knockout result projection table: absent at the time of check.
- No database write was performed in this work session.

## 5. GitHub implementation

Repository: `Omidso82/Plato-land-preview`  
Base branch: `main`  
Feature branch: `feat/series3-live-knockout-progression-20261121`  
PR: #298 — https://github.com/Omidso82/Plato-land-preview/pull/298  
PR state: Draft, open, unmerged.

Changed files include:
- `src/series3BracketProgression.ts`
- `src/series3KnockoutBracket.ts`
- `src/Series3GroupResultsManager.tsx`
- `src/Series3PublicDashboard.tsx`
- `src/Series3SeedingManager.tsx`
- `supabase/migrations/20261121193000_series3_public_knockout_results_projection.sql`
- Deno progression/bracket tests and verify workflow.

The existing admin panel includes an owner-authenticated action to save the exact approved bracket through `replace_series3_knockout_draw`, preserving the old snapshot in history. The action has not been run from an authenticated owner browser session.

## 6. Release and safety boundaries

- No merge to `main`.
- No Production deployment.
- No new Supabase migration applied.
- No saved draw replacement.
- No group or knockout result changed.
- No Telegram message sent.
- No changes to Series 1, Series 2, or PLATO LAND – Main Website.

Before release:
1. All GitHub build/typecheck, Deno tests, and Cloudflare preview checks must pass on the final PR head.
2. Review the public projection migration, including grants/RLS and Realtime publication.
3. Apply the migration to the primary Supabase project only after review/approval.
4. Verify the new public projection table, trigger, grants, RLS, and Realtime publication.
5. In the authenticated Owner panel, use the approved-bracket replacement action; verify old-draw history, active draw, exact pairings, and public projection parity.
6. Complete iPhone/Safari owner-panel and public-dashboard QA before any Production release.
7. Production merge/deploy remains a separate release approval.

