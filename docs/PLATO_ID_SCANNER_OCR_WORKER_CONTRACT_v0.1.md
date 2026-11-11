# PLATO ID Scanner — Provider-Neutral OCR Worker Contract

**Version:** 0.4  
**Date:** 2026-11-11  
**Status:** Engineering contract proposal; no runtime/provider selected  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only  
**Branch:** `feature/plato-id-scanner-v0-1`

## 1. Purpose and non-goals

Define the boundary between the Scanner application, a future independent OCR worker, and the canonical database record without committing to a hosting vendor or OCR engine.

This contract does not implement a worker, queue, database migration, Storage bucket, provider integration, Telegram delivery, or production configuration. It does not authorize sending images to an external service.

## 2. Existing source-of-truth record

The current draft table is `public.plato_id_scanner_uploads`. Its immutable source-image locator is `storage_path`; the primary record identifier is `id`; ownership is `operator_id`. The existing draft status values are:

- `uploaded`
- `queued`
- `processing`
- `needs_review`
- `completed`
- `failed`

The current upload UI inserts only `uploaded` records and an empty `ocr_result`. It does not enqueue work. The current migration grants operators SELECT/INSERT on upload metadata, not UPDATE. Therefore queue claiming and result persistence must be performed by a trusted backend/database mechanism, never by an operator browser session.

## 3. Processing boundary

### 3.1 Dispatch request

A trusted dispatcher may enqueue a scan only after verifying:
- the upload row exists;
- its object exists in the private `plato-id-scans` bucket;
- the operator remains approved, or the requester is an authorized owner;
- the scan is in `uploaded` or an explicitly retryable `failed` state;
- the source object passes server-side byte signature, decode, size and dimension checks.

The browser must not supply a worker URL, provider name, credentials, arbitrary Storage path, or Telegram destination.

### 3.2 Worker input (logical schema)

```json
{
  "contract_version": "1",
  "job_id": "uuid",
  "scan_id": "uuid",
  "attempt": 1,
  "source": {
    "bucket": "plato-id-scans",
    "object_key": "authenticated-user-uuid/scan-uuid/safe-file-name",
    "content_type": "image/jpeg",
    "sha256": "hex-digest"
  },
  "requested_at": "RFC3339 timestamp"
}
```

The object key must contain exactly three path segments: operator UUID, the same `scan_id` UUID carried by the job, and a filename matching `[A-Za-z0-9_-]{1,100}` plus a lowercase `.jpg`, `.png` or `.webp` extension. The extension must match `content_type` exactly (`image/jpeg` → `.jpg`, `image/png` → `.png`, `image/webp` → `.webp`). Extra path segments, traversal-like segments, spaces, non-ASCII filename characters, unsupported extensions and backslash separators are rejected by the worker validator. The worker receives only a short-lived, single-object read capability or an equivalent narrowly scoped internal access method. It must not receive a reusable service-role key.

### 3.3 Worker result (logical schema)

```json
{
  "contract_version": "1",
  "job_id": "uuid",
  "scan_id": "uuid",
  "outcome": "succeeded",
  "engine": {
    "name": "engine identifier",
    "version": "engine version",
    "model_version": "optional model identifier"
  },
  "source_sha256": "hex-digest",
  "raw_text": "verbatim OCR text",
  "candidates": [
    {
      "raw_value": "verbatim candidate",
      "confidence": 0.0,
      "geometry": null,
      "flags": ["low_confidence", "confusable_character"]
    }
  ],
  "started_at": "RFC3339 timestamp",
  "finished_at": "RFC3339 timestamp"
}
```

Confidence is the engine's score, not a guaranteed probability. If the engine cannot provide confidence or geometry, use null; do not fabricate values. Keep raw OCR text and raw candidate strings unchanged.

### 3.4 Failure result

A failed job records a stable machine-readable `error_code`, a safe operator-facing message, retryability, attempt number and timestamps. Do not store credentials, signed URLs, image bytes, stack traces containing secrets, or raw access tokens in user-visible records.

## 4. Canonical processing rules

