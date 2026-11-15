# PLATO LAND – Series 2 Archive and Series 3 Public Home
## Change record v1.0 – 2026-11-15

**Project:** PLATO LAND – Temporary Projects  
**Repository:** `Omidso82/Plato-land-preview`  
**Target branch:** `main` (proposed via PR; not yet merged/deployed)

## 1. Owner instruction
The owner confirmed that Series 2 has concluded and requested:
- Move the public Series 2 page to an archive.
- Make Series 3 the first/public landing page at `/`.
- Preserve Series 2 history, results, predictions, images, and existing management tools.
- Keep the existing temporary management panel and do not alter PLATO LAND – Main Website.

This instruction supersedes the prior Temporary Pages Retirement v1.2 rule that kept Series 2 at the root public path.

## 2. Routing plan implemented on feature branch
- `/` renders the Series 3 public page.
- `/series3` remains available as an alias for the Series 3 public page.
- `/series2-archive/` renders the existing Series 2 public results/history page inside an archive wrapper.
- The Series 3 landing page links to the Series 2 archive.
- The Series 2 archive links back to the Series 3 home.
- `/series2-slides-manager/` remains the existing temporary management panel.
- Existing retired standalone routes continue to redirect to the root page.

## 3. Preservation and scope
- No Series 2 database records, predictions, match results, progression, or Storage objects are modified.
- No Series 3 registration, waitlist, stats, or tournament data are modified.
- No management component is deleted.
- No database migration or Edge Function change is included.
- No PLATO LAND – Main Website files or database are changed.
- Existing Series 2 prediction UI is governed by its existing server-side open/closed status; this change does not reopen it.

## 4. Files
- `src/index.tsx`: route root to Series 3; add `/series2-archive`.
- `src/Series3Home.tsx`: Series 3 public home wrapper with archive link.
- `src/Series2Archive.tsx`: archive header/navigation wrapper around the existing Series 2 public page.

## 5. Verification boundary
This change is on feature branch `feature/series3-home-series2-archive`. It is not production until the PR is merged and the production deployment plus live URLs are verified.
Required checks:
1. Build and TypeScript verification.
2. Confirm root displays Series 3.
3. Confirm Series 2 archive displays historical Series 2 content and links back.
4. Confirm existing management URL still loads.
5. Confirm no Series 2 or Series 3 data was changed.

## 6. Version history
- v1.0 (2026-11-15): records the owner-approved transition from Series 2 public home to Series 3 public home, with Series 2 retained as an archive.
