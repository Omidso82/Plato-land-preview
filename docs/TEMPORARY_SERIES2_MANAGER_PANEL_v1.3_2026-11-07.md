# PLATO LAND – Temporary Projects
## Series 2 Results Manager
**Version:** v1.0  
**Date:** 2026-11-07  
**Status:** Implementation branch prepared; validation and deployment pending.

### Confirmed user decision
Add a group-match result entry section to the existing temporary Series 2 manager panel at:
`https://platoland.org/series2-slides-manager`

The panel retains its existing poster uploader and private champion-prediction report. The new result-entry section is placed between those sections.

### Verified live data baseline
Read-only inspection of the main Supabase project `dfrppbapaaydbjeflozw` found:
- Progression table: `public.plato_land_series2_tournament_progression`
- Record key: `tournament_key='series2'`
- Last observed `updated_at`: `2026-11-06 10:21:03.413228+00`
- 8 groups, 32 participants, and 48 group fixtures.
- 0 of 48 fixtures had a recorded winner at the time of inspection.
- The public Series 2 page also renders 8 groups and 32 players from this live progression record.

Older historical notes refer to a 12-group / 48-player plan. This implementation does not rewrite the roster or hard-code a group count; it reads the live group and fixture arrays. The historical discrepancy remains a documentation reconciliation item.

### UI behavior
- Owner-only access remains enforced by the existing panel sign-in and owner-role check.
- Groups are populated from the live progression record.
- The owner can filter fixtures by group and scheduled day.
- Each fixture shows the official match ID, player order, and current result status.
- Result inputs follow the existing five-point match rule: one score must be exactly 5 and the other must be 0–4.
- Existing results can be corrected by the owner.
- The manager displays the saved score, winner, and result-history entries.

### Storage and security
- No new table or migration is introduced.
- A dedicated `save_group_result` action is added to the existing `plato-land-series2-progression` Edge Function.
- The function verifies the caller's Supabase user and `user_roles.role='owner'` before accepting writes.
- The action updates only the requested group fixture inside the existing progression JSON.
- The function checks the expected `updated_at` value and uses a conditional update to avoid overwriting a progression record changed concurrently.
- Every first entry or correction appends a history record with previous score/winner, new score/winner, action, and timestamp.
- No owner UUID or other private identity is added to the public progression JSON.
- Existing GET behavior and generic progression POST behavior are retained.

### Public display
The public Series 2 roadmap now renders the stored score and winner for completed group fixtures instead of always displaying “waiting for result”. Pending fixtures continue to show their waiting status.

### Explicitly outside scope
- No registration, roster, group allocation, bracket, or prediction-vote data is modified.
- The pre-tournament player statistics table is not updated by this feature.
- No main-site admin workflow outside this temporary Series 2 panel is changed.
- No new database table, schema migration, paid service, or additional cost is introduced.

### Files
- `src/Series2ResultsManager.tsx` — owner-facing result entry UI.
- `src/Series2SlidesManager.tsx` — inserts the new section into the existing temporary panel.
- `src/Series2Registration.tsx` — displays saved group results publicly.
- `supabase/functions/plato-land-series2-progression/index.ts` — tracked source for the Edge Function's new result-saving action.

### Verification still required
1. Run repository typecheck/build and inspect PR checks.
2. Deploy the updated Edge Function to the existing main Supabase project.
3. Merge the code change and verify the published temporary panel.
4. Test the public GET path and owner-only result save using a deliberately selected real match only after confirming the result with the owner.
5. Verify the public page displays the saved score and that correction history is retained.

No result has been written to the live database as part of preparing this implementation branch. In particular, the previously reported V86 vs jasijan49 score remains unrecorded until the owner enters and confirms it through the new panel.

### Version history
| Version | Date | Notes |
|---|---|---|
| v1.0 | 2026-11-07 | Initial implementation specification for owner-only Series 2 group result entry and public result display. |
