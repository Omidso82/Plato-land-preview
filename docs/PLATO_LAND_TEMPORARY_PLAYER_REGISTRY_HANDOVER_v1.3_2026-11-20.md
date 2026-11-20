# PLATO LAND – Temporary Player Registry & Player Bank
Version 1.3 | 2026-11-20

## Scope
Temporary Projects only: Series 2 and Series 3. No Main Website profiles or unrelated data changed.
Repository: `Omidso82/Plato-land-preview`
PR: https://github.com/Omidso82/Plato-land-preview/pull/243
Branch: `feature/temporary-player-registry-history`
Primary Supabase: `dfrppbapaaydbjeflozw`

## Implemented work
- Persistent normalized Plato ID registry, series participation, match ledger and event stats view.
- Owner-only Player Bank UI mounted in existing `/series2-slides-manager/` management panel.
- Search, player profiles, registration history, per-series totals, opponent and match detail.
- Read-only UI; no writes to source registration/result tables.
- Stats view hardened with `security_invoker = true`; non-owner role simulation returned zero rows from the view and three registry/history tables.

## CI validation workflow
Added `.github/workflows/temporary-player-bank-validation.yml` on the feature branch.
It is configured for PR changes to run:
1. `npm ci`
2. `npm run typecheck`
3. `npm run build`

The workflow was committed as `cd70f8497c8eaef3c0d5779a7424a520f1d60ca1`. GitHub workflow-run lookup and commit combined-status lookup returned no runs/statuses. Therefore this workflow has not produced a verified test result. Do not describe TypeScript or Vite build as passed.

## Cloudflare preview evidence
PR comments show the app preview and media-pages preview successfully deployed for commit `91501f7`:
- `https://b54a391a.plato-land-preview.pages.dev`
- `https://b9556f9b.plato-land-media-pages.pages.dev`

The separate `plato-land-media-endpoint` service had failed builds reported for commits `d9123be`, `dcb6e50`, and `91501f7`. A later build for `cd70f84` was reported as in progress in the latest available comment. Exact failure logs could not be retrieved in this step. These endpoint failures are unresolved; they must not be assumed to be caused by the Player Bank UI. No production deployment or main-branch change is claimed.

## Current PR state
Latest PR read-back:
- PR #243 open, draft=true, merged=false, mergeable=true.
- Latest head: `cd70f8497c8eaef3c0d5779a7424a520f1d60ca1`.
- No merge or production release performed.

## Remaining work
1. Retrieve exact Cloudflare media-endpoint build logs and determine whether the failure is pre-existing/unrelated or caused by branch changes.
2. Obtain a real TypeScript/build result. The added GitHub Actions workflow has not returned a run.
3. Test actual Owner sign-in and Player Bank data loading.
4. Complete iPhone visual QA.
5. Review PR and wait for explicit user approval before merge/deployment.

## Version history
- v1.3 — 2026-11-20: Adds a dedicated CI validation workflow and records current Cloudflare preview/build evidence and unresolved checks.
- v1.2 — 2026-11-20: Stats view invoker security and non-owner RLS simulation.
- v1.1 — 2026-11-20: Player Bank UI in existing Owner panel.
- v1.0 — 2026-11-20: Persistent registry and match-history database foundation.
