# PLATO LAND Series 3 – Group Results Manager Handover

**Version:** v1.0  
**Date:** 2026-11-20  
**Scope:** PLATO LAND – Temporary Projects / Series 3 only

## Confirmed scope
- Existing immutable 72-match group schedule remains unchanged.
- Result manager is embedded in the existing Series 3 owner workspace.
- One current result row per scheduled match, keyed by the existing match ID.
- Corrections increment a version and preserve before/after snapshots in history.
- A normal five-point match is recorded as 5–0 through 5–4 (or reverse).
- Each win gives 3 points; loss gives 0.
- Double no-show is resolved but awards no win, loss, points, or set scores.
- Standings are computed from match results, not aggregate seeding stats.

## Database
Primary Supabase project: `dfrppbapaaydbjeflozw`

- `public.plato_land_series3_group_match_results`: current result for each of the 72 fixtures.
- `public.plato_land_series3_group_match_result_history`: immutable insert/update snapshots.

The migration seeds all 72 pending rows from `plato_land_series3_group_fixtures`. Fixture identity, date, group, and player assignments are immutable. RLS is owner-only. Delete is not granted.

## Admin UI
- `src/Series3GroupResultsManager.tsx`
- Integrated in `src/Series3SeedingManager.tsx`, directly below the fixed schedule.
- Day and group filters.
- Enter five-point match scores or mark double no-show.
- Standings show resolved matches, wins, losses, points, sets for/against, and set differential.
- Ranking: points, set differential, sets won. If these remain tied, no winner is invented.

## Boundaries
- No Series 2 changes.
- No PLATO LAND – Main Website changes.
- No group draw, knockout draw, or schedule changes.
- No Telegram messages sent.
- Production release is not part of this handover.

## Verification
- Database migration application reported successful.
- Verify 72 seeded rows and 72 unique fixture IDs.
- Owner UI read/write and correction-history tests remain pending.
- Production release remains pending.

## Next actions
1. Verify seed counts and history.
2. Run GitHub CI/typecheck/build on feature PR.
3. Authenticated owner QA: normal result, correction, double no-show, and standings.
4. Request production-release approval after tests pass.
