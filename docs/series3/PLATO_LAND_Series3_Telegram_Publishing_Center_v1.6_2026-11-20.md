# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.6  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Merged and deployed; Build, verification, and production deployment successful.

## 1. Scope

This release corrects only the three column headings in the Series 3 48-player Telegram ranking message. It does not change the ranking data, row order, calculations, player identifiers, or other Telegram message types.

## 2. Exact approved column headings

The ranking table must display the following headings above their corresponding columns, in this exact left-to-right order within the monospaced table:
1. **ردیف** — row numbers ۱ تا ۴۸.
2. **Plato ID** — each player's exact Plato ID.
3. **میانگین برد** — the existing win-percentage value.

The previous labels «شناسه PLATO» and «درصد برد» are replaced with «Plato ID» and «میانگین برد» respectively. The row heading remains «ردیف».

## 3. Unchanged behavior

- Row numbers remain generated from the existing saved ranking order.
- Plato IDs remain unchanged.
- The existing win-percentage calculation and formatting remain unchanged; only its heading changes to «میانگین برد».
- No wins count or games-played count is added.
- No database, tournament, registration, draw, or result data is modified.
- No Telegram messages are sent during this correction.

## 4. Release record

- Repository: `Omidso82/Plato-land-preview`
- PR: [#224](https://github.com/Omidso82/Plato-land-preview/pull/224) — merged.
- Merge commit: `62750104f11b30c034c4b50c57ca45154936375d`.
- Source file: `supabase/functions/plato-land-series3-telegram/index.ts`.
- Build and typecheck workflow #1299: SUCCESS.
- Production deploy workflow #1049: SUCCESS; deployed to `platoland.org`.
- Supabase Edge Function `plato-land-series3-telegram`: ACTIVE, version 5, `verify_jwt=true`.
- No database changes and no Telegram messages sent.

## 5. Version history

- **v1.5 — 2026-11-20:** Three-column ranking release: row number, Plato ID, win percentage.
- **v1.6 — 2026-11-20:** Corrects the visible headings to «ردیف»، «Plato ID»، «میانگین برد».
