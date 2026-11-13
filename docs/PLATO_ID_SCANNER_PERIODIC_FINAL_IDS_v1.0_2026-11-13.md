# PLATO ID Scanner — Periodic Final ID Archive

**Version:** 1.2  
**Date:** 13 November 2026  
**Project:** PLATO LAND – Temporary Projects  
**Status:** v1.0 deployed; v1.1 selector-layout refinement in progress on a separate branch.

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


## 7. v1.1 period selection layout refinement — 13 November 2026

Approved by the project owner after reviewing the deployed UI.

- Replace the long stack of period cards with one compact native period selector.
- Selector label adapts to the active view: روز / هفته / ماه.
- Each available period appears once as a single option, including its period label and compact image/unique-ID counts.
- Selecting an option displays one detail panel. The selected period title appears only in that detail heading, not as a repeated card and heading.
- Weekly labels remain a single Saturday–Friday date range; monthly labels remain Jalali month/year; daily labels remain one Jalali date.
- No changes to grouping boundaries, approved-revision selection, duplicate calculations, stored data, database, OCR, Telegram, or other project surfaces.
- Mobile layout uses a full-width native select with RTL direction and visible focus styling.


## 8. v1.2 period detail modal — 13 November 2026

- Daily, weekly, and monthly period selection remains on the archive page.
- Choosing a day, week, or month opens that period's details in a separate dismissible modal.
- The modal includes a close control, a return-to-period-list control, and closes when the backdrop is tapped or Escape is pressed.
- Closing the modal returns to the same daily, weekly, or monthly period list so another period can be selected.
- The period details are no longer rendered inline beneath the period selector.
- Period grouping, Jalali labels, Saturday–Friday weekly boundaries, approved revision selection, unique-ID calculations, duplicate calculations, and stored data remain unchanged.
- No database, OCR, Telegram, authentication, storage, or Main Website changes.
- This update is implemented on the existing isolated feature branch and remains subject to preview verification and owner approval before production merge/deployment.
