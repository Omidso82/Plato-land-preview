# PLATO LAND Series 3 — Knockout Bracket Protection Handover

**Document:** v1.4  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Event:** Series 3 only  
**Status:** Feature-branch code corrections and latest GitHub Actions verification succeeded. PR remains Draft/unmerged. No production migration, bracket replacement, or production release.

## 1. Scope and approved competition structure

This work applies only to Series 3. Series 1, Series 2, and PLATO LAND – Main Website are outside scope.

Approved structure:
- 12 groups, A–L.
- 24 Round-of-32 entrants: one first-place and one second-place entrant from each group.
- Eight third-place qualifiers, initially represented by eight unassigned placeholders.
- First and second from the same group must not meet in Round of 32.
- Each third-place placeholder must face a top-two entrant from a distinct group.
- After group results are complete, exactly eight eligible third-place players replace the placeholders without changing match IDs or downstream winner references.

The qualification and tie rules recorded in v1.2/v1.3 remain unchanged: points, set difference, sets won; direct head-to-head for an exact third/fourth tie within a group; a playoff for exactly two players tied at the eighth/ninth cutoff; unresolved multiway ties stop for owner review. No alphabetical ID/group fallback decides qualification.

## 2. Read-only primary database state

Primary Supabase project: `dfrppbapaaydbjeflozw`.

Last read-only verification on 2026-11-21:
- One saved Series 3 knockout draw exists: `7dbdd5ef-35aa-4a15-8ac0-f2841ae43fda`, created 2026-11-19 23:11:54 UTC.
- It contains 32 entrants and 16 Round-of-32 matches.
- One same-group clash exists: R32-5, second of group J versus first of group J.
- Two third-place-versus-third-place matches exist: R32-8 and R32-11. The eight placeholders are distributed across only six matches.
- No Series 3 knockout match results are stored.
- Group results: 72 total; 15 completed and 57 pending. Third-place qualification is not ready.
- The public bracket projection exactly matches the active saved draw. An existing database trigger syncs the public projection after changes to the saved draw.

The existing draw must be preserved. The proposed replacement RPC archives the previous draw before updating the active row. No replacement has been run.

## 3. Feature-branch corrections

Repository: `Omidso82/Plato-land-preview`  
Feature branch: `fix/series3-knockout-draw-group-protection`  
PR: #288  
Latest handover-document commit: `66ecd09624d197c9443b32f2d1e4e28b6dd72dc3`.

Corrections committed:
1. Corrected the SQL pairing predicate: first/second-versus-first/second matches are allowed; third-versus-third matches are rejected.
2. Added strict database-side 12+12+8 entrant counts, one first and one second from each A–L group, valid group metadata, and eight distinct placeholder-opponent groups.
3. Fixed the playoff score integer regex.
4. Strengthened protected draw generation and switched shuffling to `crypto.getRandomValues`.
5. Rejected old placeholder brackets with third-versus-third matches or repeated/missing placeholder-opponent groups before assignment.
6. Revalidated saved playoff participants by registration ID, group and exact Plato ID.
7. Added tests for malformed group distribution, invalid placeholder pairings and mismatched saved playoff identities.

## 4. Latest verification — confirmed success

GitHub Actions for latest handover commit `66ecd09624d197c9443b32f2d1e4e28b6dd72dc3`:

- Build and typecheck run #1570: **SUCCESS**.
- `npm install`: success.
- `npm run typecheck`: success.
- `npm run build`: success.
- Series 3 third-place qualification tests: success.
- Series 3 protected bracket tests: success.
- Existing Series 2, PLATO ID Scanner and Edge Function checks: success.
- Temporary Player Bank validation run #78: success.

Cloudflare preview:
- `plato-land-preview`: successful preview for commit `0f1ae7d`.
- `plato-land-media-pages`: successful preview for commit `0f1ae7d`.
- `plato-land-media-endpoint`: successful preview for commit `d4f960a`.
- The later commit `66ecd09` changes the handover document only; the application source corrections were already included in the successful `0f1ae7d` preview.

The GitHub Deploy PLATO LAND website workflow run #1320 completed its build successfully and skipped the deploy job because this is a PR branch. This is not a Production deployment.

## 5. Branch and PR integration status

- PR #288 remains open and Draft; it is not merged.
- Last comparison: feature branch 52 commits ahead of and 8 commits behind `main`.
- The eight newer `main` commits affect Series 3 gallery/Telegram files and documentation; the PR diff remains limited to Series 3 seeding/bracket code, its tests, the verify workflow, two migrations and handover documents.
- GitHub reported the PR mergeable at the last metadata check. The branch divergence must still be considered before merge; recheck mergeability and full diff immediately before any merge.
- No Production release is claimed.

## 6. Migration status and static review

The two new migrations remain feature-branch files only:
- `20261121143000_series3_knockout_draw_atomic_replacement.sql`
- `20261121170000_series3_third_place_playoff_persistence.sql`

The primary database migration history ends at `20261121115719`; neither new migration is applied. The playoff persistence table and draw-history table are absent from the primary database.

Static review covered owner-only authorization, RLS/read grants, history capture, atomic replacement, entrant/slot validation, group validation and playoff participant validation. No migration was executed against the primary database. SQL runtime execution remains unverified until separately approved.

No database write, table creation, policy change, RPC deployment or bracket replacement has been performed.

## 7. Explicit approval gates

Separate explicit owner approval is required for:
1. Merging PR #288 into `main` (and any resulting Production deployment).
2. Applying both reviewed migrations to the primary Supabase project.
3. Replacing the existing saved Series 3 bracket through the owner panel/RPC. The old saved draw must be archived and preserved.
4. Assigning actual third-place qualifiers after all 72 group results and any required playoff are complete.

No test registrations, group results, knockout results or dummy bracket rows may be inserted into the primary database.

## 8. Next safe steps

1. Final read-only check of current main/head SHAs, PR mergeability and changed-file scope.
2. If the PR remains mergeable, present the exact merge/Production approval request.
3. Present a separate migration approval request with the effects of each migration.
4. After migrations are approved and verified, request separate approval to replace the existing invalid saved bracket.
5. Keep third-place assignment blocked until all group results are complete and the resolver returns a valid set of eight.

## 9. Version history

- v1.0 — 2026-11-20: Original PR #220 release record.
- v1.1 — 2026-11-21: Initial correction and test handover.
- v1.2 — 2026-11-21: Protected R32 algorithm, 495 qualifier-group combinations and initial CI boundary.
- v1.3 — 2026-11-21: Read-only database findings and confirmed code defects/corrections.
- v1.4 — 2026-11-21: Records successful latest CI run #1570, successful Cloudflare previews, current branch divergence and explicit approval gates.
