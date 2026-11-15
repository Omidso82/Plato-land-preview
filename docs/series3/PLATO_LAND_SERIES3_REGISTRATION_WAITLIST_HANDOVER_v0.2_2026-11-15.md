# PLATO LAND – Series 3 Registration & Waitlist Implementation
## Technical handover v0.2 – 2026-11-15

### Scope and approved decisions
- This work is limited to Series 3 in PLATO LAND – Temporary Projects.
- Main roster capacity is exactly 32.
- Registration remains open after the main roster reaches 32; later valid applications enter the waitlist.
- Waitlist order is oldest registration first (created_at, then id).
- Owner can manually open and close registration.
- Owner can manually remove a player from active lists. Removal is a soft status change to withdrawn; the original row and timestamp remain.
- Owner can promote only the first waitlist request, and only when the main roster has fewer than 32 players.
- No automatic promotion scheduler or automatic date-based closure has been implemented. The exact local start time on Saturday 30 Aban 1405 was not supplied, so no cutoff hour is assumed.
- Existing 27 registrations were retained and initialized as main.

### Primary environment
- Repository: Omidso82/Plato-land-preview
- Primary Supabase project: dfrppbapaaydbjeflozw
- Main branch baseline at start: c8abd61df33fc09611aed6d85629a9d405efb600
- Work branch: feature/series3-registration-waitlist-20261115

### Database implementation
Migration applied to the primary database:
- 20261115143405_series3_owner_registration_controls_and_waitlist

Changes:
- Added registration_status: main / waitlist / withdrawn (existing rows default main).
- Added ordered status/time index.
- Added owner-managed singleton settings row for registration_open.
- Removed public direct INSERT path; public form now calls an atomic RPC.
- series3_registration_status() returns only the public open/closed state.
- series3_register_request() validates consent and Plato ID, serializes capacity assignment, blocks duplicates, assigns first 32 active requests to main and later requests to waitlist.
- series3_owner_set_registration_open(boolean) is owner-checked.
- series3_owner_withdraw_request(uuid) is owner-checked and preserves history.
- series3_owner_promote_waitlist(uuid) is owner-checked, requires an available main slot and only accepts the oldest waitlist request.

### UI implementation
- Public Series 3 registration form reads owner-controlled open/closed state and refuses submission when closed; the database RPC independently enforces the same condition.
- Owner panel component Series3RegistrationReport.tsx shows main/waitlist/withdrawn counts and lists, registration timestamps, open/close controls, soft removal and manual promotion.
- Main capacity and waitlist ordering are enforced in the database, not only in browser code.
- Series 2 controls and Main Website features are not part of this change.

### Snapshot after migration
At the time of verification:
- Total registrations: 27
- Main: 27
- Waitlist: 0
- Withdrawn: 0
- Registration open: true
- Existing data was not deleted or rewritten beyond the new default status.

### Security and verification notes
- Owner RPCs verify auth.uid() against public.user_roles with owner / مالک کل.
- RPCs pin search_path to empty and schema-qualify database objects.
- Direct anonymous/authenticated table INSERT was revoked; registration is routed through the controlled RPC.
- Supabase security advisors reported public execution warnings for the intentionally public registration/status RPCs and authenticated execution warnings for owner RPCs. The owner RPCs include explicit owner checks in their bodies. Review these findings as intentional, not as proof of unrestricted owner actions.
- Existing unrelated advisor findings remain outside this Series 3 change.
- SQL schema and registration counts were read back after migration.
- UI TypeScript/build and live owner interaction tests are pending CI/owner acceptance; do not treat the feature as fully QA-certified until these pass.

### Remaining work
1. Run PR CI (typecheck/build) and fix any failures.
2. Verify owner login in the temporary management panel.
3. Test open/close from owner panel and confirm public form follows it.
4. Test one test registration only if the owner approves a real test row; do not insert test data into the live roster without approval.
5. Verify soft removal and first-in-queue promotion using an explicitly approved real case or a safe rollbackable test.
6. Confirm exact tournament start time only if automatic cutoff/promotion is later requested.

### Version history
- v0.1 (2026-11-15): initial isolated branch preparation; no DB migration.
- v0.2 (2026-11-15): migration applied to primary DB; owner controls, waitlist and soft-withdrawal implementation added.
