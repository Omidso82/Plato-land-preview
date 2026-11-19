# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.4  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Three-column ranking format correction prepared; CI, merge, and deployment pending.

## 1. Scope

This correction applies only to the 48-player ranking message in the Series 3 Telegram publishing center. It does not change the saved ranking snapshot, player data, ranking order, win-percentage calculation, seeding pots, groups, knockout stages, or daily-results placeholder. Series 2 and the separate Main Website project remain out of scope.

## 2. Confirmed display requirement

The owner clarified that the ranking message must have exactly three columns, in this order:
1. Row number, 1 through 48, matching the existing saved ranking order.
2. Player Plato ID.
3. Win percentage.

Wins count and games-played count remain hidden in this ranking message. No re-sorting or database recalculation is requested.

## 3. Implementation

- Telegram HTML `<pre>` block keeps the columns monospaced and aligned.
- The row number is generated from the player's existing position in the saved 48-player ranking snapshot, using Persian numerals.
- Plato ID and win percentage follow the row number in the same row.
- Unicode left-to-right direction marks are retained to keep headings above matching columns in RTL Telegram chats.
- Win percentage remains `games_won / games_played * 100`, with up to two decimal places and Persian numeral formatting.
- The existing ranking order is preserved.

## 4. Files changed

- `supabase/functions/plato-land-series3-telegram/index.ts`

No database schema/data, player records, tournament results, draw, registrations, Telegram secrets, or Telegram destination are changed.

## 5. Release status

- Development branch: `fix/series3-telegram-ranking-row-number`
- PR and production deployment are pending.
- No Telegram message has been sent as part of this correction.
- This correction is not live until CI passes, the PR is merged, and the Supabase Edge Function is deployed and verified.

## 6. Version history

- **v1.1 — 2026-11-20:** Initial production release record.
- **v1.2 — 2026-11-20:** Ranking message simplified to Plato ID and win percentage only.
- **v1.3 — 2026-11-20:** RTL column alignment safeguard and deployed two-column format.
- **v1.4 — 2026-11-20:** Adds the missing row-number column (1–48), resulting in the requested order: row number, Plato ID, win percentage.
