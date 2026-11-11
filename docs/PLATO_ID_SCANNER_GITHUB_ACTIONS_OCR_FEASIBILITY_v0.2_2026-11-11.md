# PLATO ID Scanner — GitHub Actions OCR Runner Feasibility

**Version:** 0.2  
**Date:** 2026-11-11  
**Status:** Preparation only — no runner enabled, no images transferred, no OCR workflow dispatched  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only  
**Related branch:** `feature/plato-id-scanner-v0-1`  
**Related PR:** #123 (Draft; unmerged)

## 1. Purpose and authorization boundary

This revision records a follow-up verification of the feature-branch CI after feasibility report v0.1. The owner authorized investigation and preparation of GitHub Actions for OCR, subject to:
- no paid activation or additional cost;
- no transfer of private scan images to GitHub-hosted runners or third-party OCR services;
- no production database changes, deployment, PR merge, or Telegram send under this authorization.

This report does not authorize registering a runner, enabling an OCR workflow, creating repository secrets, downloading OCR models, or processing real images.

## 2. Latest verified GitHub Actions results

For feature-branch commit `4968268bba137ec3c5304cc1c5cff5efa44e4a86`:

### Build and typecheck
- Run ID: `42992960855`
- Result: **SUCCESS**
- Completed steps include npm install, TypeScript typecheck, Vite build, and Deno tests for Series 2 qualification, Series 2 bracket, Scanner worker contract, result adapter, reports, review, review store, and date window.

### Website build / artifact preparation
- Run ID: `42992961164`
- Build job: **SUCCESS**
- Deploy job: **SKIPPED**
- The workflow prepared the site artifact but did not deploy the feature branch to production.

These checks validate the tested source and build pipeline only. They do not prove a live OCR worker, authenticated owner/operator flow, database migration, Storage policy, or Telegram delivery.

## 3. Hosting and privacy conclusion

### GitHub-hosted runner
Not acceptable for real scan processing under the current instruction. Retrieving image bytes into a GitHub-managed virtual machine would move private images outside the PLATO-controlled storage/runtime boundary. Do not use this option for real images.

### Self-hosted runner
Potentially acceptable only on a machine explicitly controlled and administered by PLATO LAND, after security assessment and separate approval. The machine, OS/architecture, disk encryption, network boundary, maintenance owner, availability, and runner isolation have not been confirmed. No runner has been installed or registered.

### Local-only processing
A local script on an owner-controlled machine may be evaluated later as a fallback, but it is not a GitHub Actions runner.

## 4. Security requirements before implementation

1. Never run untrusted pull-request code on a self-hosted runner.
2. Any future OCR workflow must be manual-only, restricted to reviewed code and an approved protected branch, and require an owner-controlled approval gate.
3. Use a dedicated least-privilege runner account and isolated work directory.
4. Keep image bytes on the controlled machine; do not upload them to GitHub-hosted compute or OCR SaaS.
5. Use short-lived access to exactly one private object; never expose a service-role key to the browser or logs.
6. Authenticate callbacks and validate job/scan identity, SHA-256, attempt identity, idempotency and stale-worker fencing.
7. Do not log signed URLs, tokens, image bytes, raw personal data, or OCR payloads.
8. No Telegram token or destination is needed by the OCR worker.
9. Do not install/register a runner or create secrets until the machine and security review is complete and the owner separately approves.
10. Verify applicable GitHub Actions billing/quota before any dispatch; do not assume zero cost.

## 5. Proposed execution shape — not implemented

An owner manually starts a dedicated workflow from reviewed code. The workflow targets only the approved self-hosted runner. That runner obtains a narrowly scoped job request from a trusted backend, fetches the referenced private object directly from Supabase, validates the bytes and SHA-256, runs OCR locally, and submits an authenticated result to a trusted callback. The callback revalidates authorization, job identity, hash, attempt and idempotency before persistence. Human review remains authoritative.

No OCR workflow YAML, dispatch endpoint, callback, runner registration, or OCR runtime was created by this work.

## 6. Remaining blockers

- No PLATO-controlled host has been identified and assessed.
- No runner OS/architecture, encryption, network egress policy, or maintenance plan is confirmed.
- No OCR engine/model is installed or benchmarked.
- Trusted backend queue, dispatcher, callback and database persistence are not implemented.
- Scanner migration and Storage bucket/policies remain unapplied.
- No live authenticated owner/operator test has been completed.
- No real image has been processed.

## 7. Explicitly not done

No images were fetched or transferred. No GitHub-hosted OCR job was run. No self-hosted runner was registered. No repository secrets were created or read. No OCR model or package was downloaded. No Supabase schema, Storage, Edge Function, data, or production setting was changed. No deployment, merge, Telegram send, or paid activation occurred.

## 8. Version history

- **v0.1 — 2026-11-11:** Initial feasibility assessment and privacy/security constraints.
- **v0.2 — 2026-11-11:** Records successful feature-branch CI for commit `4968268`, confirms the deployment job was skipped, and retains the self-hosted-runner and no-image-transfer boundary.
