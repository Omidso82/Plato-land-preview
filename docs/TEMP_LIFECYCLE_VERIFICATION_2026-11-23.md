# PLATO LAND Temporary Projects — lifecycle implementation verification
Date: 2026-11-23 | Scope: development branch and additive primary-Supabase objects only

## Verified facts
- Primary project: dfrppbapaaydbjeflozw.
- Canonical registry: Series 3 = started / registration closed; Series 4 = planned / not_open; Series 5 = planned / not_open.
- Series 3 group results: 72 resolved rows (70 completed, 2 double_no_show); knockout match results: 0; third-place playoff: 0.
- Series 3 bracket snapshot has round32, round16, quarterfinals, semifinals, final and thirdPlace keys; existence of a bracket does NOT prove final results.
- Series 4 group and knockout results: 0.
- Internal lifecycle tables: evidence 0, transitions 0, archive holds 0.
- Owner RPCs for overview, readiness and restore: anonymous EXECUTE revoked; authenticated EXECUTE permitted with server-side owner checks.
- Archive RPC: anonymous and authenticated EXECUTE revoked; service_role EXECUTE granted.
- No scheduler, automated evidence issuer, automatic result approval or production deployment.
- No series lifecycle or registration status changed.

## Security advisor
- INFO: internal RLS tables have no policies (intentional deny-all for direct client access).
- WARN: owner-facing SECURITY DEFINER RPCs are executable by authenticated role; intentional entry points with auth.uid() and public.current_user_role() = owner checks, but require real authenticated-user negative/positive integration tests before release.
- Readiness RPC always reports ready_for_archive=false until source-specific final verification and explicit approval are implemented; conservative by design.

## Implementation limitations and release blockers
1. Authoritative stage-by-stage source verification must validate each series' bracket and actual final/third-place results, not just fixture counts.
2. Trusted evidence issuance and independent final-approval process must be implemented; currently evidence table is empty and no workflow inserts evidence.
3. A trusted server scheduler/job must invoke service-role archive gate only after the above steps.
4. Run build/typecheck and owner/unauthorized-user end-to-end tests; neither is yet verified.
5. Review security-definer RPCs and transaction idempotency with real user JWTs.
6. No merge or deployment to production without separate owner authorization.

