# PLATO LAND – Temporary Projects
## Media endpoint readiness, Namecheap DNS evidence and safe routing decision

**Document version:** 1.9  
**Date:** 2026-11-19  
**Scope:** Temporary Projects only — isolated R2 media endpoint  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**PR:** #215 — Open, Draft, Unmerged

## 1. Controlling authorization and boundaries

The owner authorized proceeding with an isolated media endpoint intended to use:

`https://media.platoland.org`

This authorization does not permit:
- changing the authoritative nameservers for `platoland.org`;
- changing the live website or GitHub Pages deployment;
- enabling bucket-wide R2 public access;
- exposing Series 2 archive, Scanner/OCR, Plato ID images or registration evidence publicly;
- changing Supabase data, policies or existing objects;
- enabling a paid Cloudflare plan/service or any other paid service;
- merging or publishing to Production before release gates pass.

## 2. Namecheap DNS evidence — owner-provided screenshots, 2026-11-19

The owner opened the `platoland.org` domain in the Namecheap account and expanded the Nameservers section.

Observed:
- Domain status: Active.
- Nameserver mode: **Namecheap BasicDNS**. This establishes that the displayed domain is configured to use Namecheap BasicDNS, not Cloudflare authoritative nameservers.
- Four apex A records (`@`) were visible:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- One CNAME was visible:
  - Host: `brevo1._domainkey`
  - Target: `b1.platoland-org.dkim.brevo.com.`
- One apex TXT record was visible with an SPF-like value beginning `v=spf1 include:spf.efwd.registrar-s...`; the screenshot truncates the full value.
- Namecheap Mail Settings displayed **Email Forwarding**.
- The screenshots are partial views of Host Records, not a complete DNS export. The complete CNAME/MX/TXT inventory has not been captured. Do not infer that no other mail records exist.

No DNS record was added, edited or deleted. Nameservers were not changed.

## 3. Cloudflare routing options — current official plan constraints

The connected Cloudflare account has Workers Free ($0/month), an existing R2 Paid subscription, the account subdomain `mozaffari-o.workers.dev`, and no active `platoland.org` zone.

Current Cloudflare documentation establishes:
1. Workers Custom Domains require an active Cloudflare zone and a Worker. A Custom Domain cannot be attached to a zone the account does not own.
2. Cloudflare CNAME/partial setup, which keeps the existing authoritative DNS provider and proxies selected subdomains, is available only on **Business or Enterprise** plans.
3. Cloudflare child/subdomain zones (delegating only `media.platoland.org` while leaving the parent zone elsewhere) are available only on **Enterprise** plans.

Official references:
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/dns/zone-setups/partial-setup/
- https://developers.cloudflare.com/dns/zone-setups/partial-setup/setup/
- https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/

Consequences:
- There is no verified Cloudflare Free-plan path to attach `media.platoland.org` while retaining Namecheap BasicDNS as the authoritative provider.
- Business/Enterprise plan activation would be a paid-plan decision and is not authorized.
- Enterprise subdomain delegation is also not authorized and would require a paid plan.
- Moving the entire domain's nameservers to the connected Cloudflare account could affect the website, email and all DNS records. It remains expressly unauthorized.
- A `workers.dev` URL is available for non-business-critical testing, but it is not the approved final hostname and must not be silently substituted for `media.platoland.org`.

## 4. Source-level security hardening on PR #215

The branch was updated after review of the existing media API:

- Series 2 slide and poster keys are marked owner-only at the API layer. The API checks the authenticated owner role before serving these archive assets.
- The existing Series 2 management panel now retrieves those private images using the owner's bearer token and in-memory object URLs; it does not rely on public image URLs.
- Upload read-back HEAD verification now includes the owner's bearer token so private archive assets can be independently verified.
- The API now has a strict allowed-origin CORS policy for `https://platoland.org`, handles OPTIONS preflight, exposes the required media/range headers, and uses `Cross-Origin-Resource-Policy: same-site` for the site-to-media-subdomain relationship.
- No Preview origin is added to the allowlist until its exact origin is confirmed and approved.
- The R2 bucket remains private. No R2 objects, Supabase records, DNS records or Production settings were changed.

These are source changes on the feature branch only. They are not live until separately tested and released.

## 5. Remaining technical gates

1. Select an authorized hosting/DNS route that can serve the exact hostname without moving parent nameservers or enabling an unapproved paid plan.
2. Confirm the final Worker/Pages deployment target and R2 binding on that target.
3. Verify exact object keys, sizes and MIME types for every Series 3 public asset. Do not guess mappings or mutate existing objects.
4. Keep Series 2 archive reads owner-authenticated; keep Scanner/OCR, Plato ID images and registration evidence private.
5. Test public GET/HEAD, video Range/416, OPTIONS/CORS, owner-only archive GET/HEAD, unauthorized upload, successful owner upload plus independent HEAD, missing assets, and mobile Safari.
6. Verify the final hostname with HTTPS before changing the site client to use it.
7. Keep PR #215 Draft and unmerged until all release gates pass.

## 6. Current verified status

- Namecheap account contains `platoland.org`: confirmed by owner screenshot.
- Namecheap BasicDNS selected: confirmed by owner screenshot.
- Apex GitHub Pages A records: four visible and captured above.
- Brevo DKIM CNAME: one visible and captured above.
- Full DNS/mail record inventory: incomplete.
- Cloudflare Workers Free: available at $0/month.
- Connected Cloudflare account has active `platoland.org` zone: no.
- Free Cloudflare route preserving Namecheap authoritative DNS: not available in current documented plan matrix.
- Worker deployed / final custom hostname attached: no.
- R2 bucket-wide public access: disabled.
- DNS, main website, Supabase and existing R2 objects changed: no.
- PR #215: Open, Draft, Unmerged.
- Latest branch source commit at time of this document: `6172d3282e827d910f390855fc6d30b8796c8313`; CI result pending at document creation.

## Version history

- v1.8 — 2026-11-19: Owner authorization, Cloudflare Free account audit and missing-zone blocker.
- v1.9 — 2026-11-19: Records owner-provided Namecheap BasicDNS evidence, official Cloudflare plan constraints for partial and child-zone setup, and source-level private Series 2/CORS hardening.
