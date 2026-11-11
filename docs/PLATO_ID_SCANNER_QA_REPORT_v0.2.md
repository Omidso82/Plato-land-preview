# PLATO ID Scanner — QA Report

**Document version:** 1.2  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Open, Draft, unmerged  
**Scope:** Feature-branch CI, source-level security review and isolated RLS test preparation

## 1. Previous migration correction

Static inspection found duplicated trailing SQL fragments after the complete Storage delete policy in `supabase/migrations/20261111000100_plato_id_scanner_foundation.sql`.

- The duplicated tail was removed on the isolated feature branch.
- Correction commit: `72eaa6c75d44f64f0dc6ee157fcf7c0a2b6f972e`.
- Static checks confirmed eight unique policy declarations, two dollar-quote delimiters for the bucket validation block, and a complete final policy terminator.
- The corrected migration was fetched back from GitHub to verify the saved source.
- This was source-only. It has NOT been executed by PostgreSQL, applied to Supabase, or runtime-tested.

## 2. Additional source-level security finding and correction

A comparison of the SQL/UI upload path rules with the provider-neutral OCR worker validator found a contract mismatch:

- SQL/UI required a safe ASCII filename (1–100 letters/digits/underscore/hyphen) and lowercase `.jpg`, `.png` or `.webp`.
- The worker validator previously checked only that the filename segment was non-empty and did not contain traversal-like text. It could therefore accept filenames the upload policy would reject.
- The worker validator now enforces the same safe filename expression and exact MIME-to-extension mapping: `image/jpeg` → `.jpg`, `image/png` → `.png`, `image/webp` → `.webp`.
- Negative test inputs now cover whitespace, non-ASCII filename characters, unsupported `.jpeg` extension and MIME/extension mismatch.
- The eight Deno test cases remain eight; additional negative inputs are included in the existing invalid-job test.
- Relevant source commits: `aa5493c686dd48603ff595ee71a317ed30967016`, `9ccd50a964d9846b1137fc3f0bac840115345eeb`, `75ebf22fef0cc692a3c9ad076f642fe9708951a3`.

## 3. CI verification for the hardened application/security source

For commit `75ebf22fef0cc692a3c9ad076f642fe9708951a3`:

- GitHub Actions run `42937507255`: verify job SUCCESS.
- npm install, TypeScript typecheck, Vite build, Series 2 qualification tests, Series 2 bracket tests and Scanner contract tests passed.
- GitHub Actions run `42937507296`: build job SUCCESS; deploy job SKIPPED on the feature branch.
- Cloudflare Pages check for this commit was still IN_PROGRESS at the last check. Preview success for this commit is not confirmed.
- Earlier preview URL: https://feature-plato-id-scanner-v0.plato-land-preview.pages.dev

## 4. SQL / RLS / Storage source review

- The Scanner migration has explicit table privilege revocations followed by narrow grants.
- Access table: SELECT/INSERT/UPDATE grants; RLS limits self-registration to pending status and owner-only review updates.
- Upload table: SELECT/INSERT grants; operator insert requires own operator ID, exact three-segment path, initial `uploaded` status and empty OCR result. Operator UPDATE/DELETE is not granted.
- Storage object keys require exactly two folders (operator UUID and scan UUID) plus a safe filename. The private bucket contract is 15 MiB and JPG/PNG/WEBP.
- The upload UI uses `upsert: false`; therefore it does not require Storage UPDATE policy for overwrite.
- Existing tracked Storage policies inspected in the repository are bucket-scoped for their respective buckets. This is not a complete audit of all live policies because the repository migration history is incomplete.
- Supabase documents `storage.foldername()` as returning the array of parent folders, consistent with the two-folder check. Storage upsert would require SELECT and UPDATE in addition to INSERT, but this UI deliberately does not use upsert.
- Source-level review does not prove runtime authorization or byte-level image validity.

## 5. Latest read-only primary database audit

