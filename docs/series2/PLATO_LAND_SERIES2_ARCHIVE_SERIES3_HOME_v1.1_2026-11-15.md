# PLATO LAND – Series 2 Archive and Series 3 Public Home
## Change record v1.2 – 2026-11-20

**Project:** PLATO LAND – Temporary Projects  
**Supersedes:** v1.1  
**Status:** Proposed via PR for review and deployment.

## 1. Change

The Series 2 archive entry card was previously placed on the Series 3 public gallery. Per the user's request, move this exact card to the bottom of the Series 2 archive page, after the tournament summary content. Remove it from the Series 3 gallery. Keep its title, description, styling, and `/?page=series2-archive` destination unchanged.
Production verification after v1.0 showed the root page correctly rendered Series 3 and the management URL remained accessible, but the direct clean path `/series2-archive/` returned a 404 at the hosting layer.

To provide a reliable public archive entry on the existing static host:
- Keep the direct `/series2-archive` application route.
- Also support `/?page=series2-archive` through the root SPA entry.
- Point the Series 3 home archive link to the root query route.
- Preserve the archive's return link to the Series 3 home.

## 2. Preserved scope
The card is rendered only when `Series2Archive` uses `Series2Registration` with `showArchiveHeader=true`. The archive route and all Series 2 records remain unchanged.
No tournament records, predictions, results, images, Supabase schema, Edge Functions, or Main Website features are changed.

## 3. Verification
After merge and deployment, verify the archive card is absent from the Series 3 gallery and appears at the bottom of the Series 2 archive page, below the summary content.


After merge and deployment, verify:
1. `https://platoland.org/` shows Series 3.
2. `https://platoland.org/?page=series2-archive` shows the Series 2 archive.
3. Archive navigation returns to Series 3.
4. `https://platoland.org/series2-slides-manager/` remains accessible.
