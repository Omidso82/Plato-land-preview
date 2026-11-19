# PLATO LAND – Temporary Projects
## Series 3 Registration Slides: R2-only upload and delivery
**Version:** 1.0  
**Date:** 2026-11-19  
**Status:** Implemented in PR #215 branch; Preview verification pending

### Scope
This change applies only to the 17 instructional images shown in the Series 3 registration flow and their owner-panel upload controls. It does not migrate, copy, move, or delete existing media.

### Storage responsibilities
- **Cloudflare R2:** binary image objects for the 17 Series 3 registration slides.
- **Supabase:** authentication/owner authorization and existing registration/business data. No slide image bytes are uploaded to Supabase Storage by this flow.

### Upload path
1. Owner selects an image in the existing Series 3 slide manager.
2. The browser calls `uploadSeries3Media('slide-NN', file)`.
3. `/api/series3-media` validates same-origin, owner authorization, image MIME type, and 10 MB size limit.
4. The Pages Function writes the object through the existing `PLATO_MEDIA_BUCKET` R2 binding.
5. The panel checks the R2 endpoint to refresh the visible slide state.

### Read/display path
- The admin panel checks only the R2 media endpoint for slide images.
- The public Series 3 registration page checks only the R2 media endpoint for the 17 slides.
- Supabase Storage fallback for these 17 slides has been removed. Missing R2 images are shown as unavailable; registration remains blocked unless all 17 slides are available.

### Safety boundaries
- No old Supabase Storage objects were deleted.
- No R2 objects were deleted, copied, moved, or overwritten as part of this code change.
- No Supabase database schema or data was changed.
- No Cloudflare Production configuration, public bucket access, DNS, custom domain, or Production deployment was changed.
- No changes were made to PLATO LAND – Main Website.

### Change record
- Updated `src/Series3SlidesPanel.tsx`: upload remains through the R2 endpoint; slide/poster refresh no longer falls back to Supabase Storage.
- Updated `src/Series3Registration.tsx`: registration slide reads now use only the R2 endpoint; a clear load error appears if not all 17 images are available.
- Existing Supabase authentication and registration RPC calls remain unchanged.

### Verification status
Code changes are committed to `feature/temporary-projects-r2-public-media-phase1` under PR #215. Build/CI and Cloudflare Preview verification for the new commits have not yet been confirmed. Before the user re-uploads images, verify the latest Preview deployment, successful owner upload, R2 object presence, and public registration-page display on mobile Safari.

### Important operational note
After the user clears the old Series 3 slide images, re-upload the 17 images through the existing admin panel. New uploads for these slots must go to R2 only. Do not run any automated deletion or cleanup against Supabase Storage or R2.
