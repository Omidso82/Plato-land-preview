# PLATO ID Scanner — Owner Panel Integration

**Version:** 0.1  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 (Draft)

## Change
- Added a dedicated `PLATO ID Scanner` entry to the existing owner navigation.
- The entry is rendered only when the existing `canManage` predicate is true.
- Embedded the Scanner component in the existing owner panel.
- Added an `ownerMode` presentation prop. In this mode, the component does not show its own sign-out control and uses the existing Supabase client/session. The component still performs its own server-side role lookup before displaying owner data.
- Retained the dedicated `?page=id-scanner` route for operator self-registration/sign-in and their restricted workspace.

## Files changed
- `src/App.tsx`
- `src/PlatoIdScannerApp.tsx`

## Verification performed
- Re-fetched both files from the feature branch after commit.
- Confirmed owner navigation entry exists and is guarded by `canManage`.
- Confirmed the owner panel renders `<PlatoIdScannerApp ownerMode/>`.
- Confirmed the operator-only route remains present.
- Confirmed owner mode hides the component sign-out action.
- GitHub Actions runs were created for the latest feature commits; their final results are pending at the time of this document.

## Boundaries
- No changes to the `main` branch.
- No SQL migration applied to the primary Supabase database.
- No production Storage/Auth configuration changed.
- No operator account created.
- No OCR provider, paid service, Telegram credentials, or Telegram message configured.
- PR #123 remains Draft and unmerged; no deployment is authorized.

## Open verification items
1. Confirm TypeScript/build checks succeed on the latest branch head.
2. Browser-test owner entry with an existing owner session and confirm no second login is requested.
3. Test operator route with pending, approved, rejected and disabled accounts.
4. Review database RLS/Storage policy behavior after a separately approved test migration.
5. Complete OCR, corrections, daily/weekly reports and Telegram only after unresolved decisions and credentials are supplied/approved.
