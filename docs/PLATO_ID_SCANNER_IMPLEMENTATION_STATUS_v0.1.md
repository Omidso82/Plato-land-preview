# PLATO ID Scanner — Implementation Status

**Document version:** 1.0  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Base:** `main` at `abb1556b57f9c9b73cdc83ea2486ffd01ffd023a`  
**Status:** Feature implementation in progress; no production activation.

## 1. Delivered on the isolated feature branch

- Dedicated `?page=id-scanner` entry point, isolated from the normal App lifecycle.
- Supabase Auth email/password registration and login flow with email-confirmation gate.
- Scanner access states: pending, approved, rejected and disabled.
- Owner review interface uses the existing owner-role check; Scanner operators are not assigned `owner` or `tournament_admin`.
- Private image upload UI for JPG/PNG/WEBP with a 15 MiB cap and client-side signature/MIME/decode preflight.
- Operator upload history is scoped to the operator in the interface; server-side authorization remains dependent on the unapplied migration and runtime tests.
- Additive draft migration for Scanner access/uploads tables, RLS and private Storage bucket.
- Provider-neutral OCR worker contract, runtime validators and eight Deno contract tests.
- Timestamp validator rejects impossible calendar dates, invalid clock fields and timezone offsets beyond ±14:00.
- Worker source path requires exactly operator UUID / matching scan UUID / safe filename; mismatched IDs, nested paths and backslashes are rejected.
- Upload object filename uses a restricted ASCII basename and MIME-derived extension; original filename remains display metadata.

## 2. Latest source-only migration correction

- Static inspection found duplicated trailing SQL fragments after the complete Storage delete policy in `supabase/migrations/20261111000100_plato_id_scanner_foundation.sql`.
- The duplicated trailing fragment was removed from the isolated feature branch.
- Correction commit: `72eaa6c75d44f64f0dc6ee157fcf7c0a2b6f972e`.
- Static checks confirmed eight uniquely named CREATE POLICY statements, two dollar-quote delimiters for the bucket validation block, and a complete final policy terminator.
- The migration was fetched back from GitHub after the edit to verify the saved source.
- This was source-only. The migration has NOT been executed, parsed by PostgreSQL, or applied to either Supabase project.

## 3. Worker path-contract hardening

- Source review found the worker validator accepted any non-empty filename segment, while the SQL/UI upload contract restricts filenames to 1–100 ASCII letters/digits/underscore/hyphen and a lowercase MIME-derived extension.
- Updated the worker validator to enforce the same exact filename pattern and MIME-to-extension mapping: JPEG → `.jpg`, PNG → `.png`, WEBP → `.webp`.
- Added negative contract inputs for whitespace, non-ASCII filenames, unsupported `.jpeg` extension and MIME/extension mismatch.
- Deno contract suite remains eight test cases; the expanded negative inputs are included in the existing invalid-job test.
- Source commits: `aa5493c686dd48603ff595ee71a317ed30967016`, `9ccd50a964d9846b1137fc3f0bac840115345eeb`, `75ebf22fef0cc692a3c9ad076f642fe9708951a3`.
- GitHub Actions verify and build jobs passed for `75ebf22...`; Cloudflare Pages check remained in progress at the last check.

## 4. Latest verified CI and preview

For application/security source commit `75ebf22fef0cc692a3c9ad076f642fe9708951a3`:

- GitHub Actions run `42937507255`: verify job SUCCESS.
- npm install, TypeScript typecheck, Vite build, Series 2 qualification tests, Series 2 bracket tests and Scanner contract tests passed.
- GitHub Actions run `42937507296`: build job SUCCESS; deploy job SKIPPED on the feature branch.
- Cloudflare Pages check for this commit remained IN_PROGRESS at the last check. Do not claim preview success for this commit until confirmed.
- The earlier verified branch preview is https://feature-plato-id-scanner-v0.plato-land-preview.pages.dev.

## 5. Pull request and release boundary

- PR #123: Open, Draft, unmerged.
- Base branch: `main`; feature branch: `feature/plato-id-scanner-v0-1`.
- No merge or production deployment.
- Main deploy job was skipped.
- PR must remain Draft and unmerged until separate explicit approval.

## 6. Database and activation status

- Primary Supabase project `dfrppbapaaydbjeflozw` remains the authoritative production project.
- Scanner access/upload tables, Scanner bucket and Scanner Storage policies were absent in the last read-only primary audit.
- No Scanner migration has been applied; no database write was made.
- Secondary Supabase project is not assumed to be disposable staging and was not used.
- Auth email confirmation and redirect allowlist require a controlled live-flow test.
- No operator account was created.
- OCR engine/provider/hosting has not been selected or activated; no paid service was enabled.
- OCR runtime, corrections, daily/weekly reports, Telegram delivery and finalization are not deployed.

## 7. Latest read-only primary database security audit

