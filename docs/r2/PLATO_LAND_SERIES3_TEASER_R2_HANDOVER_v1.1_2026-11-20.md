# PLATO LAND – Temporary Projects
## Series 3 Homepage Teaser: R2 + Supabase Handover

**Document version:** 1.1  
**Date:** 2026-11-20  
**Status:** Draft implementation updated; automated build and verify passed; production release and real R2 upload acceptance are not approved or completed.  
**Scope:** Series 3 teaser only, within PLATO LAND – Temporary Projects.

## 1. Controlling architecture

This work follows `PLATO_LAND_R2_SUPABASE_MEDIA_ARCHITECTURE_HANDOVER_v1.5_2026-11-19`:

- R2 stores new binary media objects through the existing server-side `PLATO_MEDIA_BUCKET` binding.
- Supabase remains the system of record for application settings, authorization, and the exact media object key/reference.
- New covered uploads must not fall back to Supabase Storage.
- No R2 secrets are exposed to browser code.
- Existing objects are not migrated, copied, renamed, overwritten, reconciled, or deleted.
- The existing management panel remains the only management entry point.

## 2. Repository, PRs and exact deployment targets

- Repository: `Omidso82/Plato-land-preview`
- UI PR #229: `feature/series3-teaser-r2-admin` → `main`
- Endpoint PR #228: `feature/series3-teaser-r2-endpoint` → `feature/temporary-projects-r2-public-media-phase1`
- PR #228 and PR #229 remain Draft, open and unmerged.

### 2.1 Intended R2-backed media service

Read-only Cloudflare dashboard inspection confirmed:

- The intended Pages service is **`plato-land-media-pages`**.
- Its Production branch is `feature/temporary-projects-r2-public-media-phase1`.
- Its latest successful Production deployment at inspection was commit `b3671ac`.
- Its Production R2 binding is present: `PLATO_MEDIA_BUCKET → plato-land-media`.
- Cloudflare showed the same binding available for Preview deployments.
- This is the target service for `functions/api/series3-media.ts` and the R2 media endpoint.

### 2.2 Similarly named services are not interchangeable

Cloudflare also contains other resources named `plato-land-media-endpoint`:

- The Pages project `plato-land-media-endpoint` has a separate build configuration and its own Pages deployment previews.
- A separate Workers Builds service with the same name is also present. Its Production and Previews Base bindings table was empty; it does not have `PLATO_MEDIA_BUCKET`.
- The Workers Build check on the UI branch fails because `npx wrangler preview` requires a `previews` block. This is not the intended R2-backed Pages service.
- A Pages build on the similarly named endpoint project, triggered from `main`, failed during `npx wrangler deploy` because Wrangler 4.165.0 cannot auto-configure the repository's Vite 5.4.14. This is also not the selected R2-backed Pages target.
- The application must not use these similarly named endpoint resources as a substitute for `plato-land-media-pages`.

The separate `plato-land-preview` Pages project is the application preview site; its R2 binding was absent. It is not the media storage service.

## 3. Implementation

### 3.1 Endpoint change — PR #228

File: `functions/api/series3-media.ts`

- Adds a dedicated Series 3 `teaser` asset path using the existing media endpoint and existing R2 binding.
- Every new teaser upload receives a server-generated immutable key:
  `plato-land/backgammon/series-3/public-media/videos/teaser-<timestamp>-<uuid>.mp4`.
- The browser cannot choose or overwrite the R2 key.
- Public GET/HEAD requires a strict versioned teaser key.
- Retains owner authorization for POST, MP4 validation, 100 MiB maximum, approved-origin CORS, and byte-range delivery.
- The previous fixed-key teaser object is not read, overwritten, moved, copied, migrated, reconciled, or deleted.

PR #228 Cloudflare Pages previews for commit `541ac24` reported successful deployments, including `plato-land-media-pages`. The PR remains Draft and unmerged.

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

### 3.3 Corrected API host

The first UI draft pointed the teaser client at `plato-land-media-endpoint.pages.dev`. Cloudflare inspection showed that the R2-bound Pages service is `plato-land-media-pages`, whose existing `series3MediaClient.ts` uses `https://plato-land-media-pages.pages.dev/api/series3-media`.

The teaser client was corrected to use:

`https://plato-land-media-pages.pages.dev/api/series3-media?asset=teaser`

The key-regex escaping was also corrected in the subsequent commit.

## 4. Verification status

Latest UI branch head at this update:

- Branch: `feature/series3-teaser-r2-admin`
- Commit: `0c5929022cbe746bd31c25f5fb947f6b5a2d81b2`

Automated checks on this exact commit:

- GitHub Actions `build`: **passed**.
- GitHub Actions `verify`: **passed**.
- GitHub Actions `deploy`: **skipped**, because this is still a Draft PR.
- Cloudflare Pages preview deployments reported **success** for:
  - `plato-land-media-pages`
  - `plato-land-preview`
  - the similarly named `plato-land-media-endpoint` Pages project.
- The separate **Workers Builds: plato-land-media-endpoint** check failed because its deploy command is `npx wrangler preview` and its Wrangler configuration lacks a `previews` block. This Worker service has no R2 binding and is not the selected media Pages target.

Preview API runtime verification is still incomplete: the `plato-land-media-pages` preview URL redirects to Cloudflare Access sign-in. The connected browser profile is not signed in to that Access-protected preview, so the underlying API response could not be read. No POST request was sent.

No real R2 teaser upload, Supabase metadata write, or mobile playback acceptance test has been performed.

## 5. Explicitly out of scope

- Existing Series 3 poster and 17 slide upload workflows are unchanged by these two PRs; this handover does not claim that every Series 3 media slot is already R2-backed.
- The separate important-rules video flow remains unchanged.
- No Series 2 media, Scanner/OCR, Plato ID images, registration evidence, or Main Website code is changed.
- No database schema migration, database write, R2 object upload, old-object migration/deletion, DNS change, Cloudflare binding/configuration change, bucket access change, or production merge/deployment was performed.
- The similarly named Worker service's Wrangler build configuration has not been modified.

## 6. Release gates and next steps

1. If runtime preview verification is required before release, the owner must sign in through Cloudflare Access for the protected `plato-land-media-pages` preview; no credentials are requested in chat.
2. Verify GET/HEAD rejection of an invalid teaser key and successful response for a valid key in the R2-bound Pages deployment.
3. Confirm the exact target deployment and binding immediately before release.
4. Obtain the owner's explicit approval before merging PR #228 into the existing media Pages Production branch `feature/temporary-projects-r2-public-media-phase1`.
5. After endpoint release and verification, obtain separate explicit approval before merging PR #229 into `main`.
6. Ask the owner to upload the actual teaser from the existing live admin panel. Verify the returned R2 object by HEAD and the matching Supabase key; then test playback in mobile Safari.

No production merge or deployment is authorized by this document.

## 7. Version history

- v1.1 | 2026-11-20 | Corrects the teaser API host to the R2-bound `plato-land-media-pages` service; records Cloudflare project/binding distinctions, the unrelated Wrangler Worker Build failure, latest passing UI build/verify checks, and the Cloudflare Access preview limitation.
- v1.0 | 2026-11-20 | Records the Series 3 teaser R2 implementation split across PR #228 and PR #229, validation design, preview checks, runtime limitation, and release gates.
