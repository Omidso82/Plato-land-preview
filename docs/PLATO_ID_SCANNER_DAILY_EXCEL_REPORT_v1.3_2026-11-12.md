# PLATO ID Scanner — Weekly and Monthly Excel Activity Matrix

**Document version:** 1.3  
**Date:** 2026-11-12  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Status:** Implemented on the isolated feature branch; CI passed for commit fcdaeca77c85d685d83dcf3874c55ba51592958b; PR remains Draft/unmerged; not deployed.

## 1. Confirmed reporting decisions

All prior approved report rules remain in force:
- Telegram text remains grouped by Tehran-local upload day.
- Only the latest human-approved revision per image is used.
- Plato ID strings are preserved exactly.
- Exact duplicates are deduplicated within each day; the same ID remains represented on different days.
- Report preview and sending remain manual; Excel remains optional.
- Delivery remains restricted to the existing Telegram test group.
- No automatic delivery, main Telegram destination, main website change, or schema migration is introduced by this update.

## 2. Excel workbook structure

The optional real XLSX workbook contains:
1. **خلاصه** — report range and a concise summary.
2. **One worksheet per Saturday–Friday week** intersecting the selected report range.
3. **One worksheet per Persian (Jalali) calendar month** intersecting the selected report range.

### Weekly worksheet
- First column: exact Plato ID.
- Next seven columns: Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday.
- Each day column is labelled with its Persian weekday and Jalali day number.
- A star (★) is placed only when that ID was present in approved activity for that Tehran-local day.
- Each ID appears once per weekly sheet, even if active on several days.
- The same ID can appear again in another week.

### Monthly worksheet
- One row per exact Plato ID for the whole Jalali month.
- One column per calendar day of that month (29, 30 or 31 days as applicable).
- A star (★) marks every day on which that ID was active.
- Month sheets cover the complete Jalali month even when the selected report range covers only part of it; days outside the selected/report data remain blank.
- The same ID appears once in that month sheet and can have stars in multiple day columns.

## 3. Date and data rules

- Activity day is derived from upload timestamp in Asia/Tehran.
- Weekly boundaries are Saturday through Friday.
- Monthly boundaries follow the Persian/Jalali calendar, not Gregorian month boundaries.
- Only approved canonical IDs are included. Unreviewed images do not create activity stars.
- An ID repeated across different days receives a star in each corresponding day column.
- An exact duplicate within one day still produces at most one star for that ID/day.

## 4. Implementation scope

- supabase/functions/_shared/plato-id-scanner-xlsx.ts: weekly and monthly activity matrix worksheets.
- supabase/functions/_shared/plato-id-scanner-xlsx.test.ts: verifies weekly weekday columns, Jalali month worksheet and repeated-ID activity.
- supabase/functions/plato-id-scanner-telegram-report/index.ts: passes the exact report period into workbook generation.
- Existing manual send flow, report version history, delivery history, operator data scoping and test-group destination remain unchanged.

## 5. Safety and release boundary

- Repository: Omidso82/Plato-land-preview
- Feature branch: feature/plato-id-scanner-daily-excel-report
- PR: https://github.com/Omidso82/Plato-land-preview/pull/145
- Base branch: main
- No merge or production deployment is part of this implementation step.
- No Supabase schema migration or database write is required.
- No Telegram message is sent during code implementation.
- The existing temporary management panel remains the intended operator-facing place for this workflow; this change does not create a separate public page.

## 6. Version history

- v1.0 — 2026-11-12: Initial daily Telegram grouping and optional Excel attachment specification.
- v1.1 — 2026-11-12: Records CI evidence and deployment boundary for daily Excel export.
- v1.2 — 2026-11-12: Replaces daily worksheet layout with weekly Saturday–Friday activity matrices and complete Jalali monthly activity matrices, as explicitly confirmed by the owner.
- v1.3 — 2026-11-12: Records successful TypeScript, Vite build, existing Deno tests, weekly/monthly XLSX tests and Edge Function type check; Pages build/artifact succeeded and production deploy was skipped.

## 7. Latest verification — v1.3

GitHub Actions for feature-branch head `fcdaeca77c85d685d83dcf3874c55ba51592958b`:
- Build and typecheck run `43320496767`: SUCCESS. npm install, TypeScript typecheck, Vite build, all existing Deno tests, the new weekly/monthly XLSX test, and Edge Function type check passed.
- Pages workflow run `43320496990`: build and artifact preparation SUCCESS; production deploy job SKIPPED as required for a pull request.
- PR #145 remains Open / Draft / Unmerged.
- No Supabase migration, database write, Edge Function deployment, Telegram send, or main-site production deployment was performed.
