# PLATO LAND – Series 3 Homepage Teaser Handover v1.0
**Date:** 2026-11-17  
**Status:** Draft implementation / QA pending  
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

## Implementation branch
- Repository: `Omidso82/Plato-land-preview`
- Base branch: `main`
- Base commit: `bc8bf1960d030cf8da20a194c6a2e6b0f7b656ad`
- Feature branch: `feature/series3-home-teaser-video`
- Draft PR: [#206](https://github.com/Omidso82/Plato-land-preview/pull/206)

## Changed files
- `src/Series3SlidesPanel.tsx`: owner controls for poster, teaser upload, and active media selection.
- `src/Series3Gallery.tsx`: renders the selected teaser as muted, looping, inline autoplay video; retains poster fallback and the independent rules-video modal.
- `supabase/migrations/20261117180000_series3_home_media_selector.sql`: additive RLS-protected selector table migration. It is committed to the feature branch only and has **not** been applied to Supabase.

## Storage plan
- Teaser object path: `series3-video/teaser/series3-home-teaser.mp4`.
- Existing `series3-video` bucket was verified public with a 100 MiB file limit and MP4-only MIME allowlist.
- Existing bucket owner upload/update/delete and public read policies already cover the bucket; no bucket policy change is included.
- Existing poster remains stored at its current path. Switching back to poster does not delete the teaser asset.

## Database plan
- New table: `public.plato_land_series3_home_media_settings`.
- Public read; authenticated owner-only insert/update.
- Initial selector row defaults to `poster` so the current poster remains the active display.
- Migration is not applied. No production database mutation has been performed.

## Verification status
- Branch and Draft PR created successfully.
- GitHub Actions Build and Deploy workflow runs were observed in progress; final conclusions are pending.
- No production deployment, PR merge, storage upload, asset replacement, or deletion has occurred.
- iPhone Safari autoplay, owner switching, and live end-to-end upload QA remain pending.
- No manual visual acceptance has been recorded.

## Required next steps
1. Confirm GitHub Actions typecheck/build/test outcomes.
2. Review the migration SQL and approve it separately before applying to the primary Supabase project.
3. After migration approval and application, owner uploads the actual MP4 teaser through the existing temporary admin panel.
4. Test iPhone Safari autoplay (muted, playsInline, loop), poster fallback, and switching between poster/video.
5. Obtain separate approval before merging or production deployment.

## Change log
- v1.0 (2026-11-17): Initial handover for the Series 3 homepage teaser feature. Draft only; QA and production approvals outstanding.
