# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.8  
**Date:** 2026-11-20  
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
