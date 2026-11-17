# PLATO LAND – Temporary Projects
## Prediction Center – Public Directory and Jalali Picker Correction

**Document version:** 1.6.3  
**Date:** 2026-11-17  
**Status:** Implemented on isolated feature branch; PR open as Draft; production not changed.

## 1. Scope and user-approved behavior

This update covers only the Prediction Center within PLATO LAND – Temporary Projects.

- Add a home-page introduction card titled «پیش‌بینی‌های PLATO LAND».
- The card opens a dedicated public Prediction Center route at `?page=predictions`.
- Each public campaign appears as its own card.
- Selecting a card opens an independent detail view; participation is available only while the campaign is open and within its Tehran-local schedule.
- Published campaigns are listed. Closed campaign display is implemented in the UI model, but the current public RLS policy only exposes rows whose status is `published`; see section 5.
- Correct the Jalali picker so a Jalali text value is not parsed again as a Gregorian date.
- Format the Jalali year without thousands grouping.

## 2. Repository and isolation

- Repository: `Omidso82/Plato-land-preview`
- Base branch: `main`
- Base SHA: `60355a0fcb53ef87bd251391a1a810cba42e7a7a`
- Feature branch: `feature/prediction-public-directory-and-calendar-fix`
- PR #198: https://github.com/Omidso82/Plato-land-preview/pull/198
- No merge to main has occurred.

## 3. Files changed

- `src/App.tsx`: registers the public predictions route, adds browser-history support, and adds the home-page introduction card.
- `src/PublicPredictions.tsx`: separates the public campaign directory from each campaign's detail/participation view.
- `src/JalaliDateTimePicker.tsx`: recognizes already formatted Jalali date/time text before attempting ISO conversion and disables grouping in the year display.

## 4. Data and security boundary

- Primary Supabase project remains `dfrppbapaaydbjeflozw`.
- No database schema, data rows, migrations, RLS policies, Edge Functions, or Storage settings were changed.
- No campaign, vote, or test entry was created.
- Existing campaign and prediction data remain untouched.
- The public campaign query requests `published` and `closed`; RLS remains authoritative and currently filters public SELECT to `status = 'published'`.
- Participant entries remain private; the public UI does not read or expose voter IDs or individual responses.

## 5. Known limitation requiring a separate authorization

A read-only inspection of `pg_policies` on `public.plato_land_prediction_campaigns` confirmed:

- Owner management policy applies to authenticated users with the owner role.
- Public SELECT policy is exactly `status = 'published'`.

The existing owner panel changes a campaign's status to `closed` when the owner closes participation. Consequently, closed campaigns are not currently readable by anonymous visitors, even though the new UI has a closed-campaign card/detail state.

To meet the full requirement that closed campaigns remain publicly viewable, a narrowly scoped RLS policy change is needed (or an equivalent safe public-read interface). This has **not** been performed. Obtain explicit approval before changing RLS. Public result publication also needs a defined, safe public result field/contract; private entry rows must not be exposed.

## 6. Verification and deployment

- PR #198 Cloudflare preview deployment reported success for commit `c1c8c5e646ac62576bb6a9a34638c7f0f0540e5a`, preview URL: https://4049dda0.plato-land-preview.pages.dev
- A later commit `a741a7ff4db47d0c8a8da92cf348222223669693` updated browser-history support; Cloudflare reported a new build in progress at the last check.
- The preview URL above therefore must not be treated as verified for the latest branch head until the current deployment completes.
- Automated TypeScript/build verification for the final head remains pending confirmation.
- Live visual iPhone acceptance has not been performed.
- The preview host required an authenticated fetch session during automated page inspection; owner-side browser testing is still required.

## 7. Test plan for owner

After the latest branch preview reports successful deployment:

1. Open the preview URL on iPhone Safari.
2. Check the home-page «پیش‌بینی‌های PLATO LAND» card.
3. Open the card and verify the dedicated prediction directory route.
4. Open a published campaign card and verify its separate detail view.
5. Confirm the response form appears only when participation is open and the Tehran schedule permits it.
6. In the owner panel, open the start and end date pickers:
   - year must display as ۱۴۰۵, without a thousands separator;
   - existing date values must remain in Jalali form, not become ۷۸۴;
   - selecting a day must visibly mark the selected day in both start and end pickers.
7. Do not create a new campaign or submit a test prediction during this visual acceptance pass.

## 8. Version history

- v1.6.1: prior Prediction Center implementation report.
- v1.6.2: production release handover for the Jalali picker feature.
- v1.6.3: public campaign directory, independent detail view, Jalali parsing/year display correction, and current RLS/preview limitations.
