# PLATO LAND – Temporary Projects
## R2 migration progress – corrected Preview deployment verification

**Version:** 1.3  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only; Series 3 public-media migration  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 (Open, Draft, unmerged)  
**Latest documented commit:** `1ce01b8bd39606fea40920c12728e8b774995a4f`

## 1. Correction to v1.2

The v1.2 report incorrectly treated the old deployment URL `230a3430.plato-land-preview.pages.dev` as the current Preview target and concluded that live Preview access was blocked by Cloudflare Access. A subsequent read-only inspection of the Cloudflare Pages dashboard identified the correct per-deployment Preview URL for the current PR commit. The old URL belongs to an earlier deployment and must not be used for current verification.

## 2. Cloudflare Pages project – live dashboard inspection

Read-only inspection confirmed:
- Pages project: `plato-land-preview`.
- Connected repository: `Omidso82/Plato-land-preview`.
- Production branch configured in Cloudflare: `cloudflare-preview`.
- Automatic deployments: enabled.
- Build output directory: `dist`.
- R2 binding: `PLATO_MEDIA_BUCKET` → `plato-land-media`.
- Preview Access protection is configured.
- Default project domain: `plato-land-preview.pages.dev`.
- No custom domain is configured on this Pages project.

Recent deployment rows showed:
- Commit `1ce01b8`: Preview deployment `feed6a95`.
- Commit `8ac4893`: Preview deployment `4d33e5b7`.
- Commit `7b47bec`: Preview deployment `dc84564f`.
- Commit `76d0adf`: Preview deployment `e17d6a73`.
- Commit `2826022`: Preview deployment `327512f0`.

The separate GitHub Actions workflow `deploy-preview.yml` prepares/uploads GitHub Pages artifacts; its deploy job is restricted to `main`. Cloudflare Pages Preview deployments are managed by the Cloudflare Pages Git integration and are independently visible in the Cloudflare dashboard. Therefore, the skipped GitHub Pages deploy job did not mean that the Cloudflare Preview deployment was absent.

## 3. Correct Preview media endpoint – read-only runtime check

Correct deployment URL:
`https://feed6a95.plato-land-preview.pages.dev/media/series3?asset=teaser`

Observed browser result:
- Page/resource returned **200 OK**.
- The browser identified the media as **video/mp4** and displayed a video element/player.
- Content-Length was not directly observable in the browser inspection.
- Byte-range seeking was **not conclusively tested**. The presence of a progress control alone is not accepted as proof of successful HTTP Range requests.
- A separate interaction attempt could not operate the custom player controls, so playback advancement and seek-resume remain unverified.

This confirms the current Preview URL and media route are reachable. It does not yet certify complete playback or Range behavior.

## 4. Read-only inventory endpoint

The current deployment also serves:
`https://feed6a95.plato-land-preview.pages.dev/__internal/r2-inventory`

The page loads and displays the expected read-only inventory interface. It requires the Preview `R2_AUDIT_TOKEN` in a password-type field before generating the inventory. No token was entered and no inventory POST was submitted in this verification step.

## 5. R2 dashboard inspection – current limitation

The Cloudflare dashboard confirms bucket `plato-land-media` and a total overview previously reported as 45 objects / approximately 52.07 MB. The object browser navigation exposed the folder hierarchy:
- `plato-land/backgammon/series-2/rules/`
- `plato-land/backgammon/series-3/videos/`
- `plato-land/backgammon/series-3/rules/`

The dashboard browser did not render individual object rows, sizes or MIME metadata in the inspected nested folders. Therefore this dashboard pass does not resolve the earlier 36 PNG zero-byte metadata discrepancy and does not provide a source-to-key manifest.

The prior machine inventory record remains the only detailed object-level listing available:
- 45 rows, 52,068,303 listed bytes;
- 2 non-zero MP4 objects;
- 43 zero-byte rows, including 36 PNG-named rows and 7 directory markers.
- The teaser row matches the Supabase teaser metadata by exact size and ETag.
- The 47,177,765-byte MP4 remains unidentified.
- Poster and 17 slides remain unmapped.

## 6. Next technical steps

1. Use the existing Preview-only audit mechanism to retrieve the `head()` verification output. If the existing token is not available in the secure browser context, rotate only the Preview `R2_AUDIT_TOKEN` (never Production) and immediately run the read-only endpoint; keep the token out of chat and Git.
2. Compare all list/head size, ETag, content-type and checksum values.
3. If PNG metadata remains zero, perform bounded read-only content verification and correlate with the Supabase source metadata; do not upload again or mutate objects.
4. Identify the 47,177,765-byte MP4 with read-only evidence.
5. Verify actual HTTP Range behavior with a controlled request, then verify playback and seeking in a real mobile browser.
6. Map the poster and 17 slides only from verified evidence.
7. Keep all private evidence, Scanner/OCR and Series 2 archive paths outside public delivery.

## 7. Safety and scope

- No Supabase DB or Storage writes.
- No R2 object upload, copy, rename, overwrite, move or delete.
- No Production configuration or deployment changes.
- No bucket-wide public access, DNS, custom-domain or Access policy changes.
- No PR merge.
- No Scanner/OCR or registration evidence exposure.
- No Series 2 archive exposure.
- No Main Website changes.
- No new paid service, bucket, database or plan.

## Version history

- v1.0 – 2026-11-19: Initial teaser read-path implementation and progress record.
- v1.1 – 2026-11-19: Added Preview-only read-only R2 HEAD verification.
- v1.2 – 2026-11-19: Recorded CI and an incorrect assumption that the old deployment URL represented current Preview access.
- v1.3 – 2026-11-19: Corrected the Preview deployment target using live Cloudflare dashboard evidence; recorded successful 200/video/mp4 route reachability, incomplete Range/playback verification, and current R2 inventory access limits.
