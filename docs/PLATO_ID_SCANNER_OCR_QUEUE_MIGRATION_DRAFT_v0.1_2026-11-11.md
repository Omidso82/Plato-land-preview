# PLATO ID Scanner — OCR Queue and Lease Migration Draft
**Version:** 0.1  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Status:** Draft only; not applied to Supabase  
**Branch:** `feature/plato-id-scanner-v0-1`

## Why this stage exists
The upload UI currently stores immutable operator-uploaded images with status `uploaded`, but there is no durable OCR queue. The Vision client alone cannot be connected safely until jobs can be claimed atomically and results accepted idempotently.

## Draft migration
`supabase/migrations/20261111000300_plato_id_scanner_ocr_queue_DRAFT.sql`

Adds:
- one OCR job per scan, with queued/processing/succeeded/failed states;
- bounded retry count and availability time;
- lease expiry and worker identity;
- SHA-256 of the exact source object;
- append-only attempt records with processing/result/failure evidence;
- atomic `FOR UPDATE SKIP LOCKED` claims;
- fencing by attempt number, worker identity, lease validity and source hash;
- service-role-only claim/complete/fail RPCs;
- provisional result persistence to `plato_id_scanner_uploads` as `needs_review`, never automatic approval.

No automatic enqueue trigger is included. A trusted dispatcher must first validate the approved operator, upload ownership, private object, MIME/size and source digest. This prevents an arbitrary browser from creating work or selecting a provider/object path.

## Safety validation
A static Deno test checks that:
- browser roles have no queue table privileges;
- claim/complete RPC execution is service-role-only;
- claims use skip-locked row locking;
- stale callbacks are fenced by lease, worker, attempt and SHA-256;
- each claim creates an attempt audit record;
- enqueue remains under trusted dispatcher control.

The test is included in the branch verification workflow.

## Boundaries
- This SQL is a draft on the isolated feature branch only.
- It has not been applied to the primary Supabase project.
- No production tables, buckets, policies, functions, or data were changed.
- No GCP project, credentials, API, billing, image transfer or live OCR call was made.
- No Telegram send, merge or deployment was performed.

## Next sequence
1. Finish CI verification of the client and queue contract.
2. Implement a trusted dispatcher that accepts only an authenticated scan ID, verifies operator approval/ownership and hashes the stored object before enqueue.
3. Implement a backend worker that claims jobs, obtains a short-lived Google access token from a server-only service identity, calls the EU endpoint, and completes/fails the fenced job.
4. Add an operator-side “پردازش OCR” action that invokes only the dispatcher for that operator's uploaded scan; no image input from Telegram members.
5. Before production activation, owner approval is required for applying the migration to the primary Supabase project and for configuring the Google service identity/API/billing limits. Do not substitute the other Supabase project.
