# PLATO ID Scanner — Telegram test-group delivery
Version 0.2 · 2026-11-12 · Draft / source-only

## Confirmed existing infrastructure
- The live Supabase project contains the active Series 2 progression sender and the active Telegram test function.
- Series 2 result and announcement delivery uses the server-side configuration keys TELEGRAM_BOT_TOKEN and TELEGRAM_TEST_CHAT_ID.
- The Scanner sender reuses those existing keys. It does not create a new bot, token, chat destination, sender for Series 2, or Series 2 outbox.
- The user confirmed prior successful Telegram tests in the same test group for Series 2 results and same-day match schedules.
- The main PLATO LAND Telegram channel is explicitly excluded from this phase.

## Approved product behavior
- Batch images remain separate immutable uploads.
- Only the latest approved human review revision for each image contributes to the consolidated list.
- OCR-only or unreviewed images are excluded from the report.
- Exact raw-string duplicates are identified across reviewed images. The UI shows both source images and requires explicit human confirmation before sending when duplicates exist.
- No trimming, case folding, punctuation cleanup, Unicode normalization, character substitution, or fuzzy matching is allowed.
- Report periods: today, yesterday, rolling 168-hour last 7 days, or inclusive custom date range. Calendar boundaries are interpreted in Asia/Tehran.
- Preview is read-only and never sends.
- Sending is manual only, after an explicit confirmation dialog.
- Each send creates an immutable report version and a dedicated delivery-ledger row. A request UUID prevents accidental duplicate sends. A deliberate resend uses a new request UUID and creates a new version.
- Delivery history exposes report version, period, status, timestamps, Telegram message IDs, and error status.
- Telegram messages contain only approved Plato IDs and period metadata, never source images or raw OCR text.
- If Telegram splits a large report into chunks, each message ID is recorded. Partial failures are recorded as failed with any already-sent message IDs retained.

## Implementation status
- New isolated branch: feature/plato-id-scanner-telegram-test-group.
- Draft PR: #135, based on main; it includes the source-only Scanner integration and existing PR #134 Scanner foundation changes.
- UI: global list now reads approved review revisions only; manual preview/send controls and delivery-history panel are added.
- New Edge Function source: supabase/functions/plato-id-scanner-telegram-report/index.ts.
- New draft migration: supabase/migrations/20261112120000_plato_id_scanner_telegram_test_delivery.sql.
- New CI checks include TypeScript build, Deno tests and Deno check for the new Edge Function.
- The migration is NOT applied to Supabase.
- The Edge Function is NOT deployed.
- No Telegram message has been sent from Scanner.
- No PR has been merged and no main-site production deployment has been performed.
- The test group is the only configured destination; the main channel is not referenced.

## Outstanding gates
1. Complete CI and Cloudflare preview verification for the latest commit.
2. Review and separately approve applying the migration to the existing primary Scanner database.
3. Review and separately approve deploying the new Edge Function.
4. After both are activated, owner/operator performs a preview, checks duplicate sources, confirms and manually sends a test report to the test group.
5. Complete iPhone/Safari QA and verify delivery history and resend behavior.

## Version history
- v0.1 — initial draft of manual Scanner Telegram report sender and test-group-only delivery.
- v0.2 — gates global IDs on approved revisions, adds explicit cross-image duplicate confirmation, rolling 168-hour period, delivery-history endpoint/UI, and CI type-checking for the Edge Function.
