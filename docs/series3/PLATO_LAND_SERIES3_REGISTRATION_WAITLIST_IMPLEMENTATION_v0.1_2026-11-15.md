# PLATO LAND – Series 3 Registration Capacity & Waitlist
Version: v0.5 (implementation, source-review, audit-history, status-error and cutoff-safety update)
Date: 2026-11-15
Project: PLATO LAND – Temporary Projects
Status: Draft PR #178 open; source changes staged on feature branch; database migration NOT applied; production release NOT approved.

## Approved decisions
- Main roster capacity: 32 players.
- Public registration remains open until the owner manually closes it.
- Requests received after the 32 main places are filled enter the waitlist.
- Waitlist priority is submission time ascending, with request ID as deterministic tie-breaker.
- Owner-controlled public registration open/close is independent from the replacement cutoff.
- Reserve replacement continues only until before the tournament starts on Saturday 30 Aban. The exact clock time is not established in the approved decision; it must be configured by the owner and must not be guessed.
- Series 3 only. Series 2 and PLATO LAND – Main Website are outside scope.

## Authoritative references reviewed
- PLATO_LAND_Temporary_Projects_System_Reference_v1.5_2026-11-12.
- PLATO_LAND_Series3_Registration_Waitlist_Decision_v1.0_2026-11-15.
- PLATO_LAND_SERIES3_ADMIN_WORKSPACE_AND_REPORT_v1.0_2026-11-14.
The approved workspace remains the existing temporary owner panel at https://platoland.org/series2-slides-manager/; this feature branch is an implementation/review vehicle, not a replacement admin destination.

## Read-only primary database snapshot
Primary Supabase project: dfrppbapaaydbjeflozw.
Verified 2026-11-15 using read-only inspection:
- 23 registration rows.
- All 23 rows have rules_accepted=true.
- 23 distinct generated normalized Plato IDs; zero null normalized IDs.
- Oldest request: 2026-11-14 01:34:34.340243+00.
- Newest request: 2026-11-15 06:59:35.88415+00.
- Live column plato_id_normalized is GENERATED ALWAYS AS lower(btrim(plato_id)).
- Existing table has no registration_status column yet.
- Existing owner read/update/delete policies are present; public insert policy is named "Series 3 public registration insert".
- Existing anon and authenticated roles currently have INSERT grants; authenticated also has SELECT/UPDATE/DELETE grants.
- user_roles.role check constraint permits 'owner' and 'tournament_admin'; the current_user_role() helper returns 'owner' for the owner.
- Migration ledger contains Series 3 registration creation and access migrations through 20261114013241; the proposed capacity/waitlist migration is not present.
No production rows, policies, grants, schema, or settings were changed during this review.

## Feature-branch implementation
Repository: Omidso82/Plato-land-preview
Branch: feature/series3-admin-workspace-registration-waitlist-20261115
Draft PR #178: https://github.com/Omidso82/Plato-land-preview/pull/178

Files changed:
- supabase/migrations/20261115120000_series3_registration_capacity_waitlist.sql
- src/Series3RegistrationControls.tsx
- src/Series3RegistrationReport.tsx
- src/Series3Registration.tsx
- src/Series3Gallery.tsx
- src/Series2SlidesManager.tsx
- src/Series3SeedingManager.tsx

Current behavior in draft:
- Existing rows are classified oldest-first; first 32 main, later rows waitlist. IDs and created_at values are retained.
- New public submissions use an advisory-lock serialized RPC, validate Plato ID format and duplicates, and assign main/waitlist status.
- Once the configured replacement cutoff has passed, new requests remain waitlisted even if a main player later withdraws.
- Public form reflects registration open/closed state; database RPC independently rejects submissions while closed. If the status RPC is unavailable or settings are missing, the public gallery and registration page now show a safe error instead of remaining indefinitely in a loading state; submission remains blocked.
- Owner can open/close registration and configure a separate replacement cutoff.
- Owner report separates main roster, FIFO waitlist, and withdrawn records.
- Owner can record withdrawal. If cutoff is configured and not yet passed, the earliest waitlist record is promoted. If cutoff is missing, the RPC rejects the withdrawal operation rather than silently leaving an unfilled main place.
- An append-only event table records initial allocation, later submissions, withdrawals and promotions. Event rows are retained separately from current status so promotion does not erase earlier waitlist history. Existing registrations receive an initial allocation event using their original created_at timestamp. The event table uses ON DELETE RESTRICT.
- Seeding stats are restricted to the current main roster.
- Rule count remains 17; Series 2 legacy content is not changed.

