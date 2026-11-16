# PLATO LAND – Temporary Projects
## Prediction Center Implementation Report
**Version:** 1.2  
**Date:** 2026-11-16  
**Status:** Owner entries report added on working branch; PR not merged

### Scope
A reusable prediction center for temporary PLATO LAND events. It remains independent from the Main Website and from historic Series 2 prediction features.

### Confirmed database
Main Supabase project: `dfrppbapaaydbjeflozw`

Tables:
- `public.plato_land_prediction_campaigns`
- `public.plato_land_prediction_entries`
- `public.plato_land_prediction_audit_events`

The unique key on `(campaign_id, voter_plato_id_normalized)` prevents repeat submissions by the same normalized Plato ID within one campaign. RLS is enabled on all three tables. Entries are not directly writable by anonymous clients; public submissions are performed by the Edge Function using server-side service credentials.

Current row counts at verification:
- Campaigns: 0
- Entries: 0
- Audit events: 0

No test or participant vote was inserted.

### GitHub implementation
Repository: `Omidso82/Plato-land-preview`  
Working branch: `feature/temporary-prediction-center`  
Pull request: #191 (open; not merged)  
Main branch baseline at implementation start: `66afce643fe3b5c8936448c7580cce08aca5ec75`

Files:
- `src/PredictionCampaignManager.tsx` – owner campaign creation/editing and owner entries report.
- `src/PublicPredictions.tsx` – public published-campaign list and response form.
- `src/Series2SlidesManager.tsx` – mounts the new manager in the existing temporary owner panel.
- `src/index.tsx` – public `/predictions` route.
- `supabase/functions/plato-land-predictions-submit/index.ts` – public submission Edge Function source.

### Owner entries report (v1.2)
Each campaign now has a **گزارش شرکت‌کنندگان** action in the owner manager. It:
- Checks that an authenticated user session exists before requesting the report.
- Queries entries only for the selected campaign.
- Displays Plato ID, submitted time, response JSON, score, result status and optional evaluation note.
- Uses the existing entries-table RLS policy; no public read policy or service-role key was added to the browser.
- Is read-only. Evaluation, scoring and winner assignment are not implemented in this step.

### Submission Edge Function
Deployed to the main Supabase project:
- Name: `plato-land-predictions-submit`
- Version: 1
- Status: ACTIVE
- JWT gateway verification: disabled for public participant submission; function validates request shape and campaign state itself.
- CORS origin restricted to `https://platoland.org`.
- Validates campaign publication/open state, opening/closing times, required question IDs, answer types, select options, Plato ID format and response size.
- Inserts via service role; database uniqueness handles duplicate submissions.

A live HTTP endpoint test was not performed in this stage because no safe direct HTTP invocation tool was available in the connected environment. No real or test submission was sent.

### Security review and correction
Supabase security advisor was reviewed. It reported multiple findings on unrelated pre-existing tables/functions, including legacy Series 2 and Series 3 objects; those were not changed.

One finding directly concerned the new audit trigger function:
- `public.plato_land_prediction_audit_campaign()` was a SECURITY DEFINER trigger function with EXECUTE granted to PUBLIC, anon and authenticated.
- Corrected by revoking EXECUTE from PUBLIC, anon and authenticated.
- Follow-up SQL verification returned ACL: `{postgres=X/postgres,service_role=X/postgres}`.
- The trigger remains installed; trigger execution is not exposed as a callable RPC to public roles.

### CI / deployment status
- The previous source commit `2e91866f9bf01b06ded4b64a9513bffc3cf09fa0` passed Build/Typecheck and Deploy Preview workflows.
- The v1.2 owner-report commit requires fresh CI verification.
- The website changes remain in an unmerged PR. Do not describe them as merged or live on the main site.

### Not yet implemented / not verified
- Latest CI for v1.2 commit.
- Safe non-mutating endpoint HTTP tests.
- Real iPhone/mobile visual QA.
- Manual evaluation, automatic scoring and winner/prize evaluation.
- Public campaign creation or publication.
- Merge to main (requires explicit owner approval).

### Protected legacy systems
No changes were made to Series 2 champion prediction, Series 2 finalist prediction, Series 2 tournament records, Series 3 registration data, or Main Website structures. No rows were inserted into the new prediction tables.

### Change log
- v1.0 (2026-11-16): created generic campaign schema and first owner/public UI PR.
- v1.1 (2026-11-16): added secure public submission function and public response form; corrected form syntax; switched frontend to Supabase function client.
- v1.2 (2026-11-16): added owner-only entries report; reviewed Supabase security advisor; revoked public EXECUTE on the new audit trigger function; verified ACL and confirmed all three prediction tables remain empty.

### Next steps
1. Verify v1.2 Build/Typecheck and Deploy Preview workflows.
2. Perform non-mutating endpoint tests when a safe HTTP invocation route is available.
3. Complete iPhone/mobile QA.
4. Define the first campaign's question structure and evaluation rules with the owner.
5. Implement evaluation/scoring only after those rules are approved.
6. Ask owner approval before merging PR #191 to main.
