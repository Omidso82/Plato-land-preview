# PLATO LAND – Series 3 Homepage Poster R2 Handover
Version 1.1 | 2026-11-21 | Status: delete control merged and production deployment successful

## 1. Scope
Series 3 fixed homepage poster only, within PLATO LAND – Temporary Projects.
- Repository: `Omidso82/Plato-land-preview`
- Delete UI PR: https://github.com/Omidso82/Plato-land-preview/pull/283
- Merge commit: `ff43390f07a2c8d663771a36aa045a92f41a163f`
- Build/typecheck and production deploy workflows: successful.
- Main Website, teaser video, rules video, 17 slide images, and other event assets are out of scope.

## 2. Delete control
The existing Series 3 fixed-poster area now displays a separate **حذف پوستر** control whenever a poster is detected. It requires a second explicit confirmation before any deletion.

### R2 poster
- Only the canonical key is accepted: `plato-land/backgammon/series-3/public-media/poster/main-poster`.
- The current `poster_storage_path` must exactly match the displayed object key.
- The UI clears the metadata reference first, then calls the existing owner-authenticated Pages API with `asset=poster`.
- The API requires an approved Origin and owner authorization, checks object existence, deletes the exact allowlisted object, then checks that it is absent.
- If deletion fails after metadata was cleared, the UI attempts to restore the previous metadata reference and reports any rollback failure.
- No arbitrary R2 path can be supplied by the UI.

### Legacy Supabase poster
- If the panel still detects the legacy poster, deletion is restricted to `series3-slides/poster/series3-main-poster`.
- This path is only allowed when no R2 poster reference is registered.
- After removal, the panel lists the folder and confirms that the exact object name is absent.

## 3. Behavior and safeguards
- The poster's media mode is not automatically changed. If poster mode is selected and the poster is deleted, the homepage will have no fixed poster until another is uploaded or the owner changes media mode.
- Teaser/video settings and all other media are unchanged.
- No object was deleted by PR #283 or during its deployment.
- The code does not automatically delete any legacy file.
- No database schema, R2 bucket, binding, secret, DNS or Cloudflare access policy change was made.
- The existing R2 API already had an exact fixed-poster DELETE allowlist; this UI change reuses it.

## 4. Preview URL correction
The same change fixes the admin poster preview cache-busting URL: the R2 endpoint already has an `asset=poster` query parameter, so the cache-buster now uses `&v=` rather than appending a second `?`. The preview image uses the prepared URL directly.

## 5. Verification
- PR #283 merged: `ff43390f07a2c8d663771a36aa045a92f41a163f`.
- Build workflow run `44902273944`: success.
- Build/typecheck workflow run `44902273963`: success.
- Production deployment job: success.
- The similarly named `Workers Builds: plato-land-media-endpoint` check failed; this is the separate Worker service, not the Cloudflare Pages API endpoint. No Worker was changed.
- At the last check, Cloudflare Pages media endpoint check was still in progress; the existing API endpoint itself was not changed by this UI PR.

## 6. Owner usage
1. Open `https://platoland.org/series2-slides-manager/`.
2. Refresh and expand “مدیریت تصاویر و تیزر سری سوم”.
3. Under “پوستر ثابت”, use “حذف پوستر”.
4. Read the confirmation carefully; choose “تأیید حذف دائمی” only if the selected poster is definitely the one to remove.
5. Wait for the success message confirming the object is gone and the metadata reference is cleared.
6. Refresh the panel and public page to confirm the poster is no longer present.

## 7. Version history
- v1.0 — 2026-11-21: R2 poster upload and public display handover.
- v1.1 — 2026-11-21: Added confirmed deletion for the canonical R2 poster and the exact legacy Supabase poster path; recorded preview URL correction and production deployment.
