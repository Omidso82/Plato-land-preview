# PLATO LAND – Series 3 Registration Capacity & Waitlist
Version: v0.1 (implementation draft)
Date: 2026-11-15
Project: PLATO LAND – Temporary Projects
Status: Draft PR open; CI checks in progress; production migration NOT applied.

## Approved decisions implemented in draft
- Main capacity: 32 players.
- Public registration remains open until manually closed by the owner.
- Applications after the 32 main places are filled enter the waitlist.
- Waitlist priority is submission time ascending, with request ID as deterministic tie-breaker.
- Owner can open or close public registration independently from the replacement cutoff.
- Replacement cutoff is a separate owner-configured timestamp. No clock time for tournament start is invented.
- Series 3 only. Series 2 and Main Website are outside scope.

## Production database snapshot before migration
Read-only inspection of primary Supabase project dfrppbapaaydbjeflozw on 2026-11-15:
- 23 registration rows; all 23 have rules_accepted=true.
- 23 distinct normalized Plato IDs; no null normalized IDs.
- First request: 2026-11-14 01:34:34.340243+00.
- Last request: 2026-11-15 06:59:35.88415+00.
- Under the approved oldest-first allocation, all 23 existing requests remain in the main roster and 9 main places remain.
No production data was changed during this inspection or implementation stage.

## Draft code changes
- Added migration file supabase/migrations/20261115120000_series3_registration_capacity_waitlist.sql.
- Added owner control component src/Series3RegistrationControls.tsx.
- Added owner controls to src/Series2SlidesManager.tsx inside the Series 3 workspace only.
- Changed src/Series3Registration.tsx to query registration state and submit through a serialized RPC instead of direct table INSERT.
- Changed src/Series3Gallery.tsx to display the CTA only while registration is open.
- Changed src/Series3SeedingManager.tsx to load only requests with registration_status=main.

## Important implementation notes / pending review
- Migration adds main, waitlist, withdrawn statuses, preserves request IDs and timestamps, and allocates oldest existing requests to the main roster up to 32.
- Public table INSERT is revoked and the public form is routed through a security-definer RPC with transaction-level advisory locking.
- Owner RPCs control registration open/close and the replacement cutoff.
- Withdrawal/promotion RPC does not promote a reserve applicant unless the owner has configured the replacement cutoff and the current time is before it.
- Code review draft only. Migration has not been applied; function behavior, grants, RLS, and rollback/recovery plan require review before production approval.
- Owner report has not yet been revised to split the main roster and waitlist visually.
- UI for manually withdrawing a main player and showing/promoting the next reserve applicant has not yet been added.
- No test has been run against a migrated database. No production website deployment has been performed.

## GitHub status
- Repository: Omidso82/Plato-land-preview
- Branch: feature/series3-admin-workspace-registration-waitlist-20261115
- Draft PR #178: https://github.com/Omidso82/Plato-land-preview/pull/178
- Base main: c8abd61df33fc09611aed6d85629a9d405efb600
- Latest implementation commit at document creation: 36738bbefa724816db89c59d631c514301064a0b
- TypeScript check: passed.
- Production build: passed.
- Remaining Deno verification steps and Cloudflare preview build were still running at document creation.
- Cloudflare run is a PR preview build, not a production release.

## Required next steps
1. Finish and review CI results.
2. Review migration SQL and add tests for capacity concurrency, duplicates, closed registration, waitlist ordering, owner-only controls, and replacement cutoff.
3. Update owner report to separate main, waitlist, and withdrawn entries.
4. Add owner workflow for recording withdrawal and promoting the earliest eligible waitlist applicant.
5. Present exact final SQL migration and production effects for explicit user approval.
6. Only after approval, apply migration to the primary Supabase project and verify the 23 existing rows remain intact.
7. Merge and deploy only after successful checks and approval.
