# PLATO LAND – Series 3 Champion Prediction Image Export

**Version:** 1.0  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Implemented on feature branch; awaiting CI and Owner review. Not merged or deployed.

## 1. Request and placement

Add a downloadable PNG report for the Series 3 champion prediction campaign inside the existing Series 3 Telegram management area. The feature is not placed in Prediction Management and does not create a new admin page, route, or panel.

Existing location:
- Temporary Owner panel: `/series2-slides-manager/`
- Existing Telegram manager component: `src/Series3TelegramManager.tsx`

## 2. Image contents

The image contains only two data columns:
1. Voter Plato ID
2. Selected Champion Plato ID

The report title and PLATO LAND visual identity are presentation elements. No vote timestamp, name, score, ranking, or additional prediction statistics are included.

Only entries with a non-empty voter Plato ID and a non-empty string at `response.champion` are included. The order follows the existing `submitted_at` ascending query.

## 3. Data source and access

- Primary Supabase project: `dfrppbapaaydbjeflozw`
- Campaign table: `public.plato_land_prediction_campaigns`
- Entries table: `public.plato_land_prediction_entries`
- Event key: `series3`
- Campaign ID: `6c347500-aecc-4d3e-87a9-51f292ee8b05`
- Campaign type: `champion`
- Selected champion value: `response.champion`

The feature reuses the existing Owner-authenticated, read-only campaign and voter loading flow. It reads the response field with the voter Plato ID. No database write, schema migration, Edge Function change, or new secret is introduced.

## 4. User workflow

1. Open the existing temporary Owner panel.
2. Open the Series 3 Telegram management area.
3. In «گزارش نتایج پیش‌بینی‌ها»، select the champion campaign.
4. Choose «تهیه تصویر پیش‌بینی قهرمان».
5. Review the rendered two-column PNG preview.
6. Use «دریافت تصویر PNG» to save the file and send it manually outside this feature.

This export button does not invoke the Telegram API and does not use the existing Telegram send controls. No automatic or manual Telegram send is performed by the feature.

## 5. Implementation

Changed application file:
- `src/Series3TelegramManager.tsx`

Changes:
- Extend the existing voter read query to include `response`.
- Add a champion-campaign-only image generation action.
- Render voter and selected champion Plato IDs in separate, clearly bordered columns.
- Add a PNG download link.
- Keep the existing match-prediction ranking image and per-voter report flows separate.

## 6. Safety and release boundaries

Not performed:
- No database writes or migrations.
- No Edge Function modification or deployment.
- No Telegram API call or message send.
- No merge to `main`.
- No production deployment.
- No change to PLATO LAND – Main Website scope.

The implementation is pending automated checks and Owner review. A successful branch build does not itself publish the change to the existing temporary Owner panel.

## 7. GitHub

- Repository: `Omidso82/Plato-land-preview`
- Feature branch: `feat/series3-champion-voter-image-telegram`
- Initial implementation commit: `1d8251c4391a9ba3dee32140f491c35e028f13a7`
- Base branch: `main`

## 8. Acceptance checks still required

- Confirm the campaign selector resolves the Series 3 champion campaign.
- Confirm all valid voter/champion pairs appear exactly once.
- Confirm the PNG contains only the two requested data columns.
- Confirm long Plato IDs remain readable on an iPhone.
- Confirm the download action saves a PNG.
- Confirm no Telegram message is sent.
- Confirm no database mutation occurs.
- Review automated build/typecheck results before requesting production release approval.
