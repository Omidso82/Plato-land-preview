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
