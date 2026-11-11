# PLATO ID Scanner — Implementation Status

**Document version:** 0.9  
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

## 7. Outstanding validation

1. Confirm Cloudflare branch preview for the latest source/documentation head.
2. PostgreSQL execution and runtime RLS/Storage tests remain outstanding.
3. Runtime RLS tests require an explicitly authorized disposable local or isolated environment. Neither existing Supabase project is presumed disposable.
4. Complete iPhone/Safari browser QA.
5. Test email confirmation, redirect allowlist and the complete owner/operator access lifecycle in a controlled environment.
6. Select OCR architecture/provider only after privacy, accuracy, runtime and cost review and explicit approval.
7. Keep PR #123 Draft and unmerged until the user explicitly authorizes a release decision.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 0.7 | 2026-11-11 | Previous implementation and security review status |
| 0.8 | 2026-11-11 | Records duplicated SQL tail cleanup and clarifies release/database blockers |
| 0.9 | 2026-11-11 | Aligns worker filename and MIME-extension validation with the SQL/UI upload contract and records expanded negative tests |
