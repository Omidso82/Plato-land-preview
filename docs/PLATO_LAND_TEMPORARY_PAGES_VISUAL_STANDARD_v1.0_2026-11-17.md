# PLATO LAND – Temporary Projects
## Temporary Pages Visual Standard & Release Record
**Document version:** 1.0  
**Date:** 2026-11-17  
**Status:** Production changes released; owner visual acceptance recorded  
**Scope:** Series 3 temporary home, public predictions, Series 3 registration, and Series 2 archive header consistency

---

## 1. Scope and separation

This document records only the approved visual/navigation standards and releases for **PLATO LAND – Temporary Projects**. It does not amend Series 2 tournament rules/results, Series 3 registration/waitlist rules, Prediction Center campaign rules, or the separate **PLATO LAND – Main Website** project.

Repository: `Omidso82/Plato-land-preview`  
Production branch: `main`  
Production domain: `https://platoland.org`

No database or Supabase changes were part of the visual work recorded here.

## 2. Approved shared brand header

The owner supplied a visual reference and approved a consistent PLATO LAND identity across temporary pages. The Series 2 archive header size was explicitly selected as the sizing reference.

The shared header component is:

- `src/TemporaryPageHeader.tsx`

The approved visual elements and reference dimensions in the shared component are:

| Element | Reference value |
|---|---:|
| Crown frame | 49 × 49 px |
| Crown icon | 30 px |
| PLATO LAND wordmark | 26 px |
| Persian tagline | 12 px |
| Gold divider | 132 px wide |
| Divider ornament | centered gold ✦ |

The header includes the crown in its framed badge, PLATO LAND wordmark, Persian tagline «بازی، رقابت، قهرمانی», and the gold divider. The shared component is used to prevent separate pages from drifting to different dimensions.

### Page navigation

- The Series 3 home is a root page and does not show a self-return button.
- Public predictions has an explicit return link to the Series 3 page.
- Series 3 registration has an explicit return link to the Series 3 page.
- The Series 2 archive retains its return-to-home navigation.
- New temporary subpages must include a clear return destination; browser-history-only navigation is not the standard.

## 3. Series 3 prediction card – approved content and placement

The approved card title is **«پیش‌بینی‌های سری سوم»**. The word «مرکز» is removed and the descriptive subtitle line is removed entirely.

The card destination remains:

`https://platoland.org/predictions`

The owner approved the card position **immediately below the «قوانین مهم سری سوم» button** on the Series 3 home page. Its existing visual treatment and destination remain unchanged by the placement move.

Owner acceptance: after the production change, the owner confirmed «درست شد عالی». This is recorded as visual acceptance of the card placement.

## 4. Implementation and release history

| PR | Recorded change | Result |
|---|---|---|
| [#199](https://github.com/Omidso82/Plato-land-preview/pull/199) | Added the Series 3 prediction card and filtered public campaigns to `event_key='series3'`; fixed Jalali picker display | Merged; build and production deploy succeeded |
| [#200](https://github.com/Omidso82/Plato-land-preview/pull/200) | Added the `predictions` static route entry to resolve the direct-route 404 | Merged |
| [#201](https://github.com/Omidso82/Plato-land-preview/pull/201) | Changed card title to «پیش‌بینی‌های سری سوم» and removed its subtitle | Merged |
| [#202](https://github.com/Omidso82/Plato-land-preview/pull/202) | Added the shared header and explicit back navigation to the relevant Series 3 pages | Merged |
| [#203](https://github.com/Omidso82/Plato-land-preview/pull/203) | Standardized the shared header dimensions to match the Series 2 archive reference | Merged |
| [#204](https://github.com/Omidso82/Plato-land-preview/pull/204) | Moved the prediction card immediately below the important-rules button | Merged; owner accepted the live result |

Latest recorded main merge commit for PR #204:

`bc8bf1960d030cf8da20a194c6a2e6b0f7b656ad`

GitHub Actions for that merge commit:

- Build and typecheck, run [44118763922](https://github.com/Omidso82/Plato-land-preview/actions/runs/44118763922): **SUCCESS**.
- Deploy PLATO LAND website, run [44118764096](https://github.com/Omidso82/Plato-land-preview/actions/runs/44118764096): **SUCCESS**.

## 5. Files affected by the visual standard

- `src/TemporaryPageHeader.tsx` — shared header and return navigation.
- `src/Series3Gallery.tsx` — Series 3 home header and prediction-card content/placement.
- `src/PublicPredictions.tsx` — shared header and return link.
- `src/Series3Registration.tsx` — shared header and return link.
- `src/Series2Registration.tsx` — Series 2 archive variant uses the shared header sizing.

## 6. Data, behavior, and scope boundaries

The work above did not:

- modify Supabase schema, RLS, Edge Functions, campaign rows, prediction entries, registration rows, or tournament results;
- create test campaigns, test votes, or test registrations;
- change the Series 3 prediction rules, prize rules, or draw method;
- change Series 2 rules/results;
- modify the separate PLATO LAND – Main Website project;
- create a new database, paid service, or additional hosting environment.

## 7. Remaining verification boundary

The production Build and Deploy workflows for PR #204 succeeded, and the owner confirmed the visible card placement. This is not a full visual regression certification of every viewport or every temporary page. The owner’s supplied iPhone screenshots remain the visual reference for page-to-page comparison.

## 8. Version history

- **v1.0 — 2026-11-17:** Records the approved shared header dimensions, page-return navigation standard, Series 3 prediction-card title/subtitle/placement decisions, PRs #199–#204, successful Build/Deploy workflows for PR #204, and owner acceptance.
