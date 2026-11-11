# PLATO ID Scanner — Operator Access Handover
Version: 0.1
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
- New standalone route: /plato-id-scanner.
- Email/password operator registration and login.
- New accounts remain pending until owner approval.
- Owner can approve, suspend, and return an operator to pending.
- Scanner component accepts approved operators while retaining RLS-limited access.
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
- PR head: 96323a02809efb90911d086986bdde24d3dd4136
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
