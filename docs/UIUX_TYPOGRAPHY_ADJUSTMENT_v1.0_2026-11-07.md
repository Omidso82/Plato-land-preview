# PLATO LAND Main Website — Typography Adjustment v1.0

**Date:** 2026-11-07  
**Scope:** Main Website only  
**Status:** Implemented on review branch; automated checks passed; production not deployed.

## Purpose
Increase text readability by one small step across the existing Main Website pages, following the owner's request to make the current typography slightly larger without disturbing the layout.

## Approved scope and safeguards
- Increase each existing non-zero `font-size` value by **1px**.
- Preserve the existing typography hierarchy, media-query breakpoints, and rule order.
- Scope every override under `.app-shell`.
- Keep the separate temporary Series 2 registration/prediction pages outside this change.
- Do not modify database schemas/data, authentication, tournament registration, prediction logic, or other application behavior.

## Files changed
1. `src/typography-overrides.css` — scoped typography overrides generated from the existing font-size declarations; responsive media contexts and cascade order preserved.
2. `src/index.tsx` — load the new stylesheet after existing stylesheets.

## Verification
- GitHub Actions **Build and typecheck**: success (run #559).
- GitHub Actions **Deploy PLATO LAND website** PR build/upload job: success (run #309).
- The Pages workflow's production deployment job is restricted to pushes on `main`; this pull request did not deploy to Production.
- Manual visual review on mobile/desktop and owner acceptance: pending.
- No live Preview URL was confirmed for this review branch.

## Git / review
- Repository: `Omidso82/Plato-land-preview`
- Base commit: `441910a3b55b7d42a9233470fa2ee47fd67d2655`
- Review branch: `uiux/global-typography-step-up`
- Latest branch commit: `4756fd1970faf724b00b5fa7d2253ad6b09309a8`
- Pull request: #84 — Increase typography one step across the main website
- PR URL: https://github.com/Omidso82/Plato-land-preview/pull/84

## Remaining steps
1. Obtain a visual preview and inspect key mobile and desktop pages for wrapping, clipping, and button/menu fit.
2. Obtain owner acceptance.
3. Merge to `main) only after acceptance; merge may trigger Production deployment.
4. Verify the live site after deployment and record the result in the next revision.
