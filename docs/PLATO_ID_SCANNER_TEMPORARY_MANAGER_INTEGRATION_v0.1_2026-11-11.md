# PLATO ID Scanner — Temporary Manager Integration

**Document version:** 0.1  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Integration branch:** `feature/plato-id-scanner-temporary-manager-integration`  
**Source branch:** `feature/plato-id-scanner-v0-1`  
**Status:** Source integration prepared; CI and live UI verification pending.

## 1. Goal

Make the owner-facing PLATO ID Scanner available inside the existing temporary Series 2 manager at `/series2-slides-manager`, without sending the owner to a separate Scanner page. Keep the independent `?page=id-scanner` entry point for operator registration and sign-in.

## 2. Integration performed

- Added the Scanner component import to `src/Series2SlidesManager.tsx`.
- Added a collapsible **PLATO ID Scanner** section inside the existing owner-only temporary manager.
- The Scanner is mounted as `<PlatoIdScannerApp ownerMode embedded />`.
- The existing manager continues to verify the authenticated user against `public.user_roles.role = 'owner'`.
- Scanner's `ownerMode` performs its own server-backed `current_user_role` verification and fails closed for non-owners.
- Added an embedded presentation mode to avoid a second full-screen shell and hide the duplicate Scanner brand header.
- Preserved the independent operator route `?page=id-scanner` and its email/password registration/login flow.
- Preserved the existing poster, Series 2 results and prediction report sections.

## 3. Branch and history safety

The Series 2 manager branch and Scanner branch had diverged. The integration branch was therefore created from the Scanner feature branch, which already contains the current temporary manager source, the `/series2-slides-manager` route in `src/index.tsx`, and the Scanner operator route in `src/App.tsx`. The manager branch's distinct older commits were not blindly merged.

## 4. Files changed

- `src/Series2SlidesManager.tsx` — embedded Scanner entry and collapsible owner section.
- `src/PlatoIdScannerApp.tsx` — optional `embedded` presentation prop; owner-mode authorization unchanged.
- `src/plato-id-scanner.css` — compact embedded styles.

## 5. Security and production boundaries

- No changes to `main`.
- No production deployment or Cloudflare release initiated by this integration.
- No Supabase migration executed; no Scanner table, bucket or policy created.
- No operator account created.
- No OCR provider/worker or paid service enabled.
- No Telegram message sent and no destination/token configured.
- No tournament results, registration, prediction votes or progression data changed.

## 6. Validation status

Source-level checks confirmed:
- Scanner import and collapsible entry exist in the manager component.
- Embedded prop is accepted and applied to the Scanner root.
- Embedded CSS rules are present.
- `src/index.tsx` still routes `/series2-slides-manager` to `Series2SlidesManager`.
- `src/App.tsx` still routes `?page=id-scanner` to the operator Scanner app.

Pending:
- GitHub Actions typecheck/build and Deno suites for the integrated head.
- Authenticated owner UI verification in the actual temporary manager.
- Operator account / email confirmation / approval flow test.
- Backend OCR, review correction persistence, report outbox, Telegram sender/scheduler and RLS verification remain separate incomplete work.

## 7. Next step

Run CI on the integrated feature head. If all checks pass, provide the preview URL for owner UI verification. Production merge/deployment and any Supabase migration remain subject to separate explicit authorization.
