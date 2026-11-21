# PLATO LAND – Series 3 Unified Group & Knockout Result Entry
Version: 1.1
Date: 2026-11-21
Project: PLATO LAND – Temporary Projects
Event: Series 3 Backgammon League
Status: Feature branch checks and Cloudflare frontend preview successful; PR #297 remains Draft/unmerged; production release awaits separate Owner approval

## 1. Scope and owner decision
This revision implements the owner's clarified workflow:
- Group-stage and knockout-stage result entry must be in one place: the existing "ثبت نتایج و جدول گروهی سری سوم" manager.
- The Telegram center must not contain a result-entry form. It is only for choosing reports, preparing previews, and sending approved reports.
- No parallel page, manager, or new route is introduced.

This is Series 3 only. Series 1, Series 2, and the separate PLATO LAND – Main Website project are out of scope.

## 2. Knockout schedule approved by the owner
The following dates are displayed in the result-entry manager and Telegram report choices:
| Persian date | Weekday | Stage |
|---|---|---|
| ۳ آذر | Tuesday | یک‌شانزدهم نهایی — 16 matches |
| ۴ آذر | Wednesday | یک‌هشتم نهایی — 8 matches |
| ۷ آذر | Saturday | یک‌چهارم نهایی — 4 matches |
| ۸ آذر | Sunday | نیمه‌نهایی — 2 matches |
| ۹ آذر | Monday | رده‌بندی — 1 match; فینال — 1 match |

## 3. Unified result entry
The existing `src/Series3GroupResultsManager.tsx` now contains both:
- Existing group-stage result entry and group standings (retained).
- Knockout result entry with a stage selector, official bracket fixtures, scheduled dates, player Plato ID inputs, scores, and save action.

Knockout result validation:
- Both player Plato IDs are required, distinct, and must exist in the Series 3 main or waitlist registration list.
- Both scores must be entered together, or both left blank for a pending fixture.
- Completed knockout results require integer, non-negative, non-tied scores.
- Existing result versioning and database history trigger remain in effect.
- Knockout results stay in their dedicated result tables and do not affect group standings.

## 4. Telegram reporting only
`src/Series3TelegramManager.tsx` no longer mounts the standalone knockout result-entry form.
It retains stage selection, preview, destination selection, and explicit manual send confirmation. The six knockout stage choices now show their approved dates.
The existing Edge Function report subtitles include those dates:
`supabase/functions/plato-land-series3-telegram/index.ts`.

No automatic Telegram delivery is introduced. No Telegram message is sent by this change.

## 5. Database and preservation
Primary Supabase project: `dfrppbapaaydbjeflozw`.

The existing tables are reused:
- `public.plato_land_series3_knockout_match_results`
- `public.plato_land_series3_knockout_match_result_history`
- Existing group results remain in `public.plato_land_series3_group_match_results`.

No new migration is required for this UI relocation. No existing group result, knockout result, bracket draw, registration, or history row is intentionally changed or deleted by the code change.

## 6. GitHub implementation
Repository: `Omidso82/Plato-land-preview`
Base branch: `main`
Base commit: `ff485fdb05d87d756ea5e6f03180cdc92f08d9c0`
Feature branch: `feature/series3-knockout-results-unified-entry`

Files changed:
- `src/Series3GroupResultsManager.tsx` — add knockout result entry to the existing group result manager.
- `src/Series3TelegramManager.tsx` — remove result entry from Telegram center; retain report selection and sending.
- `src/Series3KnockoutResultsManager.tsx` — remove the now-obsolete standalone component.
- `supabase/functions/plato-land-series3-telegram/index.ts` — include the approved dates in knockout report subtitles.
- This handover document.

Previous implementation release:
- PR #295 was merged to main at `ff485fdb05d87d756ea5e6f03180cdc92f08d9c0`.
- Production build/deploy workflow runs 44934770356 and 44934770399 completed successfully.
- Primary Edge Function `plato-land-series3-telegram` was verified ACTIVE at version 26.
- This v1.1 refactor is separate and has not yet been merged or released.

## 7. Verification and release gates
Pending for this revision:
- GitHub Build and typecheck: completed successfully on head `1edd31d9f21cc0e19992561e27178c3eda886ed1` (run 44937928556), including Vite build, Deno tests, and Edge Function type check.
- Cloudflare Pages frontend preview: successful for commit `d4b9ee0` at `https://f378c3ba.plato-land-preview.pages.dev`; branch preview `https://feature-series3-knockout-res-mjwp.plato-land-preview.pages.dev`. The subsequent Edge Function-only code commit is not deployed to Supabase yet.
- Inspect the live panel after release, on the existing Owner session.
- Verify group-stage entry remains available and knockout entry appears beneath it.
- Verify Telegram center contains no knockout result-entry form and still has the report choices.
- Verify no real Telegram message is sent during tests.

Do not merge or deploy this v1.1 change until CI/preview checks are reviewed and the Owner explicitly approves release. Do not deploy the Edge Function or publish the panel without that approval.

## 8. Change log
- v1.0 — 2026-11-21: Initial isolated knockout result table, Owner-only access, and Telegram reporting integration; later merged as PR #295.
- v1.1 — 2026-11-21: Owner clarified that all result entry belongs in the existing group results manager; Telegram center is reporting-only. Added the six-stage calendar dates and moved the result-entry UI accordingly. PR #297 created; Build/typecheck and Cloudflare frontend preview succeeded; not merged or released.
