# PLATO LAND – Series 3 Champion Prediction Image Export

**Version:** 1.1  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Implemented on feature branch; automated build/typecheck passed; branch preview available; awaiting Owner visual verification. Not merged or deployed to production.

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

1. Open the branch preview URL listed in Section 7, then navigate to `/series2-slides-manager/`.
2. Open the Series 3 Telegram management area.
3. In «گزارش نتایج پیش‌بینی‌ها», select the champion campaign.
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

## 6. Automated checks and release boundaries

GitHub Actions for head commit `4dd5c18410830b917a72b6d09eb2bb02550f3813`:

- **Build and typecheck:** completed successfully.
  - `npm run typecheck`: success
  - `npm run build`: success
  - Existing Deno tests and checks in the workflow: success
- **GitHub Pages build/upload workflow:** build, TypeScript verification, production-site build, Pages output preparation, configuration and upload steps completed successfully.
  - The workflow's separate `deploy` job was **skipped**.
- **Cloudflare Pages PR previews:** successful preview comments were recorded for the `plato-land-preview`, `plato-land-media-pages`, and `plato-land-media-endpoint` Pages projects.
- **Separate Cloudflare Workers preview notice:** a build failure was reported for `plato-land-media-endpoint` Workers preview. No Worker or Edge Function files are part of this PR; investigate separately if that service is in scope. This does not change the successful application typecheck/build result.

Not performed:
- No database writes or migrations.
- No Edge Function modification or deployment.
- No Telegram API call or message send.
- No merge to `main`.
- No production deployment.
- No change to PLATO LAND – Main Website scope.

A branch preview is not a production release. Owner must visually verify the feature in the branch preview before any separate release approval is requested.

## 7. GitHub and preview

- Repository: `Omidso82/Plato-land-preview`
- Pull request: https://github.com/Omidso82/Plato-land-preview/pull/312
- PR state at verification: open, draft, not merged; mergeable.
- Feature branch: `feat/series3-champion-voter-image-telegram`
- Base branch: `main`
- Head commit: `4dd5c18410830b917a72b6d09eb2bb02550f3813`
- Relevant Cloudflare Pages branch preview:
  https://feat-series3-champion-voter.plato-land-preview.pages.dev
- Preview page to inspect:
  https://feat-series3-champion-voter.plato-land-preview.pages.dev/series2-slides-manager/

## 8. Owner visual acceptance checks still required

- Confirm the preview panel opens and Owner authentication works.
- Confirm the campaign selector resolves the Series 3 champion campaign.
- Confirm all valid voter/champion pairs appear exactly once.
- Confirm the PNG contains only the two requested data columns.
- Confirm long Plato IDs remain readable on an iPhone.
- Confirm the download action saves a PNG.
- Confirm no Telegram message is sent.
- Confirm no database mutation occurs.

## 9. Release gate

Do not mark the PR ready, merge it, deploy to production, or alter the main website without separate explicit Owner approval. The PR remains draft until the visual acceptance checks are completed.
