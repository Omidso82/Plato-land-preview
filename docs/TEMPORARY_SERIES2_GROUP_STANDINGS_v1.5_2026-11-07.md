# PLATO LAND – Temporary Projects
## Series 2 Group Standings — Implementation Report v1.5

**Date:** 2026-11-07  
**Status:** Implemented on feature branch; awaiting CI and production verification.  
**Scope:** Temporary Series 2 public tournament page only.

### 1. User-confirmed ranking order
The group standings use this exact priority:
1. League points (3 points per match win).
2. Set difference.
3. Sets won.
4. Head-to-head result.

### 2. Calculation rules implemented
- A fixture counts as completed only when it has a winner and both scores are integers.
- Played matches, wins and losses are calculated from completed fixtures.
- League points = wins × 3.
- Sets won and sets lost are accumulated from each completed fixture's recorded score values for the relevant player.
- Set difference = accumulated sets won − accumulated sets lost.
- For a two-player tie after the first three criteria, the recorded direct match winner is placed higher.
- If a multi-player tie cannot be resolved by a single head-to-head result, the implementation displays a shared rank instead of inventing an extra tie-break rule.

**Interpretation note:** The current progression data stores each result as score1/score2 (for example 5–2). Those score values are used as the sets-won/sets-lost totals for the standings. No extra result fields or database schema changes were introduced.

### 3. Public page changes
- Added a visible **«جدول رده‌بندی گروه‌ها»** entry point to the public Series 2 roadmap.
- Added a dedicated **«جدول گروهی»** tab in the tournament viewer.
- Group selector is generated from the live progression data; no hard-coded A–H list is used for standings.
- The table shows rank, Plato ID, matches played, wins, league points, set difference and sets won.
- The top two ranks are visually highlighted as qualifiers.
- The page refreshes progression data every 15 seconds while open and displays the latest available update timestamp.
- Existing player pre-registration ranking and seeding views remain separate and unchanged.

### 4. Live data snapshot before implementation
Read-only query on `public.plato_land_series2_tournament_progression`, `tournament_key='series2'`:
- Groups: 8 (A–H)
- Players: 32 (4 per group)
- Group fixtures: 48
- Completed fixtures: 2
- `updated_at`: `2026-11-07 12:40:17.363+00`

The two recorded results visible in the snapshot were:
- Group C: V86 5–2 jasijan49.
- Group H: _negari_ 3–5 S93.

This snapshot is historical to the implementation review. The page reads the live endpoint and should reflect later owner-entered results automatically.

### 5. Files changed
- `src/Series2Registration.tsx`
- `src/Series2Registration.css`

No changes were made to:
- Supabase tables, migrations, RLS or Edge Functions.
- Existing tournament results, fixtures, groups or player registrations.
- The separate Main Website project outside this Series 2 public page.

### 6. Validation and release
- Repository: `Omidso82/Plato-land-preview`
- Base branch: `main`
- Working branch: `feature/series2-group-standings`
- Latest implementation commit: `dd25d71912fc14c1b6d54014b56f972f8c53bb81`
- Pull request and CI/deployment status: to be recorded after opening the PR and reviewing checks.
- No production merge or deployment is claimed in this version.

### 7. Remaining verification
1. GitHub Actions typecheck and build.
2. Review the public page on mobile and desktop after deployment.
3. Confirm the group selector, table columns, live refresh and two existing real results.
4. Confirm head-to-head ranking with actual eligible tied results if such a tie occurs.
5. If a three-or-more-player tie remains unresolved by the approved rule, retain shared rank pending an explicit additional rule.

### 8. Version history
- v1.5 — 2026-11-07: Added live public group standings, approved ranking order, 15-second progression refresh and mobile-first table styling.
