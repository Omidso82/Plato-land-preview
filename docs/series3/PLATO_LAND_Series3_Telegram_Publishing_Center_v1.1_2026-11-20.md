# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.1  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Merged and deployed; production Build/TypeScript/Deno verification successful.

## 1. Release record

- Repository: `Omidso82/Plato-land-preview`
- PR: [#221](https://github.com/Omidso82/Plato-land-preview/pull/221) — merged
- Merge commit: `db7b65616738e3a0e5e9aaac6fda4748c21e7cee`
- Production workflow: `Deploy PLATO LAND website #1037` — success; run `44638539691`
- Verification workflow: `Build and typecheck #1287` — success; run `44638539732`
- Supabase project: `dfrppbapaaydbjeflozw`
- Edge Function: `plato-land-series3-telegram` — ACTIVE, version 2, `verify_jwt=true`

## 2. Delivered feature

The owner-only Telegram publishing center is mounted inside the existing Series 3 section of the temporary management panel at `https://platoland.org/series2-slides-manager/`. No new page, route, or parallel admin panel was created.

Selectable independent messages:
- Full 48-player ranking with wins, games played, and win percentage.
- Each of the four 12-player seeding pots.
- Each group A–L independently.
- Each knockout stage independently: 32-player round, 16-player round, quarterfinals, semifinals, and final.

Each item has a polished Persian/PLATO LAND message format. The content is generated from the saved Series 3 snapshots in the primary database. Bracket placeholders remain placeholders until actual group qualifiers are known; no player identity is inferred.

## 3. Safety and sending

- The server validates the authenticated user and owner role.
- Telegram token and destination remain server-side.
- Only `TELEGRAM_TEST_CHAT_ID` is used; the browser cannot choose or override the destination.
- The owner must generate and review a preview, then confirm before sending.
- Selected messages are sent sequentially with a 3.1-second interval to stay below Telegram group rate limits.
- If a later message fails, the response reports how many earlier messages were sent. No automatic retry occurs.
- No message was sent during implementation, deployment, or verification.

## 4. Daily schedule/results follow-up

The Telegram card contains a reserved but inactive area for daily Series 3 schedules/results. The primary database currently has no Series 3 match fixture/results source or result-entry workflow. Once that source is implemented, this area can support Jalali date selection, all matches on a date, or only a selected group on that date. It must not use Series 2 progression data or unrelated tables.

## 5. Data and scope impact

- Read-only source verification confirmed a saved Series 3 seeding snapshot with 48 ranked players, four pots, and 12 groups.
- A saved Series 3 knockout snapshot contains the 32-player bracket and downstream rounds.
- No SQL migration, schema change, database write, registration edit, result edit, draw change, storage operation, Telegram secret change, destination change, paid service, or Main Website change was made.
- The production page was reachable and returned the expected unauthenticated owner login screen. An authenticated visual walkthrough of the new card was not performed by the assistant.

## 6. Files released

- `src/Series3TelegramManager.tsx`
- `src/Series2SlidesManager.tsx`
- `supabase/functions/plato-land-series3-telegram/index.ts`
- `.github/workflows/verify.yml`
- `docs/series3/PLATO_LAND_Series3_Telegram_Publishing_Center_v1.0_2026-11-20.md`

## 7. Next owner check

On iPhone, open the existing temporary management panel, sign in as Owner, enter Series 3, and open the card **مرکز اطلاع‌رسانی تلگرام**. First select one group and generate a preview; verify the IDs and text before using the send button. This visual/preview acceptance is still pending.

## 8. Version history

- **v1.0 — 2026-11-20:** Initial implementation specification and candidate release.
- **v1.1 — 2026-11-20:** Records PR #221 merge, production deployment success, successful verification, active Edge Function v2, no-message-send status, and remaining owner visual/preview acceptance.