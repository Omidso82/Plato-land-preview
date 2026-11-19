# PLATO LAND – Temporary Projects
## R2 inventory audit – Phase 3 completion report

**Document version:** 1.2  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 – Open, Draft, unmerged  
**Inventory Preview deployment:** `230a3430-7df9-4661-a3a4-dfddc6f652f0`  
**Inventory commit:** `5aa5153d8379e3905af6334d9ccf3d3de6e0fe0e`  
**Preview URL:** `https://230a3430.plato-land-preview.pages.dev`

### 1. Phase 3 status

**Phase 3 read-only inventory and source audit: COMPLETED.**  
**Media migration / application switch: NOT part of this completion and remains blocked pending technical verification.**

The user has explicitly confirmed that the files uploaded to R2 are the same source files previously held in Supabase. This is an accepted user confirmation and must not be repeatedly challenged, re-requested, or turned into a request to upload files again. The inventory findings below describe the metadata returned by the R2 listing endpoint; they do not invalidate the user's confirmation about which files were selected and uploaded.

### 2. Preview audit access repair

- Updated only the Preview environment secret `R2_AUDIT_TOKEN` with a new cryptographically random 256-bit value generated inside the browser session.
- Production `R2_AUDIT_TOKEN` was not modified.
- `VITE_PLATO_PREVIEW=true` was preserved.
- Preview-only deployment completed successfully for commit `5aa5153d8379e3905af6334d9ccf3d3de6e0fe0e`.
- Deployment ID: `230a3430-7df9-4661-a3a4-dfddc6f652f0`.
- Token was not exposed in chat, Git, or this document.

### 3. Read-only R2 inventory

- Bucket: `plato-land-media`
- Prefix: `plato-land/`
- Endpoint result: `readOnly: true`
- Listed rows: **45**
- Total listed bytes: **52,068,303** (about 49.66 MiB)
- Two non-zero objects; 43 zero-byte rows.
- 7 directory-marker rows; 36 image-named `.PNG` rows reporting zero bytes.
- No object bodies were downloaded or modified by the inventory endpoint.

### 4. Inventory classification

| R2 key | Reported size | ETag | Uploaded UTC | Classification |
|---|---:|---|---|---|
| `plato-land/backgammon/series-3/videos/-7906938477879233526.MP4` | 47,177,765 | `9dfcd62361af97ad251d7bd65e275232` | 2026-11-18T14:29:02.688Z | Non-zero MP4; identity not established from inventory metadata |
| `plato-land/backgammon/series-3/videos/168302900751657886.MP4` | 4,890,538 | `415b6f13070e0600cfa57c90523352be` | 2026-11-18T14:27:11.315Z | Non-zero MP4; matches the known Series 3 teaser by size and ETag |

The other 43 rows report size 0 and the empty-object ETag `d41d8cd98f00b204e9800998ecf8427e`. These consist of seven folder-marker keys and 36 keys ending in `.PNG`. The PNG-named keys are listed in R2 metadata, but the inventory result alone does not establish why they report zero bytes or whether the endpoint/listing metadata reflects the complete uploaded object state. No claim is made here that the user's upload action did not occur.

The 36 PNG-named keys are grouped under:
- `plato-land/backgammon/series-2/rules/سری دوم عکسها/` — 18 keys.
- `plato-land/backgammon/series-3/  rules/سری سوم عکسها/` — 18 keys.

The Series 3 prefix contains two spaces before `rules/`. Preserve this exact key spelling during audit; do not rename or move objects in this phase.

### 5. Supabase source context and user confirmation

The previously inspected Supabase source set for Series 3 consists of:
- Main poster: `series3-slides/poster/series3-main-poster`.
- 17 slide records: `series3-slides/slides/01` through `slides/17`.
- Rules video: `series3-video/rules/series3-important-rules.mp4`.
- Home teaser: `series3-video/teaser/series3-home-teaser.mp4`.

The teaser's known metadata is size 4,890,538 bytes and ETag `415b6f13070e0600cfa57c90523352be`, matching the R2 teaser row exactly.

The user has confirmed the R2 uploads were made from the same files. That confirmation is accepted. The inventory does not provide a one-to-one source-to-key manifest for the poster and 17 slides, and the zero-byte PNG metadata is a technical discrepancy requiring investigation at the R2 object metadata/body-read layer—not a reason to ask the user to prove the upload again or upload again.

### 6. Phase 3 findings and exit criteria

**Completed:**
1. Preview-only audit secret repaired and verified.
2. Preview-only deployment succeeded.
3. Read-only R2 inventory endpoint executed successfully.
4. All 45 returned rows classified by key pattern, size, ETag, and timestamp.
5. Existing R2 key naming irregularity recorded.
6. Series 3 teaser identified by exact size and ETag.
7. Unmapped MP4 and zero-byte PNG metadata anomaly recorded.
8. Supabase source usage points inspected in application code and the public/private boundaries documented.

**Not authorized or not performed:**
- No object upload, copy, move, rename, overwrite, or deletion.
- No Supabase database or Storage changes.
- No Production configuration or deployment changes.
- No custom-domain binding or bucket-wide public access.
- No application media-read switch.
- No PR merge.
- No Main Website changes.
- No changes to Series 2 archive privacy or Plato ID / registration evidence / Scanner-OCR privacy.

### 7. Next technical work (separate from completed Phase 3 audit)

1. Inspect the R2 object metadata/body-read behavior for the 36 PNG-named keys, read-only, to determine why the listing reports zero bytes and empty-object ETags.
2. Identify the 47,177,765-byte MP4 using a safe read-only verification method.
3. Preserve all R2 objects and Supabase originals while investigating.
4. Only after successful verification, prepare a separate controlled media-read migration and its tests.
5. Keep Series 2 archive and all private user evidence/Scanner/OCR media outside public delivery.

### 8. Change log — 2026-11-19

- Reason: Complete Phase 3 read-only R2 inventory and document the verified Preview result.
- Before: Inventory endpoint was blocked by Preview token configuration mismatch.
- Change: Preview-only audit token replaced; Preview deployment completed; read-only inventory returned 45 rows.
- Result: Inventory captured and classified. Phase 3 audit deliverable complete.
- Tests: Preview deployment completed; inventory endpoint succeeded and reported `readOnly: true`.
- Remaining technical anomaly: 36 PNG-named keys report zero bytes and empty-object ETags; further read-only R2 verification is required before any media switch.
- User decision preserved: uploaded R2 files are the same source files previously held in Supabase; no re-upload or repeated proof request.
- No Production, Supabase, R2 object, DNS, public-access, Main Website, or PR merge changes.

### Version history
- v1.0 – 2026-11-18: Initial read-only inventory endpoint implementation note.
- v1.1 – 2026-11-19: Initial record of the Preview inventory result.
- v1.2 – 2026-11-19: Corrected the phase status and source-confirmation language; records Phase 3 audit completion, classifies all inventory rows, preserves the user's confirmed upload context, and separates the remaining read-only technical anomaly investigation from the completed audit.
