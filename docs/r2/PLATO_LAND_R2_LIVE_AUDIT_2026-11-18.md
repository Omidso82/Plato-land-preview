# PLATO LAND – Temporary Projects
## Cloudflare R2 live audit – 2026-11-18

**Audit type:** Read-only Cloudflare dashboard inspection  
**Bucket:** `plato-land-media`  
**Approved public host:** `media.platoland.org`  
**Approved object root:** `plato-land/`  
**No settings or objects were changed during this audit.**

## Confirmed live settings
- Bucket exists in the connected Cloudflare account.
- R2 Public Access is **Disabled**; the bucket is private.
- `media.platoland.org` is **not assigned** to this bucket. No domain health or TLS state is available for this bucket yet.
- Public Development URL is disabled.
- No CORS policy is configured.
- One enabled lifecycle rule aborts incomplete multipart uploads after 7 days.
- No event notifications or data-access logs are configured.

## Object inventory observations
Two read-only dashboard inspections returned conflicting aggregate figures:
- First overview: 397 objects and 510.65 MB.
- Second recursive folder traversal: 20 visible objects and 104.14 MB.

The recursive traversal showed:
- Only top-level prefix: `plato-land/`.
- Series 2: `plato-land/backgammon/series-2/rules/سری دوم عکسها/` with 18 PNG objects, each displayed as 0 B.
- Series 3: `plato-land/backgammon/series-3/videos/` with two MP4 objects:
  - `-7906938477879233526.MP4` (47.18 MB)
  - `168302900751657886.MP4` (4.89 MB)
- Series 3 rules folder was empty.
- No Series 3 poster or slide objects were visible in the traversed tree.

**Inventory status: NOT ACCEPTED AS COMPLETE.** The dashboard totals conflict with the manually traversed 20 objects. A complete machine-readable inventory (all keys, sizes, MIME types, checksums) is required before mapping or public exposure. The 18 zero-byte PNG entries also require validation; do not assume they contain usable image data.

## Security and delivery conclusion
The architecture requires public media to be delivered through the dedicated domain/CDN, while restricted or expired media must remain inaccessible to the public. Attaching a public R2 custom domain to a bucket can make bucket objects publicly retrievable through that domain. Therefore the current mixed/uncertain contents must not be exposed wholesale.

Before domain attachment, choose and implement a verified separation mechanism for public vs restricted/expired objects (for example, separate public/private storage boundaries or an authenticated delivery layer), without adding paid services or buckets unless separately approved. Keep the current bucket private until this is resolved.

## Series 3 implementation mapping
The current R2 traversal did not locate the expected public poster, 17 slides, teaser, or rules-video object names. The two MP4 objects have opaque filenames and were not content-verified. Do not map them to UI slots based on filenames alone.

## Verification status
- GitHub PR #215 is open and Draft.
- GitHub `verify` check: success.
- GitHub `build` check: success.
- Cloudflare Pages PR preview: success.
- Production deploy job: skipped.
- No main-branch merge or production deployment was performed.
- No Supabase records, Storage files, policies, or database objects were changed.
- No R2 object was copied, uploaded, renamed, moved, or deleted.
- No Cloudflare R2 setting, public access setting, or custom-domain setting was changed.

## Next gates
1. Resolve the aggregate inventory discrepancy with a complete, auditable object listing.
2. Classify every object as public, restricted, expired, or archived based on approved business records—not filename guesses.
3. Confirm the intended public/private boundary without new cost.
4. Map verified Series 3 assets to exact object keys and validate actual content/MIME/checksum.
5. Implement authenticated owner upload to R2; never expose R2 credentials in browser code.
6. Switch public Series 3 reads only after the mapping and access tests pass.
7. Test Scanner/OCR, archive retrieval, Telegram image flows, and mobile rendering.
8. Retain Supabase originals until all acceptance tests pass and the owner separately approves deletion.

**Conclusion:** R2 bucket creation/storage is present, but public delivery and the application migration are not complete. This phase must remain unmerged until the security boundary and inventory discrepancy are resolved.
