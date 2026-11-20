# PLATO LAND – Series 3 Prediction Results Report Handover

**Version:** 1.9  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Implementation is on feature branch and PR #266 remains open as Draft. The latest code commit is `1e08452cd8f622e4db9b65e005febc6f50bb0013`. GitHub Actions for this exact commit completed successfully: Build/TypeScript/production-site build and Verify/Deno checks passed. The Pages workflow's deploy job was skipped; this does not establish a Production deployment. No merge, Edge Function deployment, migration, or Telegram message send was performed.

## 1. Scope and approved design

Extend the existing Series 3 Telegram center and existing Owner panel with prediction-results report previews. No new bot, page, route, or separate panel.

Two supported campaign types:
- `champion`: compare the selected champion prediction against an authoritative champion result.
- `match_predictions`: compare each selected prediction against the official result for the corresponding match.

Campaign type is read from `campaign_type`; the implementation does not infer evaluation semantics from question wording. Match identity is resolved from `questions[].match.matchId` to `plato_land_series3_group_match_results.match_id`.

The report creates one separate message per selected voter. The Owner can select a campaign and all or individual voter entries. Reports are preview-only until a verified private Telegram destination mapping exists.

## 2. Privacy and sending restrictions

- Voter entries are read under Owner-only RLS; the Edge Function independently verifies the authenticated user's Owner role.
- No Telegram user/chat ID mapping exists in the primary database.
- The report send path is rejected by the Edge Function with HTTP 409.
- The UI disables sending while a voter report is selected.
- Personal voter reports must never be sent to the public test group or main channel.
- No new voter-to-Telegram mapping or database schema was introduced.
- Preview responses are returned to the authenticated Owner and are not inserted into delivery history.
- Existing announcement sending remains a separate path.

## 3. Primary database facts verified

Project: `dfrppbapaaydbjeflozw`, region `eu-west-3`, status `ACTIVE_HEALTHY`.

Published Series 3 campaigns:
1. `561daec8-4608-489a-ac5c-a9a0661858ad` — `match_predictions`, title: «بازيهاي دور اول را پيش بيني كن», 6 voter entries, 24 questions.
2. `6c347500-aecc-4d3e-87a9-51f292ee8b05` — `champion`, title: «قهرمان سری سوم لیگ تخته», 6 voter entries.

The stored response shape was read-only verified as JSON objects. For match predictions, response keys correspond to question IDs such as `match_group_S3-A-R1-M1`; the question's `match.matchId` resolves to the official match ID such as `S3-A-R1-M1`.

All 72 rows in `plato_land_series3_group_match_results` currently have `result_status='pending'`; all 72 have missing scores. Consequently, no match prediction can currently be classified correct or incorrect. They must remain «در انتظار نتیجه».

Champion evaluation remains «در انتظار نتیجه» until an authoritative champion result source is formally recorded. The current report does not infer the champion from predictions or from an unofficial source.

## 4. Report logic and message-size validation

- Missing match result row: «در انتظار نتیجه».
- Explicit pending result, missing score, or tied score: «در انتظار نتیجه».
- Completed numeric result: derive winner from official scores, then compare the selected Plato ID case-insensitively.
- Missing answer on a completed result: «بدون پاسخ».
- Missing/invalid match identity or invalid result state: «نامشخص».
- No numeric scoring, points, leaderboard, or voter ranking is introduced.

The report format was compacted to retain one message per voter. A read-only SQL length estimate for all six match-prediction voters found a maximum of **3,699 characters**, below the code's 3,900-character guard. This is a DB-backed length estimate of the authored message shape, not a live Telegram send test.

## 5. Files in PR #266

- `src/Series3TelegramManager.tsx`
  - campaign selector and Owner-only voter list
  - select all or individual voters
  - preview integration
  - disabled report send action and privacy notice
- `supabase/functions/plato-land-series3-telegram/index.ts`
  - campaign-type-specific report builder
  - match ID/result mapping
  - compact per-voter message format
  - server-side block on report sends

Latest implementation commit: `1e08452cd8f622e4db9b65e005febc6f50bb0013`.

## 6. Validation

For commit `1e08452cd8f622e4db9b65e005febc6f50bb0013`:
- GitHub Actions Build and TypeScript verification: **success**
- GitHub Actions Verify and Deno checks: **success**
- GitHub Pages build job: **success**
- GitHub Pages deploy job: **skipped**
- SQL read-only checks: campaign response structure and current 72 pending match results verified
- Message-size estimate: maximum 3,699 characters across the six match-prediction entries

No live Owner-authenticated browser preview or Telegram delivery test was performed.

## 7. Branch and PR status

- Repository: `Omidso82/Plato-land-preview`
- PR: [#266](https://github.com/Omidso82/Plato-land-preview/pull/266)
- Feature branch: `feat/series3-prediction-results-report`
- PR remains open and Draft; not merged.
- At the latest comparison, feature branch was 6 commits ahead and 2 commits behind `main`. The two newer `main` commits affect:
  - `docs/PLATO_LAND_TEMPORARY_PLAYER_REGISTRY_HANDOVER_v1.5_2026-11-20.md` (new)
  - `src/PredictionCampaignManager.tsx` (modified)
- These newer changes have not yet been integrated into the feature branch. Rebase/merge conflict review is still required before the PR can be considered merge-ready.
- The PR body should reflect completed CI, not in-progress checks.

## 8. Explicit non-actions and release gates

Not performed:
- No PR merge.
- No production frontend release; Pages deploy job was skipped.
- No Edge Function deployment.
- No database migration or data mutation.
- No Telegram message send.
- No new Telegram ID mapping.
- No change to Main Website scope, PLATO ID Scanner, legacy operator, or other tournament data.

Before any release:
1. Integrate the two newer `main` commits and re-run full CI.
2. Re-review the final PR diff, especially `PredictionCampaignManager.tsx` interactions and privacy boundaries.
3. Obtain separate user approval for PR merge.
4. Obtain separate user approval for Edge Function deployment, if needed.
5. Obtain separate user approval for Production release, if needed.
6. Keep personal voter reports preview-only until a private destination mapping design is separately approved and securely implemented.
7. Never send voter reports to public group/channel destinations.

## 9. Next actions

1. Reconcile the feature branch with latest `main` (2 commits behind) without overwriting the newer campaign-manager change.
2. Re-run CI and verify PR mergeability.
3. Perform a live Owner-authenticated preview-only test if an approved browser session is available; do not send messages.
4. Keep PR Draft until these checks and review are complete.
5. After the final stable revision, create the next handover version and ask the user to replace/add it to Project Sources.
