# PLATO LAND – Temporary Projects
## Series 2 Group Standings — Tie Display Refinement v1.6

**Date:** 2026-11-07  
**Scope:** Public Series 2 standings display only.

### Change
After PR #91 was merged and the live page was inspected, Group C showed P0uri4 and M47B tied at rank 2 because neither had a completed head-to-head result and their first three statistics were equal.

The previous visual treatment highlighted every row with rank 1 or 2. That could incorrectly suggest that both tied second-place players had already qualified.

### Refinement
- Highlight only qualification places that are unambiguously determined from the current standings.
- If two players are tied at rank 2 and the direct match is not yet completed, neither tied row is marked as a confirmed qualifier.
- If exactly two players remain tied after points, set difference and sets won, the direct result is applied once that fixture has a valid recorded result.
- If a multi-player tie remains unresolved by head-to-head, keep the shared rank and do not invent an extra tie-break.
- Updated the explanatory note to make pending head-to-head results clear.

### Data and safety
- No Supabase write, migration, schema change or result correction.
- No fixtures, groups, registrations or scores changed.
- The calculation continues to use the live public progression GET endpoint.

### Validation target
Re-check Group C on the public page: V86 should remain first; P0uri4 and M47B should share rank 2 without being falsely highlighted as confirmed qualifiers; jasijan49 remains below them based on set difference.

### Version history
- v1.6 — 2026-11-07: Refined qualification highlighting for unresolved ties discovered during live browser verification.
