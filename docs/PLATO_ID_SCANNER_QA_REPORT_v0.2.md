# PLATO ID Scanner — QA Report v0.3

**Date:** 2026-11-11  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Draft  
**Scope:** Storage bucket migration hardening and isolated RLS test preparation

## 1. Work completed

### 1.1 Storage bucket contract hardening
Updated `supabase/migrations/20261111000100_plato_id_scanner_foundation.sql`.

Previous behavior:
- The migration inserted the Scanner bucket with `ON CONFLICT(id) DO NOTHING`.
- A pre-existing bucket with the same ID but weaker or incorrect settings could be silently accepted.

New behavior:
- The migration still creates the bucket only when it is absent.
- It then verifies the existing row has the exact expected contract:
  - ID/name: `plato-id-scans`
  - `public = false`
  - `file_size_limit = 15728640` bytes (15 MiB)
  - allowed MIME types exactly JPG, PNG, WEBP.
- Any mismatch raises an exception and stops the migration. The migration does not automatically overwrite an existing bucket.

### 1.2 RLS isolation test preparation
Added `docs/PLATO_ID_SCANNER_RLS_TEST_PLAN_v0.1.md`.
- 18 test cases cover operator self-access, cross-operator isolation, pending status, insert constraints, Storage path ownership, orphan cleanup, and owner access.
- Additional negative tests cover anonymous access and invalid operator actions.
- The plan explicitly prohibits running against the primary database or assuming the second Supabase project is staging.

## 2. Verification performed

| Check | Result |
|---|---|
| Feature branch exists | PASS |
| Latest migration file fetched back from GitHub | PASS |
| Bucket validation block present in fetched file | PASS |
| RLS test plan fetched back from GitHub | PASS |
| Branch comparison against main | PASS — 17 commits ahead, 0 behind |
| PR #123 found open | PASS |
| Main database changed | NO |
| Migration applied anywhere | NO |
| RLS tests executed | NO |
| Production deploy performed | NO |

## 3. GitHub Actions status

The available commit-workflow lookup returned no PR-triggered workflow runs for the latest commit at the time of this check. The deployment workflow file was inspected:
- It listens to pushes on `main` and pull requests targeting `main`.
- Its deploy job is guarded by `github.ref == 'refs/heads/main'`; therefore a feature-branch/PR run does not satisfy the deploy condition.

A complete live Actions run list was not available through the connected GitHub action set during this check. Do not treat Actions as passed until the run is directly verified in GitHub.

## 4. Migration idempotency note

The table and index creation statements use `IF NOT EXISTS`. The policy creation statements do not use conditional guards and the SQL file must be treated as a one-time versioned migration, not manually replayed. Apply it only through the Supabase migration ledger in a disposable, explicitly authorized environment. Do not manually rerun it against the primary project.

## 5. Outstanding risks / not yet verified

1. No disposable local Supabase environment has been provisioned or confirmed.
2. RLS-01 through RLS-18 remain unexecuted.
3. Storage policy behavior and cross-user isolation have not been tested with real JWT identities.
4. File signature, decoded image dimensions, and actual MIME validation remain backend requirements; client MIME checks are not sufficient.
5. Auth confirmation and redirect allowlist remain untested.
6. OCR engine, queue/worker, reporting, and Telegram delivery are not implemented.
7. Bucket schema validation is static only; the new migration has not been executed.

## 6. Safety and release status

- Primary Supabase project remains unchanged.
- No migration, bucket, policy, table, or production Storage object was created.
- No Worker, Queue, OCR provider, paid service, or new account was created.
- PR #123 must remain Draft.
- No merge or production deployment is authorized by this report.

## 7. Latest follow-up review

- The current upload UI path generator was reviewed against the worker contract. Original filenames could contain dot sequences or path-like characters after the earlier replacement-based sanitization.
- Updated the feature branch to construct a restricted object-key basename and derive the extension from the validated MIME type. The original filename remains in metadata.
- This is a source-level correction only; it has not been exercised in a browser or against Storage because the Scanner bucket and policies do not exist in the primary database.
- CI for the new head must pass before treating this change as verified.

## 8. Next step

Before any database-level test, identify and explicitly authorize a disposable local/test Supabase environment. Then execute the RLS test matrix there and record evidence. If no such environment is available, continue with static review only; do not substitute either existing Supabase project without explicit confirmation.
