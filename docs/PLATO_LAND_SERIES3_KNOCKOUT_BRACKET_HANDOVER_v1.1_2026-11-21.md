# PLATO LAND Series 3 — Knockout Bracket Protection Handover

**Document:** v1.1  
**Date:** 2026-11-21  
**Event:** Series 3 only  
**Status:** Implementation on draft PR; awaiting owner approval before production actions.

## 1. Scope and objective

Correct the Series 3 knockout bracket so that:
- 24 group first/second-place entrants and eight third-place placeholders form the 32-player Round of 32.
- First and second from the same group cannot meet in Round of 32.
- The eight third-place placeholders remain unassigned until all group results are complete and the eight qualifiers are determined under the approved rules.
- Actual third-place qualifiers are assigned to placeholders without a same-group Round-of-32 pairing.
- Round-of-16 and later winner references remain unchanged when placeholders are replaced.

This document does not change or combine Series 1, Series 2, or the Main Website project scope.

## 2. Approved qualification and tie rules represented in code

- Exactly 72 completed group matches are required (six per group, groups A–L).
- A win awards three points.
- Third-place ranking uses points, set difference, then sets won.
- If exactly the third- and fourth-placed players in a group tie on all three criteria, their direct head-to-head result determines third place.
- If that head-to-head result is missing, tied, or otherwise inconclusive, stop for owner review.
- Other unresolved group ties, including multiway ties or a tie involving second/third, stop for owner review.
- Exactly eight third-place qualifiers are selected.
- If exactly two third-place players tie on all official criteria at the eighth/ninth cutoff, a playoff is required.
- If three or more players tie at the cutoff, stop for owner review.
- No alphabetical Plato ID or group-name fallback is used to resolve official qualification ties.

## 3. Implementation on feature branch

**Repository:** `Omidso82/Plato-land-preview`  
**Base:** `main`  
**Branch:** `fix/series3-knockout-draw-group-protection`  
**Pull request:** [#288](https://github.com/Omidso82/Plato-land-preview/pull/288)  
**Latest recorded commit at document creation:** `7eb89090310a6e0c1e5ae40c4c7a8fc09d8ea5ab`

Files in scope:
- `src/Series3SeedingManager.tsx` — protected R32 draw, placeholder assignment, playoff owner UI and persistence calls.
- `src/series3ThirdPlaceQualification.ts` — isolated qualification resolver.
- `supabase/functions/_shared/series3-third-place-qualification.test.ts` — Deno tests for qualification and playoff rules.
- `.github/workflows/verify.yml` — runs the new Series 3 test suite.
- `supabase/migrations/20261121143000_series3_knockout_draw_atomic_replacement.sql` — atomic bracket replacement and history.
- `supabase/migrations/20261121170000_series3_third_place_playoff_persistence.sql` — owner-only playoff persistence, audit history and validation.

## 4. Validation performed

For commit `7eb89090310a6e0c1e5ae40c4c7a8fc09d8ea5ab`, GitHub Actions reported:
- Typecheck and production build: success.
- Build: success.
- Verify workflow: success.
- The Verify workflow included the new Series 3 Deno test file and all listed existing test/check steps.

The new Series 3 test suite covers:
- incomplete group results;
- third/fourth head-to-head tie resolution;
- exactly two players tied at the eighth/ninth cutoff;
- playoff pending state;
- playoff winner qualification and exact eight-player output;
- three-or-more cutoff tie owner review;
- inconclusive head-to-head owner review.

The bracket protection and placeholder-matching routines have runtime guards, but dedicated isolated automated tests for all pairing/matching edge cases are not yet recorded as complete.

## 5. Primary database status — read-only inspection

**Primary Supabase project:** `dfrppbapaaydbjeflozw`

Read-only inspection confirmed:
- The saved Series 3 seeding draw stores `groups_snapshot` as an array of group objects with `name` and `players`; each player object includes registration `id` and `plato_id`.
- The new `plato_land_series3_third_place_playoff` table was not present in the primary database at the time of inspection.
- The new migrations are present on the feature branch only and have not been applied to the primary database.
- No production bracket replacement has been executed.

## 6. Deployment and approval status

- PR #288 remains open and Draft.
- No merge has been performed.
- No production database migration has been applied.
- No production bracket has been replaced.
- Preview/Cloudflare checks were still in progress at the latest inspection; do not describe the preview or Workers build as fully successful until a completed status is observed.
- No production release is claimed.

## 7. Remaining work before asking for owner approval

1. Re-check the latest CI and Cloudflare Pages/Workers build statuses.
2. Add focused tests for protected R32 pairing and placeholder-to-qualifier matching.
3. Complete a final code and SQL migration review, including role grants, RLS and saved group-draw validation.
4. Confirm no accidental cross-event or Main Website changes in the PR.
5. Update this handover document to a new revision after the above checks.
6. Present the exact proposed production actions and their impact for explicit owner approval.

## 8. Hard stop boundaries

Do not merge PR #288, apply either migration to the primary Supabase project, replace the production bracket, or perform a production release without explicit owner approval.
