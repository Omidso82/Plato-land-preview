# PLATO LAND – Temporary Projects
## R2 migration progress – Series 3 upload/read implementation addendum

**Version:** 1.5  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only; Series 3 public media  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 (Open, Draft, unmerged)  
**Implementation head recorded:** `65873c2b0f30884cfd051b2e8ae40db712f668b0`

## 1. Implementation added

- `functions/api/series3-media.ts`: allowlisted GET/HEAD/POST API backed by existing `PLATO_MEDIA_BUCKET`.
- `src/series3MediaClient.ts`: browser URL and authenticated upload helper; no R2 credentials in client code.
- `src/Series3SlidesPanel.tsx`: R2 upload/read integration for 17 slides, home poster and teaser.
- `src/Series3VideoManager.tsx`: R2 upload/read integration for Important Rules video.
- `src/Series3Registration.tsx`: R2-first read for 17 registration rule slides.
- `src/Series3Gallery.tsx`: R2-first read for poster and Important Rules video. Teaser retains its existing verified R2-backed byte-range route.
- `vite.config.ts`: adds only `/api/series3-media` to the limited Pages Function route allowlist.

## 2. API and storage rules

- Strict asset allowlist: `poster`, `teaser`, `rules`, `slide-01` through `slide-17`.
- New destination namespace for poster, slides and rules video: `plato-land/backgammon/series-3/public-media/`.
- Teaser uses the previously verified exact key `plato-land/backgammon/series-3/videos/168302900751657886.MP4`; its size and ETag matched the Supabase teaser source.
- Images: JPEG/PNG/WebP, maximum 10 MiB. Videos: MP4, maximum 100 MiB.
- Upload requires same-origin Origin, valid Supabase access token, and server-side `current_user_role` result `owner` or `مالک کل`. Client-supplied role flags are not trusted.
- GET/HEAD exposes only allowlisted Series 3 slots. Video GET supports single byte ranges (206/416).
- Supabase database settings and analytics remain in Supabase.

## 3. Transition compatibility

R2 is preferred for each slot. Where an R2 object is not yet present, the relevant admin/public view can fall back to the existing Series 3 Supabase Storage object to avoid blank media during transition. This is temporary and is not the final migrated state.

Remove legacy fallbacks only after all 20 slots (poster + 17 slides + teaser + rules video) are uploaded or mapped and verified in R2, with public-read and mobile tests passed. Uploading a slot writes to its deterministic key; replacement overwrites only that named slot. The endpoint cannot address unrelated keys.

## 4. Verification status

- Build and typecheck for commit `321f6928aad30164f947fbfc4e98e030b56ffa35` completed successfully, including TypeScript typecheck, Vite build and the existing Deno test/check suite.
- Deployment workflow for that commit built and uploaded its Pages artifact; deploy job was skipped by workflow gating. This is not a Pages Preview runtime deployment.
- Commit `65873c2b0f30884cfd051b2e8ae40db712f668b0` fixes an admin image URL cache-query bug. CI and deployment workflow for this latest head were still running when this document was written.
- No authenticated owner upload, R2 read-back byte verification, end-to-end iPhone/Safari playback/seek, or full slide acceptance test has yet been completed.
- Therefore this remains an implementation in a Draft PR, not a completed or released migration.

## 5. Remaining work

1. Confirm CI success for the latest head.
2. Confirm isolated Pages Preview actually includes the new Function and R2 binding.
3. Test unauthenticated/non-owner rejection and owner upload.
4. Upload intended Series 3 poster, 17 slides and Important Rules video through the admin panel. Existing teaser identity is known; test its new API read path.
5. Verify all 20 slots with HEAD/GET, byte ranges, gallery, registration sequence and mobile playback/seeking.
6. Remove legacy Supabase read fallbacks only after parity is demonstrated.
7. Reconcile existing R2 inventory; the audit token is still required for the separate read-only inventory endpoint.
8. Only after acceptance tests pass, perform the already-authorized narrow deletion of corresponding Series 3 source media in Supabase Storage. Preserve DB settings and all unrelated objects.

## 6. Safety record

No Production deployment, DNS/custom-domain change, R2 public-access setting, Access policy change, PR merge, Supabase database/policy write, Supabase source deletion, Series 2/Scanner/OCR/private evidence/Telegram/Main Website change, new bucket/database, or paid service.

## Version history

- v1.4 – 2026-11-19: Prior inventory, teaser pilot and code review status.
- v1.5 – 2026-11-19: Added Series 3 allowlisted R2 upload/read implementation, owner authentication, deterministic slot mapping, transition fallbacks, verification status and remaining acceptance tests.