- Primary project `dfrppbapaaydbjeflozw` was queried read-only. No Scanner tables or `plato-id-scans` bucket exist.
- Enumerated live `storage.objects` RLS policies. Every returned policy is scoped to a specific existing bucket; no generic unscoped Storage policy was found in the current listing.
- Verified the existing `private.has_role(text[])` helper definition: SECURITY DEFINER, non-exposed `private` schema, empty search_path, and role lookup constrained by `auth.uid()` in `public.user_roles`.
- Security Advisor reports pre-existing, out-of-scope findings: eight RLS-enabled tables without policies, two exposed SECURITY DEFINER functions in `public` (`admin_list_site_users()` and `withdraw_tournament_registration(uuid)`), and leaked-password protection disabled.
- These findings were not changed because they are outside the Scanner scope and no authorization was given to modify the main database.
- No Scanner migration, table, bucket, Storage policy or other database write was performed.

## 6. Not executed / outstanding

1. RLS-01 through RLS-18 have not been executed with synthetic JWT identities.
2. No disposable local Supabase environment has been authorized or confirmed.
3. No Scanner migration has been applied; no Scanner table, bucket, policy or production object has been created.
4. Auth email confirmation and redirect allowlist remain untested in a live Scanner flow.
5. Browser-based iPhone/Safari QA remains outstanding.
6. Backend image signature/decode/dimension validation is not implemented as a live service.
7. OCR engine/worker runtime, queue, corrections, daily/weekly reports and Telegram delivery are not implemented.
8. OCR provider/hosting and any paid service remain unselected and require explicit approval.
9. PostgreSQL execution/runtime validation of the corrected migration remains outstanding.
10. Repeat the read-only live Storage-policy and owner-helper check immediately before any migration activation to detect configuration drift.

## 7. Database and release safety

- Primary Supabase project `dfrppbapaaydbjeflozw` remains unchanged according to the last read-only audit.
- The secondary Supabase project was not used as an assumed staging substitute.
- No database writes, migration execution, bucket creation or Storage operations were performed.
- No account or operator was created.
- No paid service was enabled.
- PR #123 remains Draft and unmerged.
- No merge or main-site production deployment was performed.

## 8. Next safe steps

1. Verify Cloudflare Pages for the latest source/documentation head.
2. Continue source-only migration/security review.
3. Run RLS/Storage tests only in an explicitly authorized disposable environment.
4. Before production activation, verify all live Storage policies and current owner-helper behavior read-only.
5. Keep production migration, account creation, OCR provider/hosting, Telegram destination and automatic delivery decisions gated by separate approval.

## 9. Version history

| Version | Date | Change |
|---|---|---|
| 0.8 | 2026-11-11 | Previous QA report and source-only policy hardening record |
| 0.9 | 2026-11-11 | Records malformed duplicate migration tail cleanup and aligns RLS test references |
| 1.0 | 2026-11-11 | Records successful CI and Cloudflare preview verification for the prior documentation head |
| 1.1 | 2026-11-11 | Records worker filename/MIME validation mismatch and fix, expanded negative tests, and remaining live-policy audit boundary |
| 1.2 | 2026-11-11 | Adds read-only primary audit of all current Storage policies, owner helper definition and unrelated Security Advisor findings |


## 10. Scope correction and latest feature-branch work — v1.3

The approved product workflow is batch image-to-Plato-ID extraction and Telegram reporting. It is not single-player identity/profile scanning.

### Changes recorded on feature branch
- `src/PlatoIdScannerApp.tsx`: operator/owner upload UI accepts multiple image files. Each file is independently preflight-validated and uploaded sequentially as its own immutable record; failures are reported per file without discarding successful uploads.
- `src/plato-id-scanner.css`: styles the selected multi-image list.
- `src/plato-id-scanner-reports.ts`: provider-independent helpers for Asia/Tehran Jalali date keys, daily exact-ID aggregation, Saturday–Friday weekly activity (one star per ID/day), and Telegram message chunk formatting.
- `supabase/functions/_shared/plato-id-scanner-reports.test.ts`: tests Tehran date boundary, daily review gating/deduplication, weekly day columns and message chunking.
- `.github/workflows/verify.yml`: runs the new report utility test.

