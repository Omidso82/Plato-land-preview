# PLATO ID Scanner — Implementation Progress

**Version:** 0.4  
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
- Checks actual initial bytes for JPEG, PNG or WEBP signatures and requires the detected format to match the browser-declared MIME type.
- Attempts to decode the image and confirms non-zero natural dimensions before enabling upload.
- Disables the upload action while file validation is running.
- This is client-side defense in depth only. Server-side byte-signature, decode, dimension and content validation remains mandatory before production activation.

### SQL draft hardening
- Revised the Scanner migration to explicitly revoke all direct table privileges from `anon` and `authenticated` before granting only the minimum operations needed by the current UI:
  - access table: SELECT, INSERT, UPDATE
  - uploads table: SELECT, INSERT
- Existing RLS policies remain an additional row-level authorization gate.
- No migration has been applied to any Supabase database.

## Static verification performed
Latest fetched SQL draft SHA: `37043b56d45d8bb047436ba34bdb94d54f3fa07b`.

Checked and passed as source-level assertions:
- explicit privilege revocation for both Scanner tables;
- narrow table grants;
- self-registration restricted to pending state;
- upload metadata requires empty OCR result and approved operator (or owner);
- upload path is constrained to the authenticated user's UUID folder;
- private bucket definition with 15 MiB and JPG/PNG/WEBP allowlist;
- owner-mode fail-closed guard;
- JPEG/PNG/WEBP signature checks in client preflight.

These are static source checks, not live RLS, Storage, browser or production tests.

## CI and runtime status
- Earlier GitHub Actions verification run #662 passed TypeScript, Vite build and the two existing Deno tests, but it predates the most recent owner fail-closed, upload preflight and SQL privilege-hardening commits.
- The separate Pages workflow was cancelled before build/upload; no deployment occurred.
- CI for the latest branch head has not been verified.
- Primary Supabase project was inspected read-only. Scanner tables and the `plato-id-scans` bucket are absent; no Scanner migration or storage policy was applied.
- Existing Edge Functions in the primary project do not include a PLATO ID Scanner worker.
- No operator account, Auth redirect configuration, OCR provider, queue, Telegram secret or Telegram send has been configured.

## OCR/backend decision boundary
The existing OCR assessment says a suitable Backend runtime is a prerequisite. Supabase Edge Functions are not selected for full OCR because the documented CPU budget is unsuitable without representative benchmarks. No worker or OCR provider is being implemented or activated until the owner confirms an existing PLATO LAND-controlled container/runtime or explicitly approves evaluation of a named managed provider and its privacy/cost terms.

## Remaining work
1. Obtain successful CI for the latest feature head.
2. Browser-test owner session reuse and operator access-state isolation.
3. Execute RLS/Storage tests only in an explicitly selected disposable local environment.
4. Confirm canonical Plato ID syntax from an authoritative sample/source before writing a parser.
5. Implement server-side file validation and worker contract after runtime approval.
6. Complete OCR correction history, daily/weekly report versioning and Telegram test-group delivery after operational policies are approved.
