# PLATO ID Scanner — QA and Implementation Progress Addendum

**Document version:** 1.7  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Draft, open, unmerged  
**Status:** Source-only UI correction committed; OCR runtime remains blocked by the unselected hosting/runtime prerequisite.

## 1. Scope of this addendum

This addendum records the follow-up work after QA report v1.6 and the OCR infrastructure feasibility review v0.2. It does not supersede the approved Scanner Design Decisions or the provider-neutral worker contract v0.4.

## 2. Source review findings

The following current implementation boundaries were re-checked on the feature branch:

- Multi-image upload creates an independent upload row and private Storage object for each image.
- Upload records are inserted with status `uploaded` and empty `ocr_result`.
- No dispatcher, queue claim, OCR worker invocation, authenticated callback, image hash verification or trusted OCR result persistence is connected to the upload flow.
- The provider-neutral job/result validators and OCR result adapter are source code and tests only; they do not perform OCR or provide runtime authentication.
- The manual review UI appends immutable review revisions.
- Daily/weekly report builders read the latest approved review revision per scan rather than unioning prior corrected versions.
- Telegram formatting is present, but the UI only copies text; no sender, outbox, scheduler, credentials or destination configuration is active.
- Existing migration files remain drafts and have not been executed against Supabase.

## 3. UI status-label correction

The upload review card previously continued to display “OCR has not run” after an operator had saved an approved review revision. That label was stale and misleading.

Correction committed:

- Commit: `ce4ac88b20f98651b4f9dd3df79ea35779eadf00`
- File: `src/PlatoIdScannerApp.tsx`
- New display precedence:
  1. If an approved review revision exists, show its revision number.
  2. If provisional OCR IDs exist, show that OCR output is ready for review.
  3. Otherwise show the upload's actual status, with `uploaded` described as awaiting OCR processing.

This is a presentation-only correction. It does not alter database rows, review history, OCR state, access rules or reports.

## 4. Local PaddleOCR environment re-check

Read-only environment checks were performed before any installation attempt:

- Python available: CPython 3.13.5 only.
- Python 3.12 and 3.11 executables: absent.
- Docker: unavailable.
- Podman: unavailable.
- `uv`: available, but only Python 3.13.5 is installed.
- Python packages: `torch`, `opencv-python`, `pytesseract` and Pillow are present; `paddleocr` and `paddle` are absent.
- Local package/model caches: no usable PaddleOCR cache was found.
- DNS/network lookup for `pypi.org` and `github.com` failed with temporary name-resolution errors.

Therefore PaddleOCR could not be installed or executed in this environment. No package installation, model download, container creation or external OCR request was attempted. No OCR accuracy claim is made.

## 5. Next engineering gate

The existing worker contract v0.4 requires a verified PLATO LAND-controlled worker runtime or explicit owner approval to evaluate a named managed provider. The current environment does not provide Docker/Podman, a Python 3.12 runtime, or package-network access. The repository and primary Supabase project do not establish an existing persistent OCR worker host.

Accordingly, the next safe work is limited to implementation preparation and tests that do not pretend to be a live worker. A runnable worker must not be connected to the production upload path until the runtime, secret handling, per-job object access, callback authentication, retry/lease policy and server-side persistence are selected and reviewed.

## 6. Verification and safety boundaries

- The UI correction commit is verified in GitHub commit metadata and diff.
- CI for commit `ce4ac88` has not yet been confirmed in this addendum.
- No Supabase migration was applied.
- No table, bucket, policy, secret, operator account or OCR service was created.
- No production database write, main-branch change, merge or production deployment occurred.
- No Telegram message was sent.
- PR #123 remains Draft, open and unmerged.

## 7. Outstanding work

1. Confirm a suitable existing private worker host, or obtain explicit approval for a named provider and any associated cost/privacy terms.
2. Implement a trusted dispatcher and append-only job/attempt lifecycle, including atomic claim/lease and stale-worker fencing.
3. Implement worker-side object validation, SHA-256 verification and narrowly scoped private image access.
4. Implement authenticated, idempotent result callback and trusted persistence of raw OCR output.
5. Connect provisional OCR output to the review card and verify that human correction creates a new revision.
6. Execute migration/RLS/Storage tests in a disposable authorized PostgreSQL environment before proposing any primary database migration.
7. Only after OCR/review acceptance, implement Telegram outbox, fixed test destination and scheduler as a separately reviewed phase.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 1.6 | 2026-11-11 | Prior verified CI and static SQL source review |
| 1.7 | 2026-11-11 | Records stale upload-card status correction, source re-review, and local PaddleOCR runtime/network blockers |
