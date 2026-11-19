# PLATO LAND – Temporary Projects
## Media endpoint: corrected no-cost custom subdomain route
**Document version:** 1.11  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only — isolated R2 media endpoint  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 — Open, Draft, Unmerged

## 1. Purpose and correction
This document corrects the routing assessment in readiness document v1.9 and the earlier PR description. The earlier conclusion that Cloudflare Free has no route for `media.platoland.org` while Namecheap BasicDNS remains authoritative was too broad: it considered Workers Custom Domains and Cloudflare partial-zone setup, but did not account for Cloudflare Pages custom subdomains.

Cloudflare Pages officially supports custom **subdomains** without making the parent domain a Cloudflare zone. The owner can keep Namecheap BasicDNS and add a CNAME at Namecheap to the Pages project hostname. This does not require moving parent nameservers or upgrading to Business/Enterprise.

Official documentation:
- Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Pages preview deployments: https://developers.cloudflare.com/pages/configuration/preview-deployments/
- Custom domain to a branch: https://developers.cloudflare.com/pages/how-to/custom-branch-aliases/

## 2. Important routing distinction
A custom subdomain CNAME at an external DNS provider (Namecheap) routes to the Pages project's **production branch**. Cloudflare's branch-specific custom-domain alias requires a proxied Cloudflare DNS record. With Namecheap BasicDNS and an ordinary unproxied CNAME, the hostname does not automatically follow a non-production PR preview branch.

Therefore:
- Do not point `media.platoland.org` directly at a PR preview URL and assume it will remain bound to that branch.
- Do not attach the hostname to the existing `plato-land-preview` project until its production branch and production contents are verified.
- Do not change that project's production branch merely to make the custom hostname work; this could alter the preview project's production deployment.
- Preferred isolated implementation: create a dedicated Cloudflare Pages project for the media endpoint, connected to the same repository and explicitly using `feature/temporary-projects-r2-public-media-phase1` as its production branch, with the existing `PLATO_MEDIA_BUCKET` R2 binding and required non-secret runtime settings. The project must contain only the reviewed media endpoint behavior and must not publish or replace the Main Website.
- After a successful production deployment of that dedicated media project, add `media.platoland.org` as its Pages custom subdomain and configure the matching CNAME at Namecheap to the exact Pages hostname shown by Cloudflare.
- Verify HTTPS certificate activation and public/private access tests before changing any public client to rely on this hostname.

The dedicated Pages project is a Cloudflare Pages configuration resource, not a new database, bucket, paid plan, or nameserver migration. Its current creation and binding status is **not yet verified or completed**.

## 3. Existing verified state at this revision
- Cloudflare Pages PR preview for commit `c22d8ce5c6f88e6017700548aeec5f95ead9c979` reported successful deployment by the Cloudflare Pages bot:
  - Preview: https://4278253b.plato-land-preview.pages.dev
  - Branch alias: https://feature-temporary-projects-r.plato-land-preview.pages.dev
- GitHub Build and typecheck: success.
- GitHub Verify workflow: success.
- GitHub Pages workflow build/upload job: success; its deploy job was skipped. This does not publish the feature branch to the Main Website.
- PR #215 remains Open, Draft, Unmerged.
- The successful Pages preview does not prove that R2 objects exist at every allowlisted key, that the bucket binding works for all slots, or that the final custom hostname is active.
- The current source API has a strict allowlist, owner authorization for Series 2 archive reads, private no-store cache headers for those reads, Range handling and CORS for the main origin.
- The existing live Main Website route `https://platoland.org/api/series3-media?asset=teaser` still returns the SPA rather than the Pages Function. The Main Website is not changed by this work.

## 4. Remaining exact work
1. Create the dedicated media-only Pages project with the feature branch as its production branch.
2. Bind the existing R2 bucket `plato-land-media` as `PLATO_MEDIA_BUCKET`; verify no bucket-wide public access is enabled.
3. Verify project deployment and runtime for known public and private asset slots. Resolve the existing R2 inventory/runtime discrepancy without copying, overwriting, renaming, moving, deleting or re-uploading old objects.
4. Add `media.platoland.org` as a Pages custom subdomain on that dedicated project.
5. Add only the required Namecheap CNAME for host `media`, pointing to the exact Pages hostname provided by Cloudflare. Do not alter apex A records, MX/TXT, Brevo records, mail settings or nameservers.
6. After DNS and certificate activation, test GET, HEAD, missing objects, video byte ranges and invalid ranges, OPTIONS/CORS from `https://platoland.org`, Series 2 owner-only GET/HEAD, unauthorized upload, authenticated upload and independent HEAD verification.
7. Only after the custom hostname is verified should the main-site client use the media hostname. Preserve same-origin Pages preview behavior for development/QA.
8. Keep PR #215 Draft and unmerged until the release scope and all acceptance checks are approved. No Main Website deployment is part of this media endpoint work.

## 5. Safety boundaries
No parent nameserver migration; no apex DNS changes; no paid Cloudflare plan; no new bucket/database; no public bucket access; no Supabase DB/Storage/policy changes; no existing R2 object mutation; no public access to Series 2 archive, Scanner/OCR, Plato ID images or registration evidence; no Main Website changes; no Telegram sends.

## Version history
- v1.11 — 2026-11-19: Corrects the Cloudflare Free routing assessment using the official Pages custom-subdomain documentation; records the isolated Pages-project approach and exact remaining work.
- v1.9 — 2026-11-19: Records Namecheap BasicDNS evidence and the earlier Workers/partial-zone routing assessment.
