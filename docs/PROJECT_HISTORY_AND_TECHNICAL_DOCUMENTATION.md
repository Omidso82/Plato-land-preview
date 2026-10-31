# PLATO LAND Tournament Platform
## Project history, technical decisions, security model and change log

**Document version:** 1.0  
**Last updated:** 2026-10-31  
**Status:** The latest administration-dashboard layout has been reviewed and explicitly approved by the project owner.  
**Canonical code repository:** `Omidso82/Plato-land-preview`, branch `main`  
**Latest confirmed main commit:** `36a8bbc3e78a69c97ff54cef36c05b5c128eff45`  
**Website domain:** `https://platoland.org`  
**Supabase project referenced by the implementation work:** `dfrppbapaaydbjeflozw`

> This document records the decisions and implementation work known at the date above. It distinguishes code/database changes from checks that were actually performed. It is not a claim that every end-to-end scenario has been tested with real player and manager accounts.

---

## 1. Product purpose and governing principles

PLATO LAND is a Persian, right-to-left tournament platform for multiple games on Plato. It is not a backgammon-only site.

### Approved product identity
- Brand/title: **PLATO LAND**
- Tagline: **«بازی، رقابت، قهرمانی»**
- Visual direction: premium dark gaming presentation, black and gold palette, crown motif and clear typography.
- Interface language: Persian (Iranian Persian), RTL.
- The public-facing platform is intended to support different games and independently configured tournaments.

### Project governance rules
1. Each series and tournament is an independent record. Never merge Series 1 and Series 2 information, rules, players, groups, draws, schedules, or results.
2. Unknown or unapproved information must be marked **«در انتظار تأیید»**. Names, IDs, scores, placements, rules, and dates must never be guessed.
3. Preserve existing records and the existing database structure. A change to one feature must not silently reset or rewrite unrelated data.
4. Do not publish Series 1 until the owner supplies and approves its complete information.
5. Do not treat a prototype, local browser state, or a successful compile as proof that a production workflow works end-to-end.
6. Avoid unnecessary paid services, token purchases, or premature publication. The owner is not expected to write or run code manually.

---

## 2. Series and tournament content boundaries

### Series 1
- Series 1 is intentionally kept out of the public tournament list.
- The existing tournament record inspected during the implementation work had ID `98a54687-bbb7-4b45-8a51-273ce0143159`, title «لیگ جدید», and series name «سری اول».
- Its database state was changed to `status='draft'` and `registration_open=false`.
- This was a visibility/registration safeguard. It did not authorize publishing Series 1 or inventing its missing public details.
- Keep it draft and closed until the owner explicitly provides and approves its complete content.

### Series 2 — backgammon
- Series 2 is a separate project scope and must not inherit Series 1 registrations, IDs, groups, results, or schedule.
- The approved final Series 2 rules contain **17 items**, not 15. The earlier 15-item version or a summary is not the final rules.
- The exact full approved 17-item text must be retrieved from the authoritative project record before inserting it into the website. It must not be reconstructed from memory or replaced with a summary.
- The implementation work described here did not insert an invented rules text into the database.

---

## 3. Tournament configuration model

The tournament builder is intended to configure each tournament independently.

### Participation format
- Individual participation.
- Team participation.
- Both individual and team participation, where the tournament permits the player to choose.
- Team roster registration currently supports a pre-formed team: a team leader submits the team name and the required teammates.
- The alternative workflow in which players register individually and an administrator later forms teams is deliberately disabled/not available yet. The form blocks this incomplete workflow rather than accepting partial team records.

### Capacity
- Capacity is stored per tournament, not as one global site-wide limit.
- A capacity may be a positive number or left blank for unlimited capacity.
- The unit is configurable as **players** or **teams**.
- When capacity is measured in teams, one complete team registration consumes one team slot; team members remain stored as a roster and are not counted as separate teams.
- The database registration record uses `slot_count=1` for a team registration.

### Reserve queue
- Reserve registration is configurable independently for each tournament.
- When enabled and the main capacity is full, further eligible submissions can be placed in the reserve queue.
- The reserve closing window is configurable per tournament using `platform_settings.reserve_close_days_before`; the implementation has a one-day fallback if no value is configured.
- A value of 0 means the reserve window closes at the tournament start; 1 means one day before; larger values mean that many days before.
- Reserve positions are stored and the manager dashboard displays the queue.
- Rejecting a pending non-reserve registration promotes the next reserve according to the database function logic. Rejecting a reserve does not trigger another promotion.
- A reserve request is not treated as an approved main-capacity slot.

