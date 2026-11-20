# PLATO LAND – Temporary Projects
## Series 3 Group Fixtures & Tournament Calendar Handover
**Version:** 1.0  
**Date:** 2026-11-20  
**Status:** Database schedule persisted; UI and Telegram integration in Draft PR; production release not approved/performed.

### 1. Approved calendar
All matches start at 21:00 Asia/Tehran.

| Stage | Persian date | Gregorian date | Matches |
|---|---|---:|---:|
| Group round 1 | شنبه ۳۰ آبان ۱۴۰۵ | 2026-11-21 | 24 |
| Group round 2 | یکشنبه ۱ آذر ۱۴۰۵ | 2026-11-22 | 24 |
| Group round 3 | دوشنبه ۲ آذر ۱۴۰۵ | 2026-11-23 | 24 |
| Round of 32 / یک‌شانزدهم نهایی | سه‌شنبه ۳ آذر ۱۴۰۵ | 2026-11-24 | 16 |
| Round of 16 / یک‌هشتم نهایی | چهارشنبه ۴ آذر ۱۴۰۵ | 2026-11-25 | 8 |
| Quarterfinals / یک‌چهارم نهایی | شنبه ۷ آذر ۱۴۰۵ | 2026-11-28 | 4 |
| Semifinals / نیمه‌نهایی | یکشنبه ۸ آذر ۱۴۰۵ | 2026-11-29 | 2 |
| Third-place match and final | دوشنبه ۹ آذر ۱۴۰۵ | 2026-11-30 | 2 |

### 2. Group fixture generation
- Source: immutable published snapshot in `public.plato_land_series3_seeding_draws`, event_key `series3`.
- Exactly 12 groups (A–L), four players each; no roster changes or replacements.
- Randomized player order within each group was used to assign a standard 3-round round-robin.
- Each group has six unique pairings, two per day.
- Each player plays once on each group-stage day (three games total).
- Database verification: 72 total matches; 12 groups with six matches each; 48 distinct players with three games each across three rounds; zero duplicate pairings.

### 3. Database
- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- New table: `public.plato_land_series3_group_fixtures`.
- Migration: `20261120074213_series3_group_fixtures_schedule`.
- Snapshot row: `3b1e6ba4-bc24-4b34-a8f6-ea229f34dafc`.
- Fingerprint: `6ba14443d0a71de4085ac31c205934316c3425372fdf88963b1c4386994c6bc3`.
- RLS enabled; two owner-only read/insert policies; no update/delete grants.
- Knockout dates stored as calendar metadata. Third-place and final pairings are placeholders for semifinal losers/winners; no player names were invented.

### 4. GitHub implementation
- Repository: `Omidso82/Plato-land-preview`.
- Base: `main` at `3cee2c18ff9fd25a244ea2197d8f66f63d3fc288`.
- Branch: `feature/series3-group-fixtures-schedule`.
- Draft PR: #227 — https://github.com/Omidso82/Plato-land-preview/pull/227
- Added `src/Series3FixturesSchedule.tsx` and mounted it in the existing Series 3 admin panel.
- Added Telegram selections for a full day or one group on a selected day, with existing preview-before-send flow.
- No Telegram message has been sent.
- No PR merge or manual production deployment has been performed.

### 5. Scope protections
No changes were made to the published group draw, knockout draw, registrations, Series 2, main website design, or unrelated database tables. Only the dedicated Series 3 fixture table was created in the primary database.

### 6. Verification and remaining work
- Database schedule integrity checks passed.
- RLS enabled and two policies verified.
- GitHub Actions typecheck and build completed successfully at the latest observed point; Deno checks were still running.
- A separate automatic website workflow was observed running from the branch push; its final deployment target/status must be checked before claiming any preview or production publication.
- Remaining: complete CI/Deno verification; inspect automatic Pages workflow result; resolve any CI issues; owner review and approval before merging/releasing; deploy the updated Telegram Edge Function only as part of the approved release; then test Telegram previews without sending.
- Sources should be updated with this handover document after it is downloaded/attached by the owner.
