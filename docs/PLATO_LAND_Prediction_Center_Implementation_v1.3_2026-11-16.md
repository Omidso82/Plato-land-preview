# PLATO LAND – Temporary Projects
## Prediction Center Implementation Report
**Version:** 1.3  
**Date:** 2026-11-16  
**Status:** CI verified; endpoint browser probe blocked; PR remains unmerged

### Scope
Reusable prediction center for PLATO LAND Temporary Projects, independent from the Main Website and historic Series 2 prediction features.

### Database and security
Main Supabase project: `dfrppbapaaydbjeflozw`

Tables:
- `public.plato_land_prediction_campaigns`
- `public.plato_land_prediction_entries`
- `public.plato_land_prediction_audit_events`

Latest row counts: campaigns 0, entries 0, audit events 0. No test or participant vote was inserted.

RLS verification:
- Campaigns: owner can manage; anon/authenticated can read only published campaigns.
- Entries: authenticated owner-only SELECT; no public read or direct public insert.
- Audit events: authenticated owner-only SELECT.
- The audit trigger function `public.plato_land_prediction_audit_campaign()` has EXECUTE revoked from PUBLIC, anon and authenticated. Verified ACL: postgres and service_role only.

### Implemented functionality
- Owner campaign manager: create/edit independent campaigns, type, event key, schedule, status/open state, questions JSON, prize/scoring/winner rules and public config.
- Public `/predictions` route: lists published campaigns and offers a response form.
- Public submissions go through Edge Function `plato-land-predictions-submit` (ACTIVE, version 1), which validates request data and campaign state and uses server-side service credentials.
- Owner entries report: read-only report showing Plato ID, submission time, response JSON, score, result status and optional note. Access is protected by the entries table RLS.

### CI verification for v1.2
Commit: `c5df0a1d7a06667948785333932f5b1e6c28ee7e`

Build and typecheck workflow run `43870477866`:
- npm install: success
- TypeScript check: success
- production build: success
- existing Deno tests: success

Deploy workflow run `43870477636`:
- build, TypeScript verification, production build and GitHub Pages output preparation: success
- final deploy job: skipped
- Therefore no claim is made that the feature was deployed to the public main site.

### Endpoint test attempt
A strictly non-mutating GET-only browser probe was attempted against the Edge Function URL. The browser automation run did not start because the connected browser service wallet balance was insufficient. No top-up or paid service purchase was made. No POST request was sent. Endpoint HTTP behavior therefore remains unverified.

### GitHub / PR
Repository: `Omidso82/Plato-land-preview`  
Branch: `feature/temporary-prediction-center`  
PR #191: open, not merged  
Head commit: `c5df0a1d7a06667948785333932f5b1e6c28ee7e`  
Base branch: `main`

PR description was updated to accurately include the public submission function, owner report, security correction, and remaining QA items.

### Protected areas
No changes to Series 2 legacy prediction systems, Series 3 registration records, tournament results, or Main Website structures. No campaign or entry data has been created.

### Outstanding work
1. Verify Edge Function HTTP behavior using an available no-cost safe test path; do not top up any external wallet without owner authorization.
2. Complete real iPhone/mobile QA when the owner can inspect the Preview.
3. Define the first real campaign's question structure, scoring, prize and winner rules with the owner.
4. Implement evaluation only after those rules are confirmed.
5. Obtain explicit owner approval before merging PR #191 to main.

### Change log
- v1.0 (2026-11-16): generic campaign schema and initial owner/public UI.
- v1.1 (2026-11-16): secure public submission Edge Function and public response form.
- v1.2 (2026-11-16): owner entries report; security advisor review; restricted audit trigger function execution.
- v1.3 (2026-11-16): recorded final CI results, deploy-job skipped status, RLS verification, zero-row verification, and blocked non-mutating endpoint probe.