### Tournament progression and public display
The tournament form includes configuration for:
- Group stage followed by knockout.
- Groups only.
- Knockout only.
- Qualifiers per group where relevant.
- Seeding metric and order, with tie-break criteria.
- Public visibility switches for seeding/pots, draw/groups, group tables/results, and knockout bracket.
- Tournament status, publication, start date, description, rules, and prizes.

These settings are per tournament. A form control being present does not itself prove a complete live competition engine or a fully populated draw/results dataset.

---

## 4. Registration workflow and evidence handling

### Player flow
1. A player creates an account or signs in using Supabase Auth.
2. The player opens a published tournament with registration open.
3. The player reads the rules for that specific tournament and must accept them before submitting.
4. The form collects the display name and Plato ID.
5. A complete Plato profile screenshot is required. The screenshot is intended to show the profile information used for review, including wins and level.
6. Team tournaments collect the team name and required roster details when the selected team-entry mode is pre-formed team.
7. The submission is sent to the database RPC and stored with a review status.

### Evidence requirements and privacy
- Profile evidence is required at submission.
- The UI enforces a maximum evidence file size of 8 MB.
- Evidence is uploaded under a user/tournament-scoped path.
- The `registration-evidence` Storage bucket is private (`public=false`).
- Evidence is not intended to be publicly browseable. Signed links are generated for authorized review and have a limited lifetime (15 minutes in the manager dashboard implementation).
- The implementation does **not** perform OCR or automatically verify wins/level from the screenshot. A human owner/authorized tournament manager reviews the evidence.
- The player must use the Plato ID associated with the signed-in profile for the primary player identity.

### Persistence and review states
- Registration submissions are persisted in Supabase, not merely in localStorage.
- The workflow uses pending, approved, and rejected review states.
- Existing localStorage-only review behavior was removed from the registration review path.
- The registration review dashboard loads registrations from the shared database and uses database RPCs for approval/rejection.
- Existing records and the private evidence bucket are preserved.

---

## 5. Database objects and security boundaries

The implementation work referenced the following existing or added database objects:

### Tables
- `public.tournaments`
- `public.registrations`
- `public.registration_evidence`
- `public.profiles`
- `public.user_admin_permissions`
- `public.tournament_manager_access`
- `public.registration_members` — added to keep team rosters linked to a registration.
- `public.player_bans` — persistent player-ban records, using the existing table schema discovered during implementation.

The registration model includes fields such as `tournament_id`, `player_id`, `status`, `rules_accepted_at`, `evidence_path`, `registration_type`, `is_reserve`, `display_name`, `plato_id`, `team_name`, `reserve_position`, and `slot_count`.

### Role model
- **Owner (`owner` / UI label «مالک کل»):** full site-level administration.
- **Tournament manager (`tournament_admin` / UI label «مدیر مسابقات»):** limited to tournaments explicitly assigned to that manager.
- **Ordinary player:** no site-wide or tournament-management controls.

### Owner-only functions and surfaces
The owner-only site administration includes:
- Global tournament creation/edit/delete and publication controls.
- Site user management.
- Assignment of tournament-specific managers.
- Homepage video announcement management.
- Persistent player-ban management.
- Legacy tournament import.
- Site-level settings.

The shield/admin entry point is rendered only when the authenticated account has the owner role. Tournament managers and ordinary users must not see the shield entry point.

### Tournament-manager scope
- A manager sees and reviews only tournaments assigned to that manager.
- The manager dashboard is scoped by `tournament_manager_access`.
- Managers may review assigned-tournament registrations and evidence.
- Managers do not receive global site administration, user management, tournament creation/edit/delete, or site-wide settings.
- Manager assignment itself is owner-only.
- At the time of the database inspection, no manager assignments existed.

### Row Level Security and private storage
The security implementation includes:
- `private.can_manage_tournament(p_tournament_id)` as the authorization helper for owner or assigned manager access.
- Public tournament reads limited to published tournaments; unpublished tournament visibility is limited to the owner/assigned manager.
- Registration reads scoped to the submitting player, owner, or assigned manager.
- Registration review/update scoped to owner or assigned manager.
- Evidence reads scoped to the submitting player, owner, or assigned manager.
- Private Storage policies restricting evidence access to the appropriate player and authorized reviewers.
- Owner-only policies on `player_bans` for select/insert/update/delete.

**Important:** hiding a button is not the security boundary. The database RLS policies and authorization checks are required and form the actual access-control layer.

### Player bans
- Owner-managed ban records persist in `public.player_bans`.
- Plato IDs are normalized using lowercase/trimmed values for comparison.
- The registration submission function checks the primary Plato ID and every supplied team roster ID against active global bans and bans scoped to the selected tournament.
- A ban may be global or limited to a selected tournament.
- The UI persists additions and removals in the database; it does not rely only on browser memory.

