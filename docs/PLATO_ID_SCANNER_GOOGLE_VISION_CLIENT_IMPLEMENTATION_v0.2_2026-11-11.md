# PLATO ID Scanner — EU Vision Client Implementation
**Version:** 0.2  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Status:** Client module and mocked tests added; no external request executed

## Goal
Continue the operator-upload → private image → OCR → provisional extraction → human review → canonical report flow. This stage adds the backend-side HTTP client behind the previously added provider-neutral response adapter.

## Added
- `plato-id-scanner-google-vision-client.ts`: a narrowly scoped synchronous client targeting only `https://eu-vision.googleapis.com/v1/images:annotate`.
- Default feature `DOCUMENT_TEXT_DETECTION`; caller may explicitly choose `TEXT_DETECTION`.
- Uses an injected access token and fetch implementation. It does not create credentials, obtain tokens, choose a Storage object, or expose provider configuration to the browser.
- Encodes the supplied bytes as base64 in the request body.
- Enforces non-empty token/image and a bounded timeout (1–120 seconds; default 20 seconds).
- Classifies auth/permission, rejected request, upstream/network/timeout, invalid JSON and empty-response failures using stable codes; does not copy provider response bodies into error messages.
- Maps successful provider payload through the existing Google Vision adapter to the provider-neutral worker result.
- Added mocked-fetch tests. Tests assert the EU endpoint, request method, bearer header, image payload, OCR feature, response mapping and safe error classification. No live network is used by tests.
- Added the client test to GitHub Actions verification.

## Security and execution boundary
This is a client module, not a deployed worker. It must only be called by a trusted backend after verifying operator approval/ownership, the immutable source object, MIME/size/decode checks and source SHA-256. The caller must obtain a short-lived access token from a backend-controlled identity mechanism. Do not put a service account key or bearer token in the browser or repository.

## Explicitly not done
No API request, image transfer, token minting, GCP project/API/service-account setup, billing activation, queue, database migration, Storage change, production write, deployment, merge or Telegram send. The existing uploaded-image panel flow remains the only intended image ingress.

## Verification
The new mocked test is included in `.github/workflows/verify.yml`. CI result for the current branch head is pending and must be checked before declaring this stage verified.

## Next implementation boundary
A real worker needs a durable job-claim mechanism, secure identity/token acquisition, private-object access and authenticated/idempotent result persistence. The existing scanner upload table currently only records uploads and does not enqueue work. Do not simulate a queue in browser state or use GitHub Actions as a private-image processing worker. Draft a migration and RLS/lease design separately; do not apply it to the production database without explicit owner approval.
