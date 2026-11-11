# PLATO ID Scanner — Source and Primary Read-Only Audit

**Document version:** 0.2  
**Date:** 2026-11-12  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Related PR:** #123 (keep Draft and unmerged)  
**Status:** Source review and read-only database audit only; no OCR execution, migration apply, deployment, merge, or Telegram delivery.

## 1. Scope preserved

The target remains the batch workflow:
1. Approved operator/owner uploads one or more screenshots.
2. A trusted backend extracts multiple Plato ID candidates from each image.
3. Original evidence and candidates are presented together.
4. Human review/correction determines the canonical list.
5. Only the reviewed result can feed a report; Telegram sending remains a separate manual action and approval boundary.

No player identity/profile lookup is in scope.

## 2. Current primary database audit (read-only)

Project: `dfrppbapaaydbjeflozw`.

Observed on 2026-11-12:
- `public.plato_id_scanner_access` exists, RLS enabled; one row reported by table metadata.
- `public.plato_id_scanner_uploads` exists, RLS enabled; seven rows reported by table metadata.
- Upload table includes `id`, `operator_id`, `storage_path`, `file_name`, `content_type`, `file_size`, `status`, `ocr_result`, timestamps.
- Storage bucket `plato-id-scans` exists and is private.
- Bucket limit is 15 MiB; accepted MIME types are JPEG, PNG and WEBP.
- Current Storage object policies include Scanner-specific owner/approved-operator policies for insert, read and delete.
- Migration history contains `20261111144344`, `20261111164812`, `20261111171636` and `20261111185702`.

These findings supersede older notes that said the Scanner tables and bucket were absent. The audit used read-only metadata/SELECT queries; no database writes were performed.

## 3. Queue migration draft — source review findings

File: `supabase/migrations/20261111000300_plato_id_scanner_ocr_queue_DRAFT.sql`.

The file remains a draft and has not been applied. Findings requiring correction or explicit resolution before runtime validation:
1. RPC service-role guards use deprecated `auth.role()`. Replace with a current, explicit JWT role check supported by current Supabase guidance, and test it with service-role and non-service-role JWTs.
2. Expired jobs are claimable only while `attempt < max_attempts`. If the final allowed attempt expires, the job can remain `processing` indefinitely. Add an atomic terminal-expiry transition that marks the attempt and job failed and updates the upload consistently.
3. The queue draft assumes the already-existing upload table/status contract. Revalidate every status transition against the live table check constraint and current upload lifecycle before treating this as deployable.
4. Validate the SECURITY DEFINER function surface, grants, schema exposure, search_path and service-role-only execution as a single security review.
5. Validate retry/backoff, concurrent claim, lease expiry, stale callback fencing, duplicate enqueue, changed source digest and failed-job retry behavior with PostgreSQL tests in an explicitly approved isolated environment.

No migration was executed, parsed by PostgreSQL, or applied as part of this review.

## 4. OCR provider and privacy boundary

The feature branch contains Google Vision client/adapter/worker source. However, the current project handover and feasibility records prohibit sending private scan images to GitHub-hosted runners or third-party OCR SaaS, and state that OCR provider/hosting selection requires a separate privacy, architecture and cost approval. Therefore:
- Treat the Google Vision implementation as dormant/unactivated source, not an approved live processing route.
- Do not send any real image to Google Vision.
- Do not enable billing, create additional secrets, configure a runner, deploy an OCR worker, or process jobs.
- Evaluate a PLATO-controlled processing runtime only after its machine, security boundary, operating ownership and cost are assessed and approved.

## 5. Source-level issues found

- The Google Vision client now expects `apiKey`, but its existing client test still passes `accessToken` and expects a Bearer Authorization header. The test is stale relative to the current client contract and needs to be updated before any provider-specific CI claim.
- The adapter throws generic Error objects with stable `code` properties for provider/empty-result failures, while the worker classifies only `GoogleVisionRequestError` as provider errors. These adapter errors can be flattened to a generic worker failure and lose retryability classification.
- No completed end-to-end dispatcher-to-queue-to-worker-to-review UI path was verified in this audit. The upload UI must not imply that upload automatically means OCR has run.
- No real OCR result or human-reviewed canonical result was created.

## 6. Verification and release boundary

- Primary database checks: read-only and successful for the listed objects/metadata.
- No OCR request made; no private image bytes read or transferred.
- No queue migration applied; no database write.
- No Edge Function deployment.
- No GitHub merge or production deployment.
- No Telegram message sent.
- CI for the current provider-specific client changes was not established by this audit.

## 7. Next safe work

1. Keep provider activation paused pending the privacy/runtime decision.
2. Correct and statically review the queue draft, including terminal lease expiry and service-role authorization.
3. Design the trusted dispatcher against the live Scanner upload/access schema and policies.
4. Add tests for queue state transitions and dispatcher authorization without touching production data.
5. Connect the UI only when the backend path is complete; display all OCR output as `needs_review`.
6. Run PostgreSQL/RLS/Storage tests only in an explicitly authorized disposable environment.
7. Before any production migration, Edge Function deployment, paid provider activation, merge, or Telegram send, obtain the required separate approval.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-12 | Records live read-only primary audit, queue draft risks, provider/privacy boundary and source-level mismatches. |
| 0.2 | 2026-11-12 | Records source-only queue hardening: current JWT role guards and terminal handling for expired final attempts. PostgreSQL runtime validation remains outstanding. |
