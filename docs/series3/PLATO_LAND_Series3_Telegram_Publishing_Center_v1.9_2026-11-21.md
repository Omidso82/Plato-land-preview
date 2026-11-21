# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.9  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Merged and deployed; verification and production function deployment confirmed.

## 1. Scope

This correction restricts win statistics to the overall 48-player ranking message only.

## 2. Overall 48-player ranking

The ranking retains:
- Row number (ردیف).
- Exact Plato ID.
- Number of wins (تعداد برد).
- Existing win percentage (میانگین برد).

The existing saved ranking order and win-percentage calculation remain unchanged. The win count is read from the existing `games_won` field in the saved ranking snapshot. Games played is not displayed.

## 3. All other Telegram messages

- Seeding pots 1–4: row number and Plato ID only (as released in v1.7).
- Groups A–L: row number, Plato ID, and the existing seed designation only. Win count, games played, and win percentage are removed.
- Knockout messages: unchanged; they do not display player win statistics.

## 4. Data and safety

- No ranking, seeding, group, registration, match, or result data is changed.
- No database schema or data writes are included.
- Authentication, owner-only access, test-group-only destination, manual preview/send flow, and JWT verification remain unchanged.
- No Telegram message is sent as part of this code change.
- PLATO LAND – Main Website remains outside scope.

## 5. Implementation

- Repository: `Omidso82/Plato-land-preview`
- Branch: `fix/series3-stats-only-ranking-v2`
- Feature commit: `5b10ac55e4966f69579790ac31543323102f40dd`
- PR: [#226](https://github.com/Omidso82/Plato-land-preview/pull/226) — merged.
- Merge commit: `7c5003fbc244e49d05456b4fd7f760847c664dc5`
- Source: `supabase/functions/plato-land-series3-telegram/index.ts`
- Ranking output adds the wins-count column.
- Group output removes player statistics and retains seed designation.
- Supabase Edge Function `plato-land-series3-telegram`: ACTIVE, version 7, `verify_jwt=true`.
- Merged main source rechecked: ranking includes wins and win percentage; pot and group builders contain no player statistics.
- No Telegram messages were sent.

## 6. Version history

- **v1.5:** Three-column 48-player ranking.
- **v1.6:** Corrected ranking headings.
- **v1.7:** Removed statistics from seeding-pot messages.
- **v1.8:** Restricts win count and win percentage to the overall ranking; removes them from group messages.


## 7. Change log — v1.9 (2026-11-21)

- Improved the Series 3 prediction-ranking image generated in `src/Series3TelegramManager.tsx`.
- Increased the row-number typography from 30px to 34px and the three statistic values (correct, incorrect, remaining) from 27px to 36px.
- Moved and narrowed the statistic cards left to reserve a separate right-side area for the full Plato ID. This addresses the overlap visible in the owner preview and improves readability in the Telegram image.
- Adjusted the vertical baselines inside each row to fit the larger values.
- The ranking source, row order, Plato ID strings, statistic values, labels, title, and overall dark/gold design remain unchanged.
- No database, Supabase Edge Function, bot destination, authentication, delivery behavior, or Telegram send was changed. No message was sent.
- Implementation commit: `22b1fbad11d176714264740af3f778a34b6492bb`.
- CI and mobile preview verification are pending.


## Follow-up adjustment — v1.9.1 (2026-11-21)

- The first preview confirmed that the longer Plato IDs could still visually touch/overlap the rightmost statistic card.
- Moved all three statistic cards farther left (centers now 255, 435, and 615; card width 128px) and moved the Plato ID right alignment to x=1000 to reserve a wider dedicated ID lane.
- Kept statistic values at 36px and row numbers at 34px.
- No ranking/data/database/bot destination/delivery behavior changed. No Telegram message was sent.
- Follow-up implementation commit: `c82f60b153ceffed852dad714ed70e6d358d5c52`.
- CI and refreshed preview verification pending.


## Follow-up adjustment — v1.9.2 (2026-11-21)

- The second iPhone preview still showed visual collision between the rightmost statistic card and some Plato IDs.
- Reworked the row into two explicitly separated drawing lanes: statistic cards are restricted to the left lane; Plato IDs are rendered inside a clipped right lane (x=650–1000). The ID font automatically reduces only when needed to fit that lane.
- Statistic cards moved to centers 205, 375, and 545 with 116px width. Statistic values remain 36px; row numbers remain 34px.
- This layout prevents statistic cards from painting over the Plato ID lane. Ranking order, values, labels, IDs, data source, database, and Telegram send behavior remain unchanged.
- No message was sent. CI and refreshed preview verification pending.
- Follow-up implementation commit: `bcdb72bb7b1f3b9d1593f8f80117c298829c7735`.
