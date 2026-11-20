# PLATO LAND – Series 3 Telegram Destination Selection & Delivery History

**Version:** 1.6  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** PR #254 was squash-merged into `main` on 2026-11-20 (merge commit `03da7844a78db7b229739a3bd50444ee5078eb02`). Post-merge verification on merge commit `03da7844a78db7b229739a3bd50444ee5078eb02`: `verify` passed; Cloudflare Pages `plato-land-preview` preview deployment succeeded at `https://071e817c.plato-land-preview.pages.dev`; the `build` job was cancelled and its `deploy` job was cancelled; `Workers Builds: plato-land-media-endpoint` failed (same pre-existing failure observed on the base commit). The primary Supabase project is healthy. The required delivery-history migration is not present in remote migration history. The currently deployed `plato-land-series3-telegram` Edge Function is version 12 and does not contain the new destination-selection/history implementation. Production release remains pending.

## 1. Approved scope
Extend the existing Series 3 Telegram publishing center in the existing temporary management panel. No new bot, page, route, or parallel panel is introduced.

Strict exclusions:
- PLATO ID Scanner: completely out of scope.
- Existing legacy operator tools and permissions: unchanged.
- Main Website: no independent feature or unrelated change.
- No automatic or scheduled sending.

## 2. Destinations
Owner can select:
- `test_group`: existing group, using the existing `TELEGRAM_TEST_CHAT_ID` secret.
- `main_channel`: primary channel, using the new server-side secret `TELEGRAM_MAIN_CHANNEL_ID`.
- Both destinations.

The primary channel ID supplied by the user from the private channel message link is `-1004322228022`. The bot was added as a channel administrator by the user. The ID is not embedded in browser code.

The bot token remains in `TELEGRAM_BOT_TOKEN`. No secret values are committed to Git.

## 3. Authorization and send flow
- UI is in the existing Series 3 owner workspace.
- Edge Function continues to verify the authenticated user and `user_roles.role='owner'` server-side.
- The server accepts only the two allow-listed destination identifiers. It never accepts a browser-supplied chat ID.
- Preview is required; a separate browser confirmation is required before sending.
- Each destination is processed independently. Telegram HTTP/network failure or missing destination Secret is recorded for that destination and does not prevent an attempt to the other.
- If audit-history insertion fails, the UI explicitly warns the owner that delivery history was not saved.
- Each destination result reports sent/partial/failed status, sent count, failed section, Telegram message IDs and error details.
- After any delivery attempt where at least one message was accepted, the UI clears the preview. Destinations with zero delivered messages and a fully failed status may remain selected for a fresh preview; destinations with partial or successful delivery are removed from the retry selection to avoid resending already accepted messages. A partially delivered destination requires manual reconciliation before any further attempt.
- No message is sent by preview, CI, migration, or deployment.

## 4. Delivery history
Migration creates `public.plato_land_series3_telegram_delivery_history`.
One row is stored per destination attempt, with status, total/sent counts, failed section, error, Telegram message IDs, sender user ID and timestamp. Message body and bot token are not stored.

RLS is enabled. Authenticated users receive SELECT only, with an Owner-only policy. Inserts are performed by the server-side service-role client. No browser insert/update/delete access is granted.

## 5. Files changed
- `src/Series3TelegramManager.tsx`: destination selection, preview wording, independent result summary and recent delivery history.
- `supabase/functions/plato-land-series3-telegram/index.ts`: destination allow-list, server-side secret lookup, independent sends and audit insert.
- `supabase/migrations/20261120130000_series3_telegram_delivery_history.sql`: owner-only delivery-history table and RLS.
- This handover document.

## 6. Required production configuration
In the Supabase Dashboard for the primary project `dfrppbapaaydbjeflozw`, add this Edge Function secret:
- Name: `TELEGRAM_MAIN_CHANNEL_ID`
- Value: `-1004322228022`

Keep existing `TELEGRAM_BOT_TOKEN` and `TELEGRAM_TEST_CHAT_ID` unchanged. Do not expose secrets in chat or GitHub.

The current assistant tool connection does not expose a supported Supabase secret-write action. Therefore this secret has not been set by this change set.

## 7. Release gates
1. PR #254 is merged. Post-merge `verify` passed and the Pages preview deployment succeeded. The main `build` and `deploy` jobs were cancelled; the unrelated/pre-existing media-endpoint Worker build failed.
2. Apply the included migration to the primary database through the approved release process.
3. Set `TELEGRAM_MAIN_CHANNEL_ID` in the primary project's Edge Function Secrets.
4. Deploy the updated Edge Function and verify its active version.
5. Publish the frontend after PR merge/deployment.
6. Run preview-only checks first. Then a user-approved, minimal test send may be performed separately. No real channel message is sent as part of this implementation task.

## 8. Explicit non-actions
- No PLATO ID Scanner files or functions changed.
- No legacy operator UI or authorization changed.
- No Series 3 draw, fixtures, results, registrations or prediction data changed.
- No existing Telegram message sent.
- No database migration applied yet.
- No production secret changed.
- No function deployed and no production release claimed.

## 9. Version history
- **v1.0 — 2026-11-20:** Initial owner-only Series 3 Telegram publishing center, test-group-only.
- **v1.1 — 2026-11-20:** Adds selectable destinations, independent delivery outcomes and owner-only delivery history; release gates remain pending.
- **v1.2 — 2026-11-20:** Fixes Deno destination typing errors, isolates per-destination configuration/network failures, adds a visible warning for unsaved delivery history, and updates the release status. No migration or production release performed.
- **v1.3 — 2026-11-20:** Corrects the remaining inferred string type for the delivery status union found by CI. Awaiting the next full CI result; no migration or production release performed.
- **v1.4 — 2026-11-20:** Clears the send preview after any accepted delivery, and retains retry selection only for destinations where zero messages were delivered and the destination failed completely. This prevents a partial delivery from being resent wholesale through the existing preview.
- **v1.5 — 2026-11-20:** Records the successful squash-merge of PR #254 into `main` (merge commit `03da7844a78db7b229739a3bd50444ee5078eb02`).
- **v1.6 — 2026-11-20:** Records post-merge CI/preview results and read-only production checks: verify passed; Pages preview succeeded; build/deploy jobs were cancelled; the media-endpoint Worker check failed as a pre-existing issue. Primary Supabase is healthy, but the delivery-history migration is not applied and deployed Series 3 Telegram Edge Function v12 does not contain the new implementation. No production secret, migration, function deployment or Telegram send was changed.
