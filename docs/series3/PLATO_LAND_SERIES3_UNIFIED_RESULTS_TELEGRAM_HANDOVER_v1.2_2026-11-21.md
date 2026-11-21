# PLATO LAND – Series 3 Unified Results & Telegram Release Handover
Version: 1.2
Date: 2026-11-21
Project: PLATO LAND – Temporary Projects
Event: Series 3 Backgammon League
Status: Merged to main and production website workflow successful; Supabase Edge Function v27 active. Manual Owner-session/iPhone acceptance remains outstanding.

## 1. Confirmed workflow
- Group-stage and knockout-stage results are entered in one place: the existing Series 3 group results manager.
- Telegram center is reporting-only: select a report, prepare/inspect preview, choose destination, and manually confirm sending.
- No standalone knockout results form remains in the Telegram center.
- This is Series 3 only; Series 1, Series 2, and PLATO LAND – Main Website project scope are excluded.

## 2. Owner-approved knockout schedule
| Persian date | Weekday | Stage | Matches |
|---|---|---|---:|
| ۳ آذر | Tuesday | یک‌شانزدهم نهایی | 16 |
| ۴ آذر | Wednesday | یک‌هشتم نهایی | 8 |
| ۷ آذر | Saturday | یک‌چهارم نهایی | 4 |
| ۸ آذر | Sunday | نیمه‌نهایی | 2 |
| ۹ آذر | Monday | رده‌بندی و فینال | 2 |

Dates appear in the unified result-entry interface and Telegram report choices/subtitles.

## 3. Unified result entry and validation
File: `src/Series3GroupResultsManager.tsx`
- Existing group-stage entry and standings retained.
- Knockout stage selector and official bracket fixtures added.
- Plato ID and score inputs added for every match.
- Player IDs must be distinct and belong to Series 3 main or waitlist registrations.
- Scores must be entered as a pair or both left blank for pending fixtures.
- Completed knockout scores must be non-negative integers and cannot tie.
- Knockout data is stored separately from group-stage results; group standings are not recalculated from knockout games.

Database tables reused:
- `public.plato_land_series3_knockout_match_results`
- `public.plato_land_series3_knockout_match_result_history`
- Group-stage data remains in `public.plato_land_series3_group_match_results`.

## 4. Telegram reporting
File: `src/Series3TelegramManager.tsx`
- Standalone knockout result-entry component removed.
- Existing report selection, preview-before-send, destination allow-list, and explicit manual-send confirmation retained.
- The six knockout stage report options display the approved dates.

Edge Function source:
`supabase/functions/plato-land-series3-telegram/index.ts`

## 5. Release record
Repository: `Omidso82/Plato-land-preview`
Merged PR: #297 — https://github.com/Omidso82/Plato-land-preview/pull/297
Merge commit / main HEAD at release: `53dd5d9838d80345be6e5183be40d8851716fab2`
Feature head before merge: `d409fe10208061f9c0d13538f3fc94e96ea6ea8d`

Production GitHub Actions:
- Build and typecheck run 44939248046 — completed successfully.
- Deploy PLATO LAND website run 44939248084 — completed successfully, including the job `Deploy to platoland.org via GitHub Pages`.

Primary Supabase project: `dfrppbapaaydbjeflozw`
Edge Function: `plato-land-series3-telegram`
- Status: ACTIVE
- Version: 27 (previously 26)
- `verify_jwt=true` retained.
- Function hash: `087c8768f623e7608d4ab37a16d90d7a1723d2fde73af94b9ab33f276ad1eaf1`

No Telegram message was sent during deployment or verification.

## 6. Post-release database check
Read-only query after release returned:
| Table | Total rows | Completed |
|---|---:|---:|
| Group results | 72 | 22 |
| Knockout results | 0 | 0 |
| Knockout result history | 0 | — |

Earlier baseline before this refactor was 72 group rows / 15 completed. The latest read shows 22 completed group rows; this code change did not update the group-results table. Knockout result tables remain empty until the Owner enters scores.

## 7. Remaining acceptance checks
- Open the live panel in the existing Owner session on iPhone/Safari.
- Confirm group and knockout result entry are visible together in the Series 3 results manager.
- Confirm the Telegram center contains report controls only and still offers the six knockout stages.
- Confirm result saving/reading using an actual Owner session.
- Confirm Telegram preview content for a selected knockout stage. Do not send a real Telegram message unless separately instructed.

The GitHub production deployment and Edge Function deployment are confirmed. The manual iPhone/Owner-session acceptance checks above are not claimed as completed.

## 8. Change log
- v1.0 — Initial separate knockout result table and Telegram reporting integration.
- v1.1 — Owner-directed relocation of knockout result entry into the existing unified group results manager; Telegram center made reporting-only; dates added.
- v1.2 — PR #297 merged; production website workflow and Edge Function v27 deployment verified; post-release database counts recorded; manual acceptance remains outstanding.
