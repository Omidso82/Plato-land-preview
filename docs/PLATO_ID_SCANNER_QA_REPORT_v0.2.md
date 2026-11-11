# PLATO ID Scanner — QA Report v0.5

**Date:** 2026-11-11  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Open, Draft, unmerged  
**Verified head:** `e8a5d544426b8801f8169e84e3ea63659ae9c67c`  
**Scope:** Feature-branch CI/preview verification, migration source review, and isolated RLS test preparation

## 1. Work completed

- Hardened the Scanner Storage bucket migration: create-if-absent, then verify private visibility, 15 MiB limit, and exact JPG/PNG/WEBP allowlist; mismatches stop the migration rather than silently changing an existing bucket.
- Added an isolated RLS test plan with 18 positive/negative access cases and explicit disposable-environment-only safety boundaries.
- Restricted upload object-key basenames to ASCII letters, digits, underscore, and hyphen; derive extension from validated MIME type. Preserve original filename only as metadata.
- Reviewed the dedicated Scanner route, owner-only navigation gate, and shared Supabase session integration at source level.
- Reviewed the provider-neutral OCR worker contract and its validation tests.

## 2. Latest verified CI and preview

For verified head `e8a5d544426b8801f8169e84e3ea63659ae9c67c`:

- GitHub Actions run `42932984323`: **SUCCESS**.
- Steps passed: npm install, TypeScript typecheck, Vite build, Series 2 qualification tests, Series 2 bracket tests, and Scanner contract tests.
- Cloudflare Pages check `130236575420`: **SUCCESS** for the feature-branch preview.
- These results verify the feature branch build/preview only. They do not mean the main website was deployed or changed.

## 3. Source-level security review

- Scanner tables and Storage policies are still only present as a migration draft.
- Operator access is scoped to the authenticated user's own approved access row and uploads.
- Operator upload-row insert is constrained to own operator ID/path, initial status, and empty OCR result.
- Operator upload-row update/delete privileges are not granted.
- Storage object ownership is scoped by the first path segment; operator deletion is restricted to orphaned objects.
- Existing bucket configuration is checked and mismatches cause an exception.
- The SQL policy statements are one-time migration statements; do not manually replay the file after it has been applied.

This review is static. It is not proof of runtime RLS or Storage isolation.

## 4. Not executed / outstanding

1. RLS-01 through RLS-18 have **not** been executed with synthetic JWT identities.
2. No disposable local Supabase environment has been authorized or confirmed.
3. No Scanner migration has been applied; no Scanner table, bucket, policy, or production object has been created.
4. Auth email confirmation and redirect allowlist remain untested in a live Scanner flow.
5. Browser-based mobile Safari QA remains outstanding.
6. Backend image signature/decode validation is not implemented as a live service.
7. OCR engine/worker runtime, queue, corrections, daily/weekly reports, and Telegram delivery are not implemented.
8. OCR provider/hosting and any paid service remain unselected and require explicit approval.

## 5. Database and release safety

- Primary Supabase project remains unchanged.
- The secondary Supabase project was not used as a staging substitute.
- No database writes, migration execution, bucket creation, or Storage operations were performed.
- No account or operator was created.
- No paid service was enabled.
- PR #123 remains Draft and unmerged.
- No merge or main-site deployment was performed.

## 6. Next safe steps

Continue source-only review and contract/test development on the isolated feature branch. Runtime RLS tests require an explicitly authorized disposable environment. Migration activation, OCR provider/hosting, account creation, Telegram destination and auto-send behavior require separate decisions/approval. Keep PR #123 Draft until the user explicitly authorizes a release decision.
