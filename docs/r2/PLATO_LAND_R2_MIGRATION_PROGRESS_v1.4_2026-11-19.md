# PLATO LAND – Temporary Projects
## R2 migration progress – Preview runtime and code review addendum

**Version:** 1.4  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only; Series 3 R2 media migration  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 (Open, Draft, unmerged)  
**Baseline reviewed:** `9bc8c995b17899962fce957f9433555235e168be`

## 1. Latest Preview runtime check

Latest Cloudflare Pages deployment associated with the documented PR head:
`https://b0789f51.plato-land-preview.pages.dev`

Read-only browser inspection of:
`/media/series3?asset=teaser`

Observed:
- Preview Access allowed the browser session to load the route.
- A video/mp4 media player was rendered and the video content was visible.
- Native player controls were displayed.
- The browser automation could not independently operate the native controls to establish playback advancement or successful seeking.
- Therefore, this is evidence of route/media delivery and visible video content, **not a completed playback/HTTP Range acceptance test**.
- The previous direct content fetch without the authenticated browser context returned `login_required`; this does not contradict the authenticated browser result because Preview Access protects the deployment.

No media object was uploaded, downloaded, or modified during this check.

## 2. Current code review findings

### 2.1 Series 3 application media paths

Reviewed:
- `src/Series3Gallery.tsx`
- `src/Series3SlidesPanel.tsx`
- `src/Series3VideoManager.tsx`
- `functions/media/series3.ts`
- `src/r2Media.ts`

Current source behavior:
- The home teaser read path is hard-mapped to the R2 route only when the Supabase setting is exactly `teaser/series3-home-teaser.mp4`.
- The poster read path still uses Supabase Storage.
- The 17 slide slots are still listed and displayed through Supabase Storage.
- The Series 3 rules video is still listed and played through Supabase Storage.
- The slides manager still uploads/replaces poster, slides and teaser through Supabase Storage.
- The rules-video manager still uploads/replaces the rules video through Supabase Storage.
- Supabase DB settings and analytics remain in use. No change was made to them.

Conclusion: this is a limited teaser read-path pilot, not a completed Series 3 media migration. Owner upload/replace flows require a separately designed authenticated server-side R2 upload path. R2 credentials must never be placed in browser code.

### 2.2 Public URL resolver and non-Latin keys

`src/r2Media.ts` currently validates every path segment against:
`^[a-z0-9][a-z0-9._-]*$`

This rejects Persian/non-Latin path segments. The existing R2 inventory record includes Persian folder names and an exact Series 3 prefix containing two spaces before `rules/`. Consequently:
- Do not assume every existing key can pass through the current resolver.
- Do not normalize, transliterate, rename or reconstruct existing keys.
- First retrieve the complete current inventory and confirm exact source-to-object mappings.
- Then decide whether the resolver should safely support Unicode path segments or whether verified media should use a separately approved ASCII-only destination layout.
- Any change must retain traversal protection and exact-key semantics.

No resolver code was changed in this review.

### 2.3 Range delivery implementation

`functions/media/series3.ts`:
- Allows GET and HEAD only.
- Exposes only the hard-coded `teaser` asset name.
- Calls R2 `head()` before delivery and rejects missing/zero-size objects.
- Implements a single byte-range parser and returns 206 with Content-Range for valid ranges.
- Returns 416 for malformed/unsatisfiable ranges.
- Sets `Accept-Ranges: bytes`.

Remaining verification:
- Actual HTTP HEAD headers and body length.
- Actual GET response headers and byte count.
- Actual `Range: bytes=0-1023` response: status 206, Content-Range and exactly 1024 bytes.
- Suffix range and invalid range behavior.
- Real iPhone/Safari playback and seek behavior.
- Cache behavior while Preview Access is enabled and before any public custom-domain exposure.

The route currently sets `Cache-Control: public, max-age=300, s-maxage=3600`. This must be reviewed against the final public/private delivery boundary before broadening the route or attaching the approved custom domain. No cache or access configuration was changed.

### 2.4 Existing migration pilot workflow

Reviewed:
- `.github/workflows/r2-migration-pilot.yml`
- `scripts/r2-migration/copy_one_object.py`

The workflow is manual-only and requires a source bucket/key plus a `dry_run` input defaulting to true. The script performs a real R2 `put_object` when `DRY_RUN=false`, then reads the destination back for size/SHA-256 verification. It does not delete the source.

This workflow was **not run**. No R2 write, copy, overwrite, or object verification read was performed. A dry-run of the current script would still read the selected Supabase source object, so it is not needed for the present read-only code review.

## 3. CI coverage gap

The current `.github/workflows/verify.yml` runs typecheck/build and existing Deno tests for other features. It does not currently run deterministic tests for:
- R2 URL resolver acceptance/rejection, including Unicode and path traversal cases.
- Series 3 media route HEAD/GET/Range behavior.
- Missing object and zero-size object behavior.
- Invalid and suffix byte ranges.

No new test framework or paid dependency was added. No CI workflow was changed in this review.

## 4. PR and CI status rechecked

PR #215:
- State: open.
- Draft: true.
- Merged: false.
- Base: `main`.
- Head: `feature/temporary-projects-r2-public-media-phase1`.
- Head SHA at review: `9bc8c995b17899962fce957f9433555235e168be`.

GitHub Actions for that SHA:
- Build and typecheck: completed, success.
- Deploy PLATO LAND website workflow: completed, success; its production deploy job is branch-gated to `main`. This does not establish a Production deployment from the PR branch.

PR remains Draft and unmerged.

## 5. Outstanding blockers and next safe work

1. Retrieve the complete read-only R2 inventory using the existing Preview-only token through an approved secure path. Do not rotate or expose the token through chat, Git, logs or untrusted browser automation.
2. Compare each listed object with independent R2 `head()` metadata. Resolve the 36 PNG zero-byte listing discrepancy without re-uploading or mutating objects.
3. Identify the 47,177,765-byte MP4 using read-only evidence.
4. Establish exact poster + 17 slide + teaser + rules-video key mappings.
5. Add deterministic tests without introducing unnecessary paid services/dependencies.
6. Verify Range behavior with controlled HTTP requests and playback/seek on iPhone/Safari.
7. Review cache semantics and confirm a safe public/private boundary before any public custom-domain work.
8. Design authenticated owner upload/replace separately; preserve Supabase originals and DB settings until parity and acceptance tests pass.

## 6. Safety record

During this review:
- No Production settings, deployment or domain changes.
- No PR merge or readiness transition.
- No Supabase DB, Storage object, policy or migration writes.
- No R2 object upload, copy, overwrite, rename, move or deletion.
- No R2 public-access or custom-domain change.
- No Access policy or secret rotation.
- No Scanner/OCR, Plato ID or registration evidence exposure.
- No Series 2 archive exposure or deletion.
- No Main Website changes.
- No new bucket, database, paid service or plan.

## Version history

- v1.3 – 2026-11-19: Corrected Preview target and documented incomplete runtime/inventory verification.
- v1.4 – 2026-11-19: Added latest authenticated Preview runtime check, source-level media migration status, Unicode-key resolver limitation, Range/cache review points, migration workflow safety review, CI test gap, and current PR/CI status.