## Version control
Branch: feature/temp-lifecycle-autoarchive-20261123.
Implementation files include src/temporaryLifecycle.ts, src/temporaryLifecycleSeriesPreflight.ts,
src/TemporaryLifecycleOwnerPanel.tsx, src/Series2SlidesManager.tsx, and docs/sql/*.
Separate project scope; do not alter Main Website.

## Additional verified source coverage (2026-11-23)
- Series 3 public bracket contains 16 round32 + 8 round16 + 4 quarterfinals + 2 semifinals + 1 final = 31 expected knockout matches, with 31 distinct match IDs.
- Match-ID-and-stage joined completed result coverage is 0/31. Third-place result remains absent.
- Readiness RPC now reports expected bracket count and draw existence; UI displays these counts without declaring completion.
- This is a **blocking** preflight, not an official result approval or evidence issuance.

## Verified execution and hardening — continuation
- Compiled the pure lifecycle TypeScript modules with TypeScript 5.8.3 and executed all 22 assertions in Node 22.16.0: **PASS 22/22**. This is a focused local test, not a full Vite build.
- Tested anonymous execution of archive RPC under database role anon: **permission denied (42501)**.
- Tested owner overview RPC with authenticated role and no owner identity: **owner authorization required (42501)**.
- Tested archive RPC with service_role database role but without service JWT claim: **service role only (42501)**.
- Tested archive RPC with simulated service role claim inside a rollback-only transaction, Series 3 still started: **archived=false, reason=series_not_completed**.
- Owner restore RPC now rejects reusing a correlation ID for a different actor, series, reason or transition.
- System archive RPC now rejects reusing a correlation ID for a different series/evidence/transition.
- Series 3 source fingerprint is derived from the current public bracket, group outcomes, knockout results and third-place result. Archive RPC requires evidence_version to match `series3:<current fingerprint>` before transition. Changed source data therefore invalidates old evidence.
- Archive RPC fails closed for series other than Series 3 until their own source-specific verifiers are implemented.
- No evidence issued, no automatic job configured, no series status changed, no site deployment.

## Remaining validation
- Full React/Vite build unavailable in this runtime (repository cannot be cloned due to network resolution); no claim of complete typecheck.
- Actual signed-in owner/non-owner browser JWT tests and UI tests are still outstanding.
- Evidence issuer, approval flow, and scheduling remain blocked pending source-specific verification and controlled rollout.

## Additional execution and version control
- Added repeatable `npm run test:lifecycle` command using the project's pinned TypeScript dependency, without new packages.
- Verified the isolated runner locally: **PASS 22/22**; it cleans up its temporary compiled files.
- Both restore and archive RPCs now recheck matching correlation IDs after acquiring the series row lock to handle concurrent retries safely.
- Live database state rechecked after migrations: Series 3 started/registration closed; Series 4 and 5 planned/registration not_open; evidence=0, transitions=0, holds=0.
- No production branch merge or website deployment.

## Append-only audit and UI reliability — continuation
- Applied migration `plato_temp_transitions_append_only_20261123`: UPDATE/DELETE triggers now reject modifications to lifecycle_transitions, preserving actor, reason, timestamp, state changes and correlation ID.
- Tested inside a rollback-only transaction by inserting a synthetic transition and attempting UPDATE; received expected SQLSTATE 42501, audit mutation denied. No synthetic transition persisted.
- Tested authenticated role without owner identity calling restore; received SQLSTATE 42501, owner authorization required.
- Owner panel now shows loading state, handles absent Supabase client, disables refresh while loading and distinguishes empty series from loading.
- Post-test database check: Series 3 started/registration closed; Series 4 and 5 planned/registration not_open; lifecycle transitions=0.
- Still no scheduled archive job, no approved evidence writer, no full React build, no merge or publication.

## Strict Series 3 source reconciliation
- Applied internal read-only `plato_temp_internal.series3_completion_preflight()`: checks exact official bracket shape (16+8+4+2+1 knockout matches, 1 third-place match), distinct match IDs, joined completed result coverage, no extra result IDs, group resolution, third-place outcome.
- Live verified output: group_total=72, group_pending=0, expected_knockout=31, matched_knockout=0, extra_results=0, third_place_completed=0, ready_for_approval=false.
- The service archive gate now additionally requires strict source preflight to pass, in addition to fresh approved evidence and fingerprint matching.
- Added owner-only read RPC `plato_temp_owner_series3_completion_preflight()`; authenticated caller without owner identity was denied (42501).
- Existing temporary manager lifecycle panel shows strict reconciliation counts. No new route or standalone page.
- Still missing: owner approval workflow, trusted evidence issuance, automated scheduling, full UI/build verification. Do not claim automatic archiving is live.

## Explicit final approval — continuation
- Installed `public.plato_temp_owner_approve_series3_final(text)` in primary Supabase. Owner identity and exact explicit confirmation token required; series must be marked completed, strict Series 3 source reconciliation must pass, no active archive hold. Only then records/refreshes approved fingerprint-bound evidence; it never changes series lifecycle, registration, bracket, or results.
- The existing owner lifecycle panel displays an explicit confirmation button only when Series 3 is completed and strict preflight passes. Browser confirmation required before invoking RPC.
- Tested authenticated role without owner identity: SQLSTATE 42501, denied.
- Current Series 3 remains started and strict preflight is false (0/31 knockout results); therefore approval is not available, and no evidence was created.
- Scheduler and end-to-end signed-in browser tests remain outstanding. No publication.
