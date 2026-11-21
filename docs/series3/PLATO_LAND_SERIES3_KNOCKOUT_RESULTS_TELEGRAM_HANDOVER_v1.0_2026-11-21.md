# PLATO LAND – Series 3 Knockout Results & Telegram Reporting
Version: 1.0  
Date: 2026-11-21  
Project: PLATO LAND – Temporary Projects  
Event: Series 3 Backgammon League  
Status: Implementation prepared on feature branch; PR open as Draft; not released to the live panel

## 1. Approved scope
Following the owner's approval, add knockout-stage result entry and result reporting to the existing Series 3 Telegram center inside the existing temporary management panel.

This work is limited to Series 3. It does not change Series 1, Series 2, the separate PLATO LAND – Main Website project, or any other admin workspace.

## 2. Existing behavior retained
- Existing group-stage selections, daily schedule reporting, and group result reads remain unchanged.
- Existing knockout stage choices and the saved bracket snapshot remain unchanged.
- Telegram remains manual: preview first, then explicit Owner confirmation to send.
- Existing Owner authorization and destination allow-list remain in place.
- No automatic Telegram sending is introduced.

## 3. New result workflow
An Owner-only result manager is mounted inside the existing Series 3 Telegram center.

Stages:
- یک‌شانزدهم نهایی — 16 matches
- یک‌هشتم نهایی — 8 matches
- یک‌چهارم نهایی — 4 matches
- نیمه‌نهایی — 2 matches
- رده‌بندی — 1 match
- فینال — 1 match

For each match, the Owner records the two exact Plato IDs and may save it as pending (no scores) or completed (both scores supplied). Plato IDs are validated against the registered Series 3 main-player list. A tie is rejected for a completed knockout match.

Saved result rows are then read by the existing Telegram Edge Function. The Telegram preview displays the saved player IDs and, for completed matches, the score and winner. The third-place placeholder uses the stable match key TP-1 when the official bracket snapshot does not yet contain a third-place fixture; sending that report remains blocked until a completed result is saved.

Participant IDs are entered explicitly and are not inferred from incomplete group standings. Existing bracket draws and group-stage data are not rewritten.

## 4. Database
Primary Supabase project: dfrppbapaaydbjeflozw

Migration file:
`supabase/migrations/20261121120000_series3_knockout_match_results.sql`

Created tables:
- `public.plato_land_series3_knockout_match_results`
- `public.plato_land_series3_knockout_match_result_history`

Security:
- RLS enabled on both tables.
- Read/insert/update policies for authenticated Owner only.
- No public or anonymous access policy.
- Insert/update history is recorded by a database trigger.
- No delete policy is provided.

The migration was applied to the primary Supabase project on 2026-11-21 and the presence of both tables and the Owner policies was verified. The migration did not insert, update, or delete any match or player result data.

## 5. Files changed
- `src/Series3KnockoutResultsManager.tsx` — new Owner result-entry interface.
- `src/Series3TelegramManager.tsx` — mounts the manager inside the existing Telegram center.
- `supabase/functions/plato-land-series3-telegram/index.ts` — reads saved knockout results and includes scores/winners in selected stage messages.
- `supabase/migrations/20261121120000_series3_knockout_match_results.sql` — isolated schema and RLS/history setup.

## 6. GitHub status
Repository: `Omidso82/Plato-land-preview`  
Base branch: `main`  
Feature branch: `feature/series3-knockout-results-telegram`  
Pull request: #295 — Add Series 3 knockout result entry and Telegram reporting  
PR URL: https://github.com/Omidso82/Plato-land-preview/pull/295  
PR status at document creation: Open / Draft / Unmerged.

## 7. Release and test status
- Primary database schema creation: completed and read-only verified.
- No knockout match result rows have been entered by this implementation.
- No group-stage result rows were changed.
- No Telegram message was sent.
- No Supabase Edge Function deployment was performed.
- No merge to main or production release was performed.
- GitHub CI and Preview verification: pending at the time of this document.
- Live iPhone/Safari validation: pending release and owner acceptance.

## 8. Release gate
Do not merge PR #295, deploy the Edge Function, or publish the live panel until CI and preview checks have been reviewed and the owner explicitly approves the release. A Preview deployment is not the live management panel.

## 9. Version history
- v1.0 — 2026-11-21: Records the approved Series 3 knockout result-entry and Telegram reporting scope, isolated primary-database schema, implementation files, PR #295, and release/verification boundaries.
