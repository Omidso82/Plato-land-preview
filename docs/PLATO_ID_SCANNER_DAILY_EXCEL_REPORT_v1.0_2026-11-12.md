# PLATO ID Scanner — Daily Telegram Report and Optional Excel Attachment

**Document version:** 1.1  
**Date:** 2026-11-12  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Status:** CI passed for implementation commit; PR remains Draft/unmerged; not deployed to the operational site or Supabase Edge Functions.

## 1. Approved user decision

On 2026-11-12, the owner approved this report-delivery format:

- Telegram text report grouped by the Tehran-local calendar day on which each source image was uploaded.
- An optional Microsoft Excel `.xlsx` attachment may accompany the Telegram text report.
- Excel is optional and is not required for text delivery.
- The operator chooses the report period, reviews the preview, and initiates sending manually.
- Delivery remains restricted to the existing Telegram test group. No automatic sending and no main Telegram group/channel delivery are authorized by this decision.

## 2. Report data rules

1. Use the upload timestamp (`created_at`) interpreted in `Asia/Tehran` to assign each image to a day.
2. Include only the latest human-approved review revision for each image. Unreviewed OCR candidates are excluded.
3. Preserve every Plato ID string exactly, including case, underscores and punctuation.
4. Deduplicate exact IDs within each Tehran-local day. The same ID appearing on different days remains visible on each day because it represents activity on both days.
5. The preview shows the day, Persian date, uploaded image count, reviewed image count, IDs for that day and exact duplicates requiring explicit review.
6. A stale preview must be regenerated before sending if the underlying approved report data changes.

## 3. Excel workbook structure

When the operator checks the optional Excel attachment:

- The workbook is generated server-side as a real `.xlsx` file.
- The first worksheet, **خلاصه**, lists the Persian date, weekday, uploaded images, reviewed images and daily unique-ID count.
- Each upload day receives its own worksheet, named with its Gregorian date key.
- Each daily worksheet contains row number, exact Plato ID, Persian date and weekday.
- All Plato IDs are written as text, not formulas or numeric values.

The workbook is sent as a Telegram document after the grouped text messages. If document delivery fails after text messages have been sent, the delivery is recorded as failed/partial and is not reported as a successful Excel attachment.

## 4. Access control and privacy

- The owner can generate the complete report.
- An approved operator can generate reports only from uploads belonging to that operator. The Edge Function applies the `operator_id = auth.uid()` scope while using its privileged database client.
- Operators can see only their own delivery history.
- Telegram credentials remain server-side. No bot token or service-role key is added to browser code.
- The fixed test-group destination is unchanged.

## 5. Version history and database scope

The existing `plato_id_scanner_report_versions` and `plato_id_scanner_telegram_deliveries` tables are reused.

The versioned report payload records the daily groups, exact IDs, duplicate details, report period and whether an Excel attachment was requested. Delivery history marks the Excel attachment as delivered only when the complete Telegram delivery is recorded as `sent`.

**No database schema change or migration is included.** No Supabase data was written by this implementation work.

## 6. Code scope

- `src/PlatoIdScannerApp.tsx`: optional Excel checkbox, daily grouped preview, updated send confirmation and attachment status in history.
- `src/plato-id-scanner.css`: mobile-friendly daily group preview styling.
- `supabase/functions/_shared/plato-id-scanner-daily-report.ts`: Tehran-local day grouping and Telegram message formatting.
- `supabase/functions/_shared/plato-id-scanner-xlsx.ts`: dependency-free XLSX workbook generation.
- `supabase/functions/plato-id-scanner-telegram-report/index.ts`: operator scoping, daily report response, optional Telegram `sendDocument`, and attachment-aware history.
- Deno tests cover Tehran date boundaries, approved revision selection, exact same-day duplicates, daily Telegram formatting and XLSX package structure.
- `.github/workflows/verify.yml`: includes the new Deno tests and Edge Function type check.

## 7. GitHub and release boundary

- Repository: `Omidso82/Plato-land-preview`
- Feature branch: `feature/plato-id-scanner-daily-excel-report`
- Pull request: [#145](https://github.com/Omidso82/Plato-land-preview/pull/145)
- Base: `main`
- PR state: Open / Draft / Unmerged.

The PR's Pages workflow may build and upload a workflow artifact, but its production `deploy` job is guarded to run only on `refs/heads/main`; it is skipped for this pull request. The PR must not be merged without separate owner approval.

The updated Edge Function source is not yet deployed to Supabase. The currently active production function remains unchanged until a separately approved deployment. No Telegram message has been sent as part of this implementation.

## 8. Validation results and remaining steps

### CI evidence

For implementation commit `dffb57e75dd6d17fdac6380b0ef6a050fde44aec`:

- GitHub Actions verify run `43314880322`: **SUCCESS**.
- npm install, TypeScript typecheck and Vite build: **SUCCESS**.
- Existing Series 2 qualification/bracket tests and Scanner Telegram/report tests: **SUCCESS**.
- New Tehran daily-grouping and XLSX package tests: **SUCCESS**.
- Deno type check for `plato-id-scanner-telegram-report/index.ts`: **SUCCESS**.
- Pages workflow run `43314880301`: build/artifact preparation **SUCCESS**; production deploy job **SKIPPED** as required for a pull request.

### Still outstanding

1. Review the PR diff and open the generated workbook in a real Excel-compatible application before release.
2. Keep PR #145 Draft and unmerged until the owner explicitly approves merging.
3. After merge approval, deploy the updated Scanner Telegram-report Edge Function separately to the primary Supabase project, without applying a migration.
4. Perform an owner-controlled preview and test-group delivery test, first without Excel and then with Excel. Verify the workbook opens and its day sheets/IDs match the preview.
5. Verify delivery history, partial-failure behavior and operator-only data scoping.
6. Do not claim the operational feature is live until the function deployment and the actual `platoland.org` UI have both been verified.

### Live production boundary checked after CI

- Supabase function `plato-id-scanner-telegram-report` remains active at **version 2**, with its previous source hash unchanged.
- No Scanner migration or database write was performed for this PR.
- No Telegram message was sent.
- PR #145 remains Open / Draft / Unmerged.
- No production Pages deployment occurred.

## 9. Version history

- **v1.0 — 2026-11-12:** Records the approved daily grouping and optional Excel delivery design and implementation scope.
- **v1.1 — 2026-11-12:** Records successful CI, the skipped production deploy job, and the unchanged live Supabase function boundary.

---

**PLATO LAND – Temporary Projects | PLATO ID Scanner | Daily Report & Excel Attachment v1.1**
