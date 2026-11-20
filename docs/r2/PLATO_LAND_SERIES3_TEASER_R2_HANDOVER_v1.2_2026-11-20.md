# PLATO LAND – Temporary Projects
## Series 3 Homepage Teaser: R2 + Supabase Handover

**Document version:** 1.2  
**Date:** 2026-11-20  
**Status:** Both implementation PRs merged; media endpoint Production deployment and main-site deployment verified successful. Ready for owner to perform the first real teaser upload.  
**Scope:** Series 3 teaser only, within PLATO LAND – Temporary Projects.

## 1. Controlling architecture

This release follows `PLATO_LAND_R2_SUPABASE_MEDIA_ARCHITECTURE_HANDOVER_v1.5_2026-11-19`:

- R2 stores the binary teaser through the existing server-side `PLATO_MEDIA_BUCKET` binding.
- Supabase remains the system of record for application settings and the exact R2 object key/reference.
- The teaser does not fall back to Supabase Storage.
- R2 secrets are not exposed to browser code.
- Existing objects are not migrated, copied, renamed, overwritten, reconciled, or deleted.
- The existing Series 3 management panel remains the only management entry point.

## 2. Release record

Repository: `Omidso82/Plato-land-preview`

### 2.1 Endpoint release

- PR #228 merged successfully.
- Source branch: `feature/series3-teaser-r2-endpoint`
- Target Production branch: `feature/temporary-projects-r2-public-media-phase1`
- Merge commit: `b1fff6ced19d6b93cc0b12e2d59905fc8ace8b4e`
- Cloudflare Pages project: `plato-land-media-pages`
- Production deployment: **successful**
- Production deployment URL: `https://b051b239.plato-land-media-pages.pages.dev`
- Deployment timestamp: `2026-11-20T09:00:14.090693Z`
- Production branch: `feature/temporary-projects-r2-public-media-phase1`
- Production binding verified read-only: `PLATO_MEDIA_BUCKET → plato-land`

### 2.2 Admin UI and public-page release

- PR #229 merged successfully.
- Source branch: `feature/series3-teaser-r2-admin`
- Target branch: `main`
- Merge commit: `d42f9a5d7be6ef87132ffaffa3087c62b95176e8`
- GitHub Actions production build: **success**
- GitHub Actions Verify: **success**
- GitHub Pages deployment job for `platoland.org`: **success**
- Cloudflare Pages integration checks for `plato-land-media-pages` and `plato-land-preview`: **success**

## 3. Current admin-panel behavior

In the existing Series 3 media panel, the owner sees the section:

`ویدیوی تیزر صفحه اول (MP4 · حداکثر ۱۰۰ مگابایت)`

Upload behavior:

1. Select a non-empty MP4 file up to 100 MiB.
2. Press `بارگذاری ویدیوی تیزر` (or `جایگزینی ویدیوی تیزر` if one is already registered).
3. The browser uses the current Supabase owner session to authorize the upload.
4. The media endpoint creates a new immutable/versioned R2 key server-side.
5. The client independently checks the R2 object with HEAD and validates size and `video/mp4`.
6. The exact R2 key is saved in the existing `plato_land_series3_home_media_settings.storage_path` field in Supabase.
7. The panel reports success only after R2 HEAD verification and Supabase metadata persistence.

Uploading does **not** automatically switch the public homepage to video mode. After a successful upload, the owner must explicitly activate the existing video-teaser mode control if public playback is desired. Returning to poster mode does not delete the uploaded teaser or its metadata reference.

## 4. Automated verification and known unrelated check

On the merged UI commit, GitHub Actions `build` and `verify` passed; the production deploy job passed. The media Pages production deployment was separately confirmed successful.

The repository also reports a failed check named `Workers Builds: plato-land-media-endpoint`. Its Cloudflare log identifies a separate Worker service with the same name and a missing Wrangler `previews` configuration block. That Worker service has no `PLATO_MEDIA_BUCKET` binding and is not the R2-backed Pages service selected for this feature. No Worker configuration was changed.

The protected preview API required Cloudflare Access sign-in, so a preview-runtime API response was not independently captured. This did not prevent the endpoint Production deployment or the main-site deployment from succeeding.

## 5. First real upload acceptance — pending owner action

No real teaser file has been uploaded by this implementation process. No R2 object has been created by a test upload, and no Supabase metadata write has been performed by this implementation process.

The owner should now upload the actual MP4 through the existing live Series 3 management panel. After that upload, acceptance still requires checking:

- The success message in the panel.
- The exact new object key and object size/content type in R2.
- The matching key saved in Supabase.
- Public playback on the Series 3 homepage, preferably in mobile Safari.

If any step fails, do not repeat uploads blindly; inspect whether the first R2 object was created and whether its metadata was saved before retrying.

## 6. Explicitly out of scope

- Series 3 poster and 17 slides remain on their existing workflow; this release does not migrate them to R2.
- The important-rules video flow remains unchanged.
- No Series 2 media, Scanner/OCR, Plato ID images, registration evidence, or Main Website redesign work is included.
- No schema migration, old-object migration/deletion, DNS change, Cloudflare binding change, or bucket access change was performed.

## 7. Version history

- v1.2 | 2026-11-20 | Records successful merge of PR #228 and #229, verified R2-backed media endpoint Production deployment, successful main-site deployment, admin upload instructions, and pending first real upload acceptance.
- v1.1 | 2026-11-20 | Corrects the teaser API host to the R2-bound `plato-land-media-pages` service; records Cloudflare project/binding distinctions, the unrelated Wrangler Worker Build failure, latest passing UI build/verify checks, and the Cloudflare Access preview limitation.
- v1.0 | 2026-11-20 | Records the Series 3 teaser R2 implementation split across PR #228 and PR #229, validation design, preview checks, runtime limitation, and release gates.
