# PLATO ID Scanner — Operator Access Handover
Version: 0.6
Date: 2026-11-11
Project: PLATO LAND – Temporary Projects
Scope: Scanner-only operator access; isolated from the Main Website feature scope.

## Approved access model
- Owner: can review all scanner images, upload, view and delete images, and approve/suspend operator access.
- Approved operator: can upload, view, and delete every image in the shared Scanner archive, including images uploaded by another approved operator.
- Pending or suspended operators cannot access Scanner images or the archive.
- Operators do not receive access to Series 2 poster management, results, prediction reports, or other admin modules.
- Deletion audit logging is intentionally deferred in this phase. Reassess if multiple operators need traceable deletion history.

## Existing infrastructure preserved
- Main Supabase project: dfrppbapaaydbjeflozw.
- Private Storage bucket: plato-id-scans.
- Tables: public.plato_id_scanner_access and public.plato_id_scanner_uploads.
- Existing upload size and MIME constraints remain unchanged (15 MiB; JPG/JPEG, PNG, WEBP).
- Existing uploaded image records are retained unless explicitly deleted by owner or an approved operator.
- Each upload remains an independent record; later uploads do not overwrite previous images.

## Implemented behavior
- One shared route and login page: /series2-slides-manager.
- Owner signs in with the existing owner account and retains the full temporary Series 2 manager.
- Operators can self-register from the same login page; new accounts remain pending until owner approval.
- Owner can approve, suspend, and return an operator to pending from the same manager page.
- The separate /plato-id-scanner route and portal have been removed from routing.
- Scanner images are grouped by Solar Hijri date using Asia/Tehran, independent of the phone/browser timezone.
- Current-day images are displayed separately from the archive. At Iran midnight, the prior date is automatically classified as archived; no scheduled job or data-moving task is needed.
- Archive dates are selectable; choosing a date displays that date's images.
- The archive fetch uses stable 500-row pagination and continues until all records are read; the former 200-row cap is removed.
- Owner and approved operators can view and delete all images in the shared private Scanner bucket/table.
- Upload creation remains restricted to the authenticated uploader's own UUID path.
- No service-role key is included in frontend code.
- Each image card includes a delete control and a confirmation step before deletion is attempted.

## Production database changes
Applied to the existing main project:
- 20261111164812_plato_id_scanner_operator_image_delete
- 20261111171636_plato_id_scanner_shared_archive_access

The shared-archive migration replaces owner/self-only SELECT and DELETE policies with policies permitting the owner or any currently approved Scanner operator to read and delete records and Storage objects within the Scanner bucket only. The bucket remains private; pending/suspended users and anonymous users do not receive this access. INSERT remains constrained to the authenticated uploader's own path and approved access.

## Verification and release record
- Queried live pg_policies after migration.
- Confirmed table policies: shared SELECT and DELETE for owner/approved operators; INSERT remains uploader/path constrained.
- Confirmed Storage policies: shared SELECT and DELETE are scoped to bucket plato-id-scans; INSERT remains uploader/path constrained.
- Confirmed Supabase migration history records plato_id_scanner_shared_archive_access.
- Implementation PR #126: https://github.com/Omidso82/Plato-land-preview/pull/126
- PR #126 was squash-merged into main. Merge commit: afb92bc674aaadf1a6f33a9f07c193c39df3f1a1.
- Post-merge GitHub Actions Build and Verify checks completed successfully.
- Post-merge Cloudflare Pages deployment check completed successfully and reported "Deployed successfully".
- Cloudflare Pages branch deployment URL: https://main.plato-land-preview.pages.dev
- User confirmed that the delete button is now visible in the deployed Scanner UI after the earlier display issue.
- User subsequently confirmed that image deletion completed successfully. This verifies the delete flow at least once in the live UI; broader multi-user/role-matrix deletion QA remains outside this single confirmation.
- No deletion of the four existing images was performed as part of the display troubleshooting.
- Main Website scope and unrelated database areas were not intentionally changed by this Scanner-specific work. The only production database changes in scope are the two Scanner migrations listed above.

## Current release status
- Git branch: main.
- PR #126: merged and closed.
- Merge commit: afb92bc674aaadf1a6f33a9f07c193c39df3f1a1.
- Build, Verify, and Cloudflare Pages deployment checks: successful.
- User-visible delete control: confirmed visible by the user.
- End-to-end delete behavior: user-confirmed successful image deletion.
- Main Supabase project remains the source of truth; no preview database was introduced.

## Not implemented in this phase
- OCR extraction.
- OCR-generated structured reports or exports.
- Automatic Telegram delivery.
- Deletion audit log.

## Remaining validation
1. With explicit user approval, test deletion using a disposable/test image; do not use one of the four existing images as a test.
2. If multi-operator operation expands, reassess whether deletion audit logging is required.
3. Continue routine iPhone/Safari checks for the operator and owner workflows as needed.

## Change log
- v0.1 (2026-11-11): initial operator portal, owner approval workflow, Solar Hijri day grouping, and scoped image deletion.
- v0.2 (2026-11-11): consolidated owner and operator access into the existing /series2-slides-manager URL; removed the separate scanner route; added role-based operator registration/status handling and owner access controls on the shared page.
- v0.3 (2026-11-11): introduced shared current-day/archive UI, full-history pagination, approved-operator-wide image viewing/deletion through narrowly bucket-scoped RLS/Storage policies, and deferred deletion audit logging.
- v0.4 (2026-11-11): records successful implementation CI and clarifies that the separate preview/deployment workflow was cancelled before build/artifact preparation.
- v0.5 (2026-11-11): records PR #126 squash merge, successful post-merge Build/Verify and Cloudflare Pages deployment checks, user confirmation that the delete control is visible, and the remaining need for a controlled end-to-end deletion test.
- v0.6 (2026-11-11): records the user's confirmation that image deletion completed successfully; the basic live delete flow is no longer pending.
