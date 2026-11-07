# PLATO LAND – Temporary Projects
## Series 2 Group Standings — Table Clarity Update v1.7

**Date:** 2026-11-07  
**Scope:** Public Series 2 group standings only.  
**Status:** Merged to main and verified on the live public site.

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

### Validation — completed
- GitHub Actions typecheck: passed.
- Production build: passed.
- Main merge: PR #93 merged; merge commit `0d4ff6dfb8dc306e2613880c51d18637a8ad4ca6`.
- Main-branch deployment workflow: completed successfully.
- Live browser verification on the public site: passed.
- Group C verified live:
  - V86: 1 completed match, 5 sets won, 2 sets lost, +3 difference, 3 points.
  - P0uri4: 0 completed matches, 0 sets won/lost.
  - M47B: 0 completed matches, 0 sets won/lost.
  - jasijan49: 1 completed match, 2 sets won, 5 sets lost, −3 difference.
- The public table headers and row numbers 1–4 were confirmed exactly as requested.
- No page errors were observed during live review.

### Version history
- v1.7 — 2026-11-07: Added sets lost, sequential row numbering and stricter completed-match validation.
