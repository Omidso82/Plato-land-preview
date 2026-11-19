# PLATO LAND – Temporary Projects
## R2 inventory audit – verified Preview result

**Version:** 1.1  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 – Open, Draft, unmerged  
**Audit deployment:** `230a3430-7df9-4661-a3a4-dfddc6f652f0`  
**Commit:** `5aa5153d8379e3905af6334d9ccf3d3de6e0fe0e`  
**Preview URL:** `https://230a3430.plato-land-preview.pages.dev`

### 1. Completed Preview-only access repair

- Replaced only the Preview environment secret `R2_AUDIT_TOKEN` with a fresh 256-bit random value generated in the browser session.
- Kept Production `R2_AUDIT_TOKEN` unchanged.
- Kept `VITE_PLATO_PREVIEW=true` unchanged.
- Triggered and verified a successful Preview-only deployment for the feature branch.
- The token was not exposed in chat, logs, Git, or this document.

### 2. Read-only inventory result

Endpoint: `/__internal/r2-inventory`  
Bucket: `plato-land-media`  
Prefix: `plato-land/`  
Endpoint reported `readOnly: true`.

| Metric | Verified result |
|---|---:|
| Total listed rows | 45 |
| Total bytes | 52,068,303 |
| Non-zero objects | 2 |
| Zero-byte objects | 43 |
| Directory-marker rows | 7 |
| Zero-byte image-named objects | 36 |
| Non-zero MP4 objects | 2 |

**Important correction:** the 43 zero-byte rows are not all folder markers. Seven are directory markers; 36 are objects whose keys end in `.PNG` but whose reported size is zero and whose ETag is the empty-object MD5 `d41d8cd98f00b204e9800998ecf8427e`. The endpoint returned no MIME type for these rows. They must not be treated as valid image uploads.

### 3. Non-zero object details

| R2 key | Size | ETag | Uploaded UTC | Finding |
|---|---:|---|---|---|
| `plato-land/backgammon/series-3/videos/-7906938477879233526.MP4` | 47,177,765 | `9dfcd62361af97ad251d7bd65e275232` | 2026-11-18T14:29:02.688Z | No matching Series 3 Supabase source identified in the audited source list; not yet mapped |
| `plato-land/backgammon/series-3/videos/168302900751657886.MP4` | 4,890,538 | `415b6f13070e0600cfa57c90523352be` | 2026-11-18T14:27:11.315Z | Exact size and ETag match to Supabase `series3-video/teaser/series3-home-teaser.mp4` |

The expected Supabase Series 3 rules video is `series3-video/rules/series3-important-rules.mp4`, size 10,299,472 bytes, ETag `4f4fdc2b0f895d7fb7491e673d9a4114`. No R2 non-zero object matches that size/ETag in this inventory. The 47,177,765-byte MP4 is not an exact metadata match and must not be relabeled as the rules video without further verification.

### 4. Zero-byte image-named keys

The inventory contains 36 image-named `.PNG` keys with size 0, no MIME metadata, and empty-object ETag. They are grouped under:
- `plato-land/backgammon/series-2/rules/سری دوم عکسها/` — 18 PNG-named zero-byte objects.
- `plato-land/backgammon/series-3/  rules/سری سوم عکسها/` — 18 PNG-named zero-byte objects.

Series 3 keys include the following filename set (all zero bytes):
`28E9AF4F-7FC1-4667-9A3A-898FD698BCDB.PNG`,
`2FF17AC1-D0B3-4816-B4CE-C0AAF70CD84A.PNG`,
`3CE7DA27-B589-44A4-A31B-84711BB95FB3.PNG`,
`4250B3A3-8637-429F-8250-8EE5C628C1EF.PNG`,
`62897FDC-0284-47EB-A942-DBC332841312.PNG`,
`6AD540EE-E85F-4B4C-AAE9-9AE421F0E320.PNG`,
`6D99E4AF-6CA1-4A07-8F72-454C0EE9F0B8.PNG`,
`8EEDAA46-33B3-4918-B63D-E26C8A82EB60.PNG`,
`A53BD332-E8DA-4457-9791-DC812A7F33F6.PNG`,
`B3D8B43C-9986-487D-ACD5-B03BC479F6CF.PNG`,
`B3D8D437-EEC2-42B0-9F79-0D7A8975892C.PNG`,
`CD226BA5-5C3F-4E03-9466-2BCAF4E4921D.PNG`,
`D0B5B224-FE79-4F41-907B-3C8B0ADBE8A2.PNG`,
`EA109179-7EFB-4CEC-97FC-33419A3E67E9.PNG`,
`EFF03EE6-81ED-4D1D-9A64-E82A75A1AF80.PNG`,
`F0B684E0-9397-4784-A983-63FD26F8B929.PNG`,
`F87F96A8-2691-420A-9199-2496CCC99F57.PNG`,
`IMG_1592.PNG`.

