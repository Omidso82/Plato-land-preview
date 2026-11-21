# PLATO LAND – Series 3 Homepage Poster R2 Handover
Version 1.3 | 2026-11-21 | Status: R2 upload/delete UI, public URL correction and border removal merged; production deployment successful

## 1. Scope
Series 3 fixed homepage poster only, within PLATO LAND – Temporary Projects.
- Repository: `Omidso82/Plato-land-preview`
- Upload/public display implementation: PR #280, merge commit `c34f58d51a468afd8ff350d748c56ec4b58564d6`
- Delete control: PR #283, merge commit `ff43390f07a2c8d663771a36aa045a92f41a163f`
- Public poster URL correction: PR #286, merge commit `a05f343a5b23b0e187015d10e0816735eec9852d`
- Remove gold frame around public poster: PR #290, merge commit `4414dfa34e99116e011b5faacd83829a700f3e57`
- Main branch at this handover: `4414dfa34e99116e011b5faacd83829a700f3e57`

## 2. Canonical R2 destination and metadata
- Cloudflare R2 bucket binding: `PLATO_MEDIA_BUCKET` → `plato-land`
- Canonical poster object key: `plato-land/backgammon/series-3/public-media/poster/main-poster`
- R2 Pages endpoint: `https://plato-land-media-pages.pages.dev/api/series3-media?asset=poster`
- Supabase metadata: `public.plato_land_series3_home_media_settings.poster_storage_path`
- Existing `storage_path` remains dedicated to the teaser video.
- No new database, bucket, binding, secret, DNS or production access configuration was created.

## 3. Public display URL correction (PR #286)
The public page `src/Series3Gallery.tsx` previously appended `?v=` to an endpoint URL that already contained `?asset=poster`, creating an invalid query string.
- Corrected cache-busting parameter to use `&v=`.
- URL-construction-only change; no R2 object or Supabase metadata changed.

## 4. Public poster frame removal (PR #290)
User requested removal of the gold frame around the public Series 3 homepage poster.
- Removed the outer wrapper's gold border, dark background and padding.
- Preserved the poster image, responsive sizing, image corner radius and spacing below the poster.
- File changed: `src/Series3Gallery.tsx`.
- No upload, deletion, storage path, API, metadata, or other page behavior changed.
- No media object was uploaded, deleted or modified by PR #290.

## 5. Upload and delete behavior
- Existing owner panel uploads/replaces the fixed Series 3 poster in R2 and verifies the returned canonical key, size and public HEAD response before saving the Supabase reference.
- Owner panel provides a separate `حذف پوستر` button with a second explicit confirmation.
- R2 deletion is limited to the exact canonical poster key, requires the Supabase reference to match, clears the reference first, calls the owner-authenticated Pages API DELETE, and relies on server-side HEAD-before/after deletion verification.
- If deletion fails after metadata clear, the UI attempts to restore the metadata reference and reports rollback failure.
- Legacy Supabase poster removal is limited to the exact path `series3-slides/poster/series3-main-poster`, and only when no R2 poster reference exists. The UI verifies absence from the folder listing.
- Deletion does not automatically change `media_mode`; if poster mode is active and the poster is deleted, no fixed poster will display until a replacement is uploaded or the owner changes mode.
- No media object is deleted automatically.

## 6. Release verification for PR #290
- PR #290 merged successfully.
- Merge commit: `4414dfa34e99116e011b5faacd83829a700f3e57`.
- Build workflow run `44915231112`: success.
- Build and typecheck workflow run `44915231207`: success.
- Cloudflare Pages `plato-land-media-pages`: success.
- Cloudflare Pages `plato-land-media-endpoint`: success.
- Cloudflare Pages `plato-land-preview`: success.
- The separate `Workers Builds: plato-land-media-endpoint` check reported failure. It is a distinct similarly named Worker service and was not modified. It is not the Pages API deployment.
- Production site deployment completed successfully.

## 7. Owner verification after release
1. Open `https://platoland.org/series2-slides-manager/`.
2. Refresh and expand “مدیریت تصاویر و تیزر سری سوم”.
3. Confirm the fixed poster preview and storage details show Cloudflare R2, bucket `plato-land`, and the canonical key above.
4. Open `https://platoland.org/series3/` and refresh. Confirm the poster displays without the outer gold frame.
5. Do not delete any remaining legacy Supabase object until R2 upload and public display have been verified.

## 8. Explicit exclusions
- No real poster object was deleted or modified by PR #290.
- Existing 17 Series 3 slide images remain in Supabase Storage.
- Series 3 teaser and rules videos remain on their existing R2 paths.
- PLATO LAND – Main Website architecture and unrelated event records remain out of scope.

## 9. Version history
- v1.0 — 2026-11-21: R2 upload/public display handover.
- v1.1 — 2026-11-21: Confirmed poster deletion control and preview URL correction.
- v1.2 — 2026-11-21: Public-page poster URL correction and production release evidence.
- v1.3 — 2026-11-21: Public poster gold frame removal (PR #290), successful production deployment evidence and updated main branch reference.
