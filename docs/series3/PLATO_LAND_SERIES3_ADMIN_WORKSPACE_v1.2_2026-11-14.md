# PLATO LAND – Series 3 Admin Workspace

**Version:** v1.2  
**Date:** 2026-11-14  
**Status:** Registration report collapse control implemented on feature branch; awaiting merge and deployed verification

## Change
The Series 3 registration report is now a separate collapsible card, matching the compact interaction pattern used by the Series 3 player stats and seeding card.

- The report is collapsed by default.
- The card header remains visible and shows the registration count and report state.
- The owner can open the report to see the existing registration table.
- The existing refresh action remains inside the expanded report.
- Registration query, fields, sorting, date formatting, and displayed records are unchanged.
- No database schema or registration data is changed by this UI-only adjustment.

## Scope
Only `src/Series3RegistrationReport.tsx` is changed. The Series 3 slides panel, manual stats/seeding card, Series 2 tools, Main Website, and Supabase schema are untouched.

## Verification
- Branch: `feature/series3-registration-report-collapse-20261114`.
- Code review by source inspection: existing report query and table retained; collapse state defaults to closed.
- Build/CI and live owner-view verification remain pending until merge and deployment.
