# PLATO ID Scanner — CI Permission Fix

**Version:** 0.1  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 (Draft; open; unmerged)

## Reason
The queue-migration safety test reads the draft SQL migration using `Deno.readTextFile`. The verification workflow invoked this test without a read permission, so Deno stopped the test module before any assertions ran.

## Before
- TypeScript typecheck: passed.
- Vite production build: passed.
- Series 2 tests and preceding Scanner tests: passed.
- Queue migration safety test: failed before assertions with `NotCapable: Requires read access`.
- Remaining tests were skipped because the workflow stopped at that failure.

## Change
Updated only `.github/workflows/verify.yml` on the Scanner feature branch. The queue migration test now runs with narrowly scoped permission:
`deno test --allow-read=supabase/migrations supabase/functions/_shared/plato-id-scanner-queue-migration.test.ts`

No broad `--allow-all` permission was added. No application code, database schema, Storage, secrets, or production configuration was changed.

## Verification
- Commit: `1f76edf5a43dc139a912630c3839a4c04a05d126`
- GitHub Actions Build and typecheck run: `43035587429`
- At report creation, the run was still in progress; final CI success is not claimed.
- Deploy workflow run: `43035587374`, also in progress at report creation. PR remains Draft and unmerged; no merge or production release was performed by this change.

## Approval boundaries unchanged
Applying any Scanner migration to the primary Supabase project, configuring Google Cloud identity/API/billing, sending a real screenshot to an external OCR provider, merging/deploying, or sending Telegram messages still requires the owner's explicit approval.

## Next safe step
After CI finishes, inspect the queue migration SQL and add isolated dispatcher/worker code and mocked tests on this feature branch only. Do not apply migrations or configure external credentials.
