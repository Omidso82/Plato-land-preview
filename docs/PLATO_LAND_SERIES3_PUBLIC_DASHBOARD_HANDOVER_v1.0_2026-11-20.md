# PLATO LAND – Series 3 Public Dashboard Handover
**Version:** 1.7  
**Date:** 2026-11-20  
**Scope:** PLATO LAND – Temporary Projects / Series 3 only

## 1. Goal and confirmed decisions
- Integrate the public tournament dashboard into the existing Series 3 gallery page; no separate site or route.
- Treat all 48 competitors as one roster.
- Preserve the saved draw: 12 groups A–L, four players per group.
- Display ranking, four seeding pots, group standings, all 72 fixtures and their real statuses/scores, and the saved knockout bracket.
- Display a third-place match between the losers of SF-1 and SF-2 alongside the final. Until semifinal results exist, show placeholders; never invent player names or scores.
- Preserve the existing shared header and approved page sections; mobile-first Persian RTL, dark/gold styling.

## 2. Repository changes
Repository: `Omidso82/Plato-land-preview`  
Base: `main`  
Working branch: `feature/series3-public-dashboard`  
Pull request: [#234 – Add public Series 3 tournament dashboard](https://github.com/Omidso82/Plato-land-preview/pull/234)

Files:
- `src/Series3PublicDashboard.tsx` — new public dashboard UI and read logic.
- `src/Series3Gallery.tsx` — integrates the dashboard into the existing public Series 3 page.
- `supabase/migrations/20261120090000_series3_public_read_model.sql` — additive public projection migration.

No change to `main`, no merge, and no production deployment has been performed.

## 3. Database
Main Supabase project: `dfrppbapaaydbjeflozw`.

Migration applied successfully: `series3_public_read_model`.

Three read-only public projection tables:
- `plato_land_series3_public_draw`
- `plato_land_series3_public_fixtures`
- `plato_land_series3_public_bracket`

The source tables retain their existing owner-only access. Public projection contains only Plato IDs, tournament stats, fixtures/results, and draw/bracket snapshots. Registration UUIDs and registration-status labels are stripped from ranking, pot, and group JSON. History and manager metadata are not exposed.

Sync triggers maintain the public projection when the saved draw, group result rows, or knockout bracket are inserted/updated. Trigger functions use a fixed empty search path and have EXECUTE revoked from public, anon, and authenticated roles. Public projection tables have RLS enabled with SELECT-only policies for the Series 3 event.

## 4. Data verification after migration
- Public ranking snapshot: 48 players.
- Public group snapshot: 12 groups.
- Public fixture projection: 72 fixtures.
- Public bracket: 16 round-of-32 matches, 8 round-of-16 matches, 4 quarterfinals, 2 semifinals, 1 final.
- Existing group results at verification: 0 confirmed, 72 pending.
- Existing bracket snapshot does not contain a third-place key. The public UI therefore displays the third-place fixture as the two semifinal losers, with no invented identities or result.
- Anonymous role can read the public projection.
- Anonymous direct read of `plato_land_series3_registration_requests` is denied (permission denied).

## 5. Security review
Supabase security advisor run after migration. No new finding was reported for the three sync functions because EXECUTE is revoked from public-facing roles. Existing unrelated project-wide security findings remain outside this task and were not changed.

Performance advisor returned existing project-wide findings (mostly unindexed foreign keys and unused indexes). No unrelated index or table changes were made.

## 6. Validation status
- Database migration: applied successfully.
- Public projection backfill: verified at the counts above.
- Anonymous read test: verified for public draw, fixture and bracket projections.
- Private registration table denial: verified.
- GitHub PR: open, not merged.
- GitHub Actions workflow/status checks: no run/status reported for the inspected commits at the time of handover.
- Local TypeScript/build verification: not run; network access from the execution environment could not reach GitHub to clone the branch.

## 7. Not done / outstanding
1. Run `npm run typecheck` and `npm run build` in GitHub Actions or another trusted build environment; fix any failures.
2. Review the PR diff and visual layout on iPhone-sized viewport.
3. Confirm public page fetches the projections from the live browser session.
4. Decide/implement the result-entry mechanism for the third-place match if the tournament requires that result to be entered and saved through the admin panel. Current public display is a placeholder matchup only; it does not create or persist a third-place result.
5. Merge PR #234 only after review/approval, then separately verify the production deployment on `https://platoland.org`.

## 8. Protected state
- No edits to the saved Series 3 group draw, ranking snapshot, 72 fixtures, saved knockout draw, or recorded results.
- No changes to the main website project scope or shared header.
- No deletion of historical or temporary event data.

## 9. Change log — v1.1 (2026-11-20)
- Removed the top summary statistic card `نتیجه ثبت‌شده` from the public Series 3 dashboard. This statistic was considered administration-oriented and is no longer shown in the public top summary row.
- The public top row now shows only `کل بازی‌های گروهی` and `در انتظار`.
- The completed-result count remains available in the separate `وضعیت مسابقات` section within the public overview; this change does not remove result data or alter admin result-entry/reporting tools.
- Changed files: `src/Series3PublicDashboard.tsx` and this handover document. No database, migration, draw, fixture, score, bracket, or admin-panel changes.
- Implementation commit on working branch: `40c9b047f0526996738ec37e847b548545cb18d0`.

## 10. Change log — v1.2 (2026-11-20)
- Removed both top summary statistic cards from the public Series 3 dashboard: `کل بازی‌های گروهی` and `در انتظار`.
- The dashboard header, group count badge, navigation, overview status section, group standings, fixtures, ranking, and knockout bracket remain unchanged.
- The `وضعیت مسابقات` section still displays detailed result status; no match/result data was deleted.
- Changed file: `src/Series3PublicDashboard.tsx` and this handover document only. No database, migration, draw, fixture, score, bracket, or admin-panel changes.
- Implementation commit: `15a094ccb41d9676f4f16560019a064f8c136a96`.

## 11. Change log — v1.3 (2026-11-20)
- Removed the public overview card `وضعیت مسابقات`, including the aggregate counts for recorded results, pending matches, and double no-shows.
- Removed the duplicate standalone aggregate double-no-show count line near the dashboard heading.
- Actual match-level results and status remain available in the fixtures/results views; no match data was deleted or changed.
- Changed file: `src/Series3PublicDashboard.tsx` and this handover document only. No database, migrations, draw, fixture, score, bracket, admin-panel, or Main Website changes.
- Implementation commit on working branch: `f453dbec44271fd6f6df8cbf94b407a52e15441a`.

## 12. Change log — v1.4 (2026-11-20)
- Simplified the public group accordion labels to show only `گروه A`, `گروه B`, etc. Removed the appended player-count text from each label.
- Player tables and all group/player data remain unchanged.
- Changed file: `src/Series3PublicDashboard.tsx` and this handover document only. No database, fixtures, scores, draw, admin-panel, or Main Website changes.
- Implementation commit on working branch: `b88cde5dc6a36e7bd63f388935a9334e64534ec7`.

## 13. Change log — v1.5 (2026-11-20)
- Renamed the public knockout bracket stage label for the 32-player opening round from `دور ۳۲ نفره` to `یک شانزدهم نهایی`, as requested. This label now matches the Persian tournament-stage terminology.
- The bracket key/data remains `round32` internally; only the public display label changed. No bracket positions, matches, results, or qualification data changed.
- Changed file: `src/Series3PublicDashboard.tsx` and this handover document only. No database, fixtures, scores, draw, admin-panel, or Main Website changes.
- Implementation commit on working branch: `173e28d9d70676992676768522dbe22ad0eda751`.

## 14. Change log — v1.6 (2026-11-20)
- Removed the retired Series 3 registration promotional card (`series3-home-cta`) from the Main Website home page. This removes only the home-page promotional card; the dedicated Series 3 pages and historical registration data remain unchanged.
- Reordered the public competition summary so `مسابقه رده‌بندی` appears immediately before `فینال`, leaving the final as the last stage in the summary.
- Changed files: `src/App.tsx`, `src/Series3PublicDashboard.tsx`, and this handover document. No database, registration records, bracket data, fixtures, scores, admin-panel, or other Main Website features changed.

## 15. Change log — v1.7 (2026-11-20)
- Removed the actual public Series 3 gallery card linking to `/series3-registration`, labeled `مشاهده قوانین و ثبت‌نام سری سوم`. The earlier homepage promotional-card change did not target this gallery card; this entry records the exact remaining card removal.
- The dedicated registration route `/series3-registration` and its historical registration/waitlist records remain intact and are not deleted. Only the public card/entry point is removed.
- Changed file: `src/Series3Gallery.tsx` and this handover document only. No database, registration data, tournament results, bracket, admin-panel, or Main Website features changed.

## 16. Current status
**Implementation is in an open PR and its additive database read model is active on the main Supabase project. The public dashboard is not yet live on the production website.**
