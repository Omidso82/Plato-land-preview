# PLATO LAND – Series 3 Tournament Progression Display Template

**Version:** 0.1  
**Date:** 2026-11-15  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Implemented on feature branch; draft PR awaiting checks/review; not deployed.

## 1. Approved purpose
Prepare the Series 3 public page with the same tournament-journey concepts used for Series 2: seeding/pots, group draw, group standings, match schedule, and knockout progression through round of 16, quarter-finals, semi-finals, third-place match, and final.

## 2. Display behavior in v0.1
- A dedicated Series 3 progression section is rendered on the existing Series 3 gallery page.
- Sections are separated into:
  - Seeding and pots
  - Draw and groups
  - Group standings
  - Match schedule
  - Knockout rounds
- Group standings and schedule have empty table layouts.
- Knockout round selector includes round16, quarter, semi, third_place, and final.
- Each section explicitly displays an empty state until Series 3 data is officially entered.
- No placeholder players, group names, fixtures, scores, winners, seeding ranks, or draw results are fabricated.

## 3. Data isolation and technical boundaries
- No Series 2 data or identifiers are copied into Series 3.
- No Series 2 progression Edge Function is called by the new Series 3 component.
- No Supabase table, schema, migration, RPC, Edge Function, Storage object, or existing record was changed.
- No PLATO LAND – Main Website feature was changed.
- This release does not implement the data-entry backend or seeding/draw algorithms; it establishes the public display shell only. Those operations must be connected to Series 3-specific data and approved rules before use.

## 4. GitHub implementation
- Repository: `Omidso82/Plato-land-preview`
- Base branch: `main`
- Feature branch: `feature/series3-progression-template`
- Pull request: #181 (Draft)
- PR URL: https://github.com/Omidso82/Plato-land-preview/pull/181
- Head commit: `7b5f46292db185934cd3c2a569f01ca5f06cea30`
- Files changed:
  - `src/Series3TournamentProgression.tsx` (new)
  - `src/Series3Gallery.tsx` (render new template)

## 5. Verification and release status
- GitHub Actions Build and typecheck run: 43736554472 — in progress at report time.
- GitHub Actions Deploy PLATO LAND website run: 43736554442 — in progress at report time.
- No successful deployment is claimed.
- PR remains draft and unmerged; production `main` and live site are unchanged by this feature branch.

## 6. Next steps
1. Confirm Build and typecheck workflow result.
2. Review the draft PR and mobile display.
3. Obtain explicit approval before merging or production deployment.
4. Later, implement Series 3-specific seeding/draw/group/bracket data operations only after the tournament rules and data model are confirmed.
5. Do not populate the display with Series 2 data or sample tournament results.

## 7. Version history
- v0.1 (2026-11-15): Adds the empty Series 3 public progression display template and records its isolation/release boundary.
