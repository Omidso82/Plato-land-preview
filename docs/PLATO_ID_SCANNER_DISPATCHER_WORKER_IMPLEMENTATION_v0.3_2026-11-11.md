# PLATO ID Scanner — Dispatcher and Worker Implementation

**Version:** 0.3  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Draft, open, unmerged

## 1. Implemented on the feature branch

### 1.1 Authenticated dispatcher
Edge Function: `supabase/functions/plato-id-scanner-dispatch/index.ts`

- Requires an authenticated, email-confirmed Supabase user.
- Checks the existing `user_roles` record for owner privileges; otherwise requires an approved Scanner operator record.
- Accepts only a `scan_id`; the browser cannot choose a bucket, Storage path, provider, OCR endpoint, credential or Telegram destination.
- Reads the upload row from the primary project configured for the function.
- Non-owner operators can dispatch only their own uploads.
- Downloads the original from the fixed private `plato-id-scans` bucket.
- Validates owner/scan path segments, safe filename, declared and actual size (maximum 15 MiB), supported MIME, byte signature, and extension/MIME match.
- Computes SHA-256 from the downloaded bytes and passes only scan ID plus digest to a service-role-only atomic enqueue RPC.
- Returns HTTP 202 after queue insertion. If the worker secret is configured, it makes a server-to-server invocation of the worker; otherwise the job remains queued. Queue acceptance is never represented as OCR completion.

### 1.2 Shared object validation
Files:
- `supabase/functions/_shared/plato-id-scanner-dispatch-validation.ts`
- `supabase/functions/_shared/plato-id-scanner-dispatch-validation.test.ts`

The helper validates the immutable Storage locator and source bytes, detects JPEG/PNG/WEBP signatures, and computes SHA-256. Tests cover valid images, unsupported bytes, unsafe/nested/foreign paths, size mismatch, MIME/extension mismatch and a known SHA-256 digest.

### 1.3 Atomic enqueue RPC
Added to the draft-only queue migration:
`public.enqueue_plato_id_scanner_ocr_job(uuid,text)`

- Service-role-only.
- Locks the upload row.
- Accepts only eligible uploaded/queued rows.
- Inserts one queue job per scan (unique scan ID).
- Rejects a digest mismatch against an existing job.
- Moves an uploaded record to queued in the same transaction.
- Does not create a retry path that silently changes the immutable source digest.

The migration remains a draft and has not been applied.

### 1.4 Secret-gated OCR worker
Edge Function:
`supabase/functions/plato-id-scanner-worker/index.ts`

- Requires a private worker secret header.
- Requires Supabase service-role configuration and a Google service-account JSON secret before it claims any jobs.
- Obtains a short-lived Google OAuth access token using a service-account JWT.
- Claims one job with a 180-second lease.
- Downloads the source object from the fixed private bucket, revalidates bytes and SHA-256, and rejects a mismatch.
- Sends the image only to the fixed Google Vision EU endpoint through the previously tested client.
- Converts raw OCR text through the already-tested exact @-based extractor and duplicate audit, then persists both provider evidence and the UI-ready provisional `ids`, `extraction_candidates` and `duplicate_audit` fields using the fenced completion RPC; human review remains authoritative.
- Uses the failure RPC for retryable/non-retryable job failures.
- Processes at most one job per invocation. The dispatcher invokes it once per scan when the shared worker secret is configured; a trusted scheduler is still needed to drain any backlog or retryable queued jobs that remain.

No Google credentials have been configured; no image has been sent to Google.

### 1.5 Manager UI
The review card now exposes a “شروع پردازش OCR” action for uploads in uploaded/queued state. It invokes the authenticated dispatcher and displays the returned response. The feature cannot operate against production until the draft migration is reviewed/applied and the Edge Functions are deployed/configured.

## 2. Required server-side secrets (not configured)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLATO_SCANNER_WORKER_SECRET` — long random secret, only for the trusted worker caller
- `GOOGLE_VISION_SERVICE_ACCOUNT_JSON` — service account restricted to the minimum Vision API scope

Do not put any of these values in frontend code, GitHub source, client storage, or logs. The service account must be created in a Google Cloud project only after owner approval of project/account/API, data processing and billing limits.

## 3. Current verification state

- Prior workflow run `43035672447` passed typecheck, build and the then-current tests after the Deno read-permission fix.
- Prior deploy workflow run `43035672418`: build/upload preparation succeeded; the actual deploy job was skipped because this was a pull request. No production release is claimed.
- The later dispatcher/worker commits triggered a new verification run; final result must be checked against the current PR head before this implementation can be called CI-verified.
- No live database migration, Storage mutation, secret configuration, Google OCR request, Telegram send, merge or production deployment was performed.

## 4. Approval gates (still closed)

Explicit owner approval is required before:
1. Applying the Scanner foundation/review/queue migrations to the primary Supabase project.
2. Creating/configuring Google Cloud project, service account, Vision API and any billing/usage cap.
3. Storing worker and Google credentials in Supabase Edge Function secrets.
4. Sending any real screenshot to Google Vision, even at the EU endpoint.
5. Deploying Edge Functions or changing production Storage/DB state.
6. Merging PR #123 or deploying the site.
7. Sending Telegram messages.

## 5. Remaining engineering tasks before first production pilot

- Confirm current PR head and complete CI; fix any failures.
- Add worker tests for OAuth JWT construction, secret gate, queue claim/fencing and provider failure handling using mocks only.
- Add a safe worker invocation mechanism (scheduler or owner-only manual trigger) after secrets are configured; no GitHub Actions image worker.
- Review queue migration against the live primary schema without applying it.
- Review scanner upload and review flows for end-to-end status consistency.
- Add operational limits, concurrency policy, retention and error monitoring.
- Only after all code checks pass, present the migration and cloud setup as explicit approval steps.

## 6. Version history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-11 | Initial worker contract and provider-neutral design |
| 0.2 | 2026-11-11 | Google Vision client and queue migration draft |
| 0.3 | 2026-11-11 | Authenticated dispatcher, strict source validation, atomic enqueue RPC, secret-gated EU Vision worker and manager UI action |
