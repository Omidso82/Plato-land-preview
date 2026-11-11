# PLATO ID Scanner — Cloud Vision API Key Authentication Update

- Date: 2026-11-12
- Document version: v0.1
- Scope: PLATO LAND – Temporary Projects / PLATO ID Scanner only
- Repository: `Omidso82/Plato-land-preview`
- Branch: `feature/plato-id-scanner-v0-1`
- Related PR: #123 (must remain Draft and unmerged)

## Confirmed Google Cloud setup

- Google Cloud project: `PLATO-LAND-OCR`
- Project ID: `plato-land-ocr`
- Cloud Vision API: enabled (confirmed by user screenshot)
- Service Account: `plato-land-ocr@plato-land-ocr.iam.gserviceaccount.com` (created; currently unused by the selected authentication path)
- Service Account JSON key creation is blocked by organization policy `iam.disableServiceAccountKeyCreation`.
- User created API key named `PLATO-LAND-SUPABASE-OCR`, restricted to Cloud Vision API only. The key value was not shared in chat and must remain secret.

## Authentication decision

Use the standard Cloud Vision API key from the trusted Supabase Edge Function runtime. Google Cloud Vision's REST API accepts either an API key or an OAuth token. A standard API key identifies the project for quota/billing but does not authenticate a principal; it must therefore remain server-side and restricted to Cloud Vision API. Do not expose it to browser code, GitHub, logs, Telegram, or chat.

The created key was not bound to the Service Account. The organization policy preventing JSON key creation remains unchanged. Do not attempt to weaken or disable that policy.

## GitHub changes made

1. `supabase/functions/_shared/plato-id-scanner-google-vision-client.ts`
   - Client option changed from `accessToken` to `apiKey`.
   - API key is sent as the `key` query parameter to the existing EU Vision endpoint.
   - Removed Bearer Authorization header.
   - Added comments requiring server-only use and no logging.

2. `supabase/functions/plato-id-scanner-worker/index.ts`
   - Removed the service-account JWT token helper import and token-exchange step.
   - Worker now requires `GOOGLE_VISION_API_KEY` in its runtime environment.
   - Passes that key to the Vision client.
   - Existing worker secret authentication, service-role Supabase access, object validation, hash check, queue processing and `needs_review` result state are retained.

## Commits

- Vision client update commit: `dabc8a02f9b79e4a4e0595ff895a87c9545918b1`
- Worker update commit: `133724a0d20b660c5b9684a67d279647829bdb09`

## Not done / blockers

- API key value has not been entered into Supabase secrets. The assistant does not have a secret-management action available; user must add it directly in Supabase Dashboard as `GOOGLE_VISION_API_KEY`.
- No OCR image has been sent to Google.
- No Scanner Edge Function has been deployed.
- No queue migration has been applied.
- Queue migration draft still needs security review (including deprecated `auth.role()` checks and SECURITY DEFINER function review).
- Trusted dispatcher implementation was not found in the branch.
- Scanner review UI is not yet connected to the OCR backend.
- No CI workflow run was returned for the latest worker commit; build/typecheck/test status is therefore unverified.
- PR #123 must remain Draft and unmerged. No main-site production deployment is authorized by this update.

## Next steps

1. Verify both changed files on the feature branch and run CI/typecheck/tests.
2. Add `GOOGLE_VISION_API_KEY` directly in the primary Supabase project's Edge Function secrets; never paste the value into chat.
3. Complete the trusted dispatcher and UI review connection.
4. Review and correct the queue migration before applying any Scanner-scoped database change to the primary project.
5. Deploy only after all prerequisites and security checks pass; keep OCR results provisional as `needs_review`.
