# PLATO ID Scanner — Dispatcher and Worker Implementation

**Version:** 0.5  
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
- Reads the upload row from Supabase and enforces upload ownership for non-owner operators.
- Downloads the original from the fixed private `plato-id-scans` bucket.
- Validates the three-segment owner/scan path, safe filename, declared and actual size (maximum 15 MiB), supported MIME, byte signature, and extension/MIME match. Full server-side image decode and dimension/decompression-bomb validation remain outstanding.
- Computes SHA-256 from the downloaded bytes and passes only scan ID plus digest to a service-role-only atomic enqueue RPC.
- Returns HTTP 202 after queue insertion. If the worker secret is configured, it makes a server-to-server worker invocation; otherwise the job remains queued. Queue acceptance is never represented as OCR completion.

### 1.2 Atomic queue and audit
Draft migration:
`supabase/migrations/20261111000300_plato_id_scanner_ocr_queue_DRAFT.sql`

- Service-role-only atomic enqueue RPC.
- One queue job per scan; immutable source digest binding.
- Atomic `FOR UPDATE SKIP LOCKED` claim and 180-second worker lease.
- Fencing by attempt number, worker identity, lease and source SHA-256.
- Append-only attempt history, including explicit `lease_expired` closure when a lease is reclaimed.
- Bounded retries up to the configured `max_attempts`; failed scans cannot be retried indefinitely.
- Completion stores provisional OCR evidence and moves the upload to `needs_review`; it does not approve IDs.

The migration is a draft only and has not been applied.

### 1.3 Secret-gated OCR worker
Edge Function:
`supabase/functions/plato-id-scanner-worker/index.ts`

- Requires a private worker secret header.
- Requires Supabase service-role configuration and a Google service-account JSON secret before it claims any jobs.
- Claims one job per invocation.
- Downloads the source from the fixed private bucket, revalidates object path, bytes, MIME, size and SHA-256, then calls the fixed Google Vision EU endpoint.
- Uses the exact existing @-based extractor and duplicate audit.
- Persists provider evidence plus UI-ready provisional `ids`, `extraction_candidates` and `duplicate_audit` fields through the fenced completion RPC.
- Human review remains authoritative.
- A trusted scheduler is still needed to drain queued backlog/retry jobs that remain after an invocation.

### 1.4 Google service-account token helper
Files:
- `supabase/functions/_shared/plato-id-scanner-google-service-account.ts`
- `supabase/functions/_shared/plato-id-scanner-google-service-account.test.ts`

- Builds a short-lived RS256 JWT with the fixed Vision scope and fixed Google OAuth token audience.
- Rejects malformed credentials, invalid private keys and token endpoint overrides.
- Uses a mocked fetch in tests; no live token exchange is performed.
- The helper is code preparation only; no service account has been created and no credentials have been configured.

### 1.5 Manager UI
The Scanner review card exposes a “شروع پردازش OCR” action for eligible uploads. It invokes the authenticated dispatcher and displays the response. This feature cannot operate against production until the draft migration is reviewed/applied and the Edge Functions are deployed/configured.

## 2. Current provider status

Google Cloud Vision EU is an engineering POC candidate only, not an approved final production provider. No real screenshot has been transferred to Google. Any Cloud project/API/service-account/billing setup, secret configuration and real image processing require separate explicit approval.

## 3. Latest verified automated checks

GitHub Actions Build and typecheck run `43038690566` for commit `8f98a64325c5d916eaf1cac15c021429cd0c657a`: **completed success**.

Passed:
- npm install, TypeScript typecheck and Vite build.
- All configured Series 2 and Scanner Deno test suites.
- Google Vision adapter/client tests.
- Mocked service-account JWT/token-exchange tests.
- Queue migration static safety tests, bounded retry and expired-lease audit tests.
- Dispatcher private-object validation tests.
- `deno check` for both dispatcher and worker Edge Functions.

Deploy workflow run `43038690681`:
- Build and Pages output preparation: success.
- Actual deploy job: skipped for the pull request.
- No production deployment is claimed.

## 4. Explicitly not done

- No Scanner migration has been applied to the primary Supabase project.
- No Scanner table, private bucket, Storage policy or production record has been created.
- No Edge Function has been deployed to Supabase.
- No worker secret, service-role configuration or Google service-account secret has been set.
- No Google Cloud project/API/service account/billing has been activated.
- No screenshot has been sent to an OCR provider.
- No operator account has been created or approved.
- No Telegram message has been sent.
- No merge, main-branch change or production deployment has occurred.

## 5. Approval gates

Explicit owner approval is required before:
1. Applying any Scanner migration to primary Supabase.
2. Creating/configuring Google Cloud project, service account, Vision API, billing or usage cap.
3. Storing worker and Google credentials in Supabase Edge Function secrets.
4. Sending a real screenshot to Google Vision or another external OCR provider.
5. Deploying Scanner Edge Functions or creating the production Storage bucket/policies.
6. Creating/approving an operator account.
7. Merging PR #123 or deploying the website.
8. Enabling any Telegram send or scheduled delivery.

## 6. Next safe work

Continue source-level review of all Scanner migrations and the full PR diff. Runtime SQL/RLS validation requires a permitted isolated environment; do not apply changes to primary Supabase without explicit approval.

## 7. Version history

| Version | Date | Change |
|---|---|---|
| 0.3 | 2026-11-11 | Initial dispatcher and worker implementation |
| 0.4 | 2026-11-11 | UI-ready provisional result, bounded retry and lease audit |
| 0.5 | 2026-11-11 | Isolated/tested OAuth helper and verified CI for dispatcher, worker and all Scanner tests |