The Series 3 path contains two spaces before `rules/`; this key-path irregularity must be preserved in the audit record and corrected only through a separately planned, verified migration (never by renaming these existing objects in this audit).

### 5. Source comparison against Supabase audit

Previously audited Supabase Series 3 sources:
- Poster: `series3-slides/poster/series3-main-poster`, PNG, 2,368,433 bytes.
- Slides: `series3-slides/slides/01` through `slides/17`, PNG, each non-zero (approximately 2.07–2.38 MB).
- Rules video: `series3-video/rules/series3-important-rules.mp4`, 10,299,472 bytes, ETag `4f4fdc2b0f895d7fb7491e673d9a4114`.
- Home teaser: `series3-video/teaser/series3-home-teaser.mp4`, 4,890,538 bytes, ETag `415b6f13070e0600cfa57c90523352be`.

Findings:
1. The teaser video is the only exact Series 3 source match established by size and ETag.
2. The 18 Series 3 PNG-named R2 objects cannot be considered the poster + 17 slides: every one is zero bytes and carries the empty-object ETag. Their names also do not encode a deterministic source-slide mapping.
3. The 47,177,765-byte MP4 is not the audited rules video by size or ETag; source identity remains unknown.
4. No R2 key has yet been proven to correspond to the Series 3 poster or any of the 17 slides.
5. The user previously confirmed that the R2 upload action was performed using the same source files. That statement is retained as user-provided context, but it does not override the live inventory metadata; the discrepancy must be resolved without accusing the user of failing to upload and without re-uploading anything.

### 6. Required next steps

1. Preserve every existing R2 object and every Supabase original. Do not delete, overwrite, rename, move, or re-upload.
2. Investigate why 36 PNG-named objects are zero bytes and why their content type is absent. Check upload path/metadata handling and actual object bodies only through a separately scoped, read-only verification step.
3. Identify the 47,177,765-byte MP4 by safe metadata/content verification; do not map it to the rules video by assumption.
4. Reconcile all 18 Series 3 image sources (poster + 17 slides) with actual non-zero R2 objects before changing application reads.
5. Keep Series 2 archive media private and unchanged.
6. Keep Plato ID images, registration evidence, Scanner/OCR objects private and outside public media migration.
7. Do not bind the public custom domain, enable bucket-wide public access, change Production, switch application media reads, or delete Supabase originals in this audit.
8. After verification, update this document with a new version and append a change record.

### 7. Change and safety record — 2026-11-19

- Reason: Complete the approved Phase 3 read-only R2 inventory and resolve the Preview audit-token mismatch.
- Before: Preview endpoint returned `Unauthorized`; the older deployment did not successfully accept the configured audit secret.
- Change: Updated only Preview `R2_AUDIT_TOKEN`, deployed commit `5aa5153d8379e3905af6334d9ccf3d3de6e0fe0e` to Preview, and generated the inventory.
- Result: Endpoint succeeded; 45 rows / 52,068,303 bytes returned.
- Tests: Cloudflare Preview deployment status completed; endpoint returned `readOnly: true`; object metadata retrieved.
- No changes: Production, Supabase, R2 object bodies/keys, DNS, custom domain, bucket public access, GitHub source code, and Main Website.
- Remaining issue: 36 image-named objects report zero bytes; rules video and poster/slides mapping unresolved.
- Next: investigate the zero-byte object discrepancy and finish exact source mapping before any media-read switch.

### Version history
- v1.0 – 2026-11-18: Initial read-only inventory endpoint implementation note.
- v1.1 – 2026-11-19: Records successful Preview-only secret repair/deployment and the actual 45-row inventory; corrects zero-byte row classification and documents source mismatches and next verification gates.
