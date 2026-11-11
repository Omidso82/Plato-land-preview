# PLATO ID Scanner — Source, Primary and Runtime Audit

**Document version:** 0.3  
**Date:** 2026-11-12  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Related PR:** #123 remains Draft/unmerged. PR #124 is a separate upload-only integration.  
**Status:** Read-only primary audit and source-only documentation/SQL-draft work. No OCR execution, package/model installation, migration apply, deployment, merge or Telegram delivery.

## 1. Binding target

The target is batch image-to-Plato-ID extraction, human review, versioned reporting and manually initiated Telegram output. It is not single-player identity/profile scanning.

## 2. Corrected OCR architecture and privacy decision

The controlling source documents are the Scanner handover v1.0, Design Decisions v0.4, Implementation Status v1.2, QA Report v1.4, Existing Infrastructure OCR Feasibility v0.2 and GitHub Actions OCR Feasibility v0.2.

They establish:
- Private scan images must not be transferred to GitHub-hosted runners or third-party OCR SaaS.
- Supabase Edge Functions are not suitable for hosting PaddleOCR CPU inference.
- The intended direction is a separate, isolated PaddleOCR worker on a PLATO-controlled machine, using a supported pinned Python/PaddleOCR/PaddlePaddle runtime and sufficient memory.
- Host/runner registration, package installation, model download, secrets, provisioning and paid hosting require separate approval.
- Supabase remains the control plane and system of record. The OCR worker cannot approve IDs or send Telegram messages.

**Correction to the prior v0.1/v0.2 audit notes:** Google Vision API-key code exists on the feature branch because of earlier source work, but this conflicts with the controlling privacy/architecture documents. It is dormant/unapproved and is not the selected OCR route. Do not invoke it with real images, configure it for production or describe Google Vision as approved.

## 3. Primary Supabase read-only audit

Project: `dfrppbapaaydbjeflozw`.

Read-only checks on 2026-11-12 observed:
- `public.plato_id_scanner_access` exists with RLS enabled.
- `public.plato_id_scanner_uploads` exists with RLS enabled; metadata reported seven rows.
- `plato-id-scans` Storage bucket exists, is private, has a 15 MiB limit and allows JPEG, PNG and WEBP.
- Scanner-specific Storage policies currently exist for approved operators/owners for insert, read and delete.
- Migration history contains `20261111144344`, `20261111164812`, `20261111171636` and `20261111185702`.

These findings supersede the older QA/handover snapshot that said Scanner tables and bucket were absent. No write was performed during this audit.

## 4. Queue draft source correction

File: `supabase/migrations/20261111000300_plato_id_scanner_ocr_queue_DRAFT.sql`.

A source-only update was committed:
- Four RPC authorization checks now use the JWT role claim via `(select auth.jwt()->>'role') is distinct from 'service_role'`; deprecated `auth.role()` calls were removed.
- Expired processing jobs at the maximum attempt count are terminalized as failed, the attempt is marked `lease_expired`, lease/worker fields are cleared and the upload is moved to failed.
- Expired jobs below the maximum attempt count remain eligible for reclaim with a new attempt identity.

This is not PostgreSQL runtime validation. The migration remains DRAFT and unapplied. SECURITY DEFINER, grants, search_path, state transitions, concurrency, retries, duplicate enqueue and stale callback behavior still require review and tests in an explicitly approved isolated PostgreSQL environment.

## 5. Current frontend source findings

File: `src/PlatoIdScannerApp.tsx`.

Verified:
- Multi-image upload is sequential and each valid image is saved as its own upload record.
- Upload records are created with `status='uploaded'`.
- The upload handler explicitly states OCR is not connected to a backend.
- `ScannerReviewCard` is defined and contains an invocation of `plato-id-scanner-dispatch`, but the current `UploadList` renders `SavedUploadItem`, not `ScannerReviewCard`; the review card/dispatch action is therefore not reachable through that list.
- A live, deployed dispatcher/worker-to-review path was not verified.

The current interface is upload-only; do not describe it as OCR-enabled.

## 6. Local OCR runtime feasibility — 2026-11-12

Observed runtime:
- Python 3.13.5 only; Python 3.12 executable not available.
- Docker executable not available.
- PaddleOCR and PaddlePaddle packages are not installed.
- Tesseract/OpenCV are present, but prior source feasibility report states the tested Tesseract output was incomplete/incorrect and not production-suitable.

No package installation, model download, OCR run, private image transfer or new service provisioning was performed. The supported PaddleOCR prototype remains blocked until an approved PLATO-controlled host/runtime is identified and separately authorized for installation/model download.

## 7. Source architecture deliverable

Created:
`docs/PLATO_ID_SCANNER_ARCHITECTURE_AND_DISPATCH_CONTRACT_v0.1_2026-11-12.md`

It defines a provider-neutral dispatcher contract:
- authenticated user and approved operator/owner authorization;
- upload ownership verification;
- storage path derived only from the database row;
- object existence, byte size, MIME, file signature and SHA-256 validation;
- idempotent trusted enqueue, no browser queue writes;
- worker lease/attempt fencing and digest validation;
- provisional `needs_review` result only;
- no OCR worker approval or Telegram privileges.

## 8. Release and safety boundary

- No OCR image has been processed.
- No Google Vision request has been made.
- No PaddleOCR package/model has been installed/downloaded.
- No migration has been applied.
- No Edge Function has been deployed.
- No GitHub merge or production deployment has occurred.
- No Telegram message has been sent.
- No new paid service, runner or host has been provisioned.
- CI for the recent source changes was not established by this audit.

## 9. Next work

1. Continue source-only review and tests for dispatcher authorization/idempotency without production connectivity.
2. Keep Google Vision implementation dormant; do not use it as the processing route.
3. Identify a PLATO-controlled host and assess ownership, isolation, encryption, network egress, maintenance and availability.
4. Obtain separate approval before Python 3.12 setup, PaddleOCR/PaddlePaddle installation and model download.
5. Benchmark on a manually labelled screenshot set: exact-ID precision/recall, false positives, preservation of @/case/underscore/punctuation, latency and peak memory.
6. Only after the local prototype passes, evaluate hosting cost and deployment.
7. Keep production migration, runner registration, deployment, merge and Telegram delivery separately gated.

## 10. Version history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-11-12 | Initial read-only audit and queue/source findings. |
| 0.2 | 2026-11-12 | Records queue source-only role-check and expired-final-attempt corrections. |
| 0.3 | 2026-11-12 | Corrects OCR architecture to the binding private PaddleOCR worker direction; records local runtime blocker, upload-only UI findings and provider-neutral dispatcher contract. |
