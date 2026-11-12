# PLATO ID Scanner — Shared Owner/Operator Dashboard

**Document:** PLATO_ID_SCANNER_SHARED_DASHBOARD_v1.4  
**Date:** 2026-11-12  
**Scope:** PLATO LAND – Temporary Projects / existing PLATO ID Scanner panel only  
**Status:** Shared visual shell updated on PR #144 branch; automated checks pending

## 1. Approved user direction

Owner and approved Operator use the same dashboard design and workspace navigation inside the existing temporary management panel. Do not create a second panel, parallel admin route, or separate review page.

The difference between roles is authorization and the available actions:
- Owner retains all existing Scanner administration, including Operator access review and management.
- Approved Operator receives the task-facing Scanner workflow only.
- Both roles retain the same mobile-first dark/gold dashboard visual language and workspace pattern.

## 2. Change recorded in v1.4

On branch `ui/plato-id-scanner-shared-workspace-v1`, the Operator home dashboard was aligned more closely with the existing Owner dashboard:
- Reuses the same ADMIN brandline and hero/header structure.
- Reuses the same title and explanatory copy.
- Adds the same four summary-stat cards, calculated only from the Operator's own permitted uploads.
- Retains the same six task-facing Scanner cards.
- Does not expose the Owner-only Operator access-management card.
- Keeps the same workspace replacement and return-to-dashboard behavior.

The Owner dashboard and its Owner-only controls are not changed by this revision.

## 3. Operator task workspaces

1. Images and upload
2. OCR extraction and human review
3. Image archive
4. Final Plato ID list and exact duplicate review
5. Telegram report preview and manual send to the existing test group
6. Operator-scoped delivery history

## 4. Authorization and data boundaries

- Existing single `approved` Operator state remains sufficient.
- No per-module permission schema is introduced.
- No unrelated website administration is exposed to Operator.
- Operator summary counts and workspaces use only rows already returned within that Operator's existing access scope.
- Existing backend authorization, RLS, Storage, Auth and Edge Function behavior is unchanged by this visual alignment.

## 5. Explicitly unchanged

- No database schema/data, RLS, Storage, Auth, RPC, Secret or Edge Function changes.
- No new database or environment.
- No OCR provider, hosting, billing or quota changes.
- No automatic Telegram sending; manual send and existing test destination remain unchanged.
- No new management page or route.
- No changes to unrelated PLATO LAND Main Website functionality.

## 6. Git and verification

- Repository: `Omidso82/Plato-land-preview`
- Branch: `ui/plato-id-scanner-shared-workspace-v1`
- PR: #144 (base `main`)
- Previous branch head: `1784ce94af85d666bae3ad08e6daa2fd01fb02a5`
- v1.4 UI alignment commit: `c6beafdf5996cd95114cab352c99388e69921dde`
- At document creation, GitHub build, verify and Cloudflare Pages checks were still running. Their final results must be checked before any merge/deployment claim.
- PR #144 remains unmerged at document creation.

## 7. Release boundary

The user has requested that this Scanner dashboard change be applied to the existing temporary management panel, not presented through a separate preview page. Any merge to `main` invokes the repository's configured site deployment workflow. Merge only after confirming the intended PR diff and successful checks, and limit the change to this Scanner component and its documentation. No database or unrelated site changes are included.

## 8. Version history

- v1.0 — 2026-11-12: Initial shared dashboard direction and first implementation.
- v1.2 — 2026-11-12: Expanded Operator workspaces to include final IDs, Telegram report and delivery history.
- v1.3 — 2026-11-12: Recorded successful earlier CI/branch preview and outstanding authenticated visual QA.
- v1.4 — 2026-11-12: Aligns Operator hero and summary cards with the Owner dashboard while preserving role-specific card visibility and Operator-scoped counts.
