# PLATO ID Scanner — QA Report

**Document version:** 1.0  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Open, Draft, unmerged  
**Scope:** Feature-branch CI/preview verification, migration source review and isolated RLS test preparation

## 1. Verified baseline before the latest source correction

For commit `ba7bbf040f7a6e8c3afc36fc1546ce5a2a77fb08`:

- GitHub Actions run `42934159521`: verify job **SUCCESS**.
- Passed: npm install, TypeScript typecheck, Vite build, Series 2 qualification tests, Series 2 bracket tests and Scanner contract tests.
- GitHub Actions run `42934159360`: build job **SUCCESS**; deploy job **SKIPPED** on the feature branch.
- Cloudflare Pages check for this commit: **SUCCESS**.
- Branch preview: https://feature-plato-id-scanner-v0.plato-land-preview.pages.dev
- Commit preview: https://c9bb03e1.plato-land-preview.pages.dev

These checks apply to `ba7bbf...` only.

## 2. Latest source-only correction after that baseline

Static inspection of `supabase/migrations/20261111000100_plato_id_scanner_foundation.sql` found duplicated trailing SQL fragments after the complete Storage delete policy. The duplicate tail made the migration source malformed.

- The duplicated tail was removed on the isolated feature branch.
- Correction commit: `72eaa6c75d44f64f0dc6ee157fcf7c0a2b6f972e`.
- Static post-edit checks confirmed eight unique policy declarations, two dollar-quote delimiters for the bucket validation block, and a complete final policy terminator.
- The migration was fetched back from GitHub after the edit in order to verify the saved source.
- This was source-only. It has NOT been executed by PostgreSQL, applied to Supabase, or runtime-tested.
- CI and Cloudflare preview for the correction and subsequent documentation commits must be checked separately; earlier green results do not validate later commits.

## 3. Documentation synchronization

The following feature-branch documents were synchronized:

- Implementation Status: v0.8 — records the migration cleanup and separates pre-fix green checks from pending post-fix validation.
- RLS Isolation Test Plan: v0.3 — RLS-06/RLS-07 now require the exact operator UUID / scan UUID / safe filename path, consistent with the migration contract.
- QA Report: v0.9 — this report.

Literal `\\n` artifacts from the previous QA/RLS documents were removed in the revised documents.

## 4. Source-level security scope and limitations

- Scanner access/uploads tables, RLS and the private bucket exist only in the draft migration source.
- Operator upload-row insert requires own operator ID, exact path shape, initial `uploaded` status and empty OCR result.
- Operator upload-row update/delete privileges are not granted.
- Storage object keys are constrained to exactly two folder segments plus a safe filename.
- A syntactically valid upload-row path does not prove that the referenced Storage object exists.
- Source review is not proof of runtime RLS or Storage isolation.

## 5. Not executed / outstanding

1. RLS-01 through RLS-18 have not been executed with synthetic JWT identities.
2. No disposable local Supabase environment has been authorized or confirmed.
3. No Scanner migration has been applied; no Scanner table, bucket, policy or production object has been created.
4. Auth email confirmation and redirect allowlist remain untested in a live Scanner flow.
5. Browser-based iPhone/Safari QA remains outstanding.
6. Backend image signature/decode validation is not implemented as a live service.
7. OCR engine/worker runtime, queue, corrections, daily/weekly reports and Telegram delivery are not implemented.
8. OCR provider/hosting and any paid service remain unselected and require explicit approval.
9. PostgreSQL syntax/runtime validation of the corrected migration remains outstanding.

## 6. Database and release safety

- Primary Supabase project `dfrppbapaaydbjeflozw` remains unchanged according to the last read-only audit.
- The secondary Supabase project was not used as an assumed staging substitute.
- No database writes, migration execution, bucket creation or Storage operations were performed.
- No account or operator was created.
- No paid service was enabled.
- PR #123 remains Draft and unmerged.
- No merge or main-site production deployment was performed.

## 7. Next safe steps

1. Verify GitHub Actions and Cloudflare Pages for the latest branch head after the migration cleanup and documentation updates.
2. If checks fail, inspect logs and correct only the isolated feature branch.
3. Continue source-only migration/security review.
4. Run RLS/Storage tests only in an explicitly authorized disposable environment.
5. Keep all activation, production migration, account creation, OCR provider/hosting, Telegram destination and automatic delivery decisions gated by separate approval.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 0.8 | 2026-11-11 | Previous QA report and source-only policy hardening record |
| 0.9 | 2026-11-11 | Records malformed duplicate migration tail cleanup, corrects validation chronology and aligns RLS test references |
| 1.0 | 2026-11-11 | Records successful final-head CI and Cloudflare preview verification |
