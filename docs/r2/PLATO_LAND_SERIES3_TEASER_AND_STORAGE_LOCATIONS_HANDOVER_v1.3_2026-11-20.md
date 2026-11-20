# PLATO LAND – Temporary Projects
## Series 3 Teaser Playback and Media Storage Locations Handover

**Document version:** 1.3  
**Date:** 2026-11-20  
**Scope:** Series 3 homepage teaser playback and storage-location labels in the existing Series 3 media management panel.

## 1. Controlling decisions retained

- R2 stores the teaser binary; Supabase stores the exact object key and application media mode.
- The existing R2 bucket and `PLATO_MEDIA_BUCKET` binding are reused.
- No new bucket, database, schema, Storage policy, DNS record, custom domain, paid service, or Cloudflare access configuration was created or changed.
- The teaser remains on R2; no Supabase Storage fallback is introduced.
- The Series 3 poster and 17 slides remain in the existing Supabase Storage bucket `series3-slides`.
- No old media object was copied, moved, renamed, overwritten, or deleted as part of this change.
- No Series 2 archive, Scanner/OCR, registration evidence, or Main Website redesign scope is included.

## 2. First real teaser upload — database evidence

Read-only query of the primary Supabase project `dfrppbapaaydbjeflozw` confirmed:

- Table: `public.plato_land_series3_home_media_settings`
- Row: `id = 1`
- `media_mode = video`
- `storage_path = plato-land/backgammon/series-3/public-media/videos/teaser-1795166226122-072299ef-4724-4802-9b52-b72f84236a18.mp4`
- Updated at: `2026-11-20 09:17:29.721+00`

This confirms the application metadata points to the uploaded R2 object key. It does not, by itself, independently confirm public playback in mobile Safari.

## 3. Playback compatibility correction

### Root cause found
The R2 media endpoint served public media with:

`Cross-Origin-Resource-Policy: same-site`

The video is delivered from `plato-land-media-pages.pages.dev`, while the public Series 3 page is hosted on `platoland.org`. These are different origins and not same-site in the way required by the existing response policy.

### Change released in source
PR #235: https://github.com/Omidso82/Plato-land-preview/pull/235

- Changed the public media response policy to `Cross-Origin-Resource-Policy: cross-origin`.
- Preserved the existing CORS allowlist, which permits `https://platoland.org`.
- No bucket access, object, binding, DNS, or Supabase setting changed.

Merge commit: `4cfc3e37dab65205b2f31188c4e062492ac9d8e0`  
Target branch: `feature/temporary-projects-r2-public-media-phase1`

The Series 3 teaser video element now also requests the resource with `crossOrigin="anonymous"` through PR #236.

## 4. Storage-location labels in the existing management panel

PR #236: https://github.com/Omidso82/Plato-land-preview/pull/236

The panel now displays storage location details beneath each populated Series 3 media item:

| Media | Binary storage | Bucket | Object path/reference |
|---|---|---|---|
| Homepage teaser | Cloudflare R2 | `plato-land` | Exact immutable key read from Supabase |
| Main poster | Supabase Storage | `series3-slides` | `poster/series3-main-poster` |
| Slide 1–17 | Supabase Storage | `series3-slides` | `slides/01` through `slides/17` |

For the teaser, the panel also identifies the Supabase metadata location:
`public.plato_land_series3_home_media_settings.storage_path`.

Merge commit: `6f0397c8a3c6eb344896b58157fb37ec89f1c0d6`  
Target branch: `main`

## 5. Verification status

Confirmed:
- The primary Supabase metadata row exists and has `media_mode = video`.
- The exact R2 key is stored in Supabase.
- PR #235 merged successfully into the existing media endpoint Production branch.
- PR #236 merged successfully into `main`.
- The source files contain the intended CORP/CORS and storage-label changes.

Not independently confirmed at the time this document was written:
- The new Cloudflare Pages deployment for merge commit `4cfc3e3...`.
- The new GitHub Pages deployment for merge commit `6f0397c...`.
- Actual playback of the existing teaser on a real iPhone/mobile Safari after those deployments.
- The new storage labels rendered in the live owner panel.

Do not describe the live release as fully accepted until the deployment status and mobile Safari playback have been checked.

## 6. Owner acceptance steps

1. Reload `platoland.org/series3` on iPhone Safari and check whether the teaser appears.
2. If it does not appear, send a screenshot of the page and any visible error; do not upload the same video again.
3. Open the existing owner media panel and expand the Series 3 media section.
4. Confirm that the teaser shows the R2 bucket and exact object key, and that each populated poster/slide shows its Supabase Storage bucket and object path.

## 7. Version history

- v1.3 | 2026-11-20 | Records first real teaser metadata evidence, cross-origin playback correction (PR #235), storage-location labels (PR #236), merge commits, and outstanding live deployment/mobile Safari acceptance.
- v1.2 | 2026-11-20 | Records initial R2 teaser implementation, deployment evidence available at that time, and first real upload acceptance as pending.
