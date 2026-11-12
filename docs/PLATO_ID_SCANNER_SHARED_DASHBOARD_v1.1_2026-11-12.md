# PLATO ID Scanner — Shared Owner/Operator Dashboard

**Document:** PLATO_ID_SCANNER_SHARED_DASHBOARD_v1.2  
**Date:** 2026-11-12  
**Status:** Expanded Operator workspace implemented on review branch; CI/preview verification pending  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only

## 1. Approved direction

Continue using the existing temporary PLATO ID Scanner panel. Do not create a second panel, parallel admin area, separate scanner application, or new route for this work.

Owner and approved Operator use the same dashboard/workspace shell and the same navigation pattern. Owner-only administration remains exclusive to Owner. A selected workspace replaces the dashboard view; the workspace provides a return-to-dashboard control.

## 2. User-confirmed permission scope

The user explicitly confirmed that the current temporary Scanner needs only one approved Operator permission scope. The Operator is intended to perform the Scanner work as a whole; there is no requirement to grant different Operators different modules or to expose other areas of PLATO LAND.

Therefore:
- Keep the existing single approval state for Operator access.
- Approved Operator can perform the Scanner tasks needed for this temporary workflow.
- Owner-only administrative functions, especially Operator account approval/management, remain exclusive to Owner.
- Do not add per-module permission settings, a granular permission schema, or new RLS complexity for this temporary panel.
- This is a deliberate scope decision, not an unresolved permission-model blocker.

## 3. Implementation change in this revision

The operator's previous single-purpose scan modal was removed from the operator landing view. The existing `PlatoIdScannerApp.tsx` now presents the operator with the shared full-page dashboard/workspace shell already used by Owner.

Current Operator dashboard cards:
- Images and upload
- OCR extraction and human review
- Image archive
- Final Plato ID list (unique IDs and duplicate review)
- Telegram report (manual preview and sending to the existing test group)
- Delivery history (Operator's own report deliveries)

The Operator now receives the complete task-facing Scanner workspace, not only the three image-processing cards. The existing `GlobalUniqueIdsPanel` is reused for final IDs, report preview/send, and delivery history. The existing `plato-id-scanner-telegram-report` Edge Function already validates a single approved Scanner access state for non-Owner users and scopes delivery history to the authenticated Operator. The report's existing test-group destination and manual-send behavior remain unchanged.

Owner-only operator-access management and other Owner administration remain absent from the Operator dashboard. Existing Scanner processing and reporting components are reused; no parallel workflows or permission schema are introduced.

The approved Operator flow is intentionally limited to the existing temporary Scanner task. It does not provide access to unrelated PLATO LAND website administration.

## 4. Live backend audit (read-only)

Production project inspected: `dfrppbapaaydbjeflozw`.

The current `public.plato_id_scanner_access` table contains:
- `user_id`
- `email`
- `status` (default `pending`)
- `requested_at`
- `reviewed_at`
- `reviewed_by`

The current approval model is one broad `approved` state, which matches the user's confirmed temporary-project requirement.

Observed RLS policies currently allow an approved operator to read the Scanner uploads collection and the Scanner Storage bucket; upload creation is tied to the operator's own user-ID folder. Review-revision insert policies constrain an operator to uploads whose `operator_id` is their own ID. Report-version policies constrain an operator to records created by that operator. Owner policies grant Owner access.

No production schema, RLS, Storage, Auth, RPC, or data changes were made for this dashboard revision.

## 5. Explicitly not changed

- No production database schema, data, RLS, Storage policies, RPCs, Auth settings, secrets, or Edge Functions.
- No new database or environment.
- No changes to the PLATO LAND Main Website's unrelated functionality.
- No automatic Telegram sending.
- No merge to `main` and no production-domain deployment.

## 6. Git and verification status

- Repository: `Omidso82/Plato-land-preview`
- Working branch: `ui/plato-id-scanner-shared-workspace-v1`
- Draft PR: https://github.com/Omidso82/Plato-land-preview/pull/144
- Earlier code commit: `744475d47b228e3d61ca3f3d493b192622fd7504`
- Expanded Operator workspace commit: `e06e3c00b59d65dcdce79b479f7f989b7f296e93`
- This revision's CI and preview status: pending verification.
- PR base: `main` at `ff515fc2833f9c938e202ddd9faff4279cbb88f8`
- Build/typecheck/test workflow run `43295911266`: **success**.
- Preview build workflow run `43295911544`: **success**.
- Cloudflare Pages preview deployment for commit `a14a253`: **success**.
- Preview URL: https://ui-plato-id-scanner-shared-w.plato-land-preview.pages.dev
- Production domain was not updated by this PR.

## 7. Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-12 | Initial shared dashboard implementation and backend audit. |
| 1.1 | 2026-11-12 | Record user's explicit confirmation that one broad approved Operator scope is sufficient for this temporary Scanner; remove granular-permission expansion as a requirement. |
| 1.2 | 2026-11-12 | Expand the Operator dashboard to include final IDs, manual Telegram report preview/send to the existing test group, and Operator-scoped delivery history; keep Owner-only access management exclusive to Owner.
