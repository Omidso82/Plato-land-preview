# PLATO LAND – Temporary Projects
## Series 3 Public Registration Flow – Handover

**Version:** 1.2  
**Date:** 2026-11-14  
**Status:** Implementation committed on feature branch; CI, merge, deployment, and live registration test pending.

### 1. Scope
This update adds a dedicated Series 3 registration journey and a call-to-action on the Series 3 public gallery. It remains independent of Series 2 and the Main Website.

### 2. User journey
- Public gallery: `/series3`.
- Gallery CTA: «مشاهده قوانین و ثبت‌نام سری سوم».
- Registration route: `/series3-registration`.
- The registration page reads the 18 ordered images from the independent `series3-slides` bucket (stable object keys `slides/01` to `slides/18`).
- One image is presented per step, with Previous/Next navigation and progress.
- On step 18, the participant must tick acceptance and enter a Plato ID.
- Plato ID validation permits English letters, digits and underscore, 2–30 characters.
- The form inserts into `public.plato_land_series3_registration_requests`; the table's unique normalized Plato ID constraint prevents duplicate registration.
- The submit control remains disabled until all 18 images are present, acceptance is checked, and the Plato ID is valid.
- A successful submission displays a confirmation. A duplicate ID displays a clear duplicate-registration message.

### 3. Data and isolation
- Existing primary Supabase project only: `dfrppbapaaydbjeflozw`.
- Registration table: `public.plato_land_series3_registration_requests`.
- Image bucket: `series3-slides`.
- No Series 2 tables, storage objects, or public registration flow are modified.
- No Main Website feature or route is changed beyond the approved temporary route handling in this repository.

### 4. Code changes
- Added `src/Series3Registration.tsx`.
- Updated `src/Series3Gallery.tsx` with the registration CTA.
- Updated `src/index.tsx` to route `/series3-registration`.
- Updated `vite.config.ts` to emit a GitHub Pages static entry for the route.

### 5. Important scope boundary
Series 3 rules, registration capacity, dates, prizes, eligibility conditions beyond the presented images, and tournament format have not been defined in this handover. The page therefore presents the uploaded rule images without inventing additional rules or limits. Do not copy Series 2 conditions into Series 3.

### 6. Verification still required
- CI TypeScript check and production build.
- Deploy to GitHub Pages.
- iPhone browser check of `/series3` and `/series3-registration`.
- Owner uploads all 18 rule images; verify they appear in the correct sequence.
- Submit one test Plato ID and verify the inserted row in the Series 3 table.
- Verify duplicate Plato ID is rejected.
- Confirm Series 2 homepage and management functions remain unchanged.

### 7. Change log
| Date | Version | Change |
|---|---|---|
| 2026-11-14 | 1.1 | Series 3 image management and public gallery deployed; manual image test pending. |
| 2026-11-14 | 1.2 | Added independent 18-step image-led Series 3 registration flow and gallery CTA; verification pending. |
