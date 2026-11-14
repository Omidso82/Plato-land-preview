# PLATO LAND – Series 3 Manual Player Stats & Seeding

**Version:** v1.0  
**Date:** 2026-11-14  
**Status:** Implemented on feature branch; awaiting CI and controlled publication

## Scope
This feature adds an owner-only, collapsible section to the existing temporary administration workspace under **Series 3**. It is separate from Series 2 data and does not change public registration, the Series 3 slide manager, the registration report, or the Main Website project.

## Data source and storage
- Registration identity and Plato ID are read from `public.plato_land_series3_registration_requests`.
- Manual statistics are stored separately in `public.plato_land_series3_player_stats`.
- The stats row is keyed by `request_id`, references the Series 3 registration row, and is deleted only if that registration is deleted.
- Fields: `games_played`, `games_won`, `updated_at`, `updated_by`.
- Database checks require non-negative counts and `games_won <= games_played`.
- RLS is enabled. SELECT, INSERT, UPDATE, and DELETE policies are limited to authenticated users whose role in `public.user_roles` is `owner` or `مالک کل`.

## Calculation and ordering
- Win rate = `games_won / games_played * 100`.
- A zero-game or missing-stat record has no valid percentage and appears after players with a valid percentage.
- Valid percentages sort descending.
- Tie-breakers follow the Series 2 public leaderboard: fewer games played first, then more wins, then Plato ID in case-insensitive English order.
- The UI accepts integer values only and rejects negative values or wins greater than total games.

## Admin UI
- Entry point: existing temporary admin route `/series2-slides-manager`.
- Navigate to **مدیریت سری سوم تخته‌نرد**.
- The new section is titled **آمار بازیکنان و سیدبندی سری سوم**.
- Includes summary counts, Plato ID search, editable total-games and wins inputs, per-player save, refresh, and collapsible display.
- No public leaderboard or public data endpoint is introduced.

## Verification status
- The production database table was created in the main Supabase project `dfrppbapaaydbjeflozw`.
- RLS is enabled and four owner-only policies were confirmed in the live schema.
- No Series 2 rows or existing Series 3 registrations were modified.
- GitHub branch: `feature/series3-manual-seeding-20261114`.
- Build/CI and live panel verification remain pending until the pull request checks complete and the change is published.
