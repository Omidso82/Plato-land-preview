# PLATO LAND – Temporary Projects
## Media endpoint security follow-up

**Document version:** 1.10  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only — R2 media endpoint  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 — Open, Draft, Unmerged  
**Source commit:** `e979f89fcf2eb4167df7927009089729296e1f9b`

## 1. Security corrections recorded

Following review of the media API and Series 2 manager integration:

1. Series 2 slide and poster asset keys remain in the allowlist only for the existing owner management workflow; API GET/HEAD now requires a verified owner bearer token.
2. Series 2 manager preview reads use authenticated fetch requests and in-memory object URLs. These URLs are revoked on refresh/unmount rather than publishing a public object URL.
3. Upload read-back HEAD requests carry the same owner bearer token, so private Series 2 assets can be verified without weakening access controls.
4. Owner-only Series 2 responses and R2 object metadata use `Cache-Control: private, no-store`; public caching is not applied to these archive objects.
5. Public Series 3 event media uses public cache headers only for the explicit public asset allowlist.
6. CORS allows the exact production site origin `https://platoland.org` when the media host is cross-origin. Same-origin requests are accepted for the deployment that serves them, including same-origin Preview testing. Other cross-origin origins are rejected.
7. OPTIONS preflight is handled; the response exposes Content-Length, Content-Range, Accept-Ranges and ETag for media/video handling.
8. Cross-Origin-Resource-Policy is `same-site` to support the approved parent-site to media-subdomain relationship.

## 2. Verification boundary

These are source changes on the feature branch only. They do not establish runtime security until the API is deployed to an isolated test target and the following are tested:
- unauthenticated Series 2 GET and HEAD return 403;
- non-owner authenticated Series 2 GET and HEAD return 403;
- owner Series 2 GET/HEAD succeed and responses are `private, no-store`;
- Series 2 owner uploads and independent HEAD verification succeed;
- public Series 3 assets work only from the exact production origin or same-origin deployment;
- unapproved cross-origin requests and preflights are rejected;
- public GET/HEAD, video byte ranges, invalid ranges, missing objects and mobile Safari work correctly.

No Preview-origin cross-origin exception is added. Preview requests are allowed only when they are same-origin with their own deployment.

## 3. Infrastructure blocker unchanged

Namecheap BasicDNS remains authoritative for `platoland.org`. The connected Cloudflare account has no active parent zone. Official Cloudflare documentation confirms:
- Custom Domains require an active zone.
- CNAME/partial setup requires Business or Enterprise.
- Independently delegated child/subdomain zones require Enterprise.

No paid plan, nameserver migration, DNS edit, R2 public-access change, merge, Production deployment or external-provider onboarding is authorized.

## 4. Version history

- v1.10 — 2026-11-19: Records private cache headers for Series 2 archive objects and same-origin Preview / exact-production CORS behavior.
