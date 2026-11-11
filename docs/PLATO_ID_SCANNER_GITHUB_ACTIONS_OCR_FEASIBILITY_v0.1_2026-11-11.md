# PLATO ID Scanner — GitHub Actions OCR Runner Feasibility
**Version:** 0.1  
**Date:** 2026-11-11  
**Status:** Preparation only — no runner enabled, no images transferred, no workflow dispatched  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only  
**Related branch:** `feature/plato-id-scanner-v0-1`  
**Related PR:** #123 (Draft, open, unmerged)

## 1. User authorization and boundaries
The owner authorized investigation and preparation of GitHub Actions as an OCR execution option, explicitly subject to:
- no paid activation or additional cost;
- no transfer of private scan images to GitHub-hosted runners or third-party OCR services;
- no production database changes, deployment, PR merge, or Telegram send under this authorization.

This document records feasibility only. It does not authorize registering a runner, enabling a workflow, creating repository secrets, downloading OCR models, or processing images.

## 2. Verified repository facts
- Existing workflow `.github/workflows/verify.yml` runs on pull requests targeting `main` and pushes to `main`; it performs npm install, typecheck/build, and Deno tests. It does not run OCR.
- Existing `.github/workflows/deploy-preview.yml` builds on pull requests and pushes to `main`; the deploy job is conditional on `github.ref == refs/heads/main`. A successful PR run is build/artifact preparation, not a production release.
- PR #123 is Draft, open, unmerged; head is `8554093699b786f9975a1b6cea1bc8eb2fad6226`.
- Existing worker contract is provider-neutral. No OCR runtime, queue, callback, Scanner DB migration, or Scanner Storage bucket is active.
- Current project environment has not established a PLATO-controlled self-hosted runner.

## 3. Hosting options and privacy conclusion
### GitHub-hosted runner
Not acceptable for real scan processing under the current instruction. The workflow would need to retrieve image bytes from private Supabase Storage into a GitHub-managed virtual machine. That transfers the private images outside the PLATO-controlled storage/runtime boundary. Do not use this option for real images.

### Self-hosted runner
Potentially acceptable only if the machine is explicitly controlled and administered by PLATO LAND and is secured for private image processing. The runner can execute the OCR process locally, while GitHub Actions coordinates a manually dispatched job. The scan image would be fetched from Supabase directly to that controlled machine; it would not be uploaded to GitHub-hosted runners or an OCR SaaS.

This option is not yet available/verified. No machine, network boundary, OS, disk encryption, owner, uptime, or runner labels have been confirmed. Therefore no self-hosted runner has been installed or registered.

### Local-only runner without GitHub registration
A locally operated script can eventually process images on an owner-controlled computer, but it would not be a GitHub Actions runner. It remains a fallback if no suitable controlled host exists.

## 4. Security requirements before any implementation
1. Never run untrusted pull-request code on a self-hosted runner. Do not add `pull_request` or `pull_request_target` triggers to an OCR workflow.
2. Any future workflow must be manual-only (`workflow_dispatch`), restricted to a protected/default branch after code review, and require an explicit owner-controlled approval gate.
3. Use a dedicated, least-privilege runner account and isolated work directory; no access to unrelated project files or production deployment credentials.
4. Keep image bytes on the controlled runner and delete temporary working copies securely after processing according to an owner-approved retention policy.
5. Use short-lived, single-object access to the exact private Supabase object; never expose a service-role key to the browser or workflow logs.
6. Authenticate result callbacks, validate job/scan identity and SHA-256, enforce idempotency and stale-attempt fencing, and preserve append-only processing history.
7. Do not log signed URLs, tokens, image bytes, raw personal data, or OCR payloads.
8. No Telegram destination or bot token is needed by an OCR worker.
9. Do not install/register a runner or create secrets until owner approval after the machine and security review.
10. Before any dispatch, verify expected GitHub Actions billing/quota and ensure the job is routed exclusively to the approved self-hosted runner. No assumption of a free quota is permitted.

## 5. Proposed future execution shape (not implemented)
- Owner manually starts a dedicated workflow from an approved branch.
- Workflow targets only a specifically labelled self-hosted runner (for example, `self-hosted`, `plato-private-ocr`).
- The runner obtains a narrowly scoped job request from a trusted backend, downloads only the referenced private object directly from Supabase, verifies MIME/signature/decode/size/dimensions and SHA-256, runs the selected OCR engine locally, and posts a signed result to a trusted callback.
- The callback revalidates the operator/scan/job, hash, attempt and idempotency before persisting OCR output and state.
- The human review remains authoritative; OCR candidates are never silently normalized or merged.

No workflow YAML, dispatch endpoint, callback, runner registration, or OCR code is created by this proposal.

## 6. Cost and model availability
- This investigation has not started a workflow run, installed packages, downloaded models, registered a runner, or invoked an external OCR API.
- GitHub Actions usage may be subject to account plan quotas and billing. A self-hosted runner avoids GitHub-hosted compute minutes but still requires a suitable machine and network/maintenance resources. No zero-cost guarantee can be made until the existing hardware and account limits are verified.
- PaddleOCR and its model files must be obtained and benchmarked only after an approved controlled runtime exists. No model download has occurred.

## 7. Current blockers
- No approved, PLATO-controlled always-on or on-demand host is identified.
- No runner OS/architecture, storage encryption, network egress policy, or owner maintenance plan is confirmed.
- No OCR runtime/model is installed or benchmarked.
- Scanner backend queue, trusted dispatcher/callback and DB persistence remain unimplemented and unapplied.
- No authenticated owner/operator live test has been performed.

## 8. Next safe step
Identify whether an existing owner-controlled computer/server can serve as an on-demand private runner, and verify its OS/architecture, availability, encrypted storage, and ability to reach GitHub and the existing Supabase project without exposing images to GitHub-hosted compute. This assessment can be performed without installing or registering a runner. Only after that assessment should a narrowly scoped manual-only workflow be drafted for owner review.

## 9. Explicitly not done
No images were fetched or transferred. No GitHub-hosted OCR job was run. No self-hosted runner was registered. No repository secrets were created or read. No OCR model or package was downloaded. No Supabase schema, Storage, Edge Function, data, or production setting was changed. No deployment, merge, Telegram send, or paid activation occurred.