### Verification boundary
- GitHub Actions for earlier multi-upload head `02ccb5619d3ad785a10a3364b226dd049bd8e15e` completed successfully for the then-current test set. A later report aggregation test was added after that run.
- A new CI run for the report-test head was observed in progress; its final result must be read from GitHub before claiming it passed.
- No local Deno runtime is available in this environment, so the new Deno test was not run locally.
- No SQL migration was executed or applied. No Scanner tables/bucket/policies were created in either Supabase project.
- No OCR worker/provider, correction RPC, report outbox, Telegram token/destination or scheduled sender was configured.
- No Telegram message, production deployment or merge occurred.
- PR #123 remains Open, Draft and unmerged.

### Blocking prerequisites
1. Confirm authoritative Plato ID syntax using a project-approved representative image/source; do not infer ID format.
2. Confirm an existing PLATO LAND-controlled Backend/container runtime, or separately approve a named OCR provider/hosting after privacy and cost review. Do not create another Supabase project.
3. Configure the fixed Telegram test destination and bot secret only through an approved secure path; never expose them to the browser.
4. Runtime RLS/Storage tests require a permitted isolated environment; neither existing Supabase project is to be repurposed.

### Version history addendum
| Version | Date | Change |
|---|---|---|
| 1.3 | 2026-11-11 | Records product-scope correction, multi-image upload, Tehran daily/weekly report helpers/tests and outstanding OCR/Telegram/runtime prerequisites. |


## 11. Per-image Telegram output formatter — v1.4

- Added `formatScanTelegramMessages` for a single image's canonical reviewed ID list.
- Formatter removes only exact duplicate strings and preserves all other ID characters exactly; no fuzzy merge or O/0/I/l/1 substitution.
- Added a Deno test for the per-image formatter.
- This does not send messages. Telegram sender, bot secret, fixed destination, outbox persistence and idempotent delivery remain unimplemented/unconfigured.

| Version | Date | Change |
|---|---|---|
| 1.4 | 2026-11-11 | Records per-image Telegram message formatting and exact canonical ID preservation. |


## 12. OCR result adaptation and review/report regression fixes — v1.5

**Date:** 2026-11-11  
**Status:** Source committed on the isolated feature branch; final CI for the latest head must be verified.

### Implemented
- Added `plato-id-scanner-result-adapter.ts` to convert provider-neutral worker success payloads into provisional `ocr_result.ids` consumed by the review UI.
- The adapter applies the user-approved `@` extraction rule v0.2 to provider `raw_text`, preserves raw OCR text and provider candidates, and marks every result as requiring human review. It does not persist, approve, normalize or send data.
- Added Deno tests for separated/concatenated IDs, exact raw preservation, punctuation retention and no inference from tokens without `@`; registered the test in GitHub Actions.
- Scoped report-version history reads and next-version lookup to the current `created_by`, matching the database uniqueness/sequence model and preventing cross-user version collisions in owner-visible history.
- Added a regression test for creator-scoped report history.
- Found and corrected over-escaped newline parsing in the manual review editor. The editor now parses LF/CRLF lines through a shared pure helper, trims line-edge whitespace only, removes exact duplicates and preserves distinct case/punctuation. Added tests for LF and CRLF.

### CI evidence
- GitHub Actions run `42989532513` (Build and typecheck, run 785) completed SUCCESS, including the new OCR result adapter test and all then-registered Deno tests.
- Subsequent manual-review newline parser and regression-test commits were pushed after that run. Their final CI result is not yet verified in this report revision.

### Boundaries still unchanged
- No OCR engine runtime or worker endpoint is deployed; this adapter is a tested source boundary, not live image OCR.
- No migration was executed and no Scanner object was created in the primary Supabase project.
- No Telegram credentials/destination or sender was configured; no Telegram message was sent.
- No merge to `main` or production deployment was performed.

| Version | Date | Change |
|---|---|---|
| 1.5 | 2026-11-11 | Records provider-neutral OCR result adaptation, creator-scoped report history, manual review newline parser correction and associated tests. |
