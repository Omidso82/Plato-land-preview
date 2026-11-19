# PLATO LAND – Temporary Projects
## Series 3 R2 media migration – implementation progress

**Document version:** 1.0  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only – Series 3 public media  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 – Open, Draft, unmerged

### 1. Implemented in this step

1. Added `functions/media/series3.ts`, a Cloudflare Pages Function that serves only the explicitly allowlisted Series 3 teaser object from the existing R2 binding `PLATO_MEDIA_BUCKET`.
2. The route accepts only `GET` and `HEAD`, rejects all asset names other than `teaser`, and supports single HTTP byte ranges for browser video playback.
3. The teaser key is the existing R2 key `plato-land/backgammon/series-3/videos/168302900751657886.MP4`. Its listed size (4,890,538 bytes) and ETag match the previously inspected Supabase teaser source metadata.
4. Updated `Series3Gallery.tsx` so the home teaser reads from `/media/series3?asset=teaser` instead of Supabase Storage. Supabase DB settings and video-open analytics remain unchanged.
5. Added `/media/series3` to the Pages Function route include list in `vite.config.ts`.

### 2. Verification

- GitHub re-fetch confirmed the new Function and the Gallery route change are present on the feature branch.
- GitHub Actions **Build and typecheck** completed successfully for commit `2826022377b3cbb533a5ee8996a44e113d7a4690`.
- The CI job completed `npm run typecheck`, `npm run build`, and the existing Deno test/check steps successfully.
- The separate website deployment workflow built and uploaded its Pages output; its deploy job was skipped. This is not evidence of a Cloudflare Preview deployment.
- Runtime playback against the Preview R2 binding and iPhone/Safari playback have not yet been verified.

### 3. Remaining work and constraints

- The poster and 17 slide objects are not mapped to exact R2 keys yet. The inventory lists 18 Series 3 PNG-named rows, but reports zero-byte sizes and empty-object ETags. Do not guess their mapping.
- The rules video is not yet mapped to an exact R2 object. The other listed MP4 does not match the known Supabase rules-video size/ETag; do not assign it by filename or assumption.
- `Series3SlidesPanel.tsx` still reads and writes media through Supabase Storage.
- `Series3VideoManager.tsx` still reads and writes the rules video through Supabase Storage.
- Secure owner-authenticated R2 upload/replace has not been implemented.
- No R2 objects, Supabase objects, database rows, Production settings, custom domain, public-access setting, or Main Website code were changed.
- No Supabase originals were deleted or overwritten.
- PR #215 remains Draft and unmerged.

### 4. Next implementation steps

1. Continue read-only R2 object verification for the Series 3 PNG rows and rules video.
2. Extend the exact-key allowlist only after object identity is established.
3. Switch poster and slide reads to R2 without changing Supabase settings.
4. Implement owner-authenticated server-side upload/replace separately; do not expose R2 credentials to browser code.
5. Verify Preview runtime, mobile Safari video seeking, all 17 slide slots, and privacy boundaries before considering release.

### 5. Version history

- v1.0 – 2026-11-19: Records the first verified R2-backed Series 3 Gallery teaser implementation and successful GitHub CI checks.
