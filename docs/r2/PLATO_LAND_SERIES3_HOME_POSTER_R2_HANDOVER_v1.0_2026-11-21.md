# PLATO LAND – Series 3 Homepage Poster R2 Handover
Version 1.0 | 2026-11-21 | Status: code merged and deployed; first R2 poster upload pending owner verification

## 1. Scope
This change applies only to the Series 3 homepage fixed poster in PLATO LAND – Temporary Projects.
- Repository: `Omidso82/Plato-land-preview`
- Primary Supabase project: `dfrppbapaaydbjeflozw`
- UI PR: https://github.com/Omidso82/Plato-land-preview/pull/280
- Merge commit: `c34f58d51a468afd8ff350d748c56ec4b58564d6`
- Production GitHub Pages build and deploy workflow run: `44901719916` — success.

PLATO LAND – Main Website, Series 3 registration, 17 slide images, Series 3 rules video, and Series 3 teaser video are out of scope.

## 2. Previous storage state
The existing owner panel stored the Series 3 fixed poster in:
- Supabase Storage bucket: `series3-slides`
- Object path: `poster/series3-main-poster`

The public Series 3 homepage also loaded the poster from that Supabase Storage object when poster mode was active.

## 3. New R2 destination
New poster uploads from the existing owner panel now use the already configured R2 media endpoint and existing bucket:
- Provider: Cloudflare R2
- Bucket binding: `PLATO_MEDIA_BUCKET` → `plato-land`
- Asset endpoint: `https://plato-land-media-pages.pages.dev/api/series3-media?asset=poster`
- Canonical object key: `plato-land/backgammon/series-3/public-media/poster/main-poster`

The existing Pages API allowlist already defines `asset=poster` with this fixed key and supports owner-authenticated POST, public GET/HEAD, and exact allowlisted DELETE. No API code, R2 binding, bucket, secret, DNS or access-policy change was required in PR #280.

## 4. Supabase metadata
Migration name: `series3_home_poster_r2_reference`

New nullable column:
- `public.plato_land_series3_home_media_settings.poster_storage_path`

Purpose:
- Stores the canonical R2 object key for the homepage poster.
- Keeps the existing `storage_path` column dedicated to the teaser video.
- Does not alter `media_mode`, teaser metadata, rules-video metadata or other event data.

The migration was applied to the primary Supabase project and read back successfully. The column exists as nullable text. At handover time the row still had `poster_storage_path = NULL`; this is expected until the first successful owner upload.

## 5. Upload and verification behavior
File: `src/series3PosterClient.ts`
- Accepts JPG, PNG and WEBP up to 10 MiB, with non-zero file size.
- Reads the current Supabase owner session and sends its bearer token to the existing R2 Pages API.
- Uses the fixed application-defined `asset=poster` slot; the local filename does not control the R2 destination.
- Validates the API response asset, exact canonical key and byte size.
- Performs a separate HEAD request and verifies non-zero content length and supported image MIME.

File: `src/Series3SlidesPanel.tsx`
- The existing “پوستر ثابت” upload/replacement control now calls the R2 uploader.
- After R2 upload and HEAD verification, saves the exact key in `poster_storage_path`.
- If R2 succeeds but Supabase metadata update fails, the UI reports partial failure and does not claim full success.
- The panel displays the actual storage provider, bucket, object key and Supabase metadata reference.

File: `src/Series3Gallery.tsx`
- When `poster_storage_path` contains the exact approved key, the public page performs HEAD validation and loads the poster from the R2 Pages endpoint.
- During transition only, if `poster_storage_path` is empty, the public page can still read the existing legacy Supabase poster. This prevents the public page from going blank before the first R2 upload.
- Once the R2 key is saved, the page does not fall back to the legacy Supabase object if the R2 object is missing or invalid.

## 6. Release and tests
- PR #280 merged successfully on 2026-11-21.
- Merge commit: `c34f58d51a468afd8ff350d748c56ec4b58564d6`.
- Build and typecheck workflow run `44901719900`: success.
- Production build/deploy workflow run `44901719916`: success; GitHub Pages upload and deployment to `platoland.org` completed.
- Cloudflare Pages preview for the app branch succeeded on commit `20b3f86`.
- The existing R2 media API endpoint code was not changed by PR #280; the media endpoint's existing asset allowlist was inspected and already supported the fixed poster key.
- A Cloudflare Pages check named `plato-land-media-pages` was still in progress at the last check for the merge commit. The separate similarly named Worker build check failed; that Worker is not the Pages endpoint and was not changed by this task.
- No real poster was uploaded to R2 as part of this code release. No R2 object was deleted or modified.

## 7. Owner's next verification
Do not delete the old Supabase object until the following steps pass:
1. Open the existing owner panel at `https://platoland.org/series2-slides-manager/`.
2. Refresh the page and expand “مدیریت تصاویر و تیزر سری سوم”.
3. In “رسانه اصلی صفحه اول سری سوم” → “پوستر ثابت”, choose the original poster image from the iPhone Files/Photos picker.
4. Tap “جایگزینی پوستر”.
5. Wait for the panel to report successful R2 upload, HEAD verification and Supabase metadata save.
6. Confirm the storage label says Cloudflare R2, bucket `plato-land`, and the exact canonical object key above.
7. Open/refresh `https://platoland.org/series3/` and verify the poster displays while poster mode is selected.
8. Only after all checks pass may the owner remove the legacy Supabase object `series3-slides/poster/series3-main-poster`, if still desired.

Do not upload the screenshot of the management panel as the poster; select the original poster image asset.

## 8. Explicit exclusions and safety
- The old Supabase poster has NOT been deleted, copied, moved, or modified by this change.
- No automatic deletion or migration of legacy files is performed.
- Existing 17 Series 3 slides remain in Supabase Storage and are unchanged.
- Series 3 teaser and important-rules videos remain on their existing R2 paths and their metadata fields are unchanged.
- No new Supabase project, bucket, R2 binding, secret, paid service, DNS record, public bucket setting or Cloudflare Production configuration was created or changed.
- No Main Website code or data was changed.

## 9. Version history
- v1.0 — 2026-11-21: Initial handover for the Series 3 homepage poster R2 upload path, metadata reference, production deployment and pending first owner upload/verification.
