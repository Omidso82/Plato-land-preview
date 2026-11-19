# PLATO LAND – Temporary Projects
## Series 3 Knockout Bracket & Draw – Handover
**Version:** 1.1  
**Date:** 2026-11-19  
**Status:** Primary database migration applied; implementation on feature branch; PR/release pending

### 1. Scope
This handover applies only to Series 3 in PLATO LAND – Temporary Projects. It does not authorize or describe changes to PLATO LAND – Main Website, Series 2, or other events.

### 2. Confirmed tournament roster
- 48 final active players participate as one unified roster.
- The former 32-main / 16-waitlist distinction is historical registration metadata only. It has no tournament ranking, seeding, qualification, or bracket priority.
- 11 withdrawn registrations are excluded completely from all tournament calculations and displays.
- Read-only primary database verification on 2026-11-19 returned 48 active players, 11 withdrawn registrations, one saved group draw, and 12 groups in that saved draw.

### 3. Existing group draw – immutable
The existing row in `public.plato_land_series3_seeding_draws` remains unchanged:
- event_key: `series3`
- 48-player ranking snapshot
- 4 seeding pots
- 12 saved groups
No reroll, update, replacement, or mutation of this draw was performed.

### 4. Approved knockout format
- 12 groups × 4 players.
- First and second place in each group qualify directly: 24 players.
- Eight best third-place players qualify: total 32.
- Round of 32: 16 matches.
- Round of 16: 8 matches.
- Quarterfinals: 4 matches.
- Semifinals: 2 matches.
- Final: semifinal winners.
- Third-place playoff: semifinal losers.

Best-third ranking criteria, in order:
1. More points.
2. Better set difference.
3. More sets won.
4. Head-to-head winner.

### 5. Draw constraints
- Bracket positions are randomized.
- No two players from the same group may meet in the Round of 32.
- No FIFA seeding pots, confederation restrictions, or additional constraints are introduced.
- The eight best-third entrants remain placeholders until their identities and origin groups are known.
- The constrained randomized pairing helper is present in the feature source. No actual knockout draw has been run.
- A final draw must be persisted once, and refresh/collapse must never reroll it.

### 6. Implementation
- Repository: `Omidso82/Plato-land-preview`
- Base main commit: `66d0447b44d0f2506aada050d4964a974d5b8054`
- Feature branch: `feature/series3-knockout-bracket`
- Existing component: `src/Series3SeedingManager.tsx`
- The bracket card is collapsible and mobile-oriented. It displays qualification counts, eight third-place placeholders, 16 Round-of-32 match slots, and the progression through the final and third-place playoff.
- The existing 48-player query still includes only `main` and `waitlist` registration statuses, which together are the unified final roster; `withdrawn` remains excluded. No main/waitlist distinction is shown in ranking or statistics UI.
- No group match fixtures, dates, schedules, or result-entry workflow were added.

### 7. Database migration – primary Supabase
Primary project: `dfrppbapaaydbjeflozw` (PostgreSQL 17.11, EU West).

Applied migration:
- Version: `20261119224228`
- Name: `series3_persistent_knockout_draw`
- Table: `public.plato_land_series3_knockout_draws`

Security:
- RLS enabled.
- Owner-only SELECT and INSERT using existing `private.has_role(ARRAY['owner','مالک کل'])`.
- No UPDATE or DELETE privilege granted.
- Unique event key prevents a second draw record for Series 3.
- The group-draw table was not changed.
- Post-migration readback confirmed the table exists, RLS is enabled, exactly two owner policies exist, authenticated has SELECT/INSERT only, and no knockout draw row exists yet.

### 8. Important outstanding dependency
The primary database currently has no Series 3 group-match results/standings table. Therefore the system cannot yet calculate points, set difference, sets won, head-to-head, or automatically identify the eight best-third qualifiers. This work intentionally does not create a match-results system or fabricate results.
Before the future draw is enabled, verify that the new public table is exposed through the Supabase Data API; Supabase's October 30, 2026 change means new public tables are not automatically exposed by default on all projects.

### 9. Verification and release boundary
- Database migration application: SUCCESS.
- Read-only roster/draw verification: 48 active, 11 withdrawn, 1 saved group draw, 12 groups, 0 knockout draws.
- RLS/table privilege readback: SUCCESS.
- Supabase Security Advisor: the new knockout table was not listed among the findings. Existing unrelated project findings remain; no unrelated security changes were made.
- GitHub feature branch source commit: `8682ca0267cd37b01620c8c0ef9fbf04599766f5`.
- CI/build, pull request, production deployment, and iPhone Safari visual QA: pending.
- No PR has been merged and no production frontend release has been performed.

### 10. Next steps
1. Add the matching migration file and this handover to the feature branch.
2. Run GitHub verification/build and inspect the diff.
3. Open a draft PR for review; do not merge or deploy without release approval.
4. After frontend release, owner checks the same existing admin panel on iPhone.
5. Later, once authoritative group results exist, implement best-third calculation, constrained random draw execution, and one-time persisted bracket snapshot.