---

## 6. Database RPCs and transaction behavior

The implementation work updated or used these functions:

### `public.submit_tournament_registration(...)`
The full signature accepts tournament ID, submitted rules, evidence and player/team details. Its logic includes:
- authenticated-user and profile checks;
- Plato ID validation;
- exact comparison of the accepted rules with the tournament's current rules;
- tournament publication, registration-open, and date checks;
- verification that the evidence path belongs to the submitting user and tournament and that the object exists in the private bucket;
- individual or pre-formed-team validation;
- team name and roster ID checks, including duplicate checks;
- capacity calculation using the tournament's capacity and capacity unit;
- reserve-queue handling when enabled;
- persistent registration, member roster, and evidence records in the database transaction;
- active-ban checks for all IDs included in the registration.

The former weak three-argument overload `submit_tournament_registration(uuid,text,jsonb)` was revoked from `public`, `anon`, and `authenticated` so clients cannot fall back to the older signature.

### `public.review_tournament_registration(uuid,boolean)`
- Requires authentication.
- Locks the pending registration row with `FOR UPDATE`.
- Checks owner/assigned-manager authorization for that tournament.
- Updates registration/evidence review state transactionally.
- Promotes the next reserve after rejection of a non-reserve registration.
- Does not promote another reserve when a reserve request itself is rejected.

### `public.withdraw_tournament_registration(uuid)`
- Performs an authenticated, owner-checked withdrawal.
- Uses the defined promotion behavior when a main slot becomes available.

### Other role/admin RPCs
- `current_user_role` reads the caller's role for UI gating.
- `admin_list_site_users` is restricted to the owner.
- Execute grants were narrowed to authenticated users for the relevant functions, while authorization remains enforced inside the function bodies.

---

## 7. Administration dashboard — approved navigation structure (2026-10-31)

### Before
The owner dashboard had many administrative tools presented in a long, vertically stacked page. This made it harder to find a particular tool and required unnecessary scrolling.

### Implemented change
The admin dashboard was reorganized into a responsive Persian navigation menu. Only the selected management section is displayed at a time.

The navigation sections are:

1. **درخواست‌ها** — review pending/approved/rejected tournament registration requests; for an assigned manager, this is the manager's permitted review area.
2. **مسابقات** — owner-only tournament creation, editing, publication, and tournament list.
3. **مدیران مسابقه** — owner-only assignment of managers to individual tournaments.
4. **کاربران سایت** — owner-only site-account list and user-management entry.
5. **محتوای صفحه اصلی** — owner-only homepage video announcement controls.
6. **انتقال اطلاعات** — owner-only legacy tournament import from the browser's old local data.

### Access and behavior
- The requests section is available to the owner and authorized tournament managers, within their database-enforced scope.
- The other five sections are shown only to the owner.
- Clicking a navigation item changes the selected section without changing database records.
- The existing feature handlers, Supabase calls, and role checks were retained; the work reorganized the dashboard presentation rather than rewriting the underlying workflows.
- The menu uses a responsive grid, clear selected-state styling, gold accents, and mobile breakpoints.
- A separate stylesheet, `src/admin-dashboard.css`, contains the navigation-specific styles.
- `src/App.tsx` imports that stylesheet and holds the selected section state.

### Approved section keys in the code
- `requests`
- `tournaments`
- `managers`
- `users`
- `content`
- `transfer`

### Files changed for this navigation work
- `src/App.tsx`
- `src/admin-dashboard.css` (new)

