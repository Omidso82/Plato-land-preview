# PLATO ID Scanner — Upload-only Integration Report

**Document version:** 1.0  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Subproject:** PLATO ID Scanner  
**Status:** Implemented on isolated branch; preview deployed; not merged to main

## 1. Approved scope

This stage implements only the upload foundation:
- Owner opens the Scanner section inside the existing temporary Series 2 manager.
- Operators use the independent `?page=id-scanner` entry route.
- New operator accounts create a pending access request after their first authenticated login.
- Owner can approve, reject or disable operator access.
- Approved operators upload one or more JPG, PNG or WEBP screenshots, maximum 15 MiB per image.
- Each image is stored as a separate immutable object and upload row.
- Operators see only their own upload history; owner sees operator requests and all uploads.
- Images are displayed through short-lived signed URLs from the private bucket.

## 2. Explicit exclusions

No OCR, ID extraction, duplicate processing, correction/review workflow, report generation, Telegram delivery, scheduled jobs, paid services, or main-website feature changes are included.

## 3. GitHub implementation

- Repository: `Omidso82/Plato-land-preview`
- Base: `main` at `abb1556b57f9c9b73cdc83ea2486ffd01ffd023a`
- Branch: `feature/plato-id-scanner-upload-only-v1`
- PR: #124 — Draft, open, unmerged
- Head commit: `d1b17f35c3855c679e0825a1a519947c33927ad7`
- Files changed: 4 application files plus this report (documentation).
- The previous broad PR #123 was not merged.

## 4. Primary database verification

Read-only checks against the authoritative Supabase project `dfrppbapaaydbjeflozw` confirmed:
- Migration `20261111144344` is present in migration history.
- `public.plato_id_scanner_access` exists with RLS enabled.
- `public.plato_id_scanner_uploads` exists with RLS enabled.
- Private Storage bucket `plato-id-scans` exists.
- Bucket limit: 15,728,640 bytes (15 MiB).
- Allowed MIME types: image/jpeg, image/png, image/webp.
- Live RLS policies were read and checked for owner/approved-operator access and operator-owned object paths.
- No database write or new migration was made during this integration step.

## 5. Verification results

For head commit `d1b17f35c3855c679e0825a1a519947c33927ad7`:
- GitHub Actions Build and typecheck: SUCCESS (run 43044427972).
- npm install: SUCCESS.
- TypeScript typecheck: SUCCESS.
- Vite production build: SUCCESS.
- Existing Series 2 qualification and bracket tests: SUCCESS.
- Cloudflare Pages preview: SUCCESS (check run 130604983210).
- Preview URL: https://1f81fdcf.plato-land-preview.pages.dev
- Branch preview URL: https://feature-plato-id-scanner-upl.plato-land-preview.pages.dev
- GitHub Pages deployment workflow was skipped; no production deployment occurred.

## 6. Outstanding checks and limitations

- Authenticated iPhone/Safari end-to-end test has not been performed.
- A real operator signup/email-confirmation/approval cycle has not been tested.
- No operator account was created.
- No real image was uploaded; end-to-end Storage + row persistence remains unverified.
- Client preflight checks MIME and size; a separate server-side image decode/signature validation service is not part of this upload-only stage.
- PR #124 remains Draft and unmerged. Main branch and public production site remain unchanged.

## 7. Current state and next actions

1. Open the Cloudflare branch preview and perform an authenticated owner-panel check.
2. Test a synthetic operator account and approval lifecycle, then upload a non-sensitive test image.
3. Verify owner/operator visibility boundaries and signed preview behavior.
4. Only after successful tests, consider a separate release decision for merging PR #124.
5. Keep OCR, extraction, reports and Telegram work out of this stage until separately requested.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-11 | First isolated upload-only implementation, live primary database read-only verification, CI and Cloudflare preview verification |
