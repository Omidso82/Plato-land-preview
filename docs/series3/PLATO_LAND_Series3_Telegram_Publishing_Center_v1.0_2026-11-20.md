# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.0  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Implementation candidate; production release pending CI and deployment verification.

## 1. Scope

Adds an owner-only Telegram publishing workspace inside the existing temporary management panel at:

https://platoland.org/series2-slides-manager/

The workspace is mounted only under **Series 3 Backgammon Management**. It does not create a new page, route, parallel panel, or Main Website feature.

## 2. Data sources

All tournament content is read from the primary Supabase project `dfrppbapaaydbjeflozw`, using the existing immutable Series 3 snapshots:

- `plato_land_series3_seeding_draws` (`event_key='series3'`): 48-player ranking, four 12-player pots, and 12 groups A–L.
- `plato_land_series3_knockout_draws` (`event_key='series3'`): saved 32-player bracket and its downstream rounds.

The publisher never performs a draw, edits tournament snapshots, or writes tournament data.

## 3. Selectable Telegram messages

Each selected item produces its own message:

- Full 48-player ranking with wins, games played, and win percentage.
- Each of the four seeding pots independently.
- Each of the 12 groups (A–L) independently, with four players and their assigned pot.
- Knockout rounds independently: round of 32, round of 16, quarterfinals, semifinals, and final.

Bracket slots are published exactly as stored. Unresolved qualifiers remain explicit placeholders; the publisher does not infer player identities or fabricate results.

## 4. Manual send and destination controls

- Preview is required before send.
- Sending requires an additional browser confirmation.
- The Edge Function verifies the caller's authenticated user and `user_roles.role='owner'`.
- Telegram credentials remain server-side.
- The only configured destination is `TELEGRAM_TEST_CHAT_ID`; no production group/channel ID is accepted from the browser.
- No automatic or scheduled Telegram sending is enabled.
- Messages are sent sequentially with a 3.1-second interval to stay below Telegram group rate limits. If Telegram rejects a later message, the response reports the number already sent; no blind retry is performed.
- No Telegram message is sent during build, deployment, preview generation, or release verification.

## 5. Daily fixtures/results – reserved follow-up

The current primary database has no Series 3 fixture/schedule/results table or Series 3 result-entry workflow. The card therefore reserves the daily publishing area but keeps it inactive. It must later be connected only to the future Series 3 source of truth and must support Jalali date selection, all matches for a date, or a selected group for that date. It must not read Series 2 progression data or unrelated generic tables.

## 6. Files and technical boundary

- `src/Series3TelegramManager.tsx` — owner-facing selection, preview, and manual send UI.
- `src/Series2SlidesManager.tsx` — mounts the new component within the existing Series 3 section.
- `supabase/functions/plato-land-series3-telegram/index.ts` — authenticated preview/send endpoint.
- `.github/workflows/verify.yml` — Deno type-check for the new Edge Function.

No SQL migration, schema change, data write, result edit, draw change, storage operation, token change, destination change, or paid service is part of this feature.

## 7. Acceptance checks

1. Build and TypeScript typecheck pass.
2. Deno type-check passes for the new Edge Function.
3. Owner-only authorization is enforced server-side.
4. Preview reads the saved 48-player ranking, four pots, 12 groups, and all five bracket stages.
5. Preview generation sends no Telegram messages.
6. Manual send targets only the existing test group and reports Telegram message IDs.
7. The existing Series 3 and Series 2 management tools remain unchanged.
8. Daily results remain visibly reserved but inactive until the Series 3 results source is implemented.

## 8. Version history

- **v1.0 — 2026-11-20:** Initial implementation specification for owner-only Series 3 Telegram publishing in the existing temporary panel.