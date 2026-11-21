# PLATO LAND – Series 3 Champion Prediction Image Report

**Version:** 1.0  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Implemented on feature branch; review and release pending.

## Approved scope
Add a downloadable PNG report to the existing Series 3 Owner prediction-results area for the existing `champion` campaign only.

The image contains exactly two fields per response:
- Voter Plato ID
- Selected champion Plato ID

No vote totals, ranking, timestamps, commentary, scoring, or extra explanatory sentences are included in the image. The existing individual response report remains unchanged.

## Data source
- Primary Supabase project: `dfrppbapaaydbjeflozw`
- Campaign table: `public.plato_land_prediction_campaigns`
- Entry table: `public.plato_land_prediction_entries`
- Series key: `series3`
- Champion campaign: `6c347500-aecc-4d3e-87a9-51f292ee8b05`
- Campaign title: «قهرمان سری سوم لیگ تخته»
- Response shape: `response.champion`
- Voter field: `voter_plato_id`

A read-only query on 2026-11-21 found 12 entries for this campaign. No database writes, schema changes, or migrations were performed.

## Implementation
- Existing Owner campaign scoring/report view is reused.
- A new button generates a high-resolution PNG in the browser from the already-loaded campaign entries.
- Image design uses the PLATO LAND black/gold visual language.
- The generated rows preserve each stored voter ID and selected champion value.
- No additional page, route, table, Edge Function, or Telegram workflow is introduced.
- No Telegram message is sent.

## Change record
- Repository: `Omidso82/Plato-land-preview`
- Base branch: `main`
- Feature branch: `feat/series3-champion-prediction-image-report`
- File changed: `src/PredictionCampaignManager.tsx`
- Implementation commit: `51ea0ab31839b254df17e90091a53c4969310639`

## Release gates
- Review the diff and run build/typecheck.
- Verify image generation on iPhone Safari using the Owner account.
- Keep existing individual report unchanged.
- Obtain separate approval before merge and production deployment.
- Do not mutate prediction entries or campaign data.
