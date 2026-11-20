# PLATO LAND – Temporary Projects
## Series 2 Fixed Poster R2 Migration Handover

**Version:** 1.0  
**Date:** 2026-11-20  
**Scope:** Future uploads of the fixed Series 2 archive poster only.

### Approved target
- Storage provider: Cloudflare R2
- Existing bucket: `plato-land`
- Exact object key: `plato-land/backgammon/series-2/posters/main-poster`
- Existing R2 endpoint: `https://plato-land-media-pages.pages.dev/api/series3-media?asset=series2-poster`
- Existing binding: `PLATO_MEDIA_BUCKET`

### Changes merged
- PR #251 merged into `feature/temporary-projects-r2-public-media-phase1`.
  - Merge commit: `2d55a9fe9db7fe6613fec9f44a9121975ef9f3b8`
  - Enables public GET/HEAD for the fixed Series 2 poster object while POST remains owner-authorized.
- PR #252 merged into `main`.
  - Merge commit: `23da24b5476f3696b04fa84b739f8afdc56034cf`
  - Existing temporary admin panel uploads the fixed poster through the R2 endpoint using the authenticated owner session.
  - Upload response key and size are checked; an independent HEAD request checks stored size and MIME type.
  - Panel shows R2 bucket and object key.
  - Public Series 2 archive reads the poster from the R2 endpoint.

### Storage boundaries
- The deleted former Supabase object `series2-slides/poster/series2-prize-poster` is not restored or copied.
- Existing 18 slide assets and their editor remain in Supabase Storage.
- No database, schema, R2 bucket, binding, secret, DNS, or paid service was created or changed.
- No other series media was moved.

### Verification
- Source files were fetched after merge and verified to contain the R2 upload, HEAD verification, R2 public read, and archive R2 URL.
- Live deployment of both merge commits has NOT yet been independently confirmed.
- No new poster has been uploaded yet.
- Do not select/upload the new image until the production endpoint and website deployment are confirmed.

### Next acceptance steps
1. Confirm Cloudflare Pages production deployment for endpoint commit `2d55a9f...`.
2. Confirm GitHub Pages deployment for main commit `23da24b...`.
3. Open the temporary admin panel and upload the new poster.
4. Confirm the success message and exact R2 object key.
5. Check that the poster displays in the public Series 2 archive.

### Version history
- v1.0 | 2026-11-20 | Records R2 migration for future Series 2 fixed-poster uploads and deployment acceptance pending.
