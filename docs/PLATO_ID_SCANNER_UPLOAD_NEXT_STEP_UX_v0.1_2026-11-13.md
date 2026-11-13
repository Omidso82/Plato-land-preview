# PLATO ID Scanner — Upload Success and Next-Step Guidance

**Document version:** 0.1  
**Date:** 2026-11-13  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Status:** Implemented on an isolated branch; awaiting CI and owner review. Not merged or deployed.

## Approved user decision

After an operator successfully saves an image, the upload page must clearly explain what happened and guide the operator to the next step. The UI must not automatically navigate away; the operator remains in control.

## Implemented behavior

- A successful upload displays an in-form confirmation banner, rather than relying only on the generic page-level status message.
- The banner shows the number of successfully saved images and their filenames.
- It explicitly states that the image is saved but OCR has not started automatically.
- It explains that the next step is to open **استخراج و بررسی** and start OCR for the saved image.
- A direct **رفتن به استخراج و بررسی ←** action navigates to the existing OCR/review workspace, where the newly saved image is listed with its existing **شروع پردازش OCR** control.
- The operator is not automatically redirected and OCR is not automatically invoked.
- The banner is cleared when the operator selects a new file, begins another upload, or opens the upload workspace again.
- If some files save and others fail, the successful images are shown in the confirmation banner while failure details remain in the existing error/status message.

## Safety and scope

- UI-only change in src/PlatoIdScannerApp.tsx and src/plato-id-scanner.css.
- No database schema or records, Storage objects, RLS policies, OCR worker/dispatcher, duplicate matching, review history, report generation, or Telegram behavior are changed.
- No automatic OCR dispatch, no Telegram send, and no change to the Main Website feature scope.
- No production merge or deployment has been performed.

## Verification required

- GitHub Actions typecheck and build on the PR head.
- Owner visual review on iPhone/Safari after a preview is available.
- Verify success path and partial-failure messaging without altering production data.
