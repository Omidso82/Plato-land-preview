# PLATO LAND Series 3 — Knockout Bracket Protection Handover

**Document:** v1.2  
**Date:** 2026-11-21  
**Event:** Series 3 only  
**Status:** Code and automated tests pass on the feature branch. Draft PR and production actions remain unapproved.

## 1. Objective and boundaries

The task is limited to correcting Series 3 knockout bracket integrity:
- 24 group first/second entrants plus eight third-place placeholders form the 32-player Round of 32.
- First and second from the same group cannot meet in Round of 32.
- Third-place placeholders stay unassigned until all group results and qualification rules are resolved.
- Exactly eight actual third-place qualifiers are assigned to placeholders without a same-group clash.
- Round-of-16 and later winner references are preserved.

Series 1, Series 2 and the Main Website are outside this change.

## 2. Approved qualification rules implemented

- Exactly 72 completed, valid, non-tied group results are required (six per group, groups A–L).
- Each win awards three points.
- Third-place ranking: points, set difference, then sets won.
- An exact third/fourth tie within a group is resolved by the direct head-to-head result.
- Missing or inconclusive head-to-head, multiway group ties, and unresolved second/third ties stop for owner review.
- Exactly eight third-place qualifiers are selected.
- Exactly two players tied on all official criteria at the eighth/ninth cutoff require a playoff.
- Three or more tied at that cutoff stop for owner review.
- No alphabetical Plato ID or group-name fallback is used to decide official qualification.

## 3. Branch and PR

- Repository: `Omidso82/Plato-land-preview`
- Base: `main`
- Branch: `fix/series3-knockout-draw-group-protection`
- PR: [#288](https://github.com/Omidso82/Plato-land-preview/pull/288)
- Latest code commit covered by the successful verification run: `a9a64e7a4955b1bddb07efe45bb405f0445d4ccd`

## 4. Implementation files

- `src/Series3SeedingManager.tsx`: admin integration, result revalidation before playoff save, bracket draw and atomic persistence calls.
- `src/series3ThirdPlaceQualification.ts`: isolated third-place resolver.
- `src/series3KnockoutBracket.ts`: isolated protected R32 construction and third-place placeholder matching.
- `supabase/functions/_shared/series3-third-place-qualification.test.ts`: qualification and playoff tests.
- `supabase/functions/_shared/series3-knockout-bracket.test.ts`: R32 and placeholder-matching tests.
- `.github/workflows/verify.yml`: runs both Series 3 Deno test suites.
- `supabase/migrations/20261121143000_series3_knockout_draw_atomic_replacement.sql`: atomic bracket replacement/history.
- `supabase/migrations/20261121170000_series3_third_place_playoff_persistence.sql`: owner-only playoff persistence, history, and saved-draw group validation.

## 5. Bracket protection details

- The eight placeholder opponents are selected from eight distinct groups. This guarantees that any valid set of eight distinct third-place groups can be assigned.
- The remaining 16 first/second entrants are paired only across different groups.
- Runtime validation checks 32 unique entrants, no same-group R32 pairing, no third-versus-third pairing, and eight distinct placeholder-opponent groups.
- Qualifier replacement uses a matching algorithm and preserves existing match IDs and downstream winner references.
- Automated test coverage checks 100 independently randomized protected draws and all 495 possible combinations of eight qualifying groups chosen from twelve.

## 6. CI results

For commit `a9a64e7a4955b1bddb07efe45bb405f0445d4ccd`:
- Typecheck: success.
- Production build: success.
- Series 3 qualification test suite: success (7 tests).
- Series 3 bracket test suite: success (2 tests, including all 495 qualifier-group combinations and 100 randomized R32 draws).
- Existing repository Deno tests and checks in the Verify workflow: success.

These are branch CI results; they do not represent a production release.

## 7. Primary Supabase database — read-only inspection

Project: `dfrppbapaaydbjeflozw`

- The saved Series 3 `groups_snapshot` structure was checked; it contains group names and player objects with registration IDs and Plato IDs.
- The new playoff table is absent from the primary database.
- Both new migrations remain branch files only and have not been applied.
- No production bracket replacement has been performed.

## 8. Deployment status

- PR #288 remains open and Draft; it is not merged.
- The latest Pages/Workers checks must be read from their current run status; no production release is claimed.
- No database migration, production bracket replacement, PR merge, or production deployment has been performed.

## 9. Remaining items before owner approval

1. Recheck final Cloudflare Pages and Workers build outcomes for the latest branch commit.
2. Complete final review of migration behavior and deployment impact.
3. Verify the full PR diff remains confined to Series 3 and its test/CI files.
4. Present a precise approval request covering PR merge and primary-database migration separately, including their effects.

## 10. Explicit stop boundary

Do not merge PR #288, apply either migration to the primary Supabase project, replace the production bracket, or release to production without explicit owner approval.
