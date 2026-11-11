# PLATO ID Scanner — Technical Implementation Notes

**Project:** PLATO LAND – Temporary Projects  
**Status:** Approved design; implementation in progress  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Base:** `main` at `abb1556b57f9c9b73cdc83ea2486ffd01ffd023a`

## Approved operator onboarding

1. Operator opens the dedicated scanner entry point.
2. Operator self-registers with email and password using Supabase Auth.
3. Supabase email confirmation is required.
4. A confirmed account remains **pending owner approval** and receives no scanner data access.
5. The owner reviews pending scanner access requests in the owner workspace and approves or rejects them.
6. Only an approved account can use scanner upload and view its own submissions.

The scanner operator is a separate application-level role. Never assign `owner` or `tournament_admin` to an operator. Do not extend the existing `user_roles` CHECK constraint merely to grant scanner access.

## Owner and operator access

- Owner uses the existing owner login and can see/manage all scanner submissions.
- Operator uses a separate Supabase Auth account and can access only the scanner.
- Operator can read and manage only their own uploads, OCR results, corrections and report history.
- Both owner and operator may edit OCR results, send report versions, and finalize reports, according to the approved design.
- All permissions must be enforced server-side and through RLS/Storage policies; hiding UI is not authorization.

## Approved scanner workflow

- Multiple images are retained as separate uploads.
- A backend OCR service produces one canonical extraction result used by both the panel and Telegram.
- Operator can correct extracted IDs after Telegram delivery and send a new version.
- Daily buckets use the Iranian Jalali date and `Asia/Tehran`.
- Daily reports close automatically but remain editable.
- Weekly activity runs Saturday–Friday. Each ID appears once if active at least one day; one star per active day.
- Weekly table is updated and sent after each day; full weekly report is sent after Friday.
- Previous days/weeks remain editable and corrections recalculate dependent weekly tables.
- Telegram destination is fixed to the approved test group; no operator destination control.

## Current implementation constraints discovered

- Existing browser auth uses Supabase Auth email/password.
- Existing global app session resolution expects a `profiles` row. Scanner-only users therefore require a separate scanner route/session handling path that does not accidentally grant or require the ordinary player profile.
- Existing `current_user_role()` resolves owner and tournament-admin roles. Scanner access must not be represented as either role.
- Existing `user_roles` has an established role model; do not alter it for scanner access without a separately reviewed migration.
- Existing Storage buckets include public and purpose-specific buckets. Scanner images require a new private bucket with narrowly scoped RLS.
- Existing app is a React/Vite single-page app. A dedicated `?page=id-scanner` route must be isolated from the normal admin workspace and public navigation.

## Work sequence

1. Build the dedicated scanner route and auth states: sign-up, email-confirmation pending, owner-approval pending, approved, rejected/disabled.
2. Add a scanner access registry and owner approval interface with strict RLS.
3. Add private image storage and upload metadata/results tables.
4. Implement OCR after selecting an acceptable engine and validating its privacy, accuracy, runtime compatibility and cost.
5. Add correction history, daily/weekly aggregation, versioned Telegram outbox and idempotent delivery.
6. Test authorization boundaries, date rollover, duplicate IDs, OCR ambiguity, retries, edits to closed days and weekly recalculation.
7. Submit a draft PR; do not merge, deploy, change production schema, create accounts or send Telegram messages without the required approvals.

## Explicit non-actions

No production migration, Storage bucket, user account, OCR provider, Telegram delivery, main-site deployment, or paid service has been created or changed as part of this initial implementation step.
