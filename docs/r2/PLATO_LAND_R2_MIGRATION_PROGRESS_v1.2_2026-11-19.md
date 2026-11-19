# PLATO LAND – Temporary Projects
## R2 migration progress – CI and Preview access verification

**Version:** 1.2  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only; Series 3 public-media migration  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 (Open, Draft, unmerged)  
**Verified branch HEAD:** `8ac4893ce75e4b54676ff2d0f77838746978ae3e`

## 1. CI verification – completed

For the current PR HEAD:

- GitHub Actions **Build and typecheck** run `44428332426`: completed, conclusion **success**; its `verify` job succeeded.
- GitHub Actions **Deploy PLATO LAND website** run `44428332449`: build job succeeded, but deploy job conclusion was **skipped**.
- Therefore, CI verification is green, but this workflow did not deploy the current HEAD to Cloudflare Pages Preview. A successful build is not a Preview runtime deployment.

## 2. Live Preview access check – attempted, blocked by Access

A live browser check was made against the previously recorded Preview URL:

`https://230a3430.plato-land-preview.pages.dev/media/series3?asset=teaser`

The URL redirected to the Cloudflare Access login host:

`plato-land-preview-pages.cloudflareaccess.com/cdn-cgi/access/login/...`

The browser could not reach the media function or receive an HTTP video response. Consequently, status code, content type, content length, and byte-range behavior remain **unverified**.

The available browser profiles do not record a sign-in to the Cloudflare Access host. One profile records `cloudflare.com`, but that does not establish an authenticated session for `cloudflareaccess.com`. No credentials were requested or entered, and no Access policy/settings were changed.

**Important:** the previously known Preview URL is tied to deployment ID `230a3430-7df9-4661-a3a4-dfddc6f652f0` and inventory commit `5aa5153d8379e3905af6334d9ccf3d3de6e0fe0e`. It is not evidence that the latest PR HEAD `8ac4893...` has a current Preview deployment.

## 3. R2 read-only verification endpoint

The branch source confirms that `functions/__internal/r2-inventory.ts` now:
- lists keys under `plato-land/`;
- checks every listed key with R2 `head()`;
- returns list/head size and ETag comparisons, content type and available checksums;
- does not download object bodies or mutate objects;
- requires the Preview bearer token and existing R2 binding.

The endpoint's runtime output has **not** yet been retrieved because the Preview host is behind Cloudflare Access and the authenticated browser session is unavailable. No claim is made about the actual `head()` results.

## 4. Media mapping status

- The Series 3 teaser key remains identified by matching source size and ETag: `plato-land/backgammon/series-3/videos/168302900751657886.MP4`, 4,890,538 bytes, ETag `415b6f13070e0600cfa57c90523352be`.
- The 47,177,765-byte MP4 remains unidentified.
- The R2 keys for the Series 3 poster and 17 slides remain unmapped. Do not infer opaque names or map by list ordering.
- Owner confirmation that R2 already contains the same source files remains accepted; no re-upload or duplicate copy is requested.

## 5. Next actions

1. Resolve access to the existing Preview host through an already authenticated Cloudflare Access browser session, or have the Preview owner perform the sign-in in the existing browser profile. Do not ask for passwords or tokens in chat.
2. Obtain a Preview deployment for the current branch HEAD and verify the deployment commit matches `8ac4893...` or a later documented commit.
3. Run the read-only inventory endpoint and inspect all `verifiedObjects`.
4. If `head()` confirms non-zero PNG sizes, use size, MIME and checksums to map the poster and 17 slides. If it confirms zero sizes, inspect only the necessary bounded object ranges/content with a secure authenticated diagnostic; do not mutate objects.
5. Identify the 47,177,765-byte MP4 with read-only evidence.
6. Continue public/private delivery tests only after the access boundary and custom-domain readiness are verified.

## 6. Safety and scope

- No Supabase database or Storage writes.
- No R2 object upload, copy, rename, overwrite, move or delete.
- No Cloudflare Production setting changes.
- No bucket-wide public access or custom-domain binding changes.
- No PR merge or Production deployment.
- No Scanner/OCR or registration evidence exposure.
- No Series 2 archive exposure.
- No Main Website changes.
- No paid service, new bucket, database or plan.

## Version history

- v1.0 – 2026-11-19: Initial teaser read-path implementation and progress record.
- v1.1 – 2026-11-19: Added Preview-only, read-only R2 HEAD verification.
- v1.2 – 2026-11-19: Recorded green CI for current PR HEAD, skipped deploy job, live Preview Cloudflare Access gate, and the resulting runtime-verification blocker.
