# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.2  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Ranking message format correction prepared on an isolated branch; CI and production release pending.

## 1. Scope

This update applies only to the 48-player ranking message in the Series 3 Telegram publishing center. It does not change the ranking snapshot, ranking order, percentage calculation, seeding pots, groups, knockout stages, daily-results placeholder, Series 2, or the separate Main Website project.

## 2. Owner-approved display requirement

The owner requested that the 48-player Telegram ranking message display only:
- Plato ID
- Win percentage

The number of wins and number of games played must not appear in this ranking message. Each player must occupy one row, with the ID and win percentage in aligned columns. The existing saved ranking order is retained.

## 3. Implementation

- The ranking message now formats its two columns in a Telegram HTML `<pre>` block, using a monospaced layout for alignment.
- The displayed percentage continues to be calculated from the saved `games_won / games_played` values and formatted in Persian numerals, with up to two decimal places.
- The ranking snapshot must still contain exactly 48 players.
- The existing order in `ranking_snapshot` is preserved; no re-sorting or database recalculation is introduced.
- Statistics in the four seeding-pot messages and twelve group messages remain unchanged and continue to show wins, games, and win percentage.

## 4. Files changed

- `supabase/functions/plato-land-series3-telegram/index.ts`

No frontend component, database schema, database record, tournament result, draw, registration, Telegram secret, or Telegram destination is changed.

## 5. Safety and release status

- Development branch: `fix/series3-telegram-ranking-layout`
- The correction is isolated from `main` pending CI and review.
- A follow-up adjustment adds Unicode direction marks to prevent the two headings from appearing over the wrong data column in RTL Telegram chats.
- No Telegram message has been sent as part of this change.
- No Edge Function deployment has been performed as part of this change.
- The correction is not considered live until the PR is merged, CI succeeds, the Edge Function is deployed, and the preview is checked by the owner.

## 6. Version history

- **v1.1 — 2026-11-20:** Initial Telegram publishing center release record.
- **v1.2 — 2026-11-20:** Records the requested ranking-only display simplification: Plato ID and win percentage in aligned columns; wins/games counts removed from the 48-player ranking message only.
