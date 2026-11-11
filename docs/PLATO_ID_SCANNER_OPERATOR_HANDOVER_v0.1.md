# PLATO ID Scanner — Operator Access Handover
Version: 0.3
Date: 2026-11-11
Project: PLATO LAND – Temporary Projects
Scope: Scanner-only operator access; isolated from the Main Website feature scope.

## Approved access model
- Owner: can review all scanner images, upload, view and delete images, and approve/suspend operator access.
- Approved operator: can upload, view, and delete every image in the shared Scanner archive, including images uploaded by another approved operator.
- Pending or suspended operators cannot access Scanner images or the archive.
- Operators do not receive access to Series 2 poster management, results, prediction reports, or other admin modules.
- Deletion audit logging is intentionally deferred while one operator handles the workflow. Reassess if multiple operators need traceable deletion history.

## Existing infrastructure preserved
- Main Supabase project: dfrppbapaaydbjeflozw.
- Private Storage bucket: plato-id-scans.
- Tables: public.plato_id_scanner_access and public.plato_id_scanner_uploads.
- Existing upload size and MIME constraints remain unchanged (15 MiB; JPG/JPEG, PNG, WEBP).
- Existing uploaded image records are retained unless explicitly deleted by owner or an approved operator.
- Each upload remains an independent record; later uploads do not overwrite previous images.

## Implemented in this change set
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

## Production database changes
Previously applied:
- 20261111164812_plato_id_scanner_operator_image_delete

Applied in this update to the existing main project:
- 20261111171636_plato_id_scanner_shared_archive_access

The latest migration replaces owner/self-only SELECT and DELETE policies with policies permitting the owner or any currently approved Scanner operator to read and delete records and Storage objects within the Scanner bucket only. The bucket remains private; pending/suspended users and anonymous users do not receive this access.

## Verification performed
- Queried live pg_policies after migration.
- Confirmed table policies: shared SELECT and DELETE for owner/approved operators; existing INSERT policy still limits new uploads to the authenticated uploader's own path and approved access.
- Confirmed Storage policies: shared SELECT and DELETE are scoped to bucket plato-id-scans; existing INSERT policy remains uploader/path constrained.
- Confirmed Supabase migration history records plato_id_scanner_shared_archive_access.
- GitHub Actions for head 79f24364430863b575339f8eed57456e080c592c were triggered. At handover time, npm install had passed and typecheck was still running; build and Deno tests were pending.
- No authenticated live owner/operator end-to-end test has been performed.
- No PR merge or production website deployment has been performed.

## Current release status
- Git branch: feature/plato-id-scanner-operators.
- Pull request: #126 — https://github.com/Omidso82/Plato-land-preview/pull/126
- PR remains open and unmerged.
- Main website code and unrelated database areas were not changed by this archive update.
- Main Supabase received only the Scanner-specific RLS/Storage policy migration described above.

## Not implemented in this phase
- OCR extraction.
- OCR-generated structured reports or exports.
- Automatic Telegram delivery.
- Deletion audit log.

## Remaining validation before release
1. Confirm GitHub Actions typecheck, build and Deno tests pass for the latest head.
2. Test owner and approved operator access with real authenticated sessions in a controlled manner.
3. Verify an approved operator can view/sign URLs for/delete another uploader's image.
4. Verify pending/suspended users cannot read or delete Scanner images.
5. Verify current-day/archive separation around Iran midnight and the full archive beyond 200 rows.
6. Complete iPhone/Safari QA.
7. Merge PR and confirm production deployment only after explicit owner release approval.

## Change log
- v0.1 (2026-11-11): initial operator portal, owner approval workflow, Solar Hijri day grouping, and scoped image deletion.
- v0.2 (2026-11-11): consolidated owner and operator access into the existing /series2-slides-manager URL; removed the separate scanner route; added role-based operator registration/status handling and owner access controls on the shared page.
- v0.3 (2026-11-11): introduced shared current-day/archive UI, full-history pagination, approved-operator-wide image viewing/deletion through narrowly bucket-scoped RLS/Storage policies, and deferred deletion audit logging.