1. The original uploaded object is immutable; processing never replaces it.
2. The source SHA-256 must match the object processed. A mismatch fails closed.
3. One `scan_id` has one canonical current OCR result, with prior processing attempts retained in an append-only attempt/audit history.
4. Job delivery is at-least-once; processing and result acceptance must be idempotent by `job_id` and `scan_id`.
5. A duplicate callback with the same job/result identity must not create duplicate candidates, corrections, reports, or Telegram sends.
6. Exact duplicate candidate strings may be deduplicated while preserving their source positions/occurrences in audit metadata.
7. Confusable characters (O/0, I/l/1), underscore/hyphen, low confidence, overlapping text, and uncertain boundaries must be flagged for human review.
8. No fuzzy merge, automatic character substitution, or inferred completion of an ID is permitted.
9. A parser must not be implemented until canonical Plato ID syntax is confirmed from an authoritative project source. Until then, candidates remain raw strings.
10. A correction creates a new immutable audit event containing prior value, corrected value, actor, timestamp and reason. It never overwrites the original OCR output.
11. Scanner UI and later Telegram reporting consume the same persisted canonical result; Telegram must not run a second OCR pass.

## 5. State transitions

Allowed logical transitions:

- `uploaded -> queued`: trusted dispatcher after eligibility and object validation.
- `queued -> processing`: worker claims job using an atomic claim/lease.
- `processing -> needs_review`: OCR completed but one or more candidates require human review.
- `processing -> completed`: OCR completed and no review flags remain under the approved review policy.
- `queued|processing -> failed`: terminal or exhausted processing failure.
- `failed -> queued`: explicit retry by trusted owner/dispatcher, preserving prior attempt history.
- `needs_review -> completed`: authorized human review/correction is finalized and audited.

A stale worker lease may be reclaimed only after its lease expires; the old worker's late callback must be rejected by fencing/attempt identity. Operators cannot directly mutate status or OCR result.

## 6. Security and privacy requirements

- Backend-only credentials, least privilege, rotation and no secrets in frontend bundles.
- Per-job, short-lived access to exactly one private object.
- Authenticated worker callbacks, request signing or equivalent service authentication, replay protection and idempotency.
- Server-side file signature, MIME, decode, dimensions and size validation; browser preflight is only defense in depth.
- Enforce current operator approval and ownership at dispatch time.
- Avoid logging image content, OCR payloads, signed URLs, tokens or personal data beyond operational necessity.
- Keep the Telegram test destination fixed server-side and outside the worker's caller-controlled input.
- Apply retention, deletion and audit policy only after owner decisions are recorded.

## 7. Operational requirements before implementation

- Identify and verify an existing PLATO LAND-controlled container/worker runtime, or obtain explicit approval to evaluate a named managed provider.
- Benchmark authorized representative images for exact-match precision, missed IDs, false candidates, latency, memory and cost.
- Confirm canonical Plato ID syntax from authoritative source material.
- Decide retry limits, lease duration, concurrency, retention and deletion policy.
- Define correction approval, review completion and daily/weekly report finalization policies.
- Add contract tests for schema validation, invalid signatures, hash mismatch, duplicate callbacks, stale leases, retries, ambiguity flags and audit immutability.

## 8. Contract validation code and tests
The provider-neutral shape validators are implemented in `supabase/functions/_shared/plato-id-scanner-contract.ts`. They validate job, success and failure envelopes without parsing or modifying Plato ID candidate strings. Eight Deno test cases are in `supabase/functions/_shared/plato-id-scanner-contract.test.ts`; timestamp negatives include impossible calendar dates, invalid clock values and offsets beyond ±14:00; path cases explicitly reject scan-ID mismatch and nested extra path segments, and the feature-branch verification workflow runs this test file. Worker object-key validation now mirrors the SQL/UI safe-filename contract and rejects MIME/extension mismatches. Tests also cover whitespace and non-ASCII filenames, unsupported extensions and content-type/extension mismatch. These validators do not perform OCR, authenticate a worker callback, access Storage, claim jobs, persist results or provide runtime security by themselves.

## 9. Explicitly not authorized / not done

No runtime or OCR provider has been selected. No worker, queue, new table/column, migration, bucket, secret, operator account, external OCR request, Telegram send, production deployment or main-branch change has been created by this document.


## 10. Version history

| Version | Date | Change |
|---|---|---|
| 0.3 | 2026-11-11 | Previous provider-neutral contract and validators |
| 0.4 | 2026-11-11 | Aligns worker filename and MIME-extension validation with the Scanner upload/storage contract |
