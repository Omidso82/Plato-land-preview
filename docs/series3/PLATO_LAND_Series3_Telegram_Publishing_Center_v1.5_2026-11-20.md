# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.5  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Three-column ranking correction merged and deployed; post-merge workflow verification recorded below.

## 1. Release record

- Repository: `Omidso82/Plato-land-preview`
- PR: [#223](https://github.com/Omidso82/Plato-land-preview/pull/223) — merged successfully
- Merge commit: `71cafc63616470c7ff2d64a1e52004fa95ccda9d`
- Supabase project: `dfrppbapaaydbjeflozw`
- Edge Function: `plato-land-series3-telegram` — ACTIVE, version 4, `verify_jwt=true`

## 2. Owner-confirmed ranking format

The owner clarified that the 48-player ranking message must contain exactly three columns, in this order:
1. **ردیف:** 1 through 48, corresponding to the existing saved ranking order.
2. **شناسه PLATO:** each player's Plato ID.
3. **درصد برد:** win percentage.

The wins count and total games played are not displayed in this ranking message.

## 3. Implementation and verification

- The ranking is rendered in a Telegram HTML `<pre>` block with monospaced aligned columns.
- Row numbers are generated from the existing array position, so the stored ranking order is retained without re-sorting.
- Row numbers and percentages use Persian numerals.
- Win percentage remains calculated from the saved `games_won / games_played` values, up to two decimal places.
- Unicode left-to-right direction marks are retained so headings remain above the matching columns in RTL Telegram chats.
- TypeScript verification passed.
- Build passed.
- Existing Deno tests passed.
- `deno check supabase/functions/plato-land-series3-telegram/index.ts` passed.
- Supabase Edge Function was deployed and retrieved afterward; it is ACTIVE at version 4 with JWT verification enabled and the three-column formatter confirmed in deployed source.

## 4. Unchanged scope

- Seeding-pot messages and group messages remain unchanged.
- Ranking snapshots, player records, draws, knockout brackets, registrations, and results were not modified.
- No database schema or data changes were made.
- Telegram secrets and destination were not changed.
- No Telegram message was sent during this correction or deployment.
- Series 2 and the separate Main Website project were not modified by the code change.

## 5. Owner visual validation

The owner should open the authenticated temporary management panel, select only the 48-player ranking, generate a preview, and confirm the three columns visually before sending. No Telegram send was performed by this implementation.

## 6. Version history

- **v1.1 — 2026-11-20:** Initial production release record.
- **v1.2 — 2026-11-20:** Ranking message simplified to Plato ID and win percentage.
- **v1.3 — 2026-11-20:** RTL alignment safeguard for the two-column format.
- **v1.4 — 2026-11-20:** Added the missing row-number column.
- **v1.5 — 2026-11-20:** Records PR #223 merge, three-column layout, CI verification, and active Supabase Edge Function version 4.
