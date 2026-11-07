# PLATO LAND – Temporary Projects
## Series 2 Double No-Show Handling
**Version:** v1.0  
**Date:** 2026-11-07  
**Status:** Initial decision and implementation plan; superseded by v1.1.

### Confirmed user decision
For the Group G Saturday fixture between `ariz_1994` and `AhmadAhmad39`, both players were absent:
- Keep score1, score2 and winner empty (null).
- Count exactly one match for each player's games-played statistic.
- Add no win, loss, league points, sets won/lost, or set difference.
- Preserve an audit history entry with timestamp and both player IDs.

### Initial implementation plan
- Add an owner-only action in the temporary Series 2 results manager.
- Add a guarded Edge Function action to record the double no-show without a score or winner.
- Count the fixture once for each player's games-played statistic only.
- Display the no-show status in the manager and public fixture list.

### Target fixture
- Fixture ID: `G-D1-1`
- Group: G
- Day: Saturday (day one)
- Player 1: `ariz_1994`
- Player 2: `AhmadAhmad39`

### Version history
- v1.0 — 2026-11-07: User-approved policy and initial implementation plan.
- v1.1 — 2026-11-07: See `SERIES2_DOUBLE_NO_SHOW_v1.1_2026-11-07.md` for merged implementation, deployment and live verification.
