# PLATO LAND – Temporary Projects
## R2 + Supabase Media Architecture and Existing Admin Panel Handover

**Version:** 1.5  
**Date:** 2026-11-19  
**Status:** Consolidated architecture reference; implementation and deployment approval are separate.

---

## 1. Scope and precedence

This document applies only to **PLATO LAND – Temporary Projects**. It must not be combined with or used to authorize changes to **PLATO LAND – Main Website**.

This version consolidates:
- The 12 architecture decisions recorded in `PLATO_LAND_R2_Supabase_Media_Architecture_v1.1_2026-11-18.docx`.
- The existing-panel-only, R2 upload, no-migration/no-deletion and release boundaries recorded in `PLATO_LAND_EXISTING_ADMIN_PANEL_R2_ARCHITECTURE_HANDOVER_v1.4_2026-11-19.md`.
- Later explicit owner clarifications recorded in the current project handover.

**Precedence rule:** the later explicit owner instructions in this document supersede any conflicting older migration, cleanup, exposure or privacy language. The original architecture document remains historical evidence, not the controlling operational instruction.

This document does not itself authorize code changes beyond this documentation update, database changes, storage writes/deletes, Cloudflare configuration changes, merge, deployment or publication.

## 2. Current controlling decisions

### 2.1 Service responsibilities

**Cloudflare R2**
- R2 is the binary object store for new media uploads covered by the approved Temporary Projects workflow.
- This includes event images, posters, slides, banners, videos, teasers and future event archives.
- Use the existing bucket `plato-land-media` through the server-side binding `PLATO_MEDIA_BUCKET`, after verifying the binding in the actual target deployment.
- No R2/S3 credentials or secrets may be exposed to browser code.

**Supabase**
- Supabase remains the system of record for authentication, authorization, tournament and registration data, predictions, settings, operational records, metadata and references to media objects.
- Keep existing database relations and business rules intact.
- Do not create another Supabase database or replace the primary database with a preview/test database.

**Upload failure behavior**
- New uploads in the covered workflow must go directly to R2.
- There must be no silent or automatic fallback to Supabase Storage.
- If R2 or its endpoint is unavailable, stop the upload and show a clear error.

### 2.2 Existing admin panel only

The owner must continue using the existing management panel:
- Route: `/series2-slides-manager/`
- Manager component: `Series2SlidesManager`
- Existing Series 3 section mounts `Series3SlidesPanel`.

Do not create a new admin page, separate upload page, separate preview page or parallel panel. The owner should be asked to test only after the change is present in this same existing panel.

### 2.3 Existing files: no migration, copy, reconciliation or deletion

The latest explicit owner instruction controls:
- Do not migrate, copy, move, rename, overwrite, reconcile or delete old objects in Supabase Storage.
- Do not migrate, copy, move, rename, overwrite, reconcile or delete old R2 objects.
- Do not inspect old inventories as a basis for deciding what to upload.
- The owner will manage any personal cleanup and will upload replacement/new files through the existing panel when the new workflow is available.
- Future Series 3 archive uploads are new R2 uploads under the approved archive structure; this is not permission to migrate old files.
- Any future deletion requires a separate, explicit request defining exact scope and a separate confirmation before destructive action.

### 2.4 Public and private access boundary

- Scanner images, Plato ID images, registration evidence and other private/sensitive records must remain private.
- Such records must never be delivered through public media routes or public cache headers.
- Private reads require authenticated/access-controlled delivery with authorization checked for each request.
- Public event media may use a narrowly scoped application delivery endpoint or an explicitly approved media host, only after the public/private boundary has been reviewed.
- Do not enable bucket-wide public access.
- Do not attach or change a custom domain, DNS, Cloudflare Production/Access settings or public-access settings without separate explicit owner approval.
- Series 2 archive content must remain within its approved access rules and must not be exposed publicly by this work.

### 2.5 Key structure and event isolation

Use a documented logical convention under the existing root `plato-land/`, organized by game, series/event and media category. Example:

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

This is a naming convention only; it does not prove that folders or objects exist. Exact keys must come from a verified manifest/allowlist. Never guess an extension or infer an object's existence from a folder name. A slot in one series must never overwrite an object belonging to another series.

For new objects, use unique filenames composed of lowercase English letters, numbers and hyphens (and approved extension syntax); avoid spaces, Persian characters and special characters. Version replacements with identifiers such as `v1`, `v2`; do not rename or modify existing objects as part of applying this convention.

### 2.6 Delivery, caching and mobile optimization

