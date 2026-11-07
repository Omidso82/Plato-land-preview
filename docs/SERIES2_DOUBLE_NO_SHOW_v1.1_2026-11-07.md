# PLATO LAND – Temporary Projects
## Series 2 Double No-Show Handling
**Version:** v1.1  
**Date:** 2026-11-07  
**Status:** Implemented, recorded in the main Series 2 progression record, and verified on the live public page.

### Confirmed user decision
For the Group G Saturday fixture between `ariz_1994` and `AhmadAhmad39`, both players were absent:
- Keep score1, score2 and winner empty (null).
- Count exactly one match for each player's games-played statistic.
- Add no win, loss, league points, sets won/lost, or set difference.
- Preserve an audit history entry with timestamp and both player IDs.

### Implementation
- Added owner-only manager action `mark_double_no_show`.
- Edge Function validates owner role, fixture ID and expected `updated_at`; refuses to overwrite a scored result; uses conditional update to avoid stale writes.
- Public group standings count the no-show fixture once for each player and do not change any other statistic.
- Owner manager and public fixture list display the explicit double-no-show status.
- Existing scored results and all other fixtures remain unchanged.

### GitHub and deployment
- Repository: `Omidso82/Plato-land-preview`
- PR #101: https://github.com/Omidso82/Plato-land-preview/pull/101
- Merge commit: `57cb3137cf26834b8e72feec9148f47f4562c552`
- GitHub Actions typecheck: success.
- Production build: success.
- GitHub Pages deployment to `platoland.org`: success.
- Edge Function `plato-land-series2-progression`: ACTIVE, version 4, `verify_jwt=false` (function continues its own owner-role validation for POST actions).

### Live database record
- Project: `dfrppbapaaydbjeflozw` (main Supabase project).
- Table: `public.plato_land_series2_tournament_progression`
- Tournament key: `series2`
- Fixture ID: `G-D1-1`
- Group: G; day: Saturday.
- Player 1: `ariz_1994`
- Player 2: `AhmadAhmad39`
- `result_status = double_no_show`
- `score1 = null`, `score2 = null`, `winner = null`
- History entry timestamp: `2026-11-07T18:23:07.436996+00:00`
- The record was updated using an optimistic concurrency condition against the pre-write `updated_at` and exact fixture/player identities. No other fixture was included in the write.

### Verified standings effect
Read-only verification of Group G after the write:
| Plato ID | Games played | Wins | Losses | Points | Sets won | Sets lost | Set difference |
|---|---:|---:|---:|---:|---:|---:|---:|
| AhmadAhmad39 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| ariz_1994 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| lMll | 1 | 0 | 1 | 0 | 3 | 5 | -2 |
| Mitra2024__ | 1 | 1 | 0 | 3 | 5 | 3 | +2 |

The two absent players each have exactly one game counted and no result-related statistic added. The other two Group G players retain their recorded statistics.

### Live page verification
- Public roadmap loaded on `https://platoland.org`.
- The Saturday Group G fixture visibly displays:
  - `ariz_1994 VS AhmadAhmad39`
  - «عدم حضور هر دو بازیکن · بدون نتیجه و امتیاز»
- No visible page error was reported.
- The temporary manager route `https://platoland.org/series2-slides-manager` loaded its owner login page. The authenticated owner panel was not opened in this verification session; the no-show database record was saved through the guarded direct database update described above.

### Safety boundaries
- No Main Website project changes.
- No schema/migration, roster, group, registration, bracket, prediction data or player pre-tournament statistics changes.
- No other fixture result or status was changed.
- No paid service or additional infrastructure cost introduced.

### Version history
- v1.0 — 2026-11-07: User-approved double no-show policy and implementation prepared.
- v1.1 — 2026-11-07: PR #101 merged; typecheck/build/deployment succeeded; Edge Function v4 deployed; G-D1-1 recorded and live standings/public display verified.
