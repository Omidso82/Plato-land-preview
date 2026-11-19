# PLATO LAND – Temporary Projects
## Existing Management Panel: R2 Upload Architecture & Implementation Handover
**Version:** 1.4  
**Date:** 2026-11-19  
**Status:** Architecture clarification and implementation plan; not a deployment approval.

---

## 1. Scope and controlling decisions

This document applies only to **PLATO LAND – Temporary Projects**. It does not authorize or describe changes to PLATO LAND – Main Website.

The work must extend the **existing temporary management panel**. Do not create a new admin page, a separate upload page, a new preview page, or a parallel panel. The owner must continue to sign in and work from the same existing management entry point:

- Existing management route: `/series2-slides-manager/`
- Existing manager component: `Series2SlidesManager`
- Existing Series 3 management section: the manager's `series3` section, which mounts `Series3SlidesPanel`

The exact live deployment currently serving the owner's panel must be identified before any release action. A code change on an unmerged feature branch is not visible in the owner's live panel.

## 2. Approved storage responsibilities

### Cloudflare R2 — binary media only

All **new media uploads covered by this implementation** must write directly to the existing R2 bucket through a server-side Cloudflare Pages Function:

- Images, posters, slides, banners and event media: R2 object storage.
- Video/teaser files: R2 object storage.
- No browser-side R2 credentials or S3 secrets.
- No upload fallback to Supabase Storage.
- If the R2 binding or upload endpoint is unavailable, stop and show a clear error. Never silently write the file to Supabase Storage.

The existing bucket/binding recorded in the prior handover is `plato-land-media` via `PLATO_MEDIA_BUCKET`. The binding must be rechecked in the target deployment before testing.

### Supabase — application data and authorization

Supabase remains the system of record for:

- Authentication and owner/role verification.
- Tournament, registration, prediction, settings and operational records.
- Media metadata and references required by the application (asset key/path, category, event/series, slot, MIME type, size, timestamps and ownership/audit fields where applicable).
- Existing database relations and business rules.

Supabase Storage must not receive new media uploads for the covered media workflows. Supabase database records and existing application data must not be deleted or replaced as part of this work.

## 3. Existing panel workflow — target behavior

1. Owner opens the existing management route and signs in using the existing Supabase authentication.
2. The existing panel verifies the signed-in user's owner role. A normal operator or unauthenticated visitor cannot upload owner media.
3. Owner selects a specific media slot inside the relevant event/series section. Slot identity is fixed by the application; file-picker order and local filename must never determine which slide or poster is replaced.
4. Browser validates allowed file type and size for immediate feedback.
5. Browser sends the file and current Supabase access token to the same-origin Pages Function endpoint. The token is used only for server-side owner verification; no R2 secret is sent to the browser.
6. Pages Function validates same-origin request, owner identity/role, slot allowlist, MIME type, non-zero size and maximum size.
7. Function writes the binary file directly to the existing R2 bucket at the exact key assigned to that slot.
8. Function returns a successful result only after the R2 write succeeds.
9. Client performs a follow-up HEAD/read check against the same R2 media endpoint. The panel marks the slot as saved only if the object exists and has a valid non-zero size and expected media type.
10. Supabase metadata is then inserted/updated for that same asset key and slot. If metadata persistence fails after the R2 write, the panel must show a distinct partial-failure message and retain enough information for safe retry/reconciliation; it must not claim full success.
11. The existing public/event page reads the media from the R2 delivery endpoint. It does not silently fall back to Supabase Storage.
12. On refresh, the existing panel reads metadata from Supabase and confirms object existence from R2. The UI clearly distinguishes a missing object, a metadata error, and a network/service error.

## 4. Storage key and event isolation

Use a deterministic, documented key convention under the existing root `plato-land/`. A logical example is:

```
plato-land/
  backgammon/
    series-2/
      posters/
      slides/
      videos/
      images/
    series-3/
      posters/
      slides/
      videos/
      images/
    series-4/
      posters/
      slides/
      videos/
      images/
  chess/
  other-games/
```

This is a naming convention, not evidence that every folder or object currently exists. Exact object keys must be registered in a manifest/allowlist; do not guess extensions or infer existing keys from folder names.

Every upload request must resolve to a server-approved event/series + media category + slot. A Series 3 slot cannot overwrite a Series 2 or Series 4 object. The server, not the browser, determines the final object key.

## 5. Public and private media boundary

- Public event media may be delivered through a narrowly scoped application endpoint or an explicitly approved media host after the access boundary has been reviewed.
- Do not enable bucket-wide public access.
- Do not attach a custom domain, change DNS, or alter Cloudflare Production/Access settings without separate explicit approval.
- Scanner images, Plato ID images, registration evidence and other sensitive/private records remain private. They must not use public media routes or public cache headers.
- Private file access must use authenticated, short-lived or otherwise access-controlled delivery, with authorization checked for each request.
- Series 2 archive content must remain within its approved access rules; this work does not expose it publicly.

## 6. Existing Series 3 implementation — verified source observations

At the checked PR head `0a9e646de4c4873fc27ac6060ec90c665bf8e51c`:

