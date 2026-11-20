# PLATO LAND – Temporary Projects
## R2 Media Deletion Controls – Handover
Version: 1.0 | Date: 2026-11-20 | Status: Implementation in PR; not merged or deployed

### 1. Scope and authorization
This change applies only to the existing PLATO LAND – Temporary Projects admin panel. The owner explicitly approved a per-file permanent deletion control for R2-backed event media, with an individual confirmation before each deletion.

No deletion is performed by this implementation or by merging either PR. A file is deleted only after the owner signs in as owner, chooses that specific file, and confirms the destructive action in the panel.

### 2. R2-backed media covered by this implementation
- Series 2 fixed poster: `series2-poster`
  - Bucket binding: `PLATO_MEDIA_BUCKET` → existing bucket `plato-land`
  - Key: `plato-land/backgammon/series-2/posters/main-poster`
- Series 3 home teaser: `teaser`
  - Exact versioned key is read from `public.plato_land_series3_home_media_settings.storage_path`
- Series 3 important-rules video: `rules`
  - Exact versioned key is read from `public.plato_land_series3_video_settings.storage_path`
  - The panel client is routed to the verified Pages endpoint `plato-land-media-pages.pages.dev`; the similarly named `plato-land-media-endpoint` Worker is not used by this flow.

### 3. Deletion behavior and safeguards
- API supports owner-authenticated `DELETE` only for exact allowlisted assets.
- The server validates the complete versioned key for teaser/rules videos; arbitrary object paths are rejected.
- The API checks object existence, deletes only the selected key, then performs R2 HEAD to verify the object is absent.
- CORS explicitly allows DELETE only under the existing approved origin policy.
- No R2 credentials/secrets are sent to the browser.
- Before deleting a teaser, the panel clears its exact Supabase reference, switches home media mode to poster, and attempts to restore the prior reference if R2 deletion fails.
- Before deleting the rules video, the panel clears its exact Supabase reference and disables the video; it attempts to restore the prior reference if R2 deletion fails.
- The Supabase `storage_path` columns were checked and are NOT NULL; the panel uses an empty string when clearing the reference. No schema change is required.
- Deletion errors and rollback errors are reported separately; the UI does not claim full success unless R2 absence is verified.

### 4. Explicit exclusions
- Existing Supabase Storage poster/slides and other legacy objects are not deleted.
- Series 2 slide editor and its existing Supabase Storage files are unchanged.
- Series 3 poster and 17 slide images currently handled through Supabase Storage are unchanged.
- Scanner images, Plato ID images, registration evidence and all private/sensitive records are excluded.
- No inventory cleanup, migration, copy, rename, reconciliation or bulk deletion is performed.
- No database schema, R2 bucket, binding, secrets, DNS, custom domain, public access policy or paid service is changed.

### 5. Repository changes
Repository: `Omidso82/Plato-land-preview`

- API PR #255: https://github.com/Omidso82/Plato-land-preview/pull/255
  - Base: `feature/temporary-projects-r2-public-media-phase1`
  - Adds owner-only DELETE and R2 post-delete verification to `functions/api/series3-media.ts`.
- UI PR #256: https://github.com/Omidso82/Plato-land-preview/pull/256
  - Base: `main`
  - Adds the shared deletion client and per-file confirmation controls to the existing Series 2/Series 3 panels.
  - Corrects the Series 3 rules-video client to use the verified Pages endpoint.

### 6. Release and acceptance status
- No PR has been merged by this handover.
- No production deployment is claimed.
- No media object has been deleted.
- GitHub Actions UI checks were still in progress at the time this version was prepared.
- API PR checks/deployment status were not yet reported.
- After owner approval of release, merge API PR #255 into the configured Pages production branch and verify its Production deployment; then merge UI PR #256 into `main` and verify the exact management panel deployment.
- Acceptance must include owner rejection, invalid asset/key rejection, successful deletion of a test object, R2 HEAD returning 404 after deletion, Supabase reference cleanup, rollback/error handling, and a real iPhone Safari panel check.

### 7. Version history
- v1.0 | 2026-11-20 | Initial handover for owner-confirmed, per-file R2 deletion controls.
