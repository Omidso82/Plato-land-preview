# PLATO ID Scanner — Daily Operator Workflow Handover
Version: 1.0
Date: 2026-11-12
Project: PLATO LAND – Temporary Projects
Status: implementation branch verified; production website deployment pending

## 1. Scope
This change applies only to the temporary PLATO ID Scanner in the existing Series 2 temporary manager route. It does not change the PLATO LAND Main Website feature scope, tournament data, registration data, prediction data, or results.

## 2. Confirmed user decisions
- The owner must have a clearly separated Scanner section inside the existing owner-only temporary manager panel.
- After an approved operator signs in, the operator sees one clear “اسکن تصاویر” button.
- The scanner opens in a focused dialog/window.
- Only one image is selected and uploaded per operation.
- After upload, the image appears in the current workday list with its own OCR action and result/review information.
- The operator proceeds to the next image only after reviewing the previous image.
- Each image may receive only one OCR attempt. No retry is allowed because OCR usage is limited.
- The current day is determined by the Solar Hijri calendar in Asia/Tehran, not the phone/browser timezone.
- At the next Solar Hijri day boundary, prior-day images become part of the archive automatically; records are not physically moved or deleted.
- The archive offers date selection and shows each day's images and associated OCR/review information.
- Human review remains mandatory. Telegram delivery is not automatic.

## 3. Implementation changes
- Operator routing in src/Series2SlidesManager.tsx now hands approved non-owner sessions to PlatoIdScannerApp; the legacy uploader was removed from the operator and owner panel render paths to avoid duplicate scanner interfaces.
- src/PlatoIdScannerApp.tsx now provides a focused operator scanner dialog, single-image selection, current-day list, and previous-day archive.
- Day keys use Intl.DateTimeFormat with the Persian calendar and Asia/Tehran timezone.
- Current-day classification refreshes periodically while the page remains open, so crossing Tehran midnight automatically moves yesterday's images into the archive view.
- Archive reads use 500-row pagination so older images are not silently omitted by a small fixed result limit.
- Approved operators and the owner can read the shared archive according to the already-applied Scanner-specific RLS policy. Upload creation remains constrained to the authenticated uploader's own storage path.
- src/plato-id-scanner.css adds the mobile-friendly modal/dialog layout.

## 4. One-attempt OCR enforcement
- Primary Supabase project: dfrppbapaaydbjeflozw.
- Applied migration: 20261112015040_plato_id_scanner_single_attempt.
- plato_id_scanner_ocr_jobs.max_attempts now defaults to 1 and has a check constraint requiring exactly 1.
- Existing queue rows were normalized to max_attempts = 1.
- The live database was queried after migration. The three existing jobs were all succeeded, attempt 1, max_attempts 1; their results were preserved.
- plato-id-scanner-dispatch was deployed as version 5 with failed uploads excluded from new dispatch requests.
- The worker's existing queue lease and attempt checks remain in place. Retryable provider errors cannot create a second OCR attempt because the queue's max_attempts is 1.

## 5. Verification
- GitHub PR: https://github.com/Omidso82/Plato-land-preview/pull/132
- Branch: feature/scanner-daily-single-image-flow
- Latest branch commit at this handover: bbfed4a24965a748d75b099921baa1b975b10591.
- Build and typecheck workflow: SUCCESS.
- npm run typecheck: SUCCESS.
- npm run build: SUCCESS.
- Existing Deno qualification and bracket tests: SUCCESS.
- Cloudflare Pages preview for the latest commit: still building at the time of this handover.
- Production website merge/deployment: not yet performed at the time of this handover.
- No real OCR image was submitted as a test, so no OCR usage was consumed during verification.

## 6. Safety boundaries
- Existing uploads and OCR results were not deleted or overwritten.
- No new Supabase project/database was created.
- No additional paid service or spend was initiated.
- Google Cloud Vision EU remains the approved OCR provider.
- No Telegram message was sent.
- No unrelated tournament, prediction, registration, or Main Website data was changed.

## 7. Remaining steps
1. Confirm Cloudflare preview build for the latest PR commit.
2. Merge PR #132 into main after successful checks.
3. Verify the production deployment workflow completes successfully.
4. Verify the published owner and operator route in the live temporary manager. Actual OCR should be tested only with a disposable image when the user chooses to consume one OCR request.
5. Update this handover with the final production commit and deployment result.

## 8. Change log
- v1.0 — 2026-11-12 — Records the agreed daily single-image workflow, owner/operator routing, Solar Hijri archive, 500-row archive pagination, and one-attempt OCR enforcement.
