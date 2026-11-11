# PLATO ID Scanner — Implementation Progress

**Version:** 1.0  
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

## OCR/backend contract progress (v0.5)
- Added `docs/PLATO_ID_SCANNER_OCR_WORKER_CONTRACT_v0.1.md` as a provider-neutral engineering contract.
- Defined logical worker input/result/failure schemas, immutable source-image/hash checks, idempotent job handling, attempt history, state transitions, retry/lease fencing, ambiguity flags and append-only correction audit requirements.
- Confirmed from repository inspection that `main` contains existing event-specific Supabase Edge Functions, but no Scanner OCR worker or persistent container worker. Those existing event functions are not evidence of an OCR-capable runtime.
- The feature branch has no `supabase/config.toml` and no Scanner function directory. No runtime/provider can be responsibly selected from repository evidence alone.
- Contract is documentation only: no schema, migration, worker, queue, secret, bucket or production setting changed.

## OCR contract validation implementation (v0.6)
- Added provider-neutral runtime validators in `supabase/functions/_shared/plato-id-scanner-contract.ts` for worker job, success and failure envelopes.
- Validators check contract version, UUID identities, attempt numbers, fixed private bucket, safe object-key shape, supported image MIME, SHA-256 format, timestamps, confidence bounds and candidate structure.
- Raw OCR candidate values are preserved exactly; no Plato ID parser, normalization, fuzzy matching or auto-correction was introduced.
- Added 8 Deno tests in `supabase/functions/_shared/plato-id-scanner-contract.test.ts` covering valid payloads, invalid paths/MIME/hash/identity, confidence bounds, raw-value preservation and failure envelopes.
- Added the Scanner contract test to `.github/workflows/verify.yml` on this feature branch only.
- CI on commit `513da823...` completed successfully: TypeScript typecheck, Vite build, existing two Deno test suites; Cloudflare Pages preview check succeeded and the deploy job was skipped. New contract tests were added after that run and require a fresh CI result.

## OCR contract hardening (v0.7)
- Tightened timestamp validation to require an RFC3339-style timestamp with an explicit UTC/offset suffix.
- Tightened source object key validation to require a user UUID folder and scan UUID folder, in addition to rejecting traversal-like paths.
- Candidate values and ambiguity flags must be non-empty; confidence remains bounded to 0..1 or null.
- Expanded Deno tests to cover invalid folder identity and timestamps without an explicit timezone.
- These checks validate payload shape only; dispatch authorization, Storage existence/hash verification, callback authentication, lease fencing and persistence still require a trusted backend runtime.

## Upload object-key filename hardening (v0.8)
- Upload object keys no longer reuse a lightly sanitized original filename.
- The key uses a restricted base name (ASCII letters/digits/underscore/hyphen) plus an extension derived from the already validated MIME type.
- Original filename remains in upload metadata for display.
- This aligns the UI-generated object key with the worker contract's safe three-segment path shape.
- CI for this latest change is pending.

## Latest verification (v0.9)
- On commit `e3f18dfb7b35dc6f432291d355d3c698e52ab311`, GitHub Actions run `42932816623` passed install, typecheck, Vite build and the existing two Deno suites plus Scanner contract suite.
- Cloudflare Pages preview remained in progress at documentation time; no main deployment was performed.
- Latest upload object-key generation uses a restricted base name and MIME-derived extension; original filename is retained separately.

## Remaining work
1. Obtain successful CI for the latest feature head.
2. Browser-test owner session reuse and operator access-state isolation.
3. Execute RLS/Storage tests only in an explicitly selected disposable local environment.
4. Confirm canonical Plato ID syntax from an authoritative sample/source before writing a parser.
5. Implement server-side file validation and worker contract after runtime approval.
6. Complete OCR correction history, daily/weekly report versioning and Telegram test-group delivery after operational policies are approved.


## Latest follow-up — worker object-key validation (v1.0)

- Source review found that the worker validator accepted any non-empty filename segment, while the SQL/UI contract restricts filenames to 1–100 ASCII letters/digits/underscore/hyphen and a lowercase MIME-derived extension.
- Updated `safeObjectKey` to enforce the exact safe filename pattern and exact MIME-to-extension mapping: JPEG → `.jpg`, PNG → `.png`, WEBP → `.webp`.
- Added negative contract cases for whitespace, non-ASCII filenames, unsupported `.jpeg` extension and MIME/extension mismatch.
- The test suite still contains eight Deno test cases; the expanded negative inputs are grouped in the existing invalid-job test.
- Source commits: `aa5493c686dd48603ff595ee71a317ed30967016`, `9ccd50a964d9846b1137fc3f0bac840115345eeb`, `75ebf22fef0cc692a3c9ad076f642fe9708951a3`.
- GitHub Actions verify and build jobs passed for `75ebf22...`; Cloudflare preview check was still running at the time this note was prepared.
- No database, Storage bucket, account, OCR runtime, Telegram integration or production deployment was changed.

## Version history

| Version | Date | Change |
|---|---|---|
| 0.9 | 2026-11-11 | Previous owner-panel and scanner integration progress |
| 1.0 | 2026-11-11 | Records worker filename/MIME validation alignment and negative tests |
