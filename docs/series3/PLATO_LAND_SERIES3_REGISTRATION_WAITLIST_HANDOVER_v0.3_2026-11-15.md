# PLATO LAND – Series 3 Registration, Waitlist & Active Statistics
## Technical handover v0.3 – 2026-11-15

### 1. Scope
This record applies only to Series 3 within **PLATO LAND – Temporary Projects**. It does not amend Series 2 records or the PLATO LAND – Main Website project.

### 2. Approved business rules
- Main roster capacity is exactly 32 players.
- Registration remains open after the main roster reaches 32; later valid applications enter the waitlist.
- Waitlist order is oldest registration first, with registration ID as stable tie-breaker.
- Owner manually opens and closes registration.
- Owner may remove a player from active lists. This is a soft withdrawal: the registration row and original timestamp are retained.
- Owner may promote only the first waitlist request, and only when the main roster has fewer than 32 players.
- No automatic promotion scheduler or date/time-based closure is implemented. The exact local tournament start time on Saturday 30 Aban 1405 was not supplied; no cutoff hour is assumed.

### 3. Primary implementation
- Repository: `Omidso82/Plato-land-preview`
- Primary branch: `main`
- Primary Supabase project: `dfrppbapaaydbjeflozw`
- Temporary management panel: https://platoland.org/series2-slides-manager/
- Registration table: `public.plato_land_series3_registration_requests`
- Main owner report: `src/Series3RegistrationReport.tsx`
- Active statistics/seeding component: `src/Series3SeedingManager.tsx`

### 4. Registration and waitlist release
Migration `20261115143405_series3_owner_registration_controls_and_waitlist` was applied to the primary Supabase project with the user's explicit approval.

It introduced:
- `registration_status`: `main`, `waitlist`, `withdrawn`.
- Owner-controlled registration open/close setting.
- Controlled public registration RPC and owner-checked management RPCs.
- Database-enforced 32-player main capacity and ordered waitlist.
- Soft withdrawal preserving registration history.
- Manual promotion restricted to the first waitlist applicant and an available main-roster place.

At the post-migration readback, 27 existing requests were retained: 27 main, 0 waitlist, 0 withdrawn; registration was open. No test registration rows were inserted.

### 5. Owner-panel operation and owner-observed result
The owner opened the deployed management panel on iPhone and confirmed the panel rendered. The owner initially could not see the per-player action because the table required horizontal scrolling; after the explanation to scroll the table horizontally, the owner confirmed: «آره دیدم درست شد».

The owner then used the removal action. The subsequent owner-provided screenshots showed:
- Main roster: 26
- Waitlist: 0
- Withdrawn: 1
- A confirmation message that the player was removed from the active list and the registration history was preserved.

This is an owner-observed successful soft withdrawal. It is not a physical deletion.

### 6. Active statistics correction
The owner-provided screenshot then showed a discrepancy:
- Owner registration report: 26 main, 1 withdrawn.
- Series 3 statistics/seeding summary: 27 registrants.

Source review found that `Series3SeedingManager.tsx` queried all registration rows without filtering `registration_status`. The approved correction was to select the status field and filter the roster to `registration_status = 'main'`.

Resulting behavior:
- Only active main-roster players appear in the statistics/seeding list and ranking.
- Waitlist and withdrawn records are excluded from active statistics.
- Registration history and stored player statistics are not deleted or rewritten.
- No database migration or database write was required for this correction.

### 7. GitHub and deployment evidence
Initial registration/waitlist implementation:
- PR #179: https://github.com/Omidso82/Plato-land-preview/pull/179
- Merge commit: `4fd22750ff3c40f18988867c19340a027f362e21`

Active-roster statistics correction:
- PR #180: https://github.com/Omidso82/Plato-land-preview/pull/180
- PR status: merged.
- Merge commit / current main head at seal time: `8bca6d4c11e01f16d9f6151d1a104ad2542a7791`
- Changed file: `src/Series3SeedingManager.tsx` only.
- GitHub Actions build: SUCCESS.
- GitHub Actions verify: SUCCESS.
- Cloudflare Pages build/deployment check: SUCCESS.
- Main deploy workflow: SUCCESS.

### 8. Verification boundary and outstanding owner check
Confirmed:
- Main branch points to merge commit `8bca6d4c11e01f16d9f6151d1a104ad2542a7791`.
- Build, verify and Cloudflare Pages deployment checks completed successfully.
- Owner confirmed the withdrawal operation and the 26/0/1 report counts in the supplied screenshots.

Still awaiting:
- Owner refresh of the statistics/seeding section after the latest deployment, to visually confirm the displayed active registrant count is now 26 and the withdrawn player no longer appears there.
- No claim is made that this final post-deployment iPhone visual check has already occurred.

### 9. Data preservation and non-effects
- No registration row was physically deleted.
- No existing statistics were deleted or recalculated in the database.
- The active-statistics correction was a read filter only.
- No new database, Supabase branch, paid service or test registration was created.
- No Series 2 files or Main Website features were intentionally changed.
- No automatic cutoff or promotion behavior was added.

### 10. Version history
- v0.1 (2026-11-15): isolated technical preparation.
- v0.2 (2026-11-15): primary database migration and owner-controlled registration/waitlist release.
- v0.3 (2026-11-15): records owner-observed soft withdrawal, the active-roster statistics filter correction, PR #180 merge, successful CI/Cloudflare deployment, and the remaining owner visual refresh check.
