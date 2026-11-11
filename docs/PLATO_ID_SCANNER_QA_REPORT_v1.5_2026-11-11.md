# PLATO ID Scanner — QA and Implementation Status

**Version:** 1.5  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Repository:** `Omidso82/Plato-land-preview`  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 — Open, Draft, unmerged

## 1. Scope and approved product rules

This is a multi-image Telegram screenshot to Plato ID extraction and review workflow, not a single-player profile scanner. The original screenshot remains immutable; OCR output is provisional; the manager's human review is authoritative. Exact-string duplicate audit is retained. No fuzzy matching or automatic confusable-character substitution is permitted.

Google Cloud Vision is currently an engineering POC candidate only. It is not an approved production processor or final provider selection. No real image has been transferred to Google.

## 2. Latest branch implementation

### Frontend and operator access
- Dedicated Scanner route and isolated operator/owner UI.
- Email/password registration and login flow; email confirmation and owner approval checks.
- Multi-image upload UI; each image is stored as its own immutable scan record.
- Per-image review card now offers an OCR dispatch action for eligible uploads.
- The UI reads provisional `ids`, `extraction_candidates` and `duplicate_audit` from OCR results after the worker completion path runs.

### Backend source-only code
- Provider-neutral job/result contract and validators.
- Exact @-based extraction and exact duplicate audit.
- Google Vision EU response adapter and HTTP client with mocked tests.
- Dispatcher validates user, owner/operator permission, upload ownership, private Storage object path, file size, MIME, byte signature, extension and SHA-256.
- Queue enqueue is performed through a service-role-only RPC in the draft migration.
- Secret-gated worker uses a service-account JWT flow, claims one job with a lease, revalidates the source hash, calls the fixed EU Vision endpoint, applies the existing exact extractor/duplicate audit, and persists provisional review payload.
- Retry is bounded by `max_attempts`; expired attempt audit is closed as `lease_expired` before reclaim.

## 3. Verified automated checks

For code head `e6793f0effdb0752e096052c8fc44fe871a647c2`:
- GitHub Actions Build and typecheck run `43038215568`: **completed success**.
- npm install: passed.
- TypeScript typecheck: passed.
- Vite build: passed.
- Existing Series 2 and Scanner contract/extraction/duplicate/report/review/date tests: passed.
- Queue migration static tests, including service-role enqueue, bounded retry and expired-lease audit: passed.
- Dispatcher source-object validation tests: passed.
- `deno check` for both new Edge Functions: passed.

For the associated deploy workflow run `43038215780`:
- Build and Pages output preparation: success.
- Actual deploy job: skipped for the pull request.
- No production deployment is claimed.

The documentation-only commits after the code head do not change application behavior. PR #123 remains Draft and unmerged.

## 4. Explicitly not done

- No Scanner migration has been applied to the primary Supabase project.
- No Scanner table, private bucket, Storage policy or production record has been created.
- No Edge Function has been deployed to Supabase.
- No worker secret, service-role configuration or Google service-account secret has been set.
- No Google Cloud project/API/service account/billing has been activated.
- No screenshot has been sent to an OCR provider.
- No operator account has been created or approved.
- No Telegram message has been sent.
- No merge, main-branch change or production deployment has occurred.

## 5. Source review and outstanding risks

- The draft queue migration still requires a complete PostgreSQL execution review and runtime validation in a permitted isolated environment.
- The current repository workflow checks TypeScript frontend and Deno tests/type checks, but does not execute the SQL against PostgreSQL.
- Auth email confirmation and redirect behavior have not been verified against live Supabase settings.
- RLS-01 through RLS-18 runtime tests remain outstanding.
- iPhone/Safari end-to-end QA remains outstanding.
- Google service-account JWT generation has only been type-checked; no live token exchange was performed.
- The worker processes one job per invocation. A trusted scheduler/backlog drain mechanism remains to be configured after approval.
- Existing Scanner design/QA sources list provider/hosting activation, production migrations, account creation and deployment as approval-gated.
- No automatic Telegram reporting/sending is implemented in this worker path.

## 6. Approval gates

Explicit owner approval is still required before:
1. Applying any Scanner migration to primary Supabase.
2. Creating/configuring Google Cloud project, service account, Vision API, billing or usage cap.
3. Storing worker and Google credentials in Supabase Edge Function secrets.
4. Sending a real screenshot to Google Vision or another external OCR provider.
5. Deploying Scanner Edge Functions or creating the production Storage bucket/policies.
6. Creating/approving an operator account.
7. Merging PR #123 or deploying the website.
8. Enabling any Telegram send or scheduled delivery.

## 7. Next safe work before approval

- Continue source-level review of the queue migration and its interaction with the foundation/review migrations.
- Add isolated mocked tests for worker secret gating, OAuth assertion construction, provider failure classification and queue callback fencing.
- Improve the migration test coverage and inspect the full PR diff for accidental changes outside Scanner scope.
- Keep all live integrations disabled until the relevant approval gates are explicitly opened.

## 8. Version history

| Version | Date | Change |
|---|---|---|
| 1.4 | 2026-11-11 | Previous source-level QA, migration/RLS and multi-image upload record |
| 1.5 | 2026-11-11 | Adds dispatcher, worker, provisional review payload, bounded retry, expired-lease audit, verified CI and current approval boundaries |
