# PLATO ID Scanner — QA and Implementation Status

**Version:** 1.6  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Open, Draft, unmerged

## 1. Scope and approved product rules

The Scanner is a multi-image Telegram screenshot to Plato ID extraction and review workflow, not a single-player profile scanner. The original screenshot remains immutable; OCR output is provisional; human review is authoritative. Exact-string duplicate audit is retained. No fuzzy matching or automatic confusable-character substitution is permitted.

Google Cloud Vision EU is an engineering POC candidate only. It is not an approved final production provider. No real image has been transferred to Google.

## 2. Latest branch implementation

- Dedicated Scanner route and owner integration inside the existing temporary Series 2 manager.
- Independent email/password operator registration/login, email-confirmation check and manual owner approval UI.
- Multi-image upload; each image is stored as its own immutable scan record.
- Exact @-based extraction and duplicate audit.
- Authenticated dispatcher validates owner/operator permission, upload ownership, private Storage object path, file size, MIME, byte signature, extension and SHA-256.
- Draft-only queue migration contains atomic enqueue/claim, lease fencing, attempt audit, completion/failure and bounded retry.
- Secret-gated worker obtains a short-lived Google OAuth token, claims one job, revalidates source hash, invokes the fixed EU Vision endpoint, and persists provisional review payload for human review.
- Mocked OAuth JWT tests now cover issuer, audience, scope, five-minute lifetime, invalid credentials and safe upstream failures.

## 3. Verified automated checks

GitHub Actions Build and typecheck run `43038690566` for commit `8f98a64325c5d916eaf1cac15c021429cd0c657a`: **completed success**.

Passed:
- npm install, TypeScript typecheck and Vite build.
- All configured Series 2 and Scanner Deno test suites.
- Google Vision adapter/client tests.
- Mocked Google service-account JWT/token exchange tests.
- Queue migration static tests, bounded retry and expired-lease audit tests.
- Dispatcher source-object validation tests.
- Deno type checks for dispatcher and worker.

Deploy workflow run `43038690681`:
- Build and Pages output preparation: success.
- Actual deploy job: skipped for this pull request.
- No production deployment is claimed.

## 4. Source review and outstanding risks

- The queue migration remains a draft; CI uses static SQL assertions and does not execute it against PostgreSQL.
- Runtime RLS/Storage tests remain outstanding.
- Auth email confirmation and redirect behavior have not been verified against live Supabase settings.
- iPhone/Safari end-to-end QA remains outstanding.
- Google service-account JWT logic is mocked/type-checked only; no live token exchange was performed.
- No trusted scheduler/backlog drain is configured.
- Provider/hosting selection remains unapproved; Vision is only a code POC candidate.
- No automatic Telegram reporting or sending is implemented in this worker path.

## 5. Explicitly not done

No production migration, Scanner tables, bucket, policies, Edge Function deployment, secrets, Google Cloud activation, real screenshot transfer, operator account creation, Telegram send, PR merge, main-branch change or production deployment has occurred.

## 6. Approval gates

Explicit owner approval is required before:
1. Applying any Scanner migration to primary Supabase.
2. Creating/configuring Google Cloud project, service account, Vision API, billing or usage cap.
3. Storing worker and Google credentials in Supabase Edge Function secrets.
4. Sending a real screenshot to an OCR provider.
5. Deploying Edge Functions or creating the production Storage bucket/policies.
6. Creating/approving an operator account.
7. Merging PR #123 or deploying the website.
8. Enabling Telegram sending or scheduled delivery.

## 7. Next safe work

Continue source-level review of all Scanner migrations and the full PR diff; add further isolated tests where they improve correctness. Runtime SQL/RLS validation requires a permitted isolated environment. Do not use either existing Supabase project as an assumed staging database.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 1.5 | 2026-11-11 | Dispatcher/worker, bounded retry and initial verified CI |
| 1.6 | 2026-11-11 | Adds mocked OAuth assertion tests and verified full CI/type-check of both Edge Functions |
