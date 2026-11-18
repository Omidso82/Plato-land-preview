# PLATO LAND – Temporary Projects
## R2 public-media integration – Phase 1

**Status:** Source preparation only; not merged or deployed  
**Base:** `main`  
**Scope:** Temporary Projects only

### Approved media destination
- Public media host: `https://media.platoland.org`
- R2 bucket: `plato-land-media`
- Object-key root: `plato-land/`
- Approved hierarchy: game / series / media category, e.g. `plato-land/backgammon/series-3/posters/` and `.../slides/`.

### Changes in this phase
- Adds `src/r2Media.ts`, a centralized public R2 URL resolver.
- The resolver accepts only verified object keys under `plato-land/`.
- It does not list bucket contents, upload, delete, sign private URLs, or silently fall back to Supabase Storage.

### Explicitly not changed
- No existing page or upload component is switched yet.
- No Supabase Storage object, row, table, policy, or migration is changed.
- No Cloudflare DNS, bucket, custom-domain, public-access, or paid-plan setting is changed.
- No R2 copy/migration workflow is run.
- No Scanner/private Plato ID image is moved or made public.
- No Series 2 archive asset is deleted or exposed.
- No Main Website code is changed.

### Required gates before switching page reads
1. Read-only inventory of existing R2 object keys and verify the custom domain is bound and serving the intended bucket.
2. Map each Series 3 poster, 17 slide slots, teaser video, and rules video to exact existing R2 object keys.
3. Confirm public vs restricted lifecycle for every asset; expired/archived assets must not be exposed publicly.
4. Add tests for URL mapping and missing-object behavior, then switch only public Series 3 reads.
5. Implement authenticated R2 upload flow separately; do not place R2 credentials in browser code.
6. Verify mobile rendering and existing Telegram/outbox integrations.
7. Keep Supabase source files until parity, runtime tests, and explicit owner deletion approval.

### Review note
The existing Series 3 components still use Supabase Storage list/getPublicUrl/upload APIs. This phase intentionally does not guess R2 filenames or object inventory. A URL resolver alone is not proof that an object exists or that the domain is connected.
