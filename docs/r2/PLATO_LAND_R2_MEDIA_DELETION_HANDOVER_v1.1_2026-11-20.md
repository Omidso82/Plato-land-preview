# PLATO LAND – Temporary Projects
## R2 Media Deletion Controls – Handover
Version: 1.1 | Date: 2026-11-20 | Status: Released; owner-reported functional verification successful

### 1. Scope and authorization
This change applies only to the existing PLATO LAND – Temporary Projects admin panel. The owner approved per-file permanent deletion controls for R2-backed event media, with an individual confirmation before each deletion.

A file is deleted only after the owner signs in as owner, chooses that specific file, and confirms the destructive action in the panel.

### 2. R2-backed media covered
- Series 2 fixed poster: `series2-poster`
  - Existing bucket binding: `PLATO_MEDIA_BUCKET` → `plato-land`
  - Key: `plato-land/backgammon/series-2/posters/main-poster`
- Series 3 home teaser: `teaser`
  - Exact versioned key is read from `public.plato_land_series3_home_media_settings.storage_path`
- Series 3 important-rules video: `rules`
  - Exact versioned key is read from `public.plato_land_series3_video_settings.storage_path`
  - Client uses the verified Pages endpoint `plato-land-media-pages.pages.dev`; the similarly named Worker `plato-land-media-endpoint` is separate and is not the client endpoint.

### 3. Deletion behavior and safeguards
- API supports owner-authenticated `DELETE` only for exact allowlisted assets.
- The server validates complete versioned keys for teaser/rules videos; arbitrary object paths are rejected.
- API checks object existence, deletes only the selected key, then performs R2 HEAD to verify absence.
- CORS allows DELETE under the existing approved-origin policy.
- R2 credentials/secrets are not sent to the browser.
- Before deleting a teaser, the panel clears its exact Supabase reference, switches home media mode to poster, and attempts to restore the prior reference if R2 deletion fails.
- Before deleting the rules video, the panel clears its exact Supabase reference and disables the video; it attempts to restore the prior reference if R2 deletion fails.
- The Supabase `storage_path` columns are NOT NULL; the panel uses an empty string when clearing the reference. No schema change is required.
- Deletion and rollback errors are reported separately; the UI does not claim full success unless R2 absence is verified.

### 4. Repository changes and releases
Repository: `Omidso82/Plato-land-preview`

- API PR #255: https://github.com/Omidso82/Plato-land-preview/pull/255
  - Merged 2026-11-20; merge commit `4e9d9721a26e27b8b3d17e8d8709415e0b1ff8b7`
  - Base: `feature/temporary-projects-r2-public-media-phase1`
  - Adds owner-only DELETE and post-delete R2 verification to `functions/api/series3-media.ts`.
- UI PR #256: https://github.com/Omidso82/Plato-land-preview/pull/256
  - Merged 2026-11-20; merge commit `3322ffc58bcd23520adfc2971213a0d9090509c9`
  - Base: `main`
  - Adds the shared deletion client and per-file confirmation controls to the existing Series 2/Series 3 panels.
  - Corrects the Series 3 rules-video client to use the verified Pages endpoint.
- Preview URL correction PR #259: https://github.com/Omidso82/Plato-land-preview/pull/259
  - Merged 2026-11-20; merge commit `9755f0afd8115feccfe90e15bebb161bd515186d`
  - Fixes the Series 2 fixed-poster preview by removing the extra `?v=` query concatenation from the already parameterized media URL.
  - Scope was one UI line; no R2 object, Supabase data, schema, bucket, binding, secret, or deletion behavior was changed.

### 5. Verification and acceptance
- GitHub Actions for merge commit `9755f0afd8115feccfe90e15bebb161bd515186d`: `build`, `verify`, and `deploy` completed successfully.
- The user confirmed on 2026-11-20 that the Series 2 poster preview now displays correctly.
- The user also explicitly reported that the upload and delete controls, and the related panel actions they tested, all work correctly.
- This is user-reported real-panel verification; no separate automated end-to-end test report is claimed here.
- No unintended changes to the main database, schema, bucket, binding, secrets, or paid services are recorded for these fixes.
- The similarly named Cloudflare Worker build check `Workers Builds: plato-land-media-endpoint` failed. This is separate from the Pages endpoint used by the client; do not report that Worker as repaired or treat its failure as a Pages failure.
- The Cloudflare Pages check for `plato-land-media-endpoint` was still shown as in progress when the GitHub check-runs were last inspected. User-reported successful panel operations provide functional acceptance, but that pending check is retained as a deployment-status caveat.

### 6. Explicit exclusions
- Existing Supabase Storage poster/slides and other legacy objects are not included in R2 deletion.
- Series 2 slide editor and its existing Supabase Storage files are unchanged.
- Series 3 poster and 17 slide images handled through Supabase Storage are unchanged.
- Scanner images, Plato ID images, registration evidence and all private/sensitive records are excluded.
- No inventory cleanup, migration, copy, rename, reconciliation or bulk deletion is performed.
- No database schema, R2 bucket, binding, secrets, DNS, custom domain, public access policy or paid service is changed.

### 7. Version history
- v1.0 | 2026-11-20 | Initial handover; implementation and checks still pending.
- v1.1 | 2026-11-20 | Records merged API/UI work, merged poster-preview fix, successful build/typecheck/deploy workflows, and owner's successful manual verification of preview, upload and delete controls. Retains the separate Worker failure and pending Pages check caveat.
