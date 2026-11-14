# PLATO LAND – Temporary Projects
## Series 3 Temporary Images & Gallery – Handover

**Version:** 1.0  
**Date:** 2026-11-14  
**Status:** Implementation committed to feature branch; CI and production deployment pending.

### 1. Scope and separation
This document covers only the temporary Series 3 image-management capability. It does not authorize or describe changes to PLATO LAND – Main Website. Series 2 objects, tables, pages, and data are kept separate and are not modified by this implementation.

### 2. Confirmed user authorization
The user approved:
- An independent Series 3 registration table and its access controls in the existing primary Supabase project.
- An independent Series 3 image bucket.
- Series 3 image upload controls inside the existing temporary owner-management panel.
- A public Series 3 image gallery route.
- Testing and publication of these Series 3-only changes.

### 3. Supabase primary project
Project ID: `dfrppbapaaydbjeflozw`  
Repository: `Omidso82/Plato-land-preview`  
Base branch at implementation start: `main`  
Base commit: `2b67158a2bda802968d7b945375a239a91d260f8`

#### 3.1 Registration table
Table: `public.plato_land_series3_registration_requests`

Columns: `id`, `plato_id`, `plato_id_normalized`, `rules_accepted`, `created_at`.

Constraints:
- Plato ID: English letters, digits and underscore; 2–30 characters.
- Normalized Plato ID is unique.
- `rules_accepted` must be true.

RLS is enabled. Anonymous users can insert accepted registration requests. Authenticated users can read, update and delete only rows allowed by the Owner RLS policies. Table-level grants were tightened so anon has INSERT only; authenticated has SELECT/UPDATE/DELETE only. Owner policy accepts role values `owner` and `مالک کل`.

**Important limitation:** A public registration form has not been implemented in this stage. Tournament rules, capacity, dates, and registration wording have not been established in this Series 3 handover and must not be inferred from Series 2.

#### 3.2 Image bucket
Bucket: `series3-slides`  
Visibility: public, for public display of event images.  
Maximum file size: 10 MiB.  
Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.

Storage object policies:
- Public listing/read scope is restricted to this bucket only.
- INSERT, UPDATE and DELETE are restricted to authenticated Owner accounts whose `user_roles.role` is `owner` or `مالک کل`.
- The bucket is independent of `series2-slides`.

Stable object keys:
- Slides: `slides/01` through `slides/18`.
- Main poster: `poster/series3-main-poster`.

Uploads replace only the corresponding Series 3 slot. No Series 2 object is used or changed.

### 4. Code changes
Feature branch: `feat/series3-temporary-image-management-2026-11-14`

Files added:
- `src/Series3SlidesPanel.tsx` — owner-only upload UI for 18 images and one main poster.
- `src/Series3Gallery.tsx` — public read-only gallery.

Files updated:
- `src/Series2SlidesManager.tsx` — embeds the Series 3 upload section in the existing temporary owner panel; existing Series 2 controls remain in place.
- `src/index.tsx` — adds public route `/series3`.
- `vite.config.ts` — creates the static GitHub Pages entry for `/series3`.

### 5. User-facing paths
- Existing temporary management panel: `https://platoland.org/series2-slides-manager`
  - New section: «مدیریت تصاویر سری سوم».
- New public image gallery: `https://platoland.org/series3`.

### 6. Verification record
Completed before publication:
- Confirmed current GitHub `main` commit and repository.
- Confirmed existing Series 2 bucket remains separate.
- Confirmed Series 3 bucket exists with public visibility, 10 MiB limit and the three allowed image MIME types.
- Confirmed Series 3 Storage policies: public read/list for this bucket; Owner-only upload, replacement and deletion.
- Confirmed Series 3 registration table has RLS enabled and Owner policies.
- Tightened Series 3 registration table grants to remove unintended broad table privileges.
- No Series 2 registration rows, slides or poster objects were changed.

Pending:
- GitHub Actions typecheck and build.
- Production deployment after successful checks.
- Post-deployment smoke tests of both URLs and an actual authenticated image upload/replace test.

### 7. Not included
- Series 3 tournament rules, capacity, schedule, group format, prizes, or match structure.
- Public Series 3 registration UI.
- Changes to Series 2 data or public page.
- Changes to Main Website features or database structures.
- Upload of actual tournament images; the 18 slots and poster are ready for the Owner to populate.

### 8. Change log
| Date | Version | Change |
|---|---|---|
| 2026-11-14 | 1.0 | Created independent Series 3 registration data controls, image bucket and policies, upload panel and public gallery route. CI/deployment status pending at document creation. |
