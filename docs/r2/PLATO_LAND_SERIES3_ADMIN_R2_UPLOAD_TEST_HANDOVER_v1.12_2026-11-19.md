# PLATO LAND – Temporary Projects
## Series 3 existing admin panel – R2 upload test handover

**Version:** 1.12  
**Date:** 2026-11-19  
**Scope:** Temporary Projects / Series 3 only  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 – Open, Draft, unmerged

### Owner's clarified objective
The owner has no old Series 3 media to recover. They intend to upload new poster, teaser, 17 rules slides and the separate important-rules MP4 from the existing temporary admin panel to the existing private R2 bucket. Uploading is also an acceptance test of the panel. Do not search for or reconcile old objects.

The Series 3 registration/rules presentation is temporary. Once registration closes, its public presentation must remain disabled. The important-rules MP4 may be uploaded for storage testing, but it must not be activated or shown publicly.

### Changes committed on the feature branch
- `src/series3MediaClient.ts`: uploads and HEAD read-back now target `https://media.platoland.org/api/series3-media`; sends the existing Supabase owner bearer token; uses CORS mode and does not send browser credentials/cookies.
- `src/Series3SlidesPanel.tsx`: teaser setting stores the canonical configured R2 object key rather than the former legacy storage path. Existing panel retains poster, teaser and 17 slide slots.
- `src/Series3VideoManager.tsx`: important-rules MP4 upload writes the configured R2 asset and saves its Supabase reference with `is_active:false`; public activation control removed. Admin preview remains available when the asset exists.
- `src/Series3Gallery.tsx`: teaser resolves through the media host for the canonical configured key; public important-rules video button is suppressed.
- Existing admin route and Series 3 panel placement remain unchanged. No parallel admin page was created.

### R2 slots
- Poster: `poster`
- Teaser: `teaser`
- Important-rules MP4: `rules`
- Rules images: `slide-01` through `slide-17`

### Upload verification behavior
A panel upload is not reported as successful until the endpoint accepts the file and an authenticated HEAD read-back confirms matching non-zero content length and MIME type. The server determines each slot's object key from its allowlist; client filenames do not determine R2 paths. The R2 bucket remains private and no R2 credentials are exposed to browser code.

### Deployment and acceptance status
- Source commits completed on feature branch; latest known commit at handover: `e5a6891a3d5efe4fb63fc0721328fdee30f4f8ca`.
- Cloudflare dashboard inspection did not find that commit in deployment history for the inspected `plato-land-media-endpoint` project. The latest recorded successful version was `f48b99df`; a later main-branch build had failed with “Empty commit message”. Therefore the new panel code is **not yet verified deployed**.
- No successful browser upload test has been run. Do not tell the owner the live panel is ready until a deployment containing this commit is confirmed and a real upload/read-back test passes.
- PR #215 remains Draft and unmerged.
- No Main Website production deployment, database migration, R2 object upload, copy, move, rename, overwrite or deletion was performed by these code changes.

### Required next checks
1. Confirm the dedicated media endpoint Pages/Workers deployment pipeline and deploy the feature-branch revision without touching Main Website.
2. Confirm the existing temporary admin route serves this feature branch build.
3. Test one owner-uploaded image in a slide slot and one MP4 rules test file; verify R2 HEAD size and MIME.
4. Verify public rules video remains hidden, including when the stored settings row previously had `is_active=true`.
5. Keep Series 3 registration/rules presentation disabled after registration closure, using the existing registration-status control. Do not change registration DB status without explicit owner authorization.
6. Keep R2 bucket private, Series 2 archive owner-only, and Scanner/OCR/Plato ID/registration evidence private.

### Version history
- v1.12 – 2026-11-19: records the owner's zero-old-files clarification, existing-panel upload test objective, non-public rules-video requirement, code changes and outstanding deployment/acceptance gates.
