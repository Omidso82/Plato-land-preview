# PLATO LAND – Series 2 Archive and Series 3 Public Home
## Change record v1.3 – 2026-11-20

**Project:** PLATO LAND – Temporary Projects  
**Supersedes:** v1.1  
**Status:** Proposed via PR for review and deployment.

## 1. Change

The user clarified that the card must remain on the same Series 3 public page where it currently appears. Move the existing `آرشیو مسابقات سری دوم` card from the top area of `Series3Gallery` to the bottom of that same page, after the Series 3 public dashboard/competition summary. Do not move it into the Series 2 archive page. Preserve its title, subtitle, style, and `/?page=series2-archive` destination.
Production verification after v1.0 showed the root page correctly rendered Series 3 and the management URL remained accessible, but the direct clean path `/series2-archive/` returned a 404 at the hosting layer.

To provide a reliable public archive entry on the existing static host:
- Keep the direct `/series2-archive` application route.
- Also support `/?page=series2-archive` through the root SPA entry.
- Point the Series 3 home archive link to the root query route.
- Preserve the archive's return link to the Series 3 home.

## 2. Preserved scope
The card remains rendered by `Series3Gallery` and is moved below `Series3PublicDashboard`. `Series2Registration` and the Series 2 archive page are unchanged.
No tournament records, predictions, results, images, Supabase schema, Edge Functions, or Main Website features are changed.

## 3. Verification
After merge and deployment, verify the archive card remains on the Series 3 public page but appears at the bottom, below the tournament dashboard/summary; verify the Series 2 archive page is unchanged.


After merge and deployment, verify:
1. `https://platoland.org/` shows Series 3.
2. `https://platoland.org/?page=series2-archive` shows the Series 2 archive.
3. Archive navigation returns to Series 3.
4. `https://platoland.org/series2-slides-manager/` remains accessible.
