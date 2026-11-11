# PLATO ID Scanner — Owner Panel Integration

**Version:** 0.2  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only  
**Branch:** `feature/plato-id-scanner-v0-1`  
**PR:** #123 (Draft)

## Change
- Added a dedicated `PLATO ID Scanner` entry to the existing owner navigation.
- The entry is rendered only when the existing `canManage` predicate is true.
- Embedded the Scanner component in the existing owner panel.
- Added an `ownerMode` presentation prop. In this mode, the component uses the shared Supabase client/session and hides its own sign-out control.
- The component independently checks the current account's owner role before showing owner data.
- Additional fail-closed guard: if embedded owner mode cannot verify the owner role, it stops and does not fall through to operator self-registration/access lookup.
- Retained the dedicated `?page=id-scanner` route for operator self-registration/sign-in and their restricted workspace.

## Files changed
- `src/App.tsx`
- `src/PlatoIdScannerApp.tsx`
- `docs/PLATO_ID_SCANNER_OWNER_PANEL_INTEGRATION_v0.1.md` (this record)

## Verification performed
- Re-fetched the modified source files from the feature branch after writes.
- Confirmed owner navigation entry exists and is guarded by `canManage`.
- Confirmed the owner panel renders `<PlatoIdScannerApp ownerMode/>`.
- Confirmed the operator route remains present.
- Confirmed owner mode hides the component sign-out action.
- Confirmed owner-mode role-check failure stops instead of falling through to operator mode.
- GitHub Actions verification run **#662** completed successfully for the preceding code commit: TypeScript check, production build, and the two existing Deno tests passed.
- The separate Pages workflow build was cancelled by the repository's concurrency group before production build/upload; its deploy job was cancelled. No deployment occurred.
- The latest fail-closed guard commit was pushed after run #662; its own CI result is not yet available at the time of this version.

## Boundaries
- No changes to the `main` branch.
- No SQL migration applied to the primary Supabase database.
- No production Storage/Auth configuration changed.
- No operator account created.
- No OCR provider, paid service, Telegram credentials, or Telegram message configured.
- PR #123 remains Draft and unmerged; no deployment is authorized.

## Open verification items
1. Obtain passing CI for the latest fail-closed guard commit.
2. Browser-test owner entry with an existing owner session and confirm no second login is requested.
3. Test operator route with pending, approved, rejected and disabled accounts.
4. Review database RLS/Storage policy behavior after a separately approved test migration.
5. Complete OCR, corrections, daily/weekly reports and Telegram only after unresolved decisions and credentials are supplied/approved.
