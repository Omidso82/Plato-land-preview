# PLATO LAND – Temporary Projects
## Series 3 Teaser Playback and Media Storage Locations Handover

**Document version:** 1.4  
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

This confirms the application metadata points to the uploaded R2 object key.

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

The Series 3 teaser video element also requests the resource with `crossOrigin="anonymous"` through PR #236.

## 4. Storage-location labels in the existing management panel

PR #236: https://github.com/Omidso82/Plato-land-preview/pull/236

The panel displays storage location details beneath each populated Series 3 media item:

| Media | Binary storage | Bucket | Object path/reference |
|---|---|---|---|
| Homepage teaser | Cloudflare R2 | `plato-land` | Exact immutable key read from Supabase |
| Main poster | Supabase Storage | `series3-slides` | `poster/series3-main-poster` |
| Slide 1–17 | Supabase Storage | `series3-slides` | `slides/01` through `slides/17` |

For the teaser, the panel also identifies the Supabase metadata location:
`public.plato_land_series3_home_media_settings.storage_path`.

Merge commit: `6f0397c8a3c6eb344896b58157fb37ec89f1c0d6`  
Target branch: `main`

## 5. Final acceptance status — owner confirmed

On 2026-11-20, the owner supplied a screenshot confirming that the live management panel displays:
- Cloudflare R2 storage location.
- Bucket name `plato-land`.
- The exact immutable teaser Object Key.
- Supabase metadata reference `public.plato_land_series3_home_media_settings.storage_path`.

The owner then explicitly confirmed that the teaser **plays on the public Series 3 page**. This is the user-observed live acceptance of playback on the public page.

Therefore:
- Teaser upload and Supabase metadata reference: accepted.
- Storage-location labels in the management panel: accepted.
- Public Series 3 teaser playback: accepted by owner on 2026-11-20.

The acceptance is based on the owner's live observation; it is not represented as an independently collected browser telemetry or automated Safari test.

## 6. Verification and boundaries

Confirmed:
- The primary Supabase metadata row exists and has `media_mode = video`.
- The exact R2 key is stored in Supabase.
- PR #235 merged successfully into the existing media endpoint Production branch.
- PR #236 merged successfully into `main`.
- The source files contain the intended CORP/CORS and storage-label changes.
- Owner confirmed the public Series 3 teaser plays.
- Owner screenshot confirms the R2 bucket and object path are visible in the live management panel.

No changes were made to:
- R2 bucket or binding configuration.
- Supabase schema, database, or existing media objects.
- Poster or slide storage destination.
- DNS or separate Cloudflare Worker services.
- Other temporary events or Main Website features outside this explicitly authorized scope.

## 7. Version history

- v1.4 | 2026-11-20 | Records owner confirmation that the public Series 3 teaser plays and screenshot confirmation of live R2/Supabase storage-location labels; marks this workstream accepted.
- v1.3 | 2026-11-20 | Records first real teaser metadata evidence, cross-origin playback correction (PR #235), storage-location labels (PR #236), merge commits, and pending live acceptance.
- v1.2 | 2026-11-20 | Records initial R2 teaser implementation, deployment evidence available at that time, and first real upload acceptance as pending.
