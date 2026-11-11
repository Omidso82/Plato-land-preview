# PLATO ID Scanner — OCR Architecture and Dispatcher Contract

**Document version:** 0.1  
**Date:** 2026-11-12  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Status:** Design/source review only. No OCR runtime installed, no images processed, no migration applied, no deployment.

## 1. Binding product goal

The approved workflow is batch image-to-Plato-ID extraction:
1. An approved operator or owner uploads one or more images.
2. Each image remains an independent, immutable upload record.
3. A dedicated OCR backend extracts multiple candidate strings from each image.
4. The original image and extracted candidates are displayed together.
5. A human corrects and confirms the canonical list.
6. The same reviewed canonical result is used for reports and the manually initiated Telegram output.
7. Later corrections create a new report revision; previous revisions remain auditable.

This is not player identity/profile scanning.

## 2. Binding privacy and runtime decision from source documents

The current source basis is:
- `PLATO_ID_SCANNER_EXISTING_INFRASTRUCTURE_OCR_FEASIBILITY_v0.2_2026-11-11.docx`
- `PLATO_ID_SCANNER_GITHUB_ACTIONS_OCR_FEASIBILITY_v0.2_2026-11-11.md`
- `PLATO_ID_SCANNER_HANDOVER_v1.0_2026-11-11.docx`
- `PLATO_ID_SCANNER_IMPLEMENTATION_STATUS_v1.2.md`
- `PLATO_ID_SCANNER_QA_REPORT_v1.4.md`
- `PLATO_ID_Scanner_Design_Decisions_v0.4_2026-11-11.docx`

Binding constraints:
- Do not transfer private scan images to GitHub-hosted runners or third-party OCR SaaS.
- Supabase Edge Functions are the control plane/system of record, not the PaddleOCR inference host.
- The target OCR direction is a separate isolated worker on a machine controlled by PLATO LAND, with a supported and pinned Python/PaddleOCR/PaddlePaddle runtime and sufficient memory.
- A self-hosted runner/host requires a separate security and ownership assessment and explicit approval before registration/provisioning.
- Installing packages, downloading model weights, registering a runner, creating secrets, provisioning hosting, or incurring cost requires separate approval.
- Supabase remains the single system of record. The OCR worker must not become a second database or decide canonical player identity.
- The OCR worker must never approve IDs or send Telegram messages.

Google Vision code currently present on the feature branch is dormant/unapproved source and is not the approved processing route. Do not invoke it with real images or configure it for production.

## 3. Current local feasibility check — 2026-11-12

Observed in the available execution environment:
- Python: 3.13.5.
- Python 3.12 executable: not available.
- Docker executable: not available.
- `paddleocr`: not installed.
- `paddle`: not installed.
- `pytesseract` and OpenCV are installed.
- No package installation, model download, image transfer or OCR execution was performed.

Therefore, the supported isolated PaddleOCR prototype cannot yet be run here. The next step requiring a controlled host/runtime is blocked pending explicit approval for the chosen owner-controlled machine and package/model installation.

## 4. Current frontend source findings

File: `src/PlatoIdScannerApp.tsx`.

Verified source behavior:
- The upload handler validates each selected file and uploads it independently.
- It inserts a `plato_id_scanner_uploads` row with `status='uploaded'`.
- It explicitly tells the user that OCR is not connected to a backend yet.
- `ScannerReviewCard` is defined and includes a call to `client.functions.invoke('plato-id-scanner-dispatch', ...)`.
- The current `UploadList` renders `SavedUploadItem`, not `ScannerReviewCard`. Thus the review card and dispatch action are not currently reachable through that list.
- No verified deployed dispatcher/worker path was established by this source review.

Do not describe the current upload UI as OCR-enabled.

## 5. Provider-neutral dispatcher contract

The dispatcher is a trusted control-plane endpoint. It must not run OCR itself and must not receive arbitrary storage paths from the browser.

### Request
- Authenticated Supabase user session.
- One `scan_id` UUID only.
- No client-supplied operator ID, storage path, MIME, byte count, digest, worker ID, status or OCR result is trusted.

