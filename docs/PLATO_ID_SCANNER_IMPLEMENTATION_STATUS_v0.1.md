# PLATO ID Scanner — Implementation Status

**Document version:** 0.8  
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

- On 2026-11-11, static inspection found duplicated trailing SQL fragments after the complete Storage delete policy in `supabase/migrations/20261111000100_plato_id_scanner_foundation.sql`.
- The duplicated trailing fragment was removed from the isolated feature branch.
- Correction commit: `72eaa6c75d44f64f0dc6ee157fcf7c0a2b6f972e`.
- Static guard after correction found eight uniquely named CREATE POLICY statements, two balanced dollar-quote delimiters for the bucket validation block, and a complete final policy terminator.
- This was a source-only edit. The migration has NOT been executed, parsed by PostgreSQL, or applied to either Supabase project. CI for the corrected commit was pending when this document was prepared.

## 3. Latest verified pre-correction CI and preview

For commit `ba7bbf040f7a6e8c3afc36fc1546ce5a2a77fb08` (before the migration cleanup):

- GitHub Actions run `42934159521`: verify job SUCCESS.
- npm install, TypeScript typecheck, Vite build, Series 2 qualification tests, Series 2 bracket tests and Scanner contract tests passed.
- GitHub Actions run `42934159360`: build SUCCESS; deploy job SKIPPED on the feature branch.
- Cloudflare Pages check: SUCCESS.
- Branch preview: https://feature-plato-id-scanner-v0.plato-land-preview.pages.dev
- Commit preview: https://c9bb03e1.plato-land-preview.pages.dev

These checks apply to `ba7bbf...` only, not the later migration cleanup commit.

## 4. Pull request and release boundary

- PR #123: Open, Draft, unmerged.
- Base branch: `main`; feature branch: `feature/plato-id-scanner-v0-1`.
- No merge or production deployment.
- Main deploy job was skipped.
- PR must remain Draft and unmerged until separate explicit approval.

## 5. Database and activation status

- Primary Supabase project `dfrppbapaaydbjeflozw` remains the authoritative production project.
- Scanner access/upload tables, Scanner bucket and Scanner Storage policies were absent in the last read-only primary audit.
- No Scanner migration has been applied; no database write was made.
- Secondary Supabase project is not assumed to be disposable staging and was not used.
- Auth email confirmation and redirect allowlist require a controlled live-flow test.
- No operator account was created.
- OCR engine/provider/hosting has not been selected or activated; no paid service was enabled.
- OCR runtime, corrections, daily/weekly reports, Telegram delivery and finalization are not deployed.

## 6. Outstanding validation

1. Re-run and inspect CI for the corrected migration commit and final documentation head.
2. Confirm Cloudflare branch preview for the corrected head.
3. Review the complete migration source; PostgreSQL execution and runtime RLS/Storage tests remain outstanding.
4. Runtime RLS tests require an explicitly authorized disposable local or isolated environment. Neither existing Supabase project is presumed disposable.
5. Complete iPhone/Safari browser QA.
6. Test email confirmation, redirect allowlist and the complete owner/operator access lifecycle in a controlled environment.
7. Select OCR architecture/provider only after privacy, accuracy, runtime and cost review and explicit approval.
8. Keep PR #123 Draft and unmerged until the user explicitly authorizes a release decision.

## 7. Version history

| Version | Date | Change |
|---|---|---|
| 0.7 | 2026-11-11 | Previous implementation and security review status |
| 0.8 | 2026-11-11 | Records duplicated SQL tail cleanup, separates pre-fix green CI from pending post-fix validation, and clarifies release/database blockers |
