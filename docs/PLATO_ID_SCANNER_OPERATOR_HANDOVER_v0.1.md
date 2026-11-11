# PLATO ID Scanner — Operator Access Handover
Version: 0.2
Date: 2026-11-11
Project: PLATO LAND – Temporary Projects
Scope: Scanner-only operator access; isolated from the Main Website feature scope.

## Approved access model
- Owner: can review all scanner images, upload, view and delete images, and approve/suspend operator access.
- Operator: can self-register with email/password, request access, and after owner approval upload, view, and delete only their own scanner images.
- Operators do not receive access to Series 2 poster management, results, prediction reports, or other admin modules.
- One or two additional operators can be added through the same approval workflow.

## Existing infrastructure preserved
- Main Supabase project: dfrppbapaaydbjeflozw.
- Private Storage bucket: plato-id-scans.
- Tables: public.plato_id_scanner_access and public.plato_id_scanner_uploads.
- Existing upload size and MIME constraints remain unchanged.
- Existing uploaded image records are retained.

## Implemented in this change set
- One shared route and login page: /series2-slides-manager.
- Owner signs in with the existing owner account and retains the full temporary Series 2 manager.
- Operators can self-register from the same login page; new accounts remain pending until owner approval.
- Approved operators see only the scanner upload and their own images; pending or suspended users see an access-status message.
- Owner can approve, suspend, and return an operator to pending from the same manager page.
- The separate /plato-id-scanner route and portal have been removed from routing.
- Images are grouped by Persian calendar day using Asia/Tehran.
- Image deletion is limited to owner or approved uploader, with matching Storage and table policies.
- No service-role key is included in frontend code.

## Production database change
Migration applied to the main project:
20261111164812_plato_id_scanner_operator_image_delete

It grants authenticated DELETE privilege on the scanner upload table and adds narrowly scoped RLS policies for owner or approved-self deletion. The migration is also included in this repository branch.

## Current status
- Database migration: applied and verified in the main Supabase project.
- Verified: upload table remains RLS-enabled; delete privilege and both delete policies are present.
- Verified: private bucket remains private; 4 upload records existed at verification time.
- Git branch: feature/plato-id-scanner-operators.
- Pull request: #126 — https://github.com/Omidso82/Plato-land-preview/pull/126
- PR is open and has not been merged.
- CI workflow results were not yet available at the time of this handover. The frontend is therefore not yet confirmed deployed to production.

## Not implemented in this phase
- OCR extraction.
- OCR-generated structured reports or exports.
- Automatic Telegram delivery.

## Required validation before production release
1. Run repository typecheck and production build.
2. Test operator signup, email confirmation (if enabled), login, pending state, owner approval, and approved login.
3. Verify operator A cannot read, sign URLs for, or delete operator B's images.
4. Verify owner can see all images and manage access.
5. Verify upload, preview, delete, and retry/error behavior.
6. Confirm production deployment after PR merge.

## Change log
- v0.1 (2026-11-11): initial operator portal, owner approval workflow, Solar Hijri day grouping, and scoped image deletion.
- v0.2 (2026-11-11): consolidated owner and operator access into the existing /series2-slides-manager URL; removed the separate scanner route; added role-based operator registration/status handling and owner access controls on the shared page.
