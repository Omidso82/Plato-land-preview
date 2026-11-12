# PLATO ID Scanner — Telegram test-group delivery
Version 0.1 · 2026-11-12 · Draft / source-only

- Reuses the already deployed PLATO LAND Telegram bot configuration (TELEGRAM_BOT_TOKEN, TELEGRAM_TEST_CHAT_ID) already used by Series 2. It does not change the Series 2 sender or its outbox.
- Destination is constrained in the new delivery ledger to test_group; the main channel is out of scope.
- Only the latest approved review revision per image is eligible. OCR candidates and images without an approved revision are excluded.
- Exact raw string equality only. No trimming, case folding, Unicode normalization, punctuation cleanup, or fuzzy matching.
- Periods: today, yesterday, rolling last 7 days, or inclusive custom Gregorian date range, interpreted in Asia/Tehran.
- A send is manual only. Preview does not send. Each manual send creates an immutable telegram_ids report version and a delivery ledger row with request UUID, outcome and Telegram message IDs.
- Repeated request UUIDs are idempotently returned; a deliberate resend must use a new request UUID and creates a new version.
- Messages contain only approved Plato IDs and report metadata, never source images or raw OCR text.
- This branch includes a draft migration and Edge Function source. It has NOT been deployed; the migration has NOT been applied; no Telegram message has been sent.
- Before activation: review migration/Edge Function, apply the migration to the primary Scanner schema only after separate approval, deploy function only after separate approval, then verify with an owner-initiated test send to the test group.
