# PLATO LAND – Temporary Projects
## R2 connection status, live-route verification and release blockers

**Document version:** 1.7  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only — existing admin panel and Series 3 public media  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 — Open, Draft, Unmerged  
**Verified head:** `6bb7c4c4901bda30ea1be5574667adddaffe3f7f`

## 1. Work completed in this step

- Re-read PR #215, the latest source files and the controlling R2 architecture handover v1.5.
- Rechecked the current PR head and file list.
- Updated `src/series3MediaClient.ts` so an upload is not reported successful based only on the POST response:
  - verifies the server-reported stored size equals the selected file size;
  - issues an independent same-origin HEAD request for the same asset slot;
  - checks the returned Content-Length and Content-Type against the selected file;
  - reports a verification error instead of claiming success if read-back fails or metadata differs.
- Source commit: `6bb7c4c4901bda30ea1be5574667adddaffe3f7f`.
- GitHub Actions Build and typecheck run `44549085558`: SUCCESS.
- GitHub Actions website build/deploy workflow run `44549085396`: SUCCESS. Its main-branch production deployment remains branch-gated; this PR branch was not published to the live site.
- Cloudflare Pages Preview deployment for this commit: SUCCESS.
- Preview deployment URL: `https://bed19b2a.plato-land-preview.pages.dev`.
- Branch Preview URL: `https://feature-temporary-projects-r.plato-land-preview.pages.dev`.

## 2. Runtime results — media is not yet connected

Read-only browser checks against the latest branch Preview returned the visible response `Media not found` for:
- `teaser`
- `poster`
- `slide-01`
- `rules`
- `series2-slide-01`
- `series2-poster`

The legacy Preview route `/media/series3?asset=teaser` also returned `Media not found`; no video player or media body was rendered.

The checks did not upload, replace, delete or modify any media object. Exact HTTP status and response headers were not exposed by the browser inspection, so this record does not claim a specific numeric status.

## 3. Cloudflare configuration audit

Read-only inspection of the Cloudflare account confirmed:
- Pages project: `plato-land-preview`.
- R2 binding: `PLATO_MEDIA_BUCKET` → `plato-land-media`.
- The Pages project settings showed one global binding set, not separate Preview/Production bindings.
- No custom domains are attached to this Pages project.
- Neither `platoland.org` nor `media.platoland.org` is attached to this Pages project.
- R2 Public Access for `plato-land-media` remains Disabled.

The R2 dashboard showed the bucket size metric as 52.07 MB, but the Objects tab rendered an empty state rather than a file listing. A separate existing bucket `plato-land-media-public` was found in the EU region and showed 0 bytes and no objects. It was not used and is not an approved substitute.

## 4. Live-domain route verification

A read-only request to:

`https://platoland.org/api/series3-media?asset=teaser`

returned the normal PLATO LAND SPA homepage shell rather than an R2 Pages Function response. This confirms that the current live domain is not serving the new Pages Function at that path.

The current Cloudflare Pages project has no custom domain, so a successful Preview deployment does not connect the owner's existing panel at `platoland.org` to the new Function.

## 5. Existing R2 inventory evidence and unresolved discrepancy

The earlier Preview-only inventory audit v1.2 records:
- 45 listed objects under `plato-land/`;
- total listed bytes 52,068,303;
- two non-zero MP4 objects;
- 43 zero-byte rows, including 36 PNG-named objects and seven directory markers;
- the teaser candidate `plato-land/backgammon/series-3/videos/168302900751657886.MP4` matched the known Supabase teaser size and ETag;
- the other 47,177,765-byte MP4 remains unidentified;
- the Series 3 PNG-named keys include a Persian folder name with two spaces before `rules/`.

This inventory conflicts with the current dashboard Objects-tab empty state and with the latest Preview media routes returning `Media not found`. The 36 zero-byte PNG entries and the other MP4 must be independently investigated before assigning media slots.

The owner's confirmation that the files were originally uploaded from the same Supabase source files remains accepted. No request is made to upload them again. No filename, extension, key or media identity is guessed in this report.

## 6. Release and privacy boundary

- PR #215 remains Open / Draft / Unmerged.
- No merge to `main`.
- No Production deployment or live-panel update.
- No custom-domain, DNS, Pages Production branch, R2 Public Access or Cloudflare Access changes.
- No R2 upload, copy, overwrite, rename, move, download or deletion.
- No Supabase database, Storage, policy or migration writes.
- No Series 2 archive exposure.
- No Scanner, OCR, Plato ID image or registration-evidence exposure.
- No Telegram send or destination change.
- No Main Website changes.
- No new bucket, database, paid service or plan upgrade.

## 7. Remaining blockers and next safe sequence

1. Resolve the R2 inventory/listing discrepancy and verify exact object metadata/content without mutating objects or asking the owner to re-upload.
2. Confirm the exact media delivery runtime for the live panel. The current `platoland.org` host does not execute the Pages Function, and the Pages project has no custom domain.
3. The isolated media host `media.platoland.org` is an approved architectural value, but attaching a Worker/Pages endpoint or changing domain routing is a separate production configuration action and has not been performed.
4. After the owner approves the isolated live media endpoint, wire the existing panel to that endpoint with a strict origin allowlist and CORS preflight handling; keep `platoland.org` hosting unchanged.
5. Preserve the private R2 bucket. Serve only explicitly allowlisted public event assets; never expose the mixed bucket wholesale.
6. Verify owner-only POST authorization, R2 write, independent HEAD read-back, GET, byte ranges, all 17 Series 3 slides, poster, both videos, iPhone/Safari, and the public Series 3 page.
7. Keep Supabase originals and all unrelated/private objects intact. No deletion or migration is authorized by this status update.

## Version history

- v1.6 — 2026-11-19: Records Series 3 R2 upload/read implementation and earlier CI state.
- v1.7 — 2026-11-19: Records independent upload HEAD verification, successful CI and Preview deployment, missing-media runtime checks, Cloudflare binding/domain audit, live-domain SPA fallback, and the remaining production media-host and R2 inventory blockers.
