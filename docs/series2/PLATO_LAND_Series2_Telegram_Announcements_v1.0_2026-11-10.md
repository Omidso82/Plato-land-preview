# PLATO LAND – Series 2 Telegram Announcements
Version: v1.0
Date: 2026-11-10
Scope: PLATO LAND – Temporary Projects / Series 2 only

## Approved scope
- Owner-only manual publication of today's schedule and the Round of 16 bracket to the Telegram test group only.
- Automatic bracket snapshot announcement after an owner saves a knockout result.
- Existing result notifications remain unchanged.
- Never send to the official group or channel.

## Data and safety design
- New table: public.plato_land_telegram_announcements.
- Unique event_key prevents duplicate announcements.
- RLS enabled; direct anon/authenticated table privileges revoked; service_role is the only granted application role.
- Edge Function continues to validate the authenticated user's user_roles.role = owner.
- Telegram destination is TELEGRAM_TEST_CHAT_ID only.
- No Telegram message is sent during deployment or migration.

## Schedule date limitation
Current canonical progression stores group fixture day labels (saturday/sunday/monday), but does not contain a verified calendar date for the daily schedule. The publish_today_schedule action therefore requires an exact scheduled_date or date field matching Copenhagen's current date. If no matching fixtures exist, it returns HTTP 409 and sends nothing. No weekday-to-date inference is permitted.

## Round of 16
The action reads the canonical Series 2 progression and resolves bracket sources read-only. It requires exactly eight fully resolved matches before publication. A recorded-bracket conflict blocks publication.

## Automatic bracket updates
After save_bracket_result successfully persists an owner-entered result, the function builds a snapshot of all knockout rounds and sends it to the test chat. The announcement has a content fingerprint event key, so identical snapshots are not sent twice.

## Files changed
- supabase/migrations/20261110140000_series2_telegram_announcements.sql
- supabase/functions/plato-land-series2-progression/index.ts
- src/Series2ResultsManager.tsx

## Current execution status
- Code committed to a feature branch and proposed through a Draft pull request.
- No migration applied to Supabase.
- No Edge Function deployed.
- No Telegram messages sent.
- No tournament progression, result, registration, prediction, or other tournament data changed.
- No changes to PLATO LAND – Main Website main branch.

## Required next steps
1. Review the PR and CI/build checks.
2. Apply the migration to the existing main Supabase project only after explicit approval for that production schema operation.
3. Deploy the updated Edge Function only after the migration is verified.
4. Test owner-only rejection and successful publication using the Telegram test group, with a separate explicit user instruction to send a test message.
5. Add exact scheduled dates to authoritative fixture data before enabling today's schedule publication.
