# PLATO LAND – Series 3 Manual Player Stats & Seeding

**Version:** v1.1  
**Date:** 2026-11-14  
**Status:** Merged to main; public admin route responds; owner-authenticated UI check pending

## Scope
Adds an owner-only, collapsible section to the existing temporary administration workspace under **Series 3**. It remains separate from Series 2 data and does not change public registration, Series 3 slides, the registration report, or the Main Website project.

## Data and security
- Registration identity and Plato ID come from `public.plato_land_series3_registration_requests`.
- Manual statistics are stored in `public.plato_land_series3_player_stats`.
- One stats row per registration, keyed by `request_id`; registration deletion cascades to its stats row.
- Fields: `games_played`, `games_won`, `updated_at`, `updated_by`.
- Database constraints enforce non-negative values and `games_won <= games_played`.
- RLS is enabled; four policies limit SELECT, INSERT, UPDATE, and DELETE to authenticated owner accounts with role `owner` or `مالک کل`.

## Calculation and sorting
- Win rate = `games_won / games_played * 100`.
- Missing stats and zero-game entries have no valid percentage and are listed after valid percentages.
- Valid win rates sort descending.
- Tie-breakers match the Series 2 public leaderboard: fewer games played, then more wins, then Plato ID case-insensitive English order.
- The UI validates integer inputs and rejects negative values or wins exceeding total games.

## Admin access
1. Open `https://platoland.org/series2-slides-manager/`.
2. Sign in with the owner account.
3. Choose **مدیریت سری سوم تخته‌نرد**.
4. Find **آمار بازیکنان و سیدبندی سری سوم** below the existing image manager and registration report.
5. Enter each player's total games and wins, then save that row.

The section includes summary counts, Plato ID search, per-player save, refresh, and collapse/expand.

## Change and verification record
- GitHub PR #175 merged to `main`.
- Merge commit: `7e6387268fafed7574f6c13267495a83b8bdedb0`.
- The new component and this feature's v1.0 document are present on `main`.
- Main Supabase project: `dfrppbapaaydbjeflozw`.
- Live schema check: 14 Series 3 registrations, 0 manual-stat rows (expected before first admin entry), RLS enabled, four policies present.
- Supabase security advisor did not report the new table among the tables missing RLS policies. Existing unrelated project findings remain unchanged.
- The admin route was fetched successfully and returned the login page. The authenticated owner view and a full production build/CI result were not independently verified in this session; therefore do not treat those checks as passed until the owner opens the section and confirms it.
- No Series 2 records, existing Series 3 registrations, or Main Website data were modified.
