# PLATO LAND – Series 3 Homepage Teaser Handover v1.1
**Date:** 2026-11-17  
**Status:** Merged and deployed; asset upload and device QA pending  
**Project:** PLATO LAND – Temporary Projects  
**Event:** Series 3

## Approved scope
Add an optional MP4 teaser to the Series 3 public home page. The owner can choose between the existing static poster and the teaser video. The implementation is isolated to Series 3 temporary pages and the existing temporary owner panel.

## Existing behavior preserved
- Existing poster object: `series3-slides/poster/series3-main-poster`.
- Existing rules video object: `series3-video/rules/series3-important-rules.mp4`.
- Existing rules-video settings and event analytics remain independent.
- Existing 17 rule-image slots remain unchanged.
- Registration, waitlist, predictions, seeding, match data and Series 2 archive are out of scope.
- PLATO LAND – Main Website is out of scope.

## Repository and release
- Repository: `Omidso82/Plato-land-preview`
- Feature branch: `feature/series3-home-teaser-video`
- PR: [#206](https://github.com/Omidso82/Plato-land-preview/pull/206)
- PR merged successfully on 2026-11-17.
- Merge commit on `main`: `26b88389595a9f33c051b19b3f641f1737cb7ce1`.
- PR head before merge: `7faacd5c689a3d2f725d71b00d4343cea04eea6c`.

## Changed files
- `src/Series3SlidesPanel.tsx`: owner controls for poster, teaser upload, and active media selection.
- `src/Series3Gallery.tsx`: renders the selected teaser as muted, looping, inline autoplay video; retains poster fallback and the independent rules-video modal.
- `supabase/migrations/20261117180000_series3_home_media_selector.sql`: additive RLS-protected selector table migration.
- `docs/series3/PLATO_LAND_SERIES3_HOMEPAGE_TEASER_HANDOVER_v1.0_2026-11-17.md`: original draft handover (retained as historical record; its pending-status statements are superseded by this v1.1).

## Database status — verified applied
- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- Table: `public.plato_land_series3_home_media_settings`.
- Migration applied successfully; registered migration version: `20261117165728`, name `series3_home_media_selector`.
- Verified initial row: `id=1`, `media_mode='poster'`, `storage_path='teaser/series3-home-teaser.mp4'`, `updated_by=null`.
- Verified RLS policies: public SELECT; authenticated owner-only INSERT and UPDATE.
- Poster remains selected by default. No teaser file has been uploaded, and no public media-mode switch has been made.

## CI and deployment — verified successful
- GitHub Actions Build and typecheck run: [run 1178](https://github.com/Omidso82/Plato-land-preview/actions/runs/44131928316) — success. Typecheck, production build, existing Deno tests and Deno check all passed.
- GitHub Actions Deploy PLATO LAND website run: [run 928](https://github.com/Omidso82/Plato-land-preview/actions/runs/44131928327) — success.
- Deploy run used merge commit `26b88389595a9f33c051b19b3f641f1737cb7ce1`; build, Pages artifact upload, and the `deploy-pages` job all completed successfully.
- Live Series 3 route responds at `https://platoland.org/series3/`. Automated text extraction confirms the route content loads; it is not a substitute for visual iPhone QA.

## Owner panel route and next user action
- Owner panel route: `https://platoland.org/series2-slides-manager/`.
- The existing manager imports and renders `Series3SlidesPanel`; the newly deployed component includes a separate “رسانه اصلی صفحه اول سری سوم” control, teaser MP4 upload and poster/video selector.
- On iPhone, refresh the page fully (Safari reload; if the old screen persists, close that tab and reopen the route). Then expand “مدیریت تصاویر و تیزر سری سوم”.
- Confirm that the panel now shows “رسانه اصلی صفحه اول سری سوم”, “ویدیوی تیزر صفحه اول”, and the current mode “پوستر ثابت”.
- Do not switch to video until the actual MP4 is uploaded and its presence is confirmed.
- Upload limit: MP4 only, non-empty, maximum 100 MiB. Target object: `series3-video/teaser/series3-home-teaser.mp4`.
- After upload, verify the object exists; only then owner may select “نمایش ویدئوی تیزر”.
- Test iPhone Safari autoplay (muted, playsInline, loop), poster fallback and switching back to poster. Switching back must not delete the uploaded teaser.

## Safety and scope
- Existing poster and rules video have not been replaced or deleted.
- No Series 2 records, Series 3 registration/waitlist/prediction/match data, or 17 rule-image slots were changed.
- No PLATO LAND – Main Website feature scope was changed; deployment was the repository's configured GitHub Pages release.
- No storage upload or public video activation has occurred.

## Change log
- v1.0 (2026-11-17): initial draft handover, written before merge and migration.
- v1.1 (2026-11-17): records verified primary Supabase migration, PR #206 merge, successful CI and successful GitHub Pages deployment; updates next steps to owner upload and iPhone QA.
