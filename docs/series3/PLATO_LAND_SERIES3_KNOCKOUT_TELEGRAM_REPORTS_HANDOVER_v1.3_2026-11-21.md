# PLATO LAND – Series 3 Knockout Telegram Reports Handover
Version: 1.3
Date: 2026-11-21
Project: PLATO LAND – Temporary Projects
Event: Series 3 Backgammon League
Status: Implemented on an isolated branch; PR opened for review. Not merged or deployed.

## 1. Owner-confirmed requirement
Each knockout stage must have its own independent Telegram report, matching the group-stage schedule/results reporting pattern:
- Include every scheduled match in the selected stage, whether or not a result has been saved.
- Show the official stage date and title.
- Show both player Plato IDs (or the official bracket slot until player IDs are entered).
- For a completed match, show the saved score and the winner.
- For a match without a completed result, show a clear “در انتظار نتیجه” status.
- Keep the third-place match and final as two separate reports, both dated دوشنبه ۹ آذر.

## 2. Approved knockout report options
| Persian date | Weekday | Stage | Matches | Independent report |
|---|---|---|---:|---|
| ۳ آذر | سه‌شنبه | یک‌شانزدهم نهایی | 16 | Yes |
| ۴ آذر | چهارشنبه | یک‌هشتم نهایی | 8 | Yes |
| ۷ آذر | شنبه | یک‌چهارم نهایی | 4 | Yes |
| ۸ آذر | یکشنبه | نیمه‌نهایی | 2 | Yes |
| ۹ آذر | دوشنبه | رده‌بندی | 1 | Yes |
| ۹ آذر | دوشنبه | فینال | 1 | Yes |

## 3. Implementation
Files changed:
- `supabase/functions/plato-land-series3-telegram/index.ts`
  - Scope saved knockout result matching to the selected `stage_key` as well as `match_id`.
  - Report each scheduled match, including matches without a saved result.
  - Render completed score and winner on separate clear lines.
  - Render pending matches with “در انتظار نتیجه”.
  - Keep each stage as its own Telegram message; third-place and final remain separate.
- `src/Series3TelegramManager.tsx`
  - Clarify that the knockout section creates independent stage reports containing schedule, player IDs, saved results, winner, and pending status.

No database schema, table, row, result, registration, bracket, group-stage, Main Website, or Cloudflare changes are included.

## 4. Data source and safety
- Primary Supabase project remains `dfrppbapaaydbjeflozw`.
- Knockout results are read from `public.plato_land_series3_knockout_match_results`.
- Official bracket remains read from `public.plato_land_series3_knockout_draws`.
- The report endpoint remains Owner-only and retains preview-before-send and explicit manual confirmation.
- No real Telegram message was sent as part of this work.
- No production Supabase Edge Function was deployed as part of this work.

## 5. Baseline database check
Read-only check at the start of this work:
- Group results: 72 rows, 22 completed.
- Knockout results: 0 rows, 0 completed.
This means the pending-result path can be reviewed from code, but a real saved knockout score cannot yet be verified against production data.

## 6. Git record
Repository: `Omidso82/Plato-land-preview`
Base: `main`
Working branch: `fix/series3-knockout-telegram-result-reports`
Edge Function commit: `986eb75b5a65970e252488229f55d3f00ecb40fb`
Telegram UI commit: `0a8f965f45c173d37e251fcfcbe4aef9648f323d`
PR: pending creation at time this document was prepared.

## 7. Required verification before release
- Review the PR diff.
- Confirm GitHub Actions build/typecheck succeeds.
- Confirm the generated preview for each of the six knockout stage choices contains the expected number of matches and stage date.
- Confirm pending match text and completed score/winner text with representative fixture/result data. Production currently has no knockout result rows, so use a safe non-production unit/mock test or an approved test fixture; do not insert test rows into the primary database.
- After PR merge, separately verify deployment of the website and Edge Function v28.
- On iPhone/Safari in an Owner session, inspect the preview. Do not send real Telegram messages without separate explicit approval.

## 8. Change log
- v1.2 — Unified group/knockout result entry and Telegram reporting release handover.
- v1.3 — Independent stage report wording; explicit completed score/winner and pending status; stage-key-scoped result lookup. Pending PR review and release verification.
