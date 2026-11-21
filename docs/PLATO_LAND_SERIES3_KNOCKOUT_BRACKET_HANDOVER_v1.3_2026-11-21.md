# PLATO LAND Series 3 — Knockout Bracket Protection Handover

**Document:** v1.3  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Event:** Series 3 only  
**Status:** Feature-branch corrections committed; latest CI and latest Pages preview are not yet confirmed. No merge, production migration, bracket replacement, or production release.

## 1. Scope and approved competition structure

This work applies only to Series 3. Series 1, Series 2, and PLATO LAND – Main Website are outside scope.

The approved qualification structure remains:
- 12 groups, A–L.
- 24 Round-of-32 entrants: one first-place and one second-place entrant from each group.
- Eight third-place qualifiers, initially represented by eight unassigned placeholders.
- First and second from the same group must not meet in Round of 32.
- Third-place placeholders must each face a top-two entrant from a distinct group.
- After group results are complete, exactly eight eligible third-place players replace the placeholders without changing match IDs or downstream winner references.

The third-place ranking and tie rules recorded in v1.2 remain unchanged: points, set difference, sets won; direct head-to-head for an exact third/fourth tie within a group; a playoff for exactly two players tied at the eighth/ninth cutoff; unresolved multiway ties stop for owner review. No alphabetical ID/group fallback decides qualification.

## 2. Read-only primary database inspection — 2026-11-21

Primary Supabase project: `dfrppbapaaydbjeflozw`.

The following state was read without any database writes:
- One saved Series 3 knockout draw exists: `7dbdd5ef-35aa-4a15-8ac0-f2841ae43fda`, created 2026-11-19 23:11:54 UTC.
- Its snapshots contain 32 entrants and 16 Round-of-32 matches.
- The saved draw contains one same-group Round-of-32 clash: R32-5, second of group J versus first of group J.
- It contains two third-place-versus-third-place matches: R32-8 and R32-11. Eight third-place placeholders exist, but they are distributed across only six matches.
- No Series 3 knockout match results are stored (zero rows in the knockout match result table).
- Group results: 72 total rows; 15 completed and 57 pending. Third-place qualification is therefore not ready to resolve.
- The public bracket projection exactly matches the active saved knockout draw. An existing database trigger syncs the public projection after changes to the saved draw.

The existing draw must be preserved. The proposed replacement RPC archives the previous draw before updating the active row. No replacement has been run.

## 3. Feature-branch corrections made

Repository: `Omidso82/Plato-land-preview`  
Base branch: `main`  
Feature branch: `fix/series3-knockout-draw-group-protection`  
PR: #288  
Latest recorded feature-branch commit at this handover: `0f1ae7d0e775570952c9fcac2636c5aa5bd54750`.

Corrections committed on the feature branch:
1. Fixed the SQL pairing predicate so it rejects third-versus-third matches, but permits valid first/second-versus-first/second matches.
2. Strengthened database-side validation: exactly 12 first-place, 12 second-place and eight third-place tokens; one first and one second from each A–L group; valid group labels; eight distinct groups facing the third-place placeholders.
3. Fixed the playoff score input regex so ordinary integer strings are accepted.
4. Strengthened the draw builder to validate the exact A–L first/second distribution and use `crypto.getRandomValues` for shuffling.
5. Strengthened placeholder replacement to reject old brackets with third-versus-third matches or repeated/missing placeholder-opponent groups.
6. Strengthened saved playoff identity revalidation to check registration IDs, group labels and exact Plato IDs.
7. Added tests for the top-two pairing count, malformed group distribution, invalid third-versus-third placeholders and mismatched saved playoff identities.

## 4. Verification status

Previously verified before the latest corrections:
- GitHub Actions Build and typecheck run #1562 on commit `3e2e91c265698695bf87d0f9823b829bd7723975`: SUCCESS.
- That run included TypeScript typecheck, Vite build, the Series 3 qualification suite (7 tests), the Series 3 bracket suite (2 tests, including 495 qualifier-group combinations and 100 randomized draws), and existing repository checks.
- Cloudflare Pages and media-endpoint previews were successful for commit `675213b21ab9b6b00422cd07b45ab3f848f184bc`.
- Cloudflare Pages build for `plato-land-media-pages` was still in progress for the latest commit `0f1ae7d` at the last check.

Important boundary: the latest code corrections after commit `3e2e91c` have not yet been confirmed by a new GitHub Actions verification run. The successful older run must not be presented as verification of the latest code.

## 5. Branch and PR integration status

- PR #288 remains open; it has not been merged.
- The feature branch is 43 commits ahead of and 8 commits behind `main` at the last comparison.
- The eight newer `main` commits affect Series 3 gallery/Telegram files and documentation; the PR diff at the last review remained confined to the Series 3 seeding/bracket code, its tests, the verify workflow, two migrations and handover documents.
- The branch must be reconciled with the latest `main` and the complete diff rechecked before merge.
- No production deployment is claimed.

## 6. Database migration status

The two new migrations remain feature-branch files only:
- `20261121143000_series3_knockout_draw_atomic_replacement.sql`
- `20261121170000_series3_third_place_playoff_persistence.sql`

The primary database migration history currently ends at `20261121115719`; neither new migration is applied. The playoff persistence table and draw-history table are absent from the primary database.

No migration, table creation, policy change, RPC deployment, database write or bracket replacement has been performed during this review.

## 7. Explicit approval gates

Do not proceed without separate explicit owner approval for:
1. Merging PR #288 into `main` (which can trigger the production release workflow).
2. Applying the two reviewed migrations to the primary Supabase project.
3. Replacing the existing saved Series 3 bracket through the owner panel/RPC. The old saved draw must be archived and preserved.
4. Any actual third-place assignment after all 72 group results and any required playoff are complete.

No test registrations, group results, knockout results or dummy bracket rows may be inserted into the primary database.

## 8. Next safe steps

1. Confirm the latest Cloudflare preview result for commit `0f1ae7d0e775570952c9fcac2636c5aa5bd54750`.
2. Obtain a fresh GitHub Actions verification for the latest corrected source and tests.
3. Reconcile the feature branch with the eight newer commits on `main`, then recheck the PR diff and mergeability.
4. Complete final static review of both migrations and their security/rollback implications.
5. Present separate approval requests for PR merge/production release, primary-database migration, and saved-bracket replacement.

## 9. Version history

- v1.0 — 2026-11-20: Initial release record for PR #220 and the original 32-player knockout bracket feature.
- v1.1 — 2026-11-21: Records the first correction/handover review and test work.
- v1.2 — 2026-11-21: Records the protected Round-of-32 algorithm, 495 qualifier-group combinations, CI results and pre-production boundary.
- v1.3 — 2026-11-21: Records the live read-only database findings, confirmed code defects and feature-branch corrections, current verification boundary, and branch divergence.