### Change record
- Pull request: [#10 — Organize admin panel into separate navigation sections](https://github.com/Omidso82/Plato-land-preview/pull/10)
- Merge commit: [`36a8bbc3e78a69c97ff54cef36c05b5c128eff45`](https://github.com/Omidso82/Plato-land-preview/commit/36a8bbc3e78a69c97ff54cef36c05b5c128eff45)
- The project owner explicitly confirmed on 2026-10-31 that the updated structure and appearance were correct and approved.

---

## 8. Other implemented owner and player features

### Site user management
- Owner can view the site account list independently of tournament registrations.
- Search supports display name, Plato ID, and email.
- The owner-only delete action calls the `admin-delete-user` Edge Function.
- The user is asked to confirm the irreversible deletion before the call is made.
- This is distinct from withdrawing a tournament registration.

### Homepage video announcement
- Owner can set a video title, upload a video, enable/disable homepage display, and remove the announcement.
- Supported formats in the UI: MP4, WebM, MOV.
- UI limit: 50 MB.
- The announcement is displayed only when enabled and a valid video URL is available.

### Profile and authentication
- Supabase Auth is used for sign-in/sign-up.
- Player profile includes display name, Plato ID, and optional personal avatar.
- The avatar UI limit is 2 MB.
- The profile area includes the player's registration history as represented by the available data.

### Preview-as-player mode
- Owner can switch to a read-only player-view preview and return to management.
- The preview mode does not grant additional database privileges.

---

## 9. Validation performed and known limits

### Checks confirmed during the implementation sequence
- The admin-navigation branch passed `npm install`.
- `npm run typecheck` completed successfully.
- `npm run build` completed successfully.
- GitHub Actions verification for the navigation change completed those steps successfully before the change was merged.
- The change was merged into `main` as commit `36a8bbc3e78a69c97ff54cef36c05b5c128eff45`.
- The owner subsequently confirmed the updated structure and appearance.

### Database checks recorded during the implementation sequence
- Existing database records were inspected before changes.
- At the time of inspection: one tournament, zero registrations, zero evidence records, and zero tournament-manager assignments.
- The private `registration-evidence` bucket was confirmed to have `public=false`.
- The Series 1 tournament row was confirmed as draft with registration closed.
- Owner RLS behavior for reading `player_bans` was tested in a transaction and rolled back.
- Plato ID normalization and a roster-ban match were tested in a transaction and rolled back.
- Reserve-cutoff date calculations were checked for 0-, 1-, and 7-day settings.
- No real production registrations or manager assignments were created as test data.

### Not claimed as fully verified
- Full end-to-end tests with separate real player, owner, assigned-manager, and unassigned-manager accounts were not completed in the recorded work.
- Automated OCR or screenshot-content validation is not implemented.
- The exact Series 2 17-rule text still needs to be loaded from its authoritative approved source before it can be displayed as final website content.
- The Supabase Auth leaked-password protection warning remained unresolved; it was not changed by guessing at configuration.
- Supabase advisor warnings also remained for some SECURITY DEFINER functions and performance/index recommendations. Function bodies include authorization checks, but those warnings should remain visible in the technical backlog until separately reviewed.
- The successful build/typecheck is not, by itself, a proof of every production workflow.
- This document does not claim a separate live-domain smoke test was run by an automated browser. The owner has now confirmed that the latest visible dashboard changes are correct.

---

## 10. Technical backlog and safeguards

These items are intentionally not represented as completed:

1. Run controlled end-to-end permission tests using distinct owner, assigned-manager, unassigned-manager, and ordinary-player accounts.
2. Review the remaining Supabase Security Advisor warnings, especially leaked-password protection and SECURITY DEFINER exposure, without weakening working authorization.
3. Review performance advisor findings: unindexed foreign keys, RLS initplan warnings, unused/duplicate indexes. Apply only measured, safe changes.
4. Retrieve and insert the exact owner-approved 17-item Series 2 rule text.
5. Validate registration, evidence review, team roster, reserve promotion, withdrawal, and ban enforcement in a non-production/staging environment before relying on them for a live event.
6. Confirm deployment workflow status for future code changes; do not equate a merged commit with a verified production deployment.
7. Keep Series 1 unpublished until the owner supplies its full approved details.

---

## 11. Change log

| Date | Change | Scope / result |
|---|---|---|
| 2026-10-31 | Persistent player bans and roster checks | Ban records persisted in Supabase; normalized Plato ID checks include team roster IDs; owner-only RLS. |
| 2026-10-31 | Reserve cutoff configuration | Registration RPC uses per-tournament reserve-close configuration, with a one-day fallback. |
| 2026-10-31 | Series 1 safety state | Existing Series 1 record set to draft and registration closed; not published. |
| 2026-10-31 | Registration security hardening | Legacy weak RPC signature revoked; review/withdraw and evidence access paths use authorization checks. |
| 2026-10-31 | Admin dashboard navigation | Six-section responsive dashboard menu added; existing feature handlers and permission boundaries retained. |
| 2026-10-31 | Owner acceptance | Owner confirmed the new dashboard structure and appearance were correct. |

---

## 12. Canonical references

- Repository: https://github.com/Omidso82/Plato-land-preview
- Latest approved navigation change: https://github.com/Omidso82/Plato-land-preview/commit/36a8bbc3e78a69c97ff54cef36c05b5c128eff45
- Pull request #10: https://github.com/Omidso82/Plato-land-preview/pull/10
- Production domain: https://platoland.org

**Maintenance rule:** update this document whenever a code, database, security, or product decision is changed. Record the date, affected files/database objects, validation performed, and whether the owner approved the result. Keep proposed changes separate from approved decisions.