The architecture retains these approved design goals for new media:
- Public media delivery should use the approved media host/CDN architecture when its access boundary and deployment readiness are verified.
- Store canonical object keys/references in Supabase metadata; avoid hardcoding full media URLs in individual records where the application can resolve the approved host centrally.
- Immutable/versioned objects may use long-lived caching. A changed asset should receive a new version/key rather than silently replacing an immutable cached object.
- Images should be optimized for mobile display while preserving the original where the approved processing workflow supports it.
- Slides should load progressively; video should load/play only when needed.
- Exact MIME, size, dimension, cache-control and image-variant implementation limits remain technical specification items; do not invent values. Confirm them against actual platform capabilities before implementation.
- Mobile Safari and the real mobile page are mandatory acceptance targets.

The host `https://media.platoland.org` and root `plato-land/` are recorded in PR #215 as approved architectural values. This does **not** mean the custom domain is currently attached, public access is enabled, or Production configuration may be changed. Verify actual state before relying on the host.

### 2.7 Lifecycle, retention and backup

The logical lifecycle vocabulary remains:
- `Active`
- `Expired`
- `Archived`

Expiry or archival is not permanent deletion. Access should follow the asset's approved public/private policy and lifecycle state. Avoid unnecessary public access or reads for expired/archived content. Permanent deletion is prohibited without the separate explicit owner approval described in §2.3.

For resilience and cost:
- Do not create a paid backup service, extra bucket, service or plan.
- If a no-cost native protection feature is available in the existing account, its availability, suitability and cost must first be verified; do not claim it is enabled unless proven.
- Preserve owner-held originals where the owner chooses to do so.
- Monitor storage, read/write/management operations, data transfer, free-tier consumption and actual monthly cost when reliable account data is available.
- Report abnormal consumption and seek approval before any action that could incur additional cost.
- No paid service, plan upgrade or billable feature may be enabled without explicit approval.

## 3. Target upload workflow in the existing panel

1. Owner signs in through the existing panel and existing Supabase authentication.
2. The existing panel/server verifies owner role; unauthenticated users and ordinary operators cannot upload owner media.
3. Owner selects a fixed, application-defined media slot. Browser file-picker order and local filename must not determine the destination slot.
4. Browser performs immediate type/size validation.
5. Browser sends the file and current Supabase access token to the same-origin Pages Function. No R2 secret is sent to the browser.
6. Server validates same-origin request, identity/role, slot allowlist, MIME type, non-zero size and configured maximum size.
7. Server writes bytes directly to the existing R2 bucket at the server-determined key.
8. Client performs a follow-up HEAD/read verification of the same asset, checking existence, non-zero size and expected media type.
9. Supabase metadata is inserted/updated for that exact canonical R2 key and slot.
10. If the R2 write succeeds but metadata persistence fails, show a distinct partial-failure state and retain safe retry/reconciliation information. Do not report full success.
11. On refresh, the panel reads metadata from Supabase and verifies object existence from R2. Distinguish missing object, metadata error and network/service error.
12. Public/event pages use the approved R2 delivery path for covered media and do not silently fall back to Supabase Storage.

## 4. Existing Series 3 code observations and acceptance gaps

The v1.4 source review at its then-checked commit recorded:
- `Series3SlidesPanel` is mounted inside the existing manager flow.
- It contains 17 slide slots, a poster and a teaser upload control.
- `series3MediaClient.ts` posts to `/api/series3-media` with the Supabase session token.
- `functions/api/series3-media.ts` uses `PLATO_MEDIA_BUCKET`, an allowlist and owner-role verification.
- Series 3 registration checks the 17 slide URLs through the R2 endpoint.
- Supabase continues to hold application settings and registration/application data.

The following are acceptance gaps, not claims of completed fixes:
1. Independently verify every successful upload with HEAD and validate type/size.
2. Replace legacy Supabase `storage_path` values used as media references with the canonical R2 asset key/reference, without changing business rules.
3. Give each refresh/HEAD request explicit network-error handling; do not misreport errors as empty slots.
4. Audit all other Series 3 media managers/read paths before claiming all Series 3 media is R2-backed.
5. Verify that the same-origin API route is served by the deployment that contains the existing management panel.
6. Verify exact manifest keys, MIME, non-zero size and successful GET/HEAD for every required slot.
7. Define safe recovery when R2 write succeeds but Supabase metadata update fails.
8. Verify the 17 slides and relevant public media on the real mobile page and in mobile Safari.
9. Confirm no Supabase Storage upload fallback remains in the covered workflows.

## 5. Telegram and PLATO ID Scanner compatibility

