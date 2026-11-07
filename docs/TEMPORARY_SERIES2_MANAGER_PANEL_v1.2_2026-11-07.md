# PLATO LAND – Temporary Projects
## Series 2 Temporary Manager Panel – Reduced UI
**Version:** v1.2  
**Date:** 2026-11-07  
**Scope:** `/series2-slides-manager` only

### Confirmed user decision
The temporary Series 2 manager panel should currently show only:
1. The homepage/competition poster uploader (the stable `poster/series2-prize-poster` object).
2. The private Series 2 champion prediction report.

### Change implemented in source
- Added `SHOW_SLIDE_EDITOR = false` in `src/Series2SlidesManager.tsx`.
- The 18-slot slide editor is conditionally hidden.
- Slide editor source code, upload logic, bucket objects, and stored slide images are retained for possible later reactivation.
- The owner sign-in and owner-role gate remain unchanged.
- The poster upload remains available and continues to use the existing storage object/path.
- The prediction report remains visible and unchanged, including its 10-second refresh and manual refresh.
- The panel heading and poster label now describe the reduced purpose.

### Explicitly not changed
- No database schema, table, row, vote, registration, tournament progression, or result data was modified.
- No storage object was deleted or overwritten as part of this UI change.
- No shared tournament-management tools or main-site public pages were changed.
- No paid service or additional cost was introduced.

### Verification status
- Source update committed to branch `temporary/series2-slim-manager-panel`.
- Production deployment has **not** yet been verified; this document records the proposed source change, not a claim of live deployment.
- After PR checks and merge, verify the panel visually at:
  `https://platoland.org/series2-slides-manager`
- Expected visible sections after deployment: homepage image uploader and champion prediction report only.

### Reactivation
To restore the 18-slot slide editor later, set `SHOW_SLIDE_EDITOR` to `true` in `src/Series2SlidesManager.tsx`. Stored images and existing upload code are retained.

### Version history
| Version | Date | Notes |
|---|---|---|
| v1.2 | 2026-11-07 | Temporarily hide the 18-slide editor; keep homepage image upload and prediction report visible. |
