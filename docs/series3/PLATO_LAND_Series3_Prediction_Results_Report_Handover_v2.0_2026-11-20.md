# PLATO LAND – Series 3 Prediction Results Report Handover

**Version:** 2.0  
**Date:** 2026-11-20  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Feature branch synchronized with latest `main`; PR #266 remains open as Draft. CI passed for synchronized code commit `fc8e6c71b15f0dc7bd8102bad2abc9738fae2b03`. No PR merge, Edge Function deployment, production release, migration, or Telegram send was performed.

## 1. Scope and approved design

Extend the existing Series 3 Telegram center and existing Owner panel with prediction-results report previews. No new bot, page, route, or separate panel.

Supported campaign types:
- `champion`: compare the selected champion prediction against an authoritative champion result.
- `match_predictions`: compare each selected prediction against the official result for the corresponding match.

Campaign type is read from `campaign_type`; evaluation semantics are not inferred from question wording. Match identity is resolved from `questions[].match.matchId` to `plato_land_series3_group_match_results.match_id`.

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

## 3. Primary database facts previously verified

Project: `dfrppbapaaydbjeflozw`, region `eu-west-3`.

Published Series 3 campaigns:
1. `561daec8-4608-489a-ac5c-a9a0661858ad` — `match_predictions`, title «بازيهاي دور اول را پيش بيني كن», 6 voter entries, 24 questions.
2. `6c347500-aecc-4d3e-87a9-51f292ee8b05` — `champion`, title «قهرمان سری سوم لیگ تخته», 6 voter entries.

Stored response shape was read-only verified as JSON objects. Match question `match.matchId` resolves to official `match_id`.

At the last primary-database verification, all 72 rows in `plato_land_series3_group_match_results` had `result_status='pending'`; all 72 had missing scores. Accordingly, match predictions must remain «در انتظار نتیجه» until official results are recorded.

Champion evaluation remains «در انتظار نتیجه» until an authoritative champion result source is formally recorded.

**Important:** The database facts above are the last verified snapshot from the v1.9 handover. This continuation did not re-query or mutate the primary database.

## 4. Report logic and message-size validation

- Missing match result row: «در انتظار نتیجه».
- Explicit pending result, missing score, or tied score: «در انتظار نتیجه».
- Completed numeric result: derive winner from official scores, then compare the selected Plato ID case-insensitively.
- Missing answer on a completed result: «بدون پاسخ».
- Missing/invalid match identity or invalid result state: «نامشخص».
- No numeric scoring, points, leaderboard, or voter ranking is introduced.

A read-only SQL length estimate in the previous handover found a maximum of 3,699 characters for one match-prediction voter message, below the code's 3,900-character guard. This is an authored-message length estimate, not a live Telegram send test.

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
- This handover document.

## 6. Branch synchronization performed

Repository: `Omidso82/Plato-land-preview`  
PR: https://github.com/Omidso82/Plato-land-preview/pull/266  
Feature branch: `feat/series3-prediction-results-report`

The feature branch had diverged from `main`. The two commits added to `main` after the prior merge base were inspected:
- `5374c680d5088e24049f670b0c74f742a5711b0e` — Temporary Player Registry handover v1.5.
- `2601b2dee5e56f35ab638fbb3378380dd5e38981` — automatic Series 3 prediction scoring report, including `src/PredictionCampaignManager.tsx`.

A merge commit was created on the feature branch:
- `fc8e6c71b15f0dc7bd8102bad2abc9738fae2b03`
- Parents: previous feature head `41faca88baabf0b4041b59801e4e6902ec7189d3` and latest `main` `2601b2dee5e56f35ab638fbb3378380dd5e38981`.
- The two main-branch commits were retained; the feature files were layered on the latest main tree.
- PR comparison after synchronization: 8 commits ahead, 0 behind.
- PR diff against current `main` remains exactly the three feature files listed in Section 5.
- GitHub reports PR mergeable=true, open, Draft, merged=false.

No changes were made to `main` by this synchronization.

## 7. CI and release status after synchronization

For synchronized code commit `fc8e6c71b15f0dc7bd8102bad2abc9738fae2b03`:
- Build and typecheck workflow run `44813628855`: **success**.
- Deploy PLATO LAND website workflow run `44813628930`: build job **success**, deploy job **skipped**.
- GitHub check runs: `build` **success**, `verify` **success**, Pages `deploy` **skipped**.
- PR #266 remains open and Draft; no merge commit to `main` has been made.

The successful Pages build does not mean that the site was deployed. No Production deployment occurred in this continuation.

## 8. Explicit non-actions and release gates

Not performed:
- No PR merge.
- No Production frontend release.
- No Edge Function deployment.
- No database migration or data mutation.
- No Telegram message send.
- No new Telegram ID mapping.
- No change to Main Website scope, PLATO ID Scanner, legacy operator, or other tournament data.

Before any release:
1. Review the final PR diff, especially privacy boundaries and the separation from existing announcement sending.
2. Obtain separate user approval for PR merge.
3. Obtain separate user approval for Edge Function deployment, if needed.
4. Obtain separate user approval for Production release, if needed.
5. Keep personal voter reports preview-only until a private destination mapping design is separately approved and securely implemented.
6. Re-query the primary database before showing any live prediction outcome; the pending-result counts above are historical snapshots.

## 9. Current next actions

1. Perform an Owner-authenticated preview-only test if an approved browser session is available; do not send messages.
2. Review the UI and Edge Function behavior against the final privacy rules.
3. Keep PR #266 Draft until the Owner preview and final review are complete.
4. Ask for separate explicit approval before merging PR #266.
5. Ask for separate explicit approval before deploying the Edge Function or publishing the website.
6. Do not send personal voter reports to any public group or channel.

## 10. Version history

- v2.0 — 2026-11-20: records conflict-aware synchronization with latest `main`, current PR diff and mergeability, and CI success for the synchronized code commit. No merge or deployment.
- v1.9 — 2026-11-20: records the original owner-only report preview implementation, result mapping, privacy gate, database snapshot, and initial CI checks.
