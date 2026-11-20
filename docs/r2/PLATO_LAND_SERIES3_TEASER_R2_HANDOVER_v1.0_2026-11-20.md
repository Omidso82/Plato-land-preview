# PLATO LAND – Temporary Projects
## Series 3 Homepage Teaser: R2 + Supabase Handover

**Document version:** 1.0  
**Date:** 2026-11-20  
**Status:** Implementation prepared in two Draft PRs; production release and real R2 upload acceptance are not approved or completed.  
**Scope:** Series 3 teaser only, within PLATO LAND – Temporary Projects.

## 1. Controlling architecture

This work follows `PLATO_LAND_R2_SUPABASE_MEDIA_ARCHITECTURE_HANDOVER_v1.5_2026-11-19`:

- R2 stores new binary media objects through the existing server-side `PLATO_MEDIA_BUCKET` binding.
- Supabase remains the system of record for application settings, authorization, and the exact media object key/reference.
- New covered uploads must not fall back to Supabase Storage.
- No R2 secrets are exposed to browser code.
- Existing objects are not migrated, copied, renamed, overwritten, reconciled, or deleted.
- The existing management panel remains the only management entry point.

## 2. Repository and branches

- Repository: `Omidso82/Plato-land-preview`
- Existing application branch base: `main` at `d8f89e16e7c8193248a99bc0e5285234e39ae324`
- Existing media endpoint branch base: `feature/temporary-projects-r2-public-media-phase1` at `b3671ac46e21e83ae6004fc7b0b69589797514f3`
- UI PR: #229 — `feature/series3-teaser-r2-admin`
- Endpoint PR: #228 — `feature/series3-teaser-r2-endpoint`
- Both PRs are Draft and unmerged.

## 3. Implementation prepared

### 3.1 Endpoint change — PR #228

File: `functions/api/series3-media.ts`

- Adds a dedicated Series 3 `teaser` asset path using the existing media endpoint and existing R2 binding.
- Every new teaser upload receives a server-generated immutable key:
  `plato-land/backgammon/series-3/public-media/videos/teaser-<timestamp>-<uuid>.mp4`.
- The browser cannot choose or overwrite the R2 key.
- Public GET/HEAD requires a strict versioned teaser key.
- Retains owner authorization for POST, MP4 validation, 100 MiB maximum, approved-origin CORS, and byte-range delivery.
- The previous fixed-key teaser object is not read, overwritten, moved, copied, migrated, reconciled, or deleted.

### 3.2 Existing panel and public page — PR #229

Files:
- `src/series3TeaserClient.ts`
- `src/Series3SlidesPanel.tsx`
- `src/Series3Gallery.tsx`

The existing Series 3 panel:
1. Uses the existing Supabase owner session.
2. Sends the selected MP4 to the existing media endpoint.
3. Validates the server-generated key and returned file size.
4. Independently verifies the exact R2 object with HEAD, checking non-zero size, expected size, and `video/mp4` content type.
5. Saves the exact R2 key in the existing `plato_land_series3_home_media_settings.storage_path` field in Supabase.
6. Reports partial failure if the R2 upload succeeds but Supabase metadata persistence fails.

On refresh, the panel reads the key from Supabase and checks the exact object in R2. The public Series 3 page reads the exact key from Supabase and resolves the teaser through the R2 endpoint. No Supabase Storage fallback is used for the teaser.

The existing poster/video mode control is retained. Uploading a teaser does not automatically activate public playback. Switching to poster mode does not clear the saved teaser reference.

## 4. Explicitly out of scope

- Existing Series 3 poster and 17 slide upload workflows are unchanged by these two PRs; this handover does not claim that every Series 3 media slot is already R2-backed.
- The separate important-rules video flow from PR #219 remains unchanged.
- No Series 2 media, Scanner/OCR, Plato ID images, registration evidence, or Main Website code is changed.
- No database schema migration, database write, R2 object upload, old-object migration/deletion, DNS change, Cloudflare binding/configuration change, bucket access change, or production merge/deployment was performed.

## 5. Verification status

- UI branch TypeScript verification and production build: passed at commit `eea0e71b209229da1179a756a8267a79937cb7d3`. After the small state-handling adjustment at `4f6cec79e228e1e73d4327b7babdf5ea1bf5f4ab`, the build passed and all verify steps passed; the final GitHub Actions cleanup step was still running at the last check.
- Existing Deno tests and checks in the repository verification workflow: passed in the same run.
- Cloudflare Pages preview builds for endpoint commit `541ac24cd712de18661d6bad0e7a9973dd16a84b`: successful for `plato-land-media-endpoint`, `plato-land-media-pages`, and `plato-land-preview`.
- Cloudflare Workers Builds check for endpoint commit `541ac24...`: failed. This is an unresolved check and has not been treated as a successful deployment.
- A read-only request to the endpoint preview returned HTTP 503. The preview runtime's R2 binding/object access therefore remains unverified. No upload request was sent.
- No successful real R2 teaser upload or Supabase metadata persistence has yet been demonstrated.

## 6. Release gates

Before enabling owner upload in the live panel:

1. Diagnose the failed Cloudflare Workers Builds check and confirm whether it is required for the existing Pages endpoint or an unrelated integration.
2. Verify the existing `PLATO_MEDIA_BUCKET` binding in the exact endpoint deployment that will serve the live panel.
3. Confirm GET/HEAD for a valid versioned teaser key and strict rejection of invalid keys.
4. Confirm the endpoint preview/runtime returns the expected media response rather than 503.
5. Obtain the owner's explicit approval before merging PR #228 into the existing endpoint production branch.
6. After endpoint deployment is verified, obtain explicit approval before merging PR #229 into `main`.
7. Ask the owner to upload the actual teaser from the existing live admin panel. Verify the returned R2 object by HEAD and the matching Supabase key; then test playback in mobile Safari.

No production merge or deployment is authorized by this document.

## 7. Version history

- v1.0 | 2026-11-20 | Records the Series 3 teaser R2 implementation split across PR #228 and PR #229, validation design, preview checks, runtime limitation, and release gates.
