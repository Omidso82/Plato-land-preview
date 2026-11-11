# PLATO ID Scanner — implementation status
**Document version:** 0.7
Date: 2026-11-11
Branch: feature/plato-id-scanner-v0-1
Base: main at abb1556b57f9c9b73cdc83ea2486ffd01ffd023a

## Delivered in this branch
- Dedicated ?page=id-scanner entry point, isolated from the existing App lifecycle.
- Email/password self-registration and login through Supabase Auth.
- Email confirmation check before scanner access.
- Owner identification through current_user_role(); scanner operators are never assigned owner or tournament_admin.
- Pending/approved/rejected/disabled access states and owner review UI.
- Private image upload UI with JPG/PNG/WEBP validation and 15 MB cap.
- Operator upload history limited to own records in the interface.
- Draft additive SQL for separate access/upload tables, RLS and private storage bucket.
- Provider-neutral worker contract validators and eight Deno tests.
- Timestamp validation hardened against impossible calendar dates, invalid clock fields and timezone offsets beyond ±14:00; negative test fixtures added.
- Worker source path hardened to exactly operator UUID / matching scan UUID / safe filename; mismatch, nested path and backslash cases rejected.
- Upload object filenames are now generated from a restricted alphanumeric/underscore/hyphen base and a MIME-derived extension; original display filename remains separate metadata. This avoids `..`, path separators and extension/MIME mismatch in the Storage key.

## Latest branch verification (commit 9fdd3b05ffcff3eacb407dacf517d3a1381d9859)
- Documentation and branch CI update completed at this head.
- GitHub Actions workflow run 42932129081 completed successfully.
- npm install, TypeScript typecheck, Vite build, both existing Deno suites and Scanner contract Deno suite passed.
- Cloudflare Pages branch preview completed successfully: https://feature-plato-id-scanner-v0.plato-land-preview.pages.dev (commit preview: https://b087b2df.plato-land-preview.pages.dev).
- Main deploy job was skipped; PR #123 remains open, Draft and unmerged.
- Read-only inspection of primary Supabase project `dfrppbapaaydbjeflozw` confirmed Scanner access/upload tables and `plato-id-scans` bucket are absent; no Scanner Storage policies exist. No DB writes were made.
- `private.has_role(text[])` exists as SECURITY DEFINER in the non-exposed `private` schema with an empty search_path and checks `public.user_roles` against `auth.uid()`.
- Supabase security advisor returned pre-existing findings on eight other tables with RLS but no policies, two exposed SECURITY DEFINER functions, and disabled leaked-password protection. These are outside Scanner scope and were not changed.

## Latest additional hardening (verified on commit e3f18dfb7b35dc6f432291d355d3c698e52ab311)
- Upload object-key basename is restricted to ASCII letters/digits/underscore/hyphen and the extension is derived from the validated MIME type; original filename remains display metadata.
- GitHub Actions run 42932816623 completed successfully on this commit: npm install, TypeScript typecheck, Vite build and all three Deno test suites including Scanner contract tests.
- Cloudflare Pages preview was still building at the time of this update; preview deployment is not yet marked successful.

- Validator now checks calendar validity (rejects dates such as February 31), valid hour/minute/second ranges and timezone offsets up to ±14:00 only.
- Added negative cases for impossible dates, hour 24 and offset +14:01.
- OCR worker contract document updated to v0.3.
- These latest code/document changes require a new CI run; do not treat the earlier successful run as validating them.

## Not activated
- SQL is draft only and has NOT been applied to the primary database.
- Auth confirmation and redirect allowlist were not readable via available management tools; live email flow must be verified.
- OCR engine/provider has not been selected. Upload records remain in uploaded state.
- No Telegram delivery, report scheduling, corrections, daily/weekly aggregation or finalization deployed.
- No main merge or production deployment.

## Required activation checks
1. Complete a dedicated review of the draft migration and test policies in an authorized non-production-safe manner before separately approving primary DB application.
2. Confirm Auth email confirmation and allowlist https://platoland.org/?page=id-scanner.
3. Test signup, email confirmation, pending/approval/rejection/disabled, owner and operator isolation.
4. Select and approve OCR engine, privacy terms and cost.
5. Implement audited correction RPC, versioned reports, Asia/Tehran daily/weekly jobs and idempotent Telegram test delivery.
6. Build/typecheck, security tests and mobile Safari QA before merge/deploy.


## Current verification addendum — 2026-11-11 (v0.6)

- Latest verified source head before this documentation update: `8be150b4f01b1d7496e784e5a7b2049d324b9634`.
- GitHub Actions `verify`: success; `build`: success; feature-branch `deploy`: skipped.
- Cloudflare Pages preview check: success for this head. Preview URL: https://feature-plato-id-scanner-v0.plato-land-preview.pages.dev
- PR #123 remains Open, Draft and unmerged. No production deployment was performed.
- Storage INSERT policy source was reviewed: exactly two folder segments (operator UUID and scan UUID), followed by a safe filename; the scan folder must match the UUID format and filename extension is restricted to JPG/PNG/WEBP. RLS test plan includes negative path cases.
- QA Report is now v0.7. These are source and CI checks only; no SQL migration was applied, no live account was created, and no runtime RLS/Storage test was performed.
- Primary Supabase remains unchanged: Scanner tables, bucket and policies have not been created. No database write occurred.

### Outstanding blockers
- Runtime RLS/Storage tests require a separately approved disposable test environment; neither existing Supabase project is assumed to be disposable.
- Browser QA on iPhone/Safari remains outstanding.
- Auth email-confirmation/redirect behavior requires a controlled live-flow test, not performed here.
- OCR runtime/provider, corrections workflow, reporting schedule and Telegram delivery remain specification-stage or undecided; no provider or paid service has been selected.
- PR must remain Draft and unmerged until explicit approval.


## Security review update — 2026-11-11

- Static review identified that the upload-row INSERT policy previously checked only an operator UUID prefix in `storage_path`. The policy has now been tightened to enforce the same exact two-folder/one-filename shape as the Storage INSERT policy, including authenticated operator UUID, valid scan UUID and safe filename/extension.
- The RLS test plan was updated to include this upload-row path requirement.
- This is a source-only change. It has not been applied to Supabase and is not runtime-verified. A valid path shape does not prove that a referenced Storage object exists; consistency requires controlled integration tests or a trusted backend workflow.
- The latest code and documentation commits require fresh CI and preview checks; prior green checks do not validate these new commits.