- Telegram text/outbox behavior remains independent of binary media storage. Any poster/image fetch used by announcements must be checked and moved to the approved R2 delivery path only within a separately tested, authorized change. No real Telegram message or destination change is authorized by this document.
- PLATO ID Scanner / Active IDs includes image intake, OCR, human review, archive, Excel reporting and optional/manual Telegram delivery. Scanner images and related registration evidence remain private. Do not infer public access from an older description that characterized images as non-sensitive.
- Any future R2 integration for Scanner must preserve record links, timestamps, OCR results, human review history, archive retrieval and report generation. It requires its own scoped implementation and acceptance tests; this document does not authorize migration of existing Scanner images.

## 6. Release gates and safety

Before any release:
1. Re-read the current branch head, PR and target deployment.
2. Identify the exact Cloudflare Pages deployment serving the owner's existing management URL.
3. Compare its commit with the proposed branch commit.
4. Complete code corrections and automated build/type checks.
5. Test owner rejection, invalid MIME/size, R2 unavailable behavior, R2 write, HEAD verification, metadata update, replacement and refresh persistence.
6. Verify all 17 slide slots and the relevant public/event page on mobile Safari.
7. Verify the absence of Supabase Storage fallback in the covered workflows.

Do not merge to `main`, change Production deployment/configuration, alter bucket access, DNS or custom-domain settings, or publish to the owner's live panel until the exact target and impact are explained and the owner explicitly approves that release action.

A branch commit, successful build, or Preview deployment is not proof that the owner's existing panel has been updated.

## 7. Superseded and retained decisions from architecture v1.1

| Earlier decision | Treatment in v1.5 |
|---|---|
| 1. R2 stores binaries; Supabase stores structured data | Retained; clarified in §2.1. |
| 2. New media to R2; migrate existing Supabase Storage media | Split: new uploads to R2 retained; **all migration/copy/reconciliation of old objects is superseded and prohibited** by §2.3. |
| 3. Game/series/media-category key structure | Retained for new objects; no renaming or moving old objects. |
| 4. Dedicated media host/CDN and canonical references in Supabase | Retained as an architectural goal; actual domain/public configuration remains unverified and requires separate approval. |
| 5. Long-lived caching for immutable versions; mobile optimization; progressive slides/on-demand video | Retained as design goals; exact implementation values remain open technical specifications. |
| 6. Active/Expired/Archived lifecycle; expiry is not deletion | Retained, with explicit no-deletion boundary. |
| 7. Public/private access controls | Retained and strengthened: Scanner, Plato ID and registration evidence are private. |
| 8. Mobile-first media validation/optimization | Retained; exact limits must be specified and verified before implementation. |
| 9. Safe unique filenames and version identifiers | Retained for new uploads only; does not authorize renaming old objects. |
| 10. Low-cost backup and recovery | Retained as a no-additional-cost objective; availability of native protections is unverified. |
| 11. Full migration from Supabase Storage followed by deletion after approval | **Superseded in full** for the current scope. No migration, copying, reconciliation or deletion of old objects. Any future deletion requires a new explicit request and confirmation. |
| 12. Cost/consumption monitoring | Retained, subject to reliable account data and no paid feature without approval. |

Older wording in architecture v1.1 that characterized Scanner images as non-sensitive is superseded by the later explicit private-access requirement in §2.4 and §5.

## 8. Current repository and PR status at v1.5 documentation

- Repository: `Omidso82/Plato-land-preview`
- PR: [#215](https://github.com/Omidso82/Plato-land-preview/pull/215)
- Branch: `feature/temporary-projects-r2-public-media-phase1`
- Base: `main`
- PR status checked immediately before this document update: Open, Draft, Unmerged; mergeable reported true.
- Branch head before this documentation commit: `4a2fb492272250d0d0c476a5579f0291f0549ed5`.
- Cloudflare reported a successful Preview deployment for that head in a PR comment. This is not Production and does not establish that the owner's live management panel has been updated.
- No merge, Production release, Supabase DB/Storage mutation, R2 object mutation or Cloudflare Production configuration change is performed by this documentation update.

## 9. Version history

| Version | Date | Change |
|---|---|---|
| 1.5 | 2026-11-19 | Consolidates the 12 architecture decisions with v1.4 existing-panel handover and later owner instructions; explicitly supersedes old-file migration/deletion and non-private Scanner wording; records lifecycle, naming, cache/mobile, backup and cost decisions. |
| 1.4 | 2026-11-19 | Existing-panel-only architecture, R2/Supabase responsibilities, no-migration/no-deletion boundary, source observations and release gates. |
| 1.1 | 2026-11-18 | Original architecture decisions and Telegram/Scanner compatibility requirements; retained as historical source. |
