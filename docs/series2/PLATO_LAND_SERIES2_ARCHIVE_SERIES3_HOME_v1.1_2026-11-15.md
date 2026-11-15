# PLATO LAND – Series 2 Archive and Series 3 Public Home
## Change record v1.1 – 2026-11-15

**Project:** PLATO LAND – Temporary Projects  
**Supersedes:** v1.0  
**Status:** Follow-up routing compatibility fix; proposed via PR, not yet merged.

## 1. Change
Production verification after v1.0 showed the root page correctly rendered Series 3 and the management URL remained accessible, but the direct clean path `/series2-archive/` returned a 404 at the hosting layer.

To provide a reliable public archive entry on the existing static host:
- Keep the direct `/series2-archive` application route.
- Also support `/?page=series2-archive` through the root SPA entry.
- Point the Series 3 home archive link to the root query route.
- Preserve the archive's return link to the Series 3 home.

## 2. Preserved scope
No tournament records, predictions, results, images, Supabase schema, Edge Functions, or Main Website features are changed.

## 3. Verification
After merge and deployment, verify:
1. `https://platoland.org/` shows Series 3.
2. `https://platoland.org/?page=series2-archive` shows the Series 2 archive.
3. Archive navigation returns to Series 3.
4. `https://platoland.org/series2-slides-manager/` remains accessible.