- Rechecked primary project `dfrppbapaaydbjeflozw` without making any writes.
- Scanner tables are still absent and bucket `plato-id-scans` is still absent.
- Enumerated live `storage.objects` RLS policies: all policies returned were scoped to their own bucket IDs; no generic unscoped Storage policy was found in the current policy listing.
- Confirmed `private.has_role(text[])` is a SECURITY DEFINER SQL function in the non-exposed `private` schema, uses an empty search_path and checks `auth.uid()` against `public.user_roles`.
- Supabase Security Advisor still reports existing findings outside the Scanner scope: eight RLS-enabled tables with no policies, two exposed SECURITY DEFINER functions in `public`, and leaked-password protection disabled. No changes were made to these findings.

## 8. Outstanding validation

1. Confirm Cloudflare branch preview for the latest source/documentation head.
2. PostgreSQL execution and runtime RLS/Storage tests remain outstanding.
3. Runtime RLS tests require an explicitly authorized disposable local or isolated environment. Neither existing Supabase project is presumed disposable.
4. Complete iPhone/Safari browser QA.
5. Test email confirmation, redirect allowlist and the complete owner/operator access lifecycle in a controlled environment.
6. Select OCR architecture/provider only after privacy, accuracy, runtime and cost review and explicit approval.
7. Keep PR #123 Draft and unmerged until the user explicitly authorizes a release decision.

## 9. Version history

| Version | Date | Change |
|---|---|---|
| 0.7 | 2026-11-11 | Previous implementation and security review status |
| 0.8 | 2026-11-11 | Records duplicated SQL tail cleanup and clarifies release/database blockers |
| 0.9 | 2026-11-11 | Aligns worker filename and MIME-extension validation with the SQL/UI upload contract and records expanded negative tests |
| 1.0 | 2026-11-11 | Records the latest read-only primary Storage-policy, owner-helper and Security Advisor audit; no database changes made |


## 10. Scope correction and workflow alignment — v1.1

The approved product is a **batch Plato ID image-to-list workflow**, not single-player identity/profile scanning.

Approved workflow retained from Design Decisions v0.4:
1. An approved operator or owner uploads one or more screenshots/images containing multiple Plato IDs. Each image remains a separate immutable upload.
2. A dedicated Backend OCR service reads each image and extracts candidate Plato ID strings.
3. Exact duplicates are deduplicated only where equality is certain. Ambiguous characters such as O/0 and I/l/1, separators and low-confidence candidates are flagged for human review; no fuzzy merge or automatic character substitution.
4. The original image and candidate/canonical ID list are displayed together in the Scanner panel.
5. The operator corrects and reviews the list. The same canonical result is used for panel display and Telegram output.
6. Manual report send is initiated from the panel. A correction after sending creates a new report version; prior versions remain available.
7. Daily and Saturday–Friday weekly reports use Asia/Tehran dates. Weekly activity contains one row per ID and at most one star per active day. Historical corrections recalculate dependent reports.

### Implemented in this update
- Operator upload UI now supports selecting multiple images in one action.
- Every selected image is validated and uploaded sequentially as its own independent upload record. Successful uploads are retained even if another selected image fails; existing uploads are not overwritten.
- Added a provider-independent report utility for Tehran-local Jalali date keys, daily exact-ID aggregation, Saturday–Friday weekly activity aggregation, one-star-per-day logic and Telegram message chunk formatting.
- Added Deno tests for Tehran date boundaries, daily deduplication/review gating, weekly activity and Telegram message splitting.
- CI workflow now includes the report utility test.

### Explicitly not complete
- The UI upload action still only stores images as `uploaded`; it does not perform OCR.
- No authoritative Plato ID syntax/sample is recorded in the accessible design register. The parser must not guess a regex or transform ambiguous characters.
- No approved/available dedicated Backend OCR host or runtime has been confirmed. Supabase Edge OCR was assessed as unsuitable for CPU-heavy image processing; no paid provider or new hosting was selected.
- Correction audit tables/RPCs, report persistence/outbox, scheduled report dispatch and Telegram sender are not yet implemented or activated.
- No Telegram bot token or fixed test destination was configured; no Telegram message was sent.
- No Supabase project was used for tests or modified. Existing secondary project remains reserved for Main Website testing.
- PR #123 remains Draft and unmerged; no production migration or deployment.

### Version history addendum
| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-11-11 | Corrects product scope to batch image-to-Plato-ID extraction; records multi-image upload UI and Tehran daily/weekly aggregation utilities/tests; records OCR/runtime, correction, reporting and Telegram blockers. |


## 11. Per-image Telegram output preparation — v1.2

- Added `formatScanTelegramMessages` to `src/plato-id-scanner-reports.ts` to format one image's reviewed canonical ID list for Telegram, split into safe message chunks.
- Exact ID strings are preserved; only exact duplicate values are collapsed. No character substitution or fuzzy matching is performed.
- Added a Deno test verifying per-image formatting and exact duplicate handling.
- This is formatting logic only. No Telegram bot sender, token, destination, outbox or message delivery has been configured.

| Version | Date | Change |
|---|---|---|
| 1.2 | 2026-11-11 | Adds per-image Telegram ID-list formatting and exact-value preservation; no delivery is activated. |
