# PLATO ID Scanner — Periodic Final ID Archive

**Version:** 1.0  
**Date:** 13 November 2026  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Implemented on feature branch; PR #154 open, not merged or deployed.

## 1. Approved product decision

The existing “فهرست نهایی آیدی‌ها” workspace is organized into four views:

1. **روزانه** — approved IDs grouped by Tehran-local Jalali upload day.
2. **هفتگی** — approved IDs grouped into Saturday–Friday weeks.
3. **ماهانه** — approved IDs grouped by Jalali calendar month.
4. **کل تاریخچه** — the existing all-time unique-ID aggregate remains available as a separate view.

This is an enhancement inside the existing Scanner panel and workspace. No parallel panel or route is introduced.

## 2. Data and calculation rules

- Only the highest-numbered human-approved revision for each image is used.
- Each image remains an independent source record; corrections do not union old and new revisions.
- Date grouping uses `Asia/Tehran`.
- Weekly boundaries are Saturday through Friday.
- Monthly grouping uses the Persian/Jalali calendar.
- ID strings are preserved exactly. No case folding, trimming, punctuation cleanup, Unicode normalization or fuzzy matching is added.
- Period unique-ID counts deduplicate exact IDs within that selected period.
- Duplicate occurrences are counted within the same Tehran-local day. The same ID appearing on different days remains activity on each day and is not treated as a duplicate across days.
- Period details show the approved source images, upload timestamps, revision numbers, unique IDs and exact duplicate source images.
- The all-history view retains the existing aggregate duplicate audit.

## 3. Scope and safety

Changed files:
- `src/PlatoIdScannerApp.tsx`
- `src/plato-id-scanner.css`
- `docs/PLATO_ID_SCANNER_PERIODIC_FINAL_IDS_v1.0_2026-11-13.md`

No database schema or data changes. No changes to OCR dispatch, OCR execution, image storage, RLS, Auth, Telegram delivery, report Edge Functions, or PLATO LAND – Main Website.

## 4. GitHub status

- Repository: `Omidso82/Plato-land-preview`
- Branch: `feat/scanner-periodic-final-ids`
- PR: [#154](https://github.com/Omidso82/Plato-land-preview/pull/154)
- Base: `main`
- Current head: `7b7897ef21c830c25b386955d436f5772fd798fd`
- Merge/deployment: not performed.

## 5. Verification boundary

The first CI attempt found a TypeScript inference issue in the new grouping loop. It was corrected in commit `7b7897ef21c830c25b386955d436f5772fd798fd`; the corrected head must pass fresh CI before merge. No successful CI or production deployment is claimed. Authenticated iPhone/Safari visual QA remains pending after an approved merge and release.

## 6. Next steps

1. Wait for PR #154 verification workflows to finish.
2. Review any CI failures and fix them on the same feature branch.
3. Request explicit approval before merging.
4. After an approved merge, verify the actual release and ask the owner to test daily, weekly, monthly and all-history views in the existing authenticated Scanner panel.
