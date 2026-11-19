# PLATO LAND – Series 3 Telegram Publishing Center

**Version:** 1.7  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Merged and deployed; verification and production deployment successful.

## 1. Scope

This change applies only to the four Series 3 seeding-pot Telegram messages (سید ۱ تا ۴). Each listed player is shown with the existing rank/row number and exact Plato ID. Win totals, games played, and win percentage are omitted from these four messages.

## 2. Exact pot-list format

Each player line contains only:
- The existing saved-order row number.
- The exact Plato ID.

No player statistics are appended to pot-list lines. Existing pot membership, saved order, identifiers, item counts, message title, subtitle, and footer remain unchanged.

## 3. Explicitly unchanged message types

- The 48-player ranking message retains its three columns: «ردیف»، «Plato ID»، «میانگین برد».
- Group A–L messages retain their existing content and statistics.
- Knockout bracket messages remain unchanged.
- No ranking, seeding, group, registration, match, or result data is modified.

## 4. Implementation

- Repository: `Omidso82/Plato-land-preview`
- Base: `main` at `404e604fbd0ea9e9c8efe697e5f1e6676be26896`
- Branch: `fix/series3-telegram-pot-id-only`
- Feature commit: `fd1e4364589c9bdb03d5b195bdc1c9d628352944`
- PR: [#225](https://github.com/Omidso82/Plato-land-preview/pull/225) — merged.
- Merge commit: `799aca588fba2637a6c562e84c6bb5c5593127ac`
- Changed source: `supabase/functions/plato-land-series3-telegram/index.ts`
- The pot message builder now renders row number plus Plato ID only.

## 5. Safety and release status

- No database query/write or schema change was performed for this code edit.
- Build/typecheck and Deno verification workflow #1300: SUCCESS ([run](https://github.com/Omidso82/Plato-land-preview/actions/runs/44641949695)).
- Production website deployment workflow #1050: SUCCESS ([run](https://github.com/Omidso82/Plato-land-preview/actions/runs/44641949796)).
- Supabase Edge Function `plato-land-series3-telegram`: ACTIVE, version 6, `verify_jwt=true`.
- No Telegram message was sent.
- The existing owner authentication, test-group-only destination, manual preview/send flow, and JWT verification must remain unchanged.
- The separate PLATO LAND – Main Website project is outside scope.

## 6. Version history

- **v1.5:** Three-column 48-player ranking message.
- **v1.6:** Corrected the ranking headings to «ردیف»، «Plato ID»، «میانگین برد».
- **v1.7:** Removes win statistics from Series 3 seeding-pot messages; keeps row number and Plato ID only.