## Source review findings and fixes
Two material SQL defects were found by comparing the draft against the live schema and approved timing rule:
1. The live plato_id_normalized column is GENERATED ALWAYS. The initial draft attempted to insert into that generated column, which PostgreSQL would reject. The draft INSERT was corrected to omit that column and let PostgreSQL generate it.
2. The initial draft could assign a new submission to the main roster after the replacement cutoff if a player had withdrawn. The allocation condition now keeps post-cutoff submissions in the waitlist.
3. Withdrawal now requires a configured replacement cutoff before changing the roster. This prevents an unset cutoff from creating an unfilled main slot with no eligible automatic promotion.
4. Browser datetime-local display was corrected to convert stored UTC timestamps into local wall-clock values before populating the control.

## Security review notes
- Proposed migration revokes direct INSERT from anon and authenticated and drops the current public insert policy; the browser form must submit through the validated RPC.
- Owner-only RPCs check auth.uid() against public.user_roles. Existing live role constraint permits 'owner' (and 'tournament_admin'), not the literal 'مالک کل'; the owner check therefore relies on the valid 'owner' value.
- RPCs use SECURITY DEFINER with empty search_path and fully qualified application/auth objects. PUBLIC execute is revoked and grants are re-applied only to the intended roles. Public status and submission RPCs are intentionally callable by anon/authenticated; owner mutations are authenticated-only and verify the owner role in the function body.
- The migration still requires independent SQL/runtime review and execution in a genuinely disposable isolated PostgreSQL/Supabase environment before production approval. Neither existing Supabase project is assumed to be disposable.
- The event history table is owner-readable only; no direct anon/authenticated INSERT, UPDATE or DELETE grants are provided. Writes are performed inside the validated database functions.
- The current Security Advisor snapshot reports existing findings on unrelated tables/functions and leaked-password protection. These were not changed and are not represented as caused or fixed by this Series 3 branch.

## Verification status
- GitHub Actions verify run for commit 36738bbefa724816db89c59d631c514301064a0b completed successfully, including TypeScript, Vite build, existing Deno tests and Edge Function typecheck.
- A newer verify run for commit 44c0d0cf74849535323cac6e97dc1bcbe00973b8 had TypeScript and Vite build steps complete successfully; Deno setup/tests were still in progress at last inspection. Final conclusion must be refreshed before release.
- The workflow "Deploy PLATO LAND website" was inspected at .github/workflows/deploy-preview.yml. On pull_request it builds and uploads a GitHub Pages artifact; its deploy job has the explicit condition github.ref == 'refs/heads/main', so the PR run does not deploy to platoland.org. The separate Cloudflare Pages check is a branch preview check, not a production release.
- No SQL runtime tests have been run against a migrated database.
- No iPhone/Safari QA has been performed against the new registration/waitlist flow.
- No production migration, main merge, or production release has been performed.

## Remaining blockers
1. Complete latest CI and establish the exact target/behavior of the workflow named "Deploy PLATO LAND website" before any release action.
2. Run migration and RPC tests only in an explicitly authorized disposable isolated environment; do not use either existing Supabase project as an assumed test DB.
3. Validate grants, RLS, SECURITY DEFINER behavior, role checks, duplicate submissions, capacity concurrency, registration closure, FIFO queue, withdrawal and cutoff cases.
4. Review recovery/rollback strategy and test append-only event-history creation, owner-only reading and retention.
5. Perform iPhone/Safari visual and functional QA after a safe preview is available.
6. Present final SQL, exact production impact and test evidence for explicit user approval before applying it to the primary Supabase project.
7. Merge/deploy only after the required approval and verified checks.

## Version history
- v0.1 — 2026-11-15: Initial implementation draft.
- v0.2 — 2026-11-15: Adds review against current primary schema and approved source documents; records generated-column and post-cutoff allocation fixes; adds separate main/waitlist/withdrawn owner report and withdrawal control; clarifies remaining security, CI, runtime-test and release blockers.
- v0.3 — 2026-11-15: Adds append-only registration event history and deletion protection; confirms the GitHub Pages workflow does not deploy PR builds to the production domain; records latest CI as pending for the new SQL/history commit.\n- v0.4 — 2026-11-15: Adds explicit public status-RPC failure/missing-settings messages to the Series 3 gallery and registration route; prevents an indefinite loading message when the migration is not yet present or the status endpoint fails.\n- v0.5 — 2026-11-15: Prevents an already-configured replacement cutoff from being cleared to NULL, which could otherwise reopen main-roster allocation after the replacement window had been set.
