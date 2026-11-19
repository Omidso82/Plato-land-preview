# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.3  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Ranking display correction merged and deployed.

## 1. Release record

- Repository: `Omidso82/Plato-land-preview`
- PR: [#222](https://github.com/Omidso82/Plato-land-preview/pull/222) — merged successfully
- Merge commit: `9dd440ff48fcd7cf95fca4ab3c5b2dbd19794b97`
- CI workflow on PR head `ea6bcb2025764abab6e65e028d5468463f152a4e`: Build and typecheck run `44639617749` — success
- Production website build/deploy workflow on PR head: run `44639617792` — success (PR preview deployment)
- Supabase project: `dfrppbapaaydbjeflozw`
- Edge Function: `plato-land-series3-telegram` — ACTIVE, version 3, `verify_jwt=true`

## 2. Owner-approved ranking format

The owner confirmed the requested correction:
- The 48-player ranking message displays only Plato ID and win percentage.
- Wins count and games-played count are not shown in this ranking message.
- Each player is displayed on one row in two aligned columns.
- Column headings must stay directly above their corresponding values in Persian RTL Telegram chats.

## 3. Implementation and verification

- Ranking output uses a Telegram HTML `<pre>` block with monospaced text.
- Unicode left-to-right direction marks are applied to rows to prevent heading/value column reversal in RTL chat clients.
- Win percentage remains calculated from the saved `games_won / games_played` values, formatted in Persian numerals to a maximum of two decimal places.
- The saved 48-player ranking order is preserved. No re-sorting or DB recalculation was introduced.
- TypeScript verification and production build passed.
- All existing Deno tests passed.
- `deno check supabase/functions/plato-land-series3-telegram/index.ts` passed.
- The Edge Function was redeployed to the primary Supabase project and independently retrieved afterward; status is ACTIVE, version 3, with the updated formatter and JWT verification enabled.

## 4. Unchanged scope

- Seeding-pot messages and group messages continue to show wins, games played, and win percentage.
- Ranking snapshots, player records, draws, knockout brackets, registrations, and results were not modified.
- No database schema or data changes were made.
- Telegram secrets and destination were not changed.
- No Telegram message was sent during this correction or deployment.
- Series 2 and the separate Main Website project were not changed.

## 5. Owner validation still pending

The code is deployed, but the owner should perform the final visual check from the authenticated management panel:
1. Open the existing temporary management panel and sign in as Owner.
2. Open the Series 3 Telegram publishing center.
3. Select only the 48-player ranking and generate a preview.
4. Confirm that the Plato ID heading is above the IDs and the win-percentage heading is above the percentages.
5. Do not send unless separately desired and explicitly confirmed.

## 6. Version history

- **v1.1 — 2026-11-20:** Initial production release record for the Telegram publishing center.
- **v1.2 — 2026-11-20:** Requested simplification of the 48-player ranking message to ID and win percentage only.
- **v1.3 — 2026-11-20:** Records RTL column alignment safeguard, PR #222 merge, successful CI, successful preview build/deploy workflow, and active Supabase Edge Function version 3. Owner visual preview acceptance remains pending.
