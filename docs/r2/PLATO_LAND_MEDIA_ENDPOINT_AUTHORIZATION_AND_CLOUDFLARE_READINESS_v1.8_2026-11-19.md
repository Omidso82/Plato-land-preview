# PLATO LAND – Temporary Projects
## Media endpoint authorization and Cloudflare account readiness

**Document version:** 1.8  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only — isolated R2 media endpoint  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 — Open, Draft, Unmerged

## 1. Owner authorization

On 2026-11-19, the owner explicitly approved proceeding with an isolated media endpoint intended to use:

`https://media.platoland.org`

This approval covers implementation and configuration of the isolated media endpoint only. It does not authorize:
- changing nameservers for `platoland.org`;
- changing or replacing the existing live website or its GitHub Pages deployment;
- enabling public access to the whole R2 bucket;
- exposing Series 2 archive, Scanner/OCR, Plato ID or registration evidence;
- changing Supabase data, policies or existing objects;
- enabling a paid Cloudflare plan, service or other paid feature.

## 2. Read-only Cloudflare account audit after authorization

Cloudflare dashboard was inspected read-only using the already connected account.

Confirmed:
- Workers plan: **Workers Free — $0/month**.
- Existing R2 subscription: **R2 Paid**, active and renewing 2026-12-18; this is the existing storage subscription, not a new service.
- Account Workers subdomain: `mozaffari-o.workers.dev`.
- No Worker applications currently exist; one Pages project exists: `plato-land-preview`.
- The Free plan page showed capacity for up to 100 Workers and 100,000 requests/day; current usage displayed 86 requests for that day at audit time.
- The account's Domains overview and registrations pages did not list `platoland.org`.
- The Pages project `plato-land-preview` has no custom domain attached.
- No R2 Public Access setting was changed. The existing `plato-land-media` bucket remains private.

## 3. Domain ownership / DNS control blocker

The Cloudflare account used for the existing R2 bucket and Pages project does **not** currently contain an active Cloudflare zone for `platoland.org`.

Cloudflare's current Custom Domain requirements say an active Cloudflare zone is required, and a custom domain cannot be created on a zone the account does not own. The account therefore cannot attach `media.platoland.org` to a Worker from its present state.

Adding `platoland.org` to this account would require onboarding the domain and changing its authoritative nameservers at the registrar. That could affect the existing website, email and all other DNS records. The owner has not authorized such a nameserver migration, and it must not be attempted as part of this task.

The actual DNS provider/account for `platoland.org` has not yet been identified. Public DNS lookup through the available research/browser services was not completed in this step; no provider is guessed.

## 4. Safe implementation route

- A separate Worker can be created on the existing Workers Free plan without a new monthly Workers subscription.
- Its temporary default endpoint would be under `*.mozaffari-o.workers.dev`; Cloudflare recommends a Custom Domain or route for business-critical production traffic rather than relying permanently on `workers.dev`.
- The intended final endpoint remains `media.platoland.org`.
- To use the intended hostname without changing the entire domain's nameservers, the Worker must be attached to the Cloudflare zone that actually manages `platoland.org`, or that zone must be safely delegated/managed by the connected account after a full DNS/email-impact review.
- No Worker was created or deployed in this step. No DNS, domain, bucket, R2 object, Pages, Access or Production setting was changed.
- TinyFish browser automation's free Fetch allowance was exhausted during the account audit, so no further dashboard changes were attempted.

## 5. Security requirements for the endpoint

Before deployment:
1. Use the existing `plato-land-media` bucket through a server-side R2 binding; do not attach the bucket's public R2 custom domain directly.
2. Keep R2 Public Access disabled.
3. Expose only an explicit public allowlist for Series 3 public-event media.
4. Keep Series 2 archive objects behind owner authentication unless a separate approved public-access rule exists.
5. Keep Scanner/OCR, Plato ID images, registration evidence and all private objects inaccessible through public GET/HEAD.
6. Require exact-origin CORS for `https://platoland.org` and any explicitly approved Preview origin; handle OPTIONS preflight.
7. Keep R2 credentials and secrets server-side. Verify owner role through Supabase on every upload/replace request.
8. Independently verify each upload with HEAD and check size/type. A POST response alone is not a successful acceptance.
9. Preserve Supabase originals and existing R2 objects. No migration, copy, reconciliation, overwrite or deletion is authorized.
10. Test GET, HEAD, video byte ranges, invalid ranges, unauthorized uploads, non-owner reads of restricted slots, missing objects and mobile Safari.

## 6. Current status

- Owner authorization for the isolated media endpoint: **GRANTED**.
- Existing Workers Free plan availability: **CONFIRMED**.
- New Worker monthly subscription cost: **$0** within the existing Free plan.
- Existing R2 subscription: **unchanged**.
- `platoland.org` zone present in the connected Cloudflare account: **NO**.
- DNS provider/account for `platoland.org`: **NOT YET IDENTIFIED**.
- Worker created/deployed: **NO**.
- `media.platoland.org` attached: **NO**.
- R2 bucket remains private: **YES**.
- Production website, DNS and email records changed: **NO**.

## 7. Required next input / action

To complete the custom hostname without risking the current website, the account that currently manages DNS for `platoland.org` must be identified and made available for the specific `media` subdomain setup. The only information still needed from the owner is which account/provider currently manages the domain's DNS (for example, another Cloudflare account, the registrar's DNS, or a different DNS provider).

Do not change the domain's nameservers to the currently connected Cloudflare account merely to finish this task.

## Version history

- v1.7 — 2026-11-19: Records successful code CI/Preview deployment and live route/R2 runtime blockers.
- v1.8 — 2026-11-19: Records the owner's approval for the isolated media endpoint, read-only Cloudflare Workers Free/account audit, missing platoland.org zone, no-new-cost route and explicit DNS/nameserver safety boundary.
