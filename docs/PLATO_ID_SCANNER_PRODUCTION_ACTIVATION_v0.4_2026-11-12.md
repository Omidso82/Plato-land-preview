# PLATO ID Scanner — Production Activation Status

**Document version:** 0.4  
**Date:** 2026-11-12  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Primary Supabase project:** `dfrppbapaaydbjeflozw` (`eu-west-3`)  
**GitHub repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Pull request:** [#123](https://github.com/Omidso82/Plato-land-preview/pull/123) — Draft, open, unmerged

## 1. Owner-approved provider decision

On 2026-11-12, the owner explicitly approved Google Cloud Vision EU for OCR processing of PLATO archive images, with all OCR output remaining provisional and subject to human review. Automatic Telegram sending remains disabled and is not part of this activation.

## 2. Production database changes completed

The existing primary database was inspected before changes. The following already-existing foundation was retained without replaying its original migration:

- `plato_id_scanner_access`
- `plato_id_scanner_uploads`
- Private Storage bucket `plato-id-scans` (15 MiB maximum; JPEG, PNG and WEBP)

The following two additive migrations were successfully applied to the primary project:

| Migration | Applied version |
|---|---:|
| `plato_id_scanner_review_and_report_history` | `20261111233715` |
| `plato_id_scanner_ocr_queue` | `20261111233719` |

Post-application read-only checks confirmed the presence of:

- `plato_id_scanner_review_revisions`
- `plato_id_scanner_report_versions`
- `plato_id_scanner_ocr_jobs`
- `plato_id_scanner_ocr_attempts`

The four server-side RPCs were also confirmed present:

- `enqueue_plato_id_scanner_ocr_job`
- `claim_plato_id_scanner_ocr_jobs`
- `complete_plato_id_scanner_ocr_job`
- `fail_plato_id_scanner_ocr_job`

The original foundation draft migration was deliberately not replayed because its tables and private bucket already existed in the primary database.

## 3. Edge Functions deployed

Both functions are active in the primary Supabase project:

| Function | Status | Version | JWT verification |
|---|---|---:|---|
| `plato-id-scanner-dispatch` | ACTIVE | 1 | Enabled |
| `plato-id-scanner-worker` | ACTIVE | 2 | Enabled |

The worker initially failed bundling because the shared result adapter imported application files outside the Edge Function package. The adapter was made self-contained, preserving the `@` extraction rule and exact-string duplicate audit. A whitespace-delimiter escaping issue in that adapter was corrected before the successful second deployment.

## 4. Processing and safety behavior

- Source image remains in the existing private archive bucket.
- Dispatcher validates authenticated user, owner/operator authorization, stored path, MIME, size and source hash before enqueueing.
- Worker requires the shared worker secret and server-side Supabase/Google credentials.
- Google Vision endpoint is the EU regional endpoint: `https://eu-vision.googleapis.com/v1/images:annotate`.
- OCR output is stored as provisional `needs_review` data.
- Extraction starts at `@`, ends at the next `@` or whitespace/newline, preserves exact raw spelling and performs exact-string deduplication only.
- No automatic approval, no automatic Telegram send, and no Telegram message was sent.

## 5. Outstanding configuration and verification

The available Supabase connection does not expose a safe way to list or verify project secrets. Therefore the presence of these two required secrets has **not** been independently confirmed:

- `GOOGLE_VISION_API_KEY`
- `PLATO_SCANNER_WORKER_SECRET`

Supabase-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are expected at Edge runtime. The owner must verify/add the two named secrets through Supabase Dashboard → Project Settings → Edge Functions → Secrets. Do not send secret values in chat.

No archive image has yet been sent to Google Vision. No OCR result has been tested against a real archive image. The first live OCR test must be performed on one existing archive image only, and its output must be reviewed by a human before any approval.

The Scanner UI wiring changes remain in PR #123. The PR is still Draft and unmerged; no main website merge or frontend production release was performed. GitHub Actions CI for the latest source commit has not been independently confirmed.

## 6. Change record

- Primary database: two additive migrations applied successfully.
- Edge Functions: dispatch v1 and worker v2 active.
- Existing archive tables and bucket: retained; no replacement or deletion.
- Existing archive image records: not changed by this activation.
- Main website frontend: not merged or deployed by this activation.
- Telegram: no automatic sending and no messages sent.
- Google Vision: approved for EU OCR only; live OCR request not yet made.

## 7. Next step

After the owner verifies both required secrets in Supabase Dashboard, run one controlled OCR test against one existing archive image, confirm that the result is provisional and visible in the human-review UI, then report the exact outcome before processing any further archive images.
