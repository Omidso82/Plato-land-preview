# PLATO LAND – Series 3 Admin Collapsible Cards Handover

**Version:** 1.0  
**Date:** 2026-11-20  
**Status:** Implemented on an isolated branch; awaiting review and release approval.

## 1. Request
Make every top-level card in the Series 3 administration area independently expandable/collapsible. When the Series 3 admin page is opened, all five cards must start collapsed.

## 2. Scope
The five top-level cards are:
1. Series 3 images and poster management
2. Important rules video management
3. Registration and waitlist management
4. Ranking, seeding, group draw, knockout draw, and fixture schedule
5. Telegram announcements center

## 3. Implementation
- The images/poster card already used a native `details/summary` disclosure and remains closed by default.
- The rules-video card now uses a native `details/summary` disclosure, closed by default.
- The registration card now uses a native `details/summary` disclosure, closed by default. Its separate roster-list toggle remains available inside the card.
- The ranking/draw card now uses a native `details/summary` disclosure, closed by default. Existing inner toggles for ranking, pots, group draw, knockout bracket, and player statistics remain unchanged. The official fixture schedule is inside this card and is therefore hidden until the card is opened.
- The Telegram center already starts collapsed and retains its existing open/close control and preview-before-send workflow.

## 4. Files changed
- `src/Series3VideoManager.tsx`
- `src/Series3RegistrationReport.tsx`
- `src/Series3SeedingManager.tsx`

The existing images and Telegram components were reviewed and already met the requested collapsed-by-default behavior, so they were not modified.

## 5. Protected behavior
No changes were made to:
- Supabase schema, rows, RLS, or RPC calls
- Registration, waitlist, withdraw, or promote operations
- Ranking calculations, stored group draw, knockout draw, or fixture snapshot
- Storage/R2 media operations or video activation
- Telegram preview/send implementation or destination
- Series 2 tools or the Main Website project

## 6. Git and release status
- Repository: `Omidso82/Plato-land-preview`
- Base: `main` at `d8f89e16e7c8193248a99bc0e5285234e39ae324`
- Branch: `feat/series3-admin-collapsible-cards-2026-11-20`
- Pull request: [#231](https://github.com/Omidso82/Plato-land-preview/pull/231)
- PR is draft, open, and not merged.
- No production deployment was performed.

## 7. Verification and remaining work
- Source review confirms the three changed components have closed-by-default disclosures.
- The branch comparison shows only the three intended source files plus this handover document.
- No CI workflow run or status check was returned for the PR head at the time of this handover; build/typecheck are therefore **not yet verified**.
- Next: run/confirm typecheck and build, review the mobile layout, then obtain owner approval before merge or deployment.
