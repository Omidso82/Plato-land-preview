# PLATO LAND – Series 3: Third-Place Qualification and Double No-Show Closure

**Version:** 1.0  
**Date:** 2026-11-23  
**Project:** PLATO LAND – Temporary Projects  
**Event:** Series 3  
**Status:** Prepared on review branch; deployment pending checks and release approval.

## Confirmed incident

The owner reports that all Series 3 group fixtures are finished, but the official eight best third-place players are not being assigned to the fixed Round-of-32 bracket slots.

Read-only inspection of the primary Supabase project `dfrppbapaaydbjeflozw` on 2026-11-23 found 72 group results: 70 `completed`, two `double_no_show`, and zero `pending`. The closed no-shows are S3-C-R2-M1 (group C) and S3-I-R3-M1 (group I); both have null scores.

## Root causes

1. The auto-assignment gate in `src/Series3GroupResultsManager.tsx` required all 72 fixtures to have `completed` status and numeric scores. Official `double_no_show` closures were incorrectly treated as unfinished.
2. `resolveSeries3ThirdPlaces` in `src/series3ThirdPlaceQualification.ts` rejected every non-`completed` fixture and unconditionally added numeric sets for each row.

## Implemented fix

- Recognize an official `double_no_show` with both scores null as a closed fixture.
- Count it as a scheduled/closed game for the fixture completeness check, but award **no win, no points and no sets** to either player, consistent with the existing Series 3 group results manager.
- Continue rejecting pending fixtures, malformed completed scores, or non-null scores on a `double_no_show`.
- Preserve the existing third-place ranking criteria, group head-to-head tie handling, 8th/9th playoff requirement, and owner-review stops for unresolved ties.
- Preserve the official bracket, group results, player IDs, historical records, and prediction data. No database writes or migrations were made as part of this PR.

## Release and verification

The change must pass repository Build/Verify checks and then be merged/released under owner authorization. Following production deployment, refresh the existing Series 3 temporary admin panel. If the resolver returns `ready`, the existing authorized RPC assigns the eight official third-place qualifiers; if a playoff or owner review is needed, it must stop with an explicit message rather than invent qualifiers.

No automatic assignment or publication is claimed in this document before live verification.

## Files

- `src/Series3GroupResultsManager.tsx`
- `src/series3ThirdPlaceQualification.ts`
- This handover file.
