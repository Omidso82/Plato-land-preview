# PLATO ID Scanner — OCR Backend Architecture Assessment
**Version:** 0.1  
**Date:** 2026-11-11  
**Status:** Technical assessment / proposal only — not an approved architecture change  
**Project:** PLATO LAND – Temporary Projects  
**Branch:** `feature/plato-id-scanner-v0-1`

## 1. Approved design constraints retained
The current approved Scanner design requires:
- OCR to run in an independent Backend service; the Telegram bot is not an OCR engine.
- One canonical OCR result to feed both the Scanner panel and Telegram reports.
- Operators to see and correct only their own records; owner can review all records.
- Exact duplicates may be removed; uncertain lookalikes (O/0, I/l/1, underscore/hyphen) must be flagged, never silently merged.
- Images, OCR results, corrections and report versions must be retained.
- Telegram destination remains the fixed test group.
- No paid service, production migration, deployment, merge, or Telegram send without required approval.

Browser-side OCR is not selected because it conflicts with the approved Backend OCR requirement.

## 2. Runtime assessment
### Existing Supabase Edge Functions
The current hosted Supabase Edge Functions environment documents a 2-second CPU execution limit per request, despite a longer wall-clock duration. OCR is CPU-intensive, so running full image recognition synchronously in an Edge Function is not recommended without a representative benchmark proving it stays within limits. Current documentation also describes resource-limit failures for CPU-heavy work.

### Existing frontend hosting
The repository's Vite app is configured for static hosting. GitHub Pages can serve the Scanner UI but is not a persistent server-side OCR worker.

### Tesseract.js / Tesseract engine
Tesseract.js 7.0.0 is an Apache-2.0-licensed JavaScript/WebAssembly OCR wrapper and can run in browser or Node environments. It is a candidate engine, not a selected production provider. Its OCR accuracy for the actual Plato ID image types has not been benchmarked. A Node/container worker or another dedicated backend runtime would be more aligned with the approved backend architecture than browser-side OCR.

## 3. Candidate deployment patterns
| Pattern | Privacy | Cost | Fit / limitation |
|---|---|---|---|
| Dedicated self-hosted container worker using Tesseract | Images remain within infrastructure controlled by PLATO LAND | Depends on available compute/hosting; not yet known | Best alignment with approved design if an existing suitable host is available |
| Managed OCR API | Images leave PLATO LAND infrastructure for a provider | May be paid per page/request | Technically straightforward, but provider, retention terms, data region and price require explicit approval |
| Supabase Edge Function OCR | Images remain in Supabase | Within existing plan, subject to usage | Not recommended for full OCR because of the 2-second CPU limit and memory/runtime constraints |
| Browser-side OCR | Image can remain on operator device during recognition | No OCR API fee; downloads worker/model assets | Not adopted because it contradicts the approved Backend OCR architecture |

## 4. Proposed backend processing contract (not implemented)
1. Scanner UI uploads an image to the private `plato-id-scans` bucket and creates a scan record with status `uploaded`.
2. An authenticated, owner-approved request enqueues that scan record. The operator cannot choose a worker URL, provider, or Telegram destination.
3. A dedicated worker claims one queued job idempotently and obtains the image through a short-lived, narrowly scoped access method.
4. The worker performs OCR and returns raw text, candidate strings, per-candidate confidence/geometry where available, engine/version metadata, and processing timestamps.
5. A deterministic parser extracts only candidates matching a Plato ID format after that format has been confirmed from authoritative samples.
6. Exact duplicate strings are deduplicated. Confusable-character candidates and uncertain reads are marked `needs_review`; no automatic character substitution or fuzzy merge is allowed.
7. The canonical result is stored against the scan record and displayed in the Scanner UI. Telegram reporting later reads only this stored canonical result.
8. Manual corrections create an append-only audit entry with old value, new value, actor, timestamp and reason; corrections do not overwrite history.
9. Retries use a stable job/scan idempotency key. Failed jobs remain visible and retryable without duplicate report delivery.

## 5. Security requirements
- Never expose Supabase service-role/secret keys to the browser.
- Worker credentials must be server-side secrets, least-privilege, rotatable and unavailable to operators.
- Worker access must be scoped to a single scan/job and expire quickly.
- Worker callbacks must be authenticated and idempotent.
- Validate MIME type, actual file signature, byte size and image dimensions; do not trust browser metadata alone.
- Enforce operator ownership and owner authorization in database policies/backend, not only UI.
- Do not log image bytes, signed URLs, access tokens, or sensitive OCR payloads.
- Keep the fixed Telegram test destination server-side.

## 6. Validation required before provider/host selection
- Collect representative, authorized sample images covering different layouts, resolutions, compression, lighting and text sizes.
- Confirm the canonical Plato ID syntax and allowed characters from an authoritative project source.
- Measure exact-match precision, missed IDs, false candidates, processing time, memory and per-image cost (if any).
- Specifically test O/0, I/l/1, underscore/hyphen, adjacent IDs, repeated IDs and low-confidence outputs.
- Confirm hosting region, retention/deletion policy, data processing terms, operational monitoring and backup.
- No production image should be sent to an external OCR provider during evaluation without explicit approval.

## 7. Decision required before implementation
The missing prerequisite is a suitable Backend runtime. The next implementation step depends on one of these being confirmed:
- An existing PLATO LAND-controlled server/container host can run a persistent or on-demand worker; or
- The owner explicitly approves evaluating a named managed OCR provider, including its privacy terms and any price.

No hosting resource, paid OCR account, Supabase schema, Storage bucket, secret, worker, migration, production deployment or Telegram message was created or changed by this assessment.

## 8. Status
This document records technical findings and a proposal only. It does not supersede the approved Scanner Design Decisions register. Any architecture change requires the owner's explicit approval.
