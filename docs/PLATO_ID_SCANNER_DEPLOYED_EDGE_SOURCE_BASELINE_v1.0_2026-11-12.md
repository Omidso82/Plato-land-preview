# PLATO ID Scanner — Deployed Edge Source Baseline
Version: 1.0
Date: 2026-11-12
Project: PLATO LAND – Temporary Projects
Primary Supabase project: dfrppbapaaydbjeflozw

## Purpose
This commit restores the exact deployed source snapshots of the Scanner Edge Functions to GitHub for reproducibility. It does not change runtime behavior and does not deploy functions.

## Captured production versions
- plato-id-scanner-worker: ACTIVE, version 4
- plato-id-scanner-dispatch: ACTIVE, version 5

## Source mapping
- Worker entrypoint and shared modules were copied verbatim from the active function source returned by Supabase on 2026-11-12.
- Dispatch entrypoint and shared validation module were copied verbatim from the active function source returned by Supabase on 2026-11-12.
- Shared validation exists in both function-local _shared directories because each deployed function resolves its own relative imports.

## Safety
- No Supabase migration was applied.
- No Edge Function was deployed or changed.
- No OCR request was made.
- No image, upload, OCR result, or review revision was changed.
- No Main Website source or database object was modified.

## Known source completeness limitation
The deployed worker snapshot references the type-only module `plato-id-scanner-contract.ts`, but the active function source bundle returned by Supabase did not include that file. Before any function redeployment, this module must be recovered from the repository or the deployment artifact and the restored source must pass Deno checks. This baseline is for source recovery/review only, not yet deployable.

## Change log
- v1.0 — 2026-11-12 — Restored the deployed Worker v4 and Dispatch v5 source snapshots for review; no runtime changes.
