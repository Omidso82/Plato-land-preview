# PLATO LAND – Temporary Projects
## Prediction Center Implementation Report
**Version:** 1.1  
**Date:** 2026-11-16  
**Status:** Initial implementation; not merged to main

### Scope
A reusable prediction center for temporary PLATO LAND events. It is independent from the Main Website and from historic Series 2 prediction features.

### Confirmed database
Main Supabase project: `dfrppbapaaydbjeflozw`

Existing tables:
- `public.plato_land_prediction_campaigns`
- `public.plato_land_prediction_entries`
- `public.plato_land_prediction_audit_events`

The unique key on `(campaign_id, voter_plato_id_normalized)` prevents repeat submissions by the same normalized Plato ID within one campaign. RLS remains enabled. Entries are not directly writable by anonymous clients; submissions are performed by the Edge Function using server-side service credentials.

### GitHub implementation
Repository: `Omidso82/Plato-land-preview`  
Working branch: `feature/temporary-prediction-center`  
Pull request: #191 (open; not merged)  
Main branch baseline at implementation start: `66afce643fe3b5c8936448c7580cce08aca5ec75`

Files added/updated:
- `src/PredictionCampaignManager.tsx` – owner campaign creation and editing.
- `src/PublicPredictions.tsx` – public published-campaign list and response form.
- `src/Series2SlidesManager.tsx` – mounts the new manager in the existing temporary owner panel.
- `src/index.tsx` – public `/predictions` route.
- `supabase/functions/plato-land-predictions-submit/index.ts` – source for public submission Edge Function.

### Submission Edge Function
Deployed to the main Supabase project:
- Name: `plato-land-predictions-submit`
- Version: 1
- Status: ACTIVE
- JWT gateway verification: disabled because this endpoint accepts public participant submissions; the function validates request shape and campaign state itself.
- CORS origin restricted to `https://platoland.org`.
- Validates campaign exists and is published, is_open, opening/closing times, required question IDs, answer types, select options, Plato ID format and response size.
- Inserts via service role; database uniqueness handles duplicate submissions.

### Question JSON contract for the current public form
Each question should be an object with a unique string `id`, a string `label`, and optional `type`:
- `text` (default)
- `number`
- `select` with an `options` array of allowed strings

Example:
```json
[
  {"id":"champion","label":"قهرمان مسابقات چه کسی می‌شود؟","type":"select","options":["Player A","Player B"]}
]
```
The current form requires an answer for every question. Do not publish a campaign with empty/duplicate IDs or unsupported question structures.

### CI and deployment status
- Initial UI-only commit passed Build/Typecheck and the branch deployment workflow.
- Adding the public form introduced a TSX syntax error; this was corrected.
- The corrected form then passed Build/Typecheck and branch deployment.
- After switching submission to `supabase.functions.invoke`, a fresh CI run is required before treating that latest revision as verified.
- The Edge Function deployment itself is confirmed ACTIVE from Supabase.
- The website changes remain in an unmerged PR. Do not describe them as merged or live on the main site.

### Not yet implemented / not verified
- No real participant submission has been made as a test.
- No public campaign has been created or published.
- Owner-side entries report, manual evaluation and automatic scoring are not yet implemented.
- No campaign-specific winner/prize evaluation logic has been activated.
- Mobile visual QA on a real iPhone has not been completed.
- No merge to main has occurred.

### Protected legacy systems
No changes were made to Series 2 champion prediction, Series 2 finalist prediction, Series 2 tournament records, Series 3 registration, or the Main Website database structures.

### Change log
- v1.0 (2026-11-16): created generic campaign schema and first owner/public UI PR.
- v1.1 (2026-11-16): added secure public submission function and public response form; corrected form syntax; switched frontend to Supabase function client.

### Next steps
1. Verify latest PR checks after the final frontend change.
2. Perform controlled endpoint tests that do not insert real votes, followed by an explicitly designated test campaign/test Plato ID if authorized.
3. Build owner entries report and evaluation workflow.
4. Complete iPhone/mobile QA.
5. Ask owner approval before merging PR #191 to main.
