# PLATO ID Scanner — Telegram test-group delivery
Version 0.3 · 2026-11-12 · Draft / source-only

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
- Messages contain only approved Plato IDs and period metadata, never source images or raw OCR text.
- Multi-message reports store each Telegram message ID. Partial failures retain already-sent IDs and are recorded as failed.

## Implementation status
- Isolated branch: feature/plato-id-scanner-telegram-test-group.
- Draft PR: #135, based on main and including Scanner global-dedup foundation.
- UI gates the global list on approved reviews, offers report preview/send controls, duplicate review confirmation and delivery history.
- Edge Function source: supabase/functions/plato-id-scanner-telegram-report/index.ts.
- Draft migration: supabase/migrations/20261112120000_plato_id_scanner_telegram_test_delivery.sql.
- Migration is NOT applied to Supabase.
- Edge Function is NOT deployed.
- No Telegram message has been sent from Scanner.
- No PR has been merged and no main-site production deployment has been performed.
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
