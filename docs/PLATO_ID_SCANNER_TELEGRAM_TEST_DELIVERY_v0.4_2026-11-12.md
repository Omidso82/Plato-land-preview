# PLATO ID Scanner — Telegram test-group delivery
Version 0.4 · 2026-11-12 · Persian header specification

## Confirmed existing infrastructure
- The live Supabase project contains the active Series 2 progression sender and the active Telegram test function.
- Series 2 result and announcement delivery uses the existing server-side configuration keys TELEGRAM_BOT_TOKEN and TELEGRAM_TEST_CHAT_ID.
- The Scanner sender reuses those existing keys. It does not create a new bot, token, chat destination, sender for Series 2, or Series 2 outbox.
- The user confirmed prior successful Telegram tests in the same test group for Series 2 results and same-day match schedules.
- The main PLATO LAND Telegram channel is explicitly excluded from this phase.

## Product behavior
- Batch images remain separate immutable uploads.
- Only the latest approved human review revision for each image contributes to the consolidated list.
- OCR-only or unreviewed images are excluded.
- Exact raw-string duplicates are identified across reviewed images. The UI shows both source images and requires explicit human confirmation before sending when duplicates exist.
- The send request is bound to the exact preview snapshot by a SHA-256 fingerprint of the period, reviewed image/revision identities, final IDs and duplicate sources. If data changes between preview and send, the server rejects the stale preview and requires a new one.
- No trimming, case folding, punctuation cleanup, Unicode normalization, character substitution, or fuzzy matching.
- Periods: today, yesterday, rolling 168-hour last 7 days, or inclusive custom date range. Calendar boundaries are interpreted in Asia/Tehran.
- Preview is read-only and never sends. Sending is manual only, after an explicit confirmation dialog.
- Each send creates an immutable telegram_ids report version and a dedicated delivery-ledger row. A request UUID prevents accidental duplicate sends. A deliberate resend uses a new request UUID and creates a new version.
- Delivery history exposes report version, period, status, timestamps, Telegram message IDs and error status. Operators see their own history; owner can see all.
- Telegram message header is exactly three lines: `♛ آیدی‌های فعال PLATO LAND`, the report-generation weekday in Persian, and the report-generation date in the Persian calendar, all interpreted in `Asia/Tehran`. No range label, timezone text, image count, ID count, or other metadata appears in the message header. Approved Plato IDs follow the header; no source images or raw OCR text are sent.
- Multi-message reports store each Telegram message ID. Partial failures retain already-sent IDs and are recorded as failed.

## Implementation status
- PR #135 merged the Scanner global list, preview/send UI and delivery history.
- PR #138 merged the Persian-only Telegram header and CI formatter test.
- UI gates the global list on approved reviews, offers report preview/send controls, duplicate review confirmation and delivery history.
- Edge Function source: supabase/functions/plato-id-scanner-telegram-report/index.ts.
- Migration: `supabase/migrations/20261112120000_plato_id_scanner_telegram_test_delivery.sql` (applied to primary project).
- Scanner Telegram migration was applied to the existing primary Supabase project `dfrppbapaaydbjeflozw` before the first successful Scanner test send.
- PR #135 integrated the Scanner UI and report workflow; PR #138 merged the approved Persian-only header implementation (merge commit `fa70d211bbd4b60d5d1c568000ae6c2aecc6e3c1`).
- Edge Function `plato-id-scanner-telegram-report` is ACTIVE at version 2 in the primary Supabase project; `verify_jwt=true` is preserved.
- The first manual test-group report was delivered successfully: 15 approved IDs, one Telegram message, Telegram message ID 94, delivery status `sent`, no recorded error. No additional message was sent during the header update.
- GitHub Pages production deployment for merge commit `fa70d211bbd4b60d5d1c568000ae6c2aecc6e3c1` completed successfully.
- No main Telegram channel delivery was performed.
- Main Telegram channel is not referenced or configured.

## Activation gates
1. Complete latest CI and Cloudflare preview verification.
2. Review and separately approve applying the migration to the existing primary Scanner database.
3. Review and separately approve deploying the new Edge Function.
4. After activation, preview the exact date range, check duplicate sources, confirm and manually send a test report to the test group.
5. Complete iPhone/Safari QA and verify report history and resend behavior.

## Version history
- v0.1 — initial draft of manual Scanner Telegram report sender and test-group-only delivery.
- v0.2 — approved-review gating, duplicate confirmation, period selection, delivery history and CI checks.
- v0.3 — adds preview snapshot fingerprint protection and restricts operator history to their own deliveries while owner retains full history access.
- v0.4 — records the user-approved Telegram header: title, Persian weekday, Persian date; removes period/count/image metadata from the Telegram message header.
