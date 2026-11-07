# PLATO LAND – Temporary Projects
## Series 2 Double No-Show Handling
**Version:** v1.0  
**Date:** 2026-11-07  
**Status:** Implementation prepared in PR #101; deployment and live data write pending verification.

### Confirmed user decision
For the Group G Saturday fixture between `ariz_1994` and `AhmadAhmad39`, both players were absent. Record the fixture as a double no-show:
- Keep score1, score2 and winner empty (null).
- Count exactly one played/considered match for each player.
- Add no win, loss, league points, sets won/lost, or set difference.
- Preserve an audit history entry with timestamp and both player IDs.

### Implementation scope
- Owner-only action in the temporary Series 2 results manager.
- Edge Function action `mark_double_no_show` validates owner role, fixture ID and expected updated_at; refuses to overwrite a scored result; uses conditional update to avoid stale writes.
- Public group standings add one to games played for both players only.
- Owner manager and public fixture list show the explicit double-no-show status.
- Existing scored results and other fixtures remain unchanged.

### Files changed in PR #101
- `src/Series2ResultsManager.tsx`
- `src/Series2Registration.tsx`
- `supabase/functions/plato-land-series2-progression/index.ts`

### Safety boundaries
- Main Website project is not in scope.
- No database schema/migration, roster, group, registration, bracket, prediction or player pre-tournament statistics changes.
- Only the existing Series 2 progression JSON fixture is intended to be updated.
- The live fixture write must occur only after code and deployment verification.

### Target fixture
- Fixture ID: `G-D1-1`
- Group: G
- Day: Saturday (day one)
- Player 1: `ariz_1994`
- Player 2: `AhmadAhmad39`
- Intended state: `result_status = double_no_show`; score1=null; score2=null; winner=null.

### Verification still required
1. GitHub Actions typecheck/build pass.
2. Merge and successful production deployment.
3. Deploy updated `plato-land-series2-progression` Edge Function.
4. Re-read the live fixture and confirm it is still unscored before writing.
5. Record the double no-show through the owner-authenticated action.
6. Re-read the saved fixture and group standings; verify both players have +1 games played and no other statistic changed.

### Change log
- v1.0 — 2026-11-07: User-approved double no-show policy and implementation record.