### Authorization and validation
1. Require a valid authenticated user.
2. Load the access row server-side and require `status='approved'`, unless the caller is the verified owner.
3. Load the upload row by `scan_id`.
4. Require owner access or exact `upload.operator_id = auth.uid()`.
5. Require an eligible upload state; initially only `uploaded` (and a separately specified safe retry state) may enqueue.
6. Derive the storage path only from the database row.
7. Verify the object exists in the private Scanner bucket.
8. Read/stream the object in the trusted backend and verify actual byte size, allowed MIME, file signature and SHA-256 against the upload metadata/expected digest contract.
9. Enqueue idempotently using a trusted server-side database operation. Never expose queue-table write privileges or service-role credentials to the browser.
10. Return only a safe job identifier and state; do not return signed URLs, secrets, image bytes or raw OCR data.

### Idempotency and concurrency
- At most one active logical OCR job per immutable upload, unless a separately audited reprocess revision is explicitly designed.
- Repeated dispatch requests must return the existing active job rather than create duplicate work.
- Lock or use an atomic unique constraint to avoid simultaneous duplicate enqueue.
- The worker must claim jobs atomically with a lease and attempt identity.
- Stale callbacks must be rejected by job ID, attempt, worker identity and source digest.
- A changed source digest must never reuse an old OCR result.

### Worker boundary
- The isolated PLATO-controlled worker obtains only a narrowly scoped job.
- It fetches only the exact private object through short-lived authenticated access.
- It verifies SHA-256 again before OCR.
- It returns provider-neutral raw text, candidate values, confidence and geometry plus job/scan/digest metadata.
- It has no Telegram credentials and no broad owner/admin database permissions.
- It cannot approve or canonicalize candidates.

### Result callback
- Authenticate the worker independently of browser sessions.
- Validate job ID, scan ID, attempt, lease, source digest and response contract.
- Persist output as provisional `needs_review`.
- Store safe error codes only; never log image bytes, signed URLs, tokens, raw private text or provider payloads.
- Human review remains the only path to canonical IDs.

## 6. Extraction and review constraints

- Preserve the original image as evidence.
- Preserve raw OCR spelling and case.
- Exact duplicate removal only; no fuzzy deduplication.
- Never auto-substitute O/0, I/l/1 or punctuation.
- The extraction parser must follow the separately approved @-boundary rule; do not invent a Plato ID validation regex.
- Low-confidence, ambiguous or incomplete candidates remain visible for human review.
- OCR output is never an approved/canonical list.

## 7. Queue migration and release boundary

The queue migration remains a draft in the feature branch. The recent source-only correction to JWT role checks and terminal handling of expired final attempts has not been executed or PostgreSQL-tested.

Before any production use:
- complete SECURITY DEFINER, grants, RLS, search_path and state-transition review;
- test concurrency, retry, lease expiry, stale callback, duplicate enqueue and changed digest in an explicitly approved isolated PostgreSQL environment;
- test operator/owner authorization and private Storage access using the approved RLS test plan;
- obtain separate approval before applying any migration to the primary Supabase project.

No production database write, migration, Edge Function deployment, GitHub merge, production deployment or Telegram send is authorized by this document.

## 8. Next safe work

1. Continue source-only review of the upload schema, authorization helpers, Storage policies and current UI integration.
2. Prepare tests for the dispatcher contract with mocked storage/database boundaries; do not connect them to production.
3. Make the review UI reachable only after a complete trusted backend contract exists; display OCR output as `needs_review`.
4. Identify the proposed PLATO-controlled host and assess ownership, isolation, OS, disk encryption, network egress, maintenance and availability.
5. Request explicit approval for Python 3.12 environment setup, PaddleOCR/PaddlePaddle installation and model download on that host.
6. Benchmark against the manually labelled screenshot set: exact-ID precision/recall, false positives, preservation of @/case/underscore/punctuation, latency and peak RAM.
7. Only after the prototype passes, evaluate hosting cost and deployment. Keep production migration, runner registration, deployment, merge and Telegram delivery separately gated.

## 9. Version history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-12 | Establishes provider-neutral dispatcher contract and corrects OCR runtime/privacy direction to isolated PLATO-controlled PaddleOCR worker. |
