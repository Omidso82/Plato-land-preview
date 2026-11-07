# PLATO LAND – Temporary Projects
## Series 2 Group Standings — Table Clarity Update v1.7

**Date:** 2026-11-07  
**Scope:** Public Series 2 group standings only.  
**Status:** Implemented on feature branch; validation and deployment pending.

### User-requested changes
1. Display both **sets won** and **sets lost** so players can independently verify set difference.
2. Replace the repeated competition-rank number with a sequential row number: 1, 2, 3, 4. The column is labeled «ردیف».
3. Show the number of **completed matches only**. A scheduled fixture with null score/winner must not count as a played match.

### Implementation
- Table columns are now: row, Plato ID, completed matches, wins, points, sets won, sets lost, set difference.
- Sequential row number uses the displayed row index, while the underlying tie-break rank remains available for qualification logic.
- A result counts only if:
  - winner is present and matches one of the two fixture players;
  - both scores are present;
  - both scores can be interpreted as integers.
- Null-score scheduled fixtures are excluded from games played, wins, points, sets won and sets lost.
- Set difference remains sets won minus sets lost.
- Mobile table uses horizontal scrolling to preserve all eight columns without shrinking text excessively.

### Existing approved tie-break order retained
1. Points (3 per win).
2. Set difference.
3. Sets won.
4. Head-to-head result.

### Data safety
- No Supabase data was written or changed.
- No fixtures, match results, registrations, groups, schema, migration, RLS policy or Edge Function were modified.
- The table continues to read the public Series 2 progression endpoint.
- No changes to the separate Main Website project.

### Files changed
- `src/Series2Registration.tsx`
- `src/Series2Registration.css`

### Validation
Pending:
- TypeScript check and production build.
- Live browser review of Group C and a group with no completed fixtures.
- Confirm the unplayed players show 0 completed matches and 0 sets won/lost.
- Confirm the table displays row numbers 1–4 and both set columns.

### Version history
- v1.7 — 2026-11-07: Added sets lost, sequential row numbering and stricter completed-match validation.