- `Series3SlidesPanel.tsx` is mounted inside the existing `Series2SlidesManager` flow; it is not a standalone admin page.
- The panel currently displays 17 slide slots, a poster and a teaser upload control.
- `series3MediaClient.ts` sends uploads to `/api/series3-media` with the Supabase session access token.
- `functions/api/series3-media.ts` uses the `PLATO_MEDIA_BUCKET` binding and an allowlist for poster, teaser, rules and 17 slide slots.
- The function checks owner role through Supabase Auth and `current_user_role`, then writes bytes to R2.
- The Series 3 registration page checks all 17 slide URLs through the R2 endpoint and blocks registration if the complete slide set is unavailable.
- Supabase continues to hold the home media mode setting and registration/application data.

### Required corrections before owner acceptance

The source review identified remaining acceptance gaps; therefore the current code must not yet be described as complete or production-ready:

1. The client currently treats an HTTP-success upload response as success without independently verifying the returned asset by HEAD and checking expected type/size.
2. The panel's media-mode update still writes a legacy `storage_path` value (`series3-video/teaser/series3-home-teaser.mp4`) into Supabase metadata. This must be changed to the canonical R2 asset key/reference, without changing the media-mode business rule.
3. The panel's refresh path uses concurrent HEAD requests without a complete per-request network-error state. Failures must be shown clearly and must not be misreported as empty slots.
4. The panel currently checks R2 for the slide, poster and teaser slots. Other Series 3 media managers/read paths must be audited separately before claiming all Series 3 media has moved to R2.
5. Confirm that the exact same-origin API route is served by the deployed build that contains the existing management panel.
6. Confirm the R2 key manifest, object MIME type, non-zero size and successful GET/HEAD for every required slot before the public page reports the asset as available.
7. Metadata write ordering and recovery must be made explicit so an R2 success followed by a Supabase metadata failure cannot be reported as a complete success.

## 7. Existing data and files — no migration or cleanup

The owner has clarified that the immediate work is **new uploads after the owner's own cleanup/re-upload decision**.

- Do not migrate, copy, move, rename, reconcile or delete old Supabase Storage objects.
- Do not migrate, copy, move, rename, reconcile or delete old R2 objects.
- Do not inspect old inventory as a basis for deciding what to upload.
- Do not execute any deletion. If the owner later requests deletion, obtain a separate explicit scope and confirmation before any destructive operation.
- The owner will upload the replacement images through the existing management panel after the new workflow is available.
- Series 3 archive handling is a separate future task: archive media should be stored in R2 under the approved archive structure, with its access rules preserved. It is not permission to migrate old files now.

## 8. Release and verification plan — no separate Preview page

The goal is to make the change available through the **same existing management panel**. No new page or parallel test panel will be created.

Before release:
1. Re-read the current Git branch head and PR status.
2. Identify the exact Cloudflare Pages deployment/branch that serves the owner's current management URL.
3. Compare that deployment's commit with the branch containing the proposed changes.
4. Complete code corrections and automated build/type checks.
5. Test the same-origin upload API, owner rejection, invalid MIME/size rejection, R2 unavailable behavior, successful R2 write, follow-up HEAD, metadata update, replacement of an existing slot and refresh persistence.
6. Verify all 17 Series 3 slide slots from the public registration page.
7. Verify mobile Safari behavior and clear error messages.
8. Confirm no Supabase Storage upload fallback exists in the covered flow.

Release gate:
- Do not merge to `main`, change the production deployment, change Cloudflare Production settings, or publish to the owner's live panel until the exact deployment target and impact are explained and the owner explicitly approves that release action.
- A PR branch commit, successful build, or a separate Cloudflare deployment is not proof that the owner's existing panel has been updated.
- The owner should only be asked to test after the change is actually present in the same existing panel.

## 9. Current GitHub status at documentation time

- Repository: `Omidso82/Plato-land-preview`
- PR: [#215](https://github.com/Omidso82/Plato-land-preview/pull/215)
- Branch: `feature/temporary-projects-r2-public-media-phase1`
- PR state: Open, Draft, Unmerged
- Checked head: `0a9e646de4c4873fc27ac6060ec90c665bf8e51c`
- Mergeable: true (GitHub metadata at check time)
- The PR is not merged. Its code is therefore not established as present in the owner's current live management panel.
- No Production deployment, Supabase DB/Storage write/delete, R2 object write/delete, or Cloudflare Production configuration change is recorded by this handover.

## 10. Next actions

1. Keep work confined to the Temporary Projects branch and existing manager route.
2. Correct the acceptance gaps listed in section 6.
3. Audit the exact deployment currently serving the existing management panel.
4. Complete automated and controlled verification.
5. Present the precise release target and request approval before any merge/deployment that changes the owner's current panel.
6. After the owner uploads replacement media, verify display on the actual PLATO LAND event page.

## 11. Version history

| Version | Date | Change |
|---|---|---|
| 1.4 | 2026-11-19 | Clarified existing-panel-only architecture, R2/Supabase responsibilities, no-migration/no-deletion boundary, verified source state, implementation gaps and release gates. |
| 1.3 | 2026-11-19 | Previous R2 status correction and handover; retained as historical reference. |
