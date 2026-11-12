# PLATO ID Scanner — Shared Owner/Operator Dashboard

**Document:** PLATO_ID_SCANNER_SHARED_DASHBOARD_v1.0  
**Date:** 2026-11-12  
**Status:** Implementation in review (Draft PR #144)  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only

## 1. Approved direction

Continue using the existing temporary PLATO ID Scanner panel. Do not create a second panel, parallel admin area, separate scanner application, or new route for this work.

Owner and approved Operator use the same dashboard/workspace shell and the same navigation pattern. Owner-only administration remains exclusive to Owner. Operator sees only the currently approved Scanner workspaces. A selected workspace replaces the dashboard view; the workspace provides a return-to-dashboard control.

## 2. Implementation change in this revision

The operator's previous single-purpose scan modal was removed from the operator landing view. The existing `PlatoIdScannerApp.tsx` now presents the operator with the shared full-page dashboard/workspace shell already used by Owner.

Current operator cards:
- Images and upload
- OCR extraction and human review
- Image archive

Owner-only operator-access management and other owner administration remain absent from the Operator dashboard. Existing Scanner processing components and data handling are reused; this revision does not create new Scanner workflows.

## 3. Live backend audit (read-only)

Production project inspected: `dfrppbapaaydbjeflozw`.

The current `public.plato_id_scanner_access` table contains:
- `user_id`
- `email`
- `status` (default `pending`)
- `requested_at`
- `reviewed_at`
- `reviewed_by`

There are no per-workspace permission columns in this table. The current approval model is one broad `approved` state.

Observed RLS policies currently allow an approved operator to read the Scanner uploads collection and the Scanner Storage bucket; upload creation is tied to the operator's own user-ID folder. Review-revision insert policies constrain an operator to uploads whose `operator_id` is their own ID. Report-version policies constrain an operator to records created by that operator. Owner policies grant Owner access.

**Consequence:** The present revision mirrors the current broad approved-Scanner scope in the UI. It does not implement owner-configurable, per-module or per-record permissions. Hiding a card is not a security boundary.

## 4. Explicitly not changed

- No production database schema, data, RLS, Storage policies, RPCs, Auth settings, secrets, or Edge Functions.
- No new database or environment.
- No changes to the PLATO LAND Main Website's unrelated functionality.
- No automatic Telegram sending.
- No merge or production deployment.

## 5. Required next decision / security boundary

If Owner must grant different operators different modules or data ranges, a separate minimal permission model is required in the primary database, with matching RLS and Storage enforcement. This requires a reviewed migration and explicit approval before applying it to production. Until then, the UI must not imply that fine-grained permissions exist.

## 6. Git and verification status

- Repository: `Omidso82/Plato-land-preview`
- Working branch: `ui/plato-id-scanner-shared-workspace-v1`
- Draft PR: https://github.com/Omidso82/Plato-land-preview/pull/144
- Initial code commit: `744475d47b228e3d61ca3f3d493b192622fd7504`
- PR base: `main` at `ff515fc2833f9c938e202ddd9faff4279cbb88f8`
- CI runs triggered: workflow run `43295797483` (build/deploy workflow; PR build only) and `43295797494` (typecheck/build/tests).
- At document creation, both runs were still in progress. Their final results must be checked before marking verification complete.

## 7. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-12 | Record approved shared dashboard direction, existing-panel-only implementation, live permission-model limitation, and PR #144 verification boundary. |
