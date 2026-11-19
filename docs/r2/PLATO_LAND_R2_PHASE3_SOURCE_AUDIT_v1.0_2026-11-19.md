# PLATO LAND – Temporary Projects
## R2 Phase 3 – Supabase source inventory and application-readiness audit

**Version:** 1.0  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only; Series 3 public-media candidates and protected-media exclusions  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 (Draft; unmerged)  
**Audit type:** Read-only source/database inspection; documentation-only commit

## 1. Purpose and boundary

This audit records the current Supabase Storage source references and the application code paths that must be handled during Phase 3. It does not claim that R2 keys have been inventoried or mapped. The owner has confirmed that the files already uploaded to R2 are the same files previously present in Supabase; no re-upload or duplicate copy is requested or authorized.

Supabase remains the structured-data authority. Existing Supabase originals remain untouched until parity, access, runtime, mobile, Scanner/OCR, Telegram and archive checks pass and separate deletion approval is obtained.

## 2. Read-only Supabase source inventory

Primary Supabase project: `dfrppbapaaydbjeflozw`.

Observed Storage bucket totals:

| Bucket | Objects | Total bytes | Treatment |
|---|---:|---:|---|
| `avatars` | 5 | 1,679,466 | Out of this media migration scope |
| `registration-evidence` | 1 | 286,645 | Restricted evidence; do not publicize |
| `series2-slides` | 19 | 40,928,243 | Series 2 archive; lifecycle classification required |
| `series3-slides` | 18 | 39,476,704 | Series 3 poster and 17 slide sources |
| `series3-video` | 2 | 15,190,010 | Series 3 teaser and rules video sources |
| `site-announcements` | 1 | 41,840,241 | Outside this Series 3 migration scope; classify separately |

### Series 3 image source paths

- `series3-slides/poster/series3-main-poster` — PNG, 2,368,433 bytes; ETag `2003c91da4856370acba296dbec99945`.
- `series3-slides/slides/01` through `slides/17` — PNG sources. The database listing returned the exact per-object metadata during this audit; no object was downloaded, changed or deleted.

### Series 3 video source paths

- `series3-video/rules/series3-important-rules.mp4` — video/mp4, 10,299,472 bytes; ETag `4f4fdc2b0f895d7fb7491e673d9a4114`.
- `series3-video/teaser/series3-home-teaser.mp4` — video/mp4, 4,890,538 bytes; ETag `415b6f13070e0600cfa57c90523352be`.

### Current Series 3 media settings (read-only)

- `plato_land_series3_home_media_settings`: row id 1; `media_mode=video`; `storage_path=teaser/series3-home-teaser.mp4`.
- `plato_land_series3_video_settings`: row id 1; `storage_path=rules/series3-important-rules.mp4`; `is_active=true`.

These settings are authoritative app metadata and must remain unchanged during the public-read migration.

## 3. Application code inspection

The following components still read Series 3 public assets through Supabase Storage:

- `src/Series3Gallery.tsx`: reads home-media mode and video settings from Supabase tables; lists teaser/poster/rules objects and builds Supabase public URLs. It also records video modal-open analytics in Supabase.
- `src/Series3SlidesPanel.tsx`: lists the 17 slide slots, poster and teaser; builds Supabase public URLs. Its current upload and replace actions write to Supabase Storage. These write paths must not be redirected to a public R2 URL helper; a separate authenticated owner upload workflow is required.
- `src/Series3VideoManager.tsx`: reads video settings and analytics from Supabase, lists the rules video, and currently uploads/replaces the file in Supabase Storage. Upload migration is a separate security-sensitive workstream.

The current `src/r2Media.ts` helper only builds a URL from a caller-supplied, verified key under the approved `plato-land/` root. It does not prove that a key exists, inspect file content, list objects, authorize access, or provide private delivery.

## 4. Scope exclusions

- Keep `registration-evidence`, Plato ID images, Scanner/OCR files and any identity-bearing evidence private. A public object URL is not an acceptable delivery mechanism for these assets.
- Do not expose Series 2 archive objects until archive/expiry lifecycle is verified and an approved access boundary is implemented.
- Do not infer that `site-announcements` belongs to Series 3.
- Do not modify any Supabase Storage object, database row, table, policy, bucket or migration as part of this audit.
- Do not modify the separate PLATO LAND – Main Website project.

## 5. R2 mapping status and the remaining technical gate

**R2 key-to-source mapping: NOT YET VERIFIED.**

The prior dashboard traversal was incomplete/conflicting and must not be treated as authoritative. The owner confirmed the R2 files are already uploaded and identical to the Supabase source files. This audit therefore does not request another upload and does not reinterpret the earlier dashboard count discrepancy as missing files.

Before changing any page read URL, obtain the existing R2 object-key metadata through the already configured Preview-only inventory endpoint and match each candidate by available metadata/content evidence. Do not guess opaque filenames, extensions, or folder names. The custom public domain is also not yet confirmed as bound and serving the intended bucket; the bucket was last observed private with R2 Public Access disabled.

Until both key mapping and the public/private boundary are verified, keep current Supabase reads operational.

## 6. Next implementation sequence

1. Retrieve the complete read-only R2 key inventory from the existing Preview-only audit endpoint; no file upload or copy is involved.
2. Match the Series 3 poster, 17 slides, teaser and rules video to exact existing R2 keys, validating MIME, size and checksum/ETag where comparable.
3. Confirm the custom-domain and public/private delivery design without exposing the mixed bucket wholesale or introducing new cost.
4. Add deterministic tests for exact-key URL mapping, rejected paths, missing keys and cache-version behavior.
5. Switch only the verified public Series 3 read paths in the Preview branch. Keep Supabase tables/settings and analytics unchanged.
6. Design authenticated owner upload/replace to R2 separately; never put R2 credentials in browser code.
7. Test iPhone/Safari rendering, video playback, all 17 slide slots, Telegram media flows, Scanner/OCR privacy and Series 2 archive access.
8. Retain all Supabase originals until acceptance tests pass and separate explicit deletion approval is received.

## 7. Actual changes and verification

- Read-only inspection of the primary Supabase project and current branch source files.
- No database writes, Storage writes, R2 object operations, Cloudflare setting changes, Production deployment, PR merge, or Main Website changes.
- This document is a source-audit record only; it does not certify R2 inventory completion or migration completion.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-19 | Records Supabase source buckets, Series 3 source paths and settings, application read/write touchpoints, protected-media exclusions, and the remaining R2 mapping gate. |
