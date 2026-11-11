# PLATO ID Scanner — Implementation Progress

**Version:** 0.3  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 (Draft)

## Implemented in this branch
### Owner integration
- Added a dedicated `PLATO ID Scanner` item to the existing owner navigation, guarded by `canManage`.
- Embedded the Scanner component in the existing owner panel.
- Owner mode shares the existing Supabase client/session and hides the component's own sign-out control.
- The component independently verifies the current owner role. If that check fails in owner mode, it stops instead of falling through to operator self-registration/access lookup.
- Retained the separate `?page=id-scanner` route for operator registration/sign-in and restricted operator workspace.

### Upload preflight
- Checks non-zero size and the existing 15 MiB maximum.
- Checks the file's actual initial bytes for JPEG, PNG or WEBP signatures and requires the detected format to match the browser-declared MIME type.
- Attempts to decode the image and confirms non-zero natural dimensions before enabling upload.
- Disables the upload action while file validation is running.

**Security boundary:** This is client-side defense in depth. It is not a substitute for server-side byte-signature, decode, dimension and content validation. The upload flow remains inactive until the approved database migration and Storage policies are activated in an authorized test environment.

## Latest source verification
- Latest Scanner component fetched from the feature branch: commit `119b5af4ddd465ebaa6a9f10d138d5da7ab86df0`.
- Verified in source: PNG/JPEG/WEBP signature checks, image decode check, file-checking state and upload-button disable condition.
- Earlier GitHub Actions verification run #662 passed TypeScript, Vite build and the two existing Deno tests. That run predates the latest fail-closed guard and upload preflight changes.
- A separate Pages workflow was cancelled before build/upload; no deployment occurred.
- CI for the latest commit remains unverified.

## Current runtime/database state
- Primary Supabase project remains unchanged; no Scanner tables or bucket created.
- Scanner migration remains a draft and is not applied.
- No operator account or Auth redirect configuration changed.
- No OCR worker/provider, queue, Telegram secret or Telegram send configured.
- No production or staging environment was created.
- PR #123 remains Draft and unmerged.

## OCR/backend decision boundary
The existing OCR assessment says a suitable Backend runtime is a prerequisite. Supabase Edge Functions are not selected for full OCR because the documented CPU budget is unsuitable without representative benchmarks. No worker or OCR provider is being implemented or activated until the owner confirms an existing PLATO LAND-controlled container/runtime or explicitly approves evaluation of a named managed provider and its privacy/cost terms.

## Next verification and implementation tasks
1. Obtain successful CI for the latest feature commit.
2. Browser-test owner session reuse and operator access-state isolation.
3. Execute RLS/Storage matrix only in an explicitly selected disposable local environment.
4. Confirm canonical Plato ID syntax from an authoritative sample/source before writing a parser.
5. Implement server-side file validation and a provider-neutral worker contract after runtime approval.
6. Complete OCR corrections, daily/weekly report versioning and Telegram test-group delivery after operational policies are approved.
