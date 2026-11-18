# PLATO LAND – Temporary Projects
## R2 inventory audit endpoint – implementation note

**Version:** 1.0  
**Date:** 2026-11-18  
**Scope:** Temporary Projects only  
**Branch:** `feature/temporary-projects-r2-public-media-phase1`  
**Status:** Added to PR branch; preview configuration and owner acceptance pending

### Purpose
The Cloudflare R2 dashboard did not provide a complete CSV/JSON export of object metadata. A read-only, token-gated inventory endpoint has therefore been added to the existing Pages project branch to obtain a complete listing through an R2 bucket binding.

### Added implementation
- `functions/__internal/r2-inventory.ts`
  - GET displays a small audit form.
  - POST requires a preview-only bearer secret.
  - Lists objects only under `plato-land/`.
  - Returns keys, sizes, ETags, upload timestamps, content types, available checksums, count and total bytes.
  - Does not read object bodies, upload, copy, move, rename, overwrite or delete objects.
  - Has a 10,000-object safety ceiling.
- `vite.config.ts`
  - Emits `dist/_routes.json` with only `/__internal/r2-inventory` included.
  - Keeps normal static site pages/assets outside Pages Function invocation, preserving static delivery and avoiding unnecessary Function requests.

### Required preview-only Cloudflare configuration
Do not configure Production for this audit.

1. In Cloudflare > Workers & Pages > Pages project `plato-land-preview` > Settings > Bindings, add an R2 bucket binding for the **Preview environment only**:
   - Variable name: `PLATO_MEDIA_BUCKET`
   - Bucket: `plato-land-media`
2. In Preview > Variables and Secrets, add an encrypted secret:
   - Name: `R2_AUDIT_TOKEN`
   - Value: a strong random token stored in a password manager; do not send it in chat or commit it.
3. Redeploy the PR preview.
4. Open `/__internal/r2-inventory` on the PR preview, enter the token in the form, generate and download the JSON inventory.
5. Supply the JSON file in this project conversation for verification and classification.

### Cost and isolation
- No new bucket, database, paid service, Worker service, API token, or plan upgrade is created by this code.
- Pages Functions requests count against the Cloudflare Workers Free daily allowance. The generated `_routes.json` includes only the audit route; static site routes remain excluded from Function invocation.
- Only Preview gets the binding and secret for this audit. Production remains unchanged.
- The endpoint is read-only and does not expose object bodies. The bearer secret is not stored in Git.

### Acceptance gates
- Confirm the Preview binding and secret are configured and the preview redeployed.
- Generate inventory and reconcile the previous dashboard count/size discrepancy.
- Classify each object against approved event/media records before any public delivery.
- Remove this temporary audit endpoint after the inventory is verified, unless the owner explicitly approves retaining it.
- No public domain attachment, production binding, R2 public access, application media switch, migration, or source deletion is part of this phase.

### Version history
- v1.0 – 2026-11-18: Added the gated read-only inventory endpoint and preview-only configuration instructions.
