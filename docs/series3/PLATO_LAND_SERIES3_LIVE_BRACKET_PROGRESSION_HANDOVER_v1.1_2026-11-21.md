# PLATO LAND – Series 3 Live Bracket Progression Handover

Version: 1.1  
Date: 2026-11-21  
Project: PLATO LAND – Temporary Projects  
Event: Series 3 Backgammon League  
Status: Migration applied to primary Supabase; PR #298 merged to main; Production deployment is triggered by the main-branch workflow and its completion has not yet been independently confirmed.

## 1. Owner-approved bracket

The owner approved the complete bracket path from Round of 32 through the final:
- Round of 32: 16 exact pairings.
- Round of 16: 8 exact pairings.
- Quarterfinals: 4 pairings.
- Semifinals: 2 pairings.
- Third-place match: loser of SF-1 versus loser of SF-2.
- Final: winner of SF-1 versus winner of SF-2.

The approved pairings are encoded in `buildOwnerApprovedSeries3Bracket()` in `src/series3KnockoutBracket.ts`.

**Important:** the approved candidate has NOT yet been saved as the active database draw. The active draw remains `7dbdd5ef-35aa-4a15-8ac0-f2841ae43fda`, with 16 R32 matches. Its previously verified fingerprint remains `cef0effd32b01a2b320ff0840352f131`.

## 2. Automatic progression implementation

Merged implementation includes:
- `src/series3BracketProgression.ts`: conservative mathematical locking of group first/second positions and recursive winner/loser slot resolution.
- No alphabetical fallback for unresolved ties; owner review is required where the result cannot be safely determined.
- Knockout result participant IDs are validated against official resolved bracket slots.
- Group result updates recompute the bracket.
- Third-place qualification is assigned only when all 72 group fixtures are valid and tie/playoff resolution is ready, and no knockout result has already been recorded.
- Public dashboard reads the public-safe knockout projection and subscribes to Realtime updates.

## 3. Primary Supabase migration

Migration applied successfully:
- Version: `20261121202836`
- Name: `series3_public_knockout_results_projection`
- Project: `dfrppbapaaydbjeflozw` (Plato land, eu-west-3)

Verified after application:
- `public.plato_land_series3_public_knockout_results` exists.
- RLS is enabled.
- anon and authenticated have SELECT only; INSERT is not granted.
- The trigger function has no EXECUTE permission for anon/authenticated.
- Read policy is scoped to `event_key = 'series3'`.
- Insert/update/delete synchronization trigger exists on `plato_land_series3_knockout_match_results`.
- The following tables are in `supabase_realtime`: public knockout results, public fixtures, group match results, third-place playoff.
- Public projection currently contains 0 rows; source knockout results also contain 0 rows.

## 4. Current primary database snapshot

Read-only verification after migration and merge on 2026-11-21:
- Group fixtures: 72 total; 24 completed; 48 pending.
- Knockout result rows: 0.
- Active draw ID: `7dbdd5ef-35aa-4a15-8ac0-f2841ae43fda`.
- Active bracket: 16 R32 matches.
- No group results or knockout results were changed during the migration/merge work.
- No approved bracket replacement has been executed.

## 5. GitHub implementation and release

Repository: `Omidso82/Plato-land-preview`  
Base branch: `main`  
Feature branch: `feat/series3-live-knockout-progression-20261121`  
PR #298: https://github.com/Omidso82/Plato-land-preview/pull/298  
PR state: merged.  
Merge commit: `6531b48309e80e70760769cb78bcf9f9e2edd423`  
Merged at: 2026-11-21 20:29 UTC.

Verified on final PR head `29c12dc1c597452df5a98be9e97cb86b0f00e57a`:
- Build and typecheck workflow: success.
- Deno verification workflow: success.
- Temporary Player Bank validation workflow: success.
- PR preview deployment workflow: success. This workflow is configured as a pull_request preview; it is not evidence of the main-branch Production deployment.

The `.github/workflows/deploy-preview.yml` workflow deploys GitHub Pages only when `github.ref == refs/heads/main`. The main-branch Production deployment after merge has not yet been independently confirmed in this handover.

## 6. Outstanding release and owner actions

1. Confirm the main-branch GitHub Pages deployment has completed successfully and verify `https://platoland.org/`.
2. In an authenticated Owner browser session, run the owner-approved bracket replacement action. This action has not been run yet.
3. Verify the previous draw was archived, the active draw now matches the exact owner-approved R32 pairings, and the public projection matches the active draw.
4. Complete iPhone/Safari QA for Owner panel and public bracket.
5. Do not assign third-place qualifiers until all 72 group results and any required playoff are complete.
6. Do not alter existing group or knockout results without the normal owner correction process.

## 7. Scope and safety

- This work is limited to PLATO LAND – Temporary Projects, Series 3.
- No Series 1, Series 2, or PLATO LAND – Main Website-specific feature decisions were changed.
- No Telegram message was sent.
- No group or knockout match result was modified.
- No active draw replacement has been performed.
