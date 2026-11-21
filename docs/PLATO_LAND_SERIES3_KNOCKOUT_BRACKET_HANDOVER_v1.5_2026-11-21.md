# PLATO LAND Series 3 — Knockout Bracket Protection Handover

**Document:** v1.5  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Event:** Series 3 only  
**Status:** Both approved migrations successfully applied to the primary Supabase database and verified. Existing invalid draw preserved. PR #288 remains Draft/unmerged. No bracket replacement or Production release.

## 1. Scope and approved competition structure

This work applies only to Series 3. Series 1, Series 2, and PLATO LAND – Main Website are outside scope.

Approved structure:
- 12 groups, A–L.
- 24 Round-of-32 entrants: one first-place and one second-place entrant from each group.
- Eight third-place qualifiers, initially represented by eight unassigned placeholders.
- First and second from the same group must not meet in Round of 32.
- Each third-place placeholder must face a top-two entrant from a distinct group.
- After group results are complete, exactly eight eligible third-place players replace the placeholders without changing match IDs or downstream winner references.

Qualification/tie rules remain as documented in v1.2–v1.4: points, set difference, sets won; direct head-to-head for exact third/fourth tie within a group; playoff for exactly two players tied at the eighth/ninth cutoff; unresolved multiway ties stop for owner review. No alphabetical ID/group fallback decides qualification.

## 2. Approved migrations — actual execution record

User explicitly approved execution on 2026-11-21. Both migrations were applied to the primary Supabase project `dfrppbapaaydbjeflozw` (Plato land, eu-west-3, PostgreSQL 17).

1. `series3_knockout_draw_atomic_replacement`
   - Applied successfully.
   - Database migration version: `20261121180054`.
   - Creates `public.plato_land_series3_knockout_draw_history`, enables RLS, adds owner-only SELECT policy, and installs owner-checked atomic replacement RPC `public.replace_series3_knockout_draw(jsonb,jsonb,text,text)`.
2. `series3_third_place_playoff_persistence`
   - Applied successfully.
   - Database migration version: `20261121180102`.
   - Creates `public.plato_land_series3_third_place_playoff` and `public.plato_land_series3_third_place_playoff_history`, owner-only SELECT policies, audit trigger and owner-checked save RPC.
   - Before application, the feature-branch migration was hardened to revoke direct execution of the SECURITY DEFINER audit trigger helper from PUBLIC, anon and authenticated. The trigger still invokes it.

No migration rollback was required. Both migrations appear in Supabase migration history.

## 3. Post-migration verification — 2026-11-21

Confirmed through read-only SQL:
- Both migration history entries are present at versions `20261121180054` and `20261121180102`.
- All three new tables exist and have RLS enabled.
- Each table has its intended owner-only SELECT policy for authenticated users.
- Audit trigger `series3_third_place_playoff_audit` is attached to the playoff table.
- `replace_series3_knockout_draw` and `save_series3_third_place_playoff` are SECURITY DEFINER functions, callable by authenticated role only; each checks the authenticated owner role in its function body.
- `audit_series3_third_place_playoff` is not executable by anon or authenticated roles directly.
- Existing saved draw remains unchanged: active ID `7dbdd5ef-35aa-4a15-8ac0-f2841ae43fda`.
- No archive row was created for that existing draw, because no replacement was performed.
- One active draw remains; zero knockout results.
- Group results remain 15 completed and 57 pending.
- Public bracket projection still exactly matches the active saved draw.

## 4. Existing draw defects — still intentionally preserved

The active saved draw has 32 entrants and 16 Round-of-32 matches, but still contains:
- One same-group clash: R32-5, second of group J versus first of group J.
- Two third-place-versus-third-place matches: R32-8 and R32-11.
- Eight third-place placeholders distributed across only six matches.

The approved migration added the capability to archive and replace the draw safely. It did not itself replace the draw. The old draw and its public projection remain intact pending separate owner approval.

## 5. Security and advisor findings

Post-migration Supabase security advisor:
- No new anon-executable SECURITY DEFINER helper was introduced by these migrations.
- The two owner RPCs are flagged by the generic advisor because authenticated users can invoke the RPC endpoints; both functions explicitly reject users unless `private.has_role(['owner','مالک کل'])` succeeds.
- The audit trigger helper is not directly executable by anon or authenticated.
- Pre-existing advisor warnings remain for other Series 3 registration RPCs, other project functions, and tables with RLS but no policies. These are not caused by this migration pair.

Performance advisor:
- Reports unindexed foreign keys, including four FKs on the new playoff table, as INFO-level performance notices.
- Existing unrelated performance notices remain. No unrelated indexes or tables were changed.

Health advisor: no findings.

## 6. Code and CI verification

Repository: `Omidso82/Plato-land-preview`  
Feature branch: `fix/series3-knockout-draw-group-protection`  
PR: #288, Draft and unmerged.

Latest successful application-source verification before the final SQL-only audit-trigger privilege hardening:
- GitHub Actions Build and typecheck run #1570: SUCCESS.
- TypeScript, Vite build, Series 3 qualification tests, Series 3 bracket tests, existing Deno tests and Edge Function checks passed.
- Temporary Player Bank validation run #78: SUCCESS.
- Cloudflare previews for application code were successful. No Production deployment was made; the production deploy job was skipped for the PR branch.

The last migration-file-only change (revoking direct trigger-helper execution) was applied to the database successfully. A fresh CI run after that last SQL-only commit should be checked before PR merge.

## 7. Branch and PR status

- PR #288 remains open, Draft and unmerged.
- Last comparison: feature branch 53 commits ahead of and 8 commits behind `main`.
- Reconcile branch with the eight newer `main` commits and recheck full PR diff and mergeability before any merge.
- No Production release is claimed.

## 8. Explicit approval gates still outstanding

Separate explicit owner approval remains required for:
1. Merging PR #288 into `main` and any resulting Production release.
2. Replacing the existing saved Series 3 knockout draw through the owner panel/RPC. The current draw must first be archived by the atomic RPC.
3. Assigning actual third-place qualifiers after all 72 group results and any required playoff are complete.

No test registrations, group results, knockout results or dummy bracket rows were inserted. No existing result or player record was modified.

## 9. Next safe steps

1. Check GitHub Actions for the final SQL-only branch commit and the latest preview/deploy comments.
2. Reconcile feature branch with current `main`, review the full diff, and recheck PR mergeability.
3. Request separate approval for PR merge/Production release.
4. After merge/release, request separate approval to replace the existing saved invalid draw. Verify archive, active draw and public projection immediately after replacement.
5. Keep actual third-place assignment blocked until all group results and any required playoff are complete.

## 10. Version history

- v1.0 — 2026-11-20: Original PR #220 release record.
- v1.1 — 2026-11-21: Initial correction and test handover.
- v1.2 — 2026-11-21: Protected R32 algorithm and initial CI results.
- v1.3 — 2026-11-21: Read-only database findings and code corrections.
- v1.4 — 2026-11-21: Successful latest CI and Cloudflare previews.
- v1.5 — 2026-11-21: Records user approval, successful application of both primary-database migrations, post-migration verification, advisor findings, and remaining approval gates.
