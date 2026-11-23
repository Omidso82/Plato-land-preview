# Series 3 — stale-source read guard and verification
Version: 0.8 | 2026-11-23 | Production Supabase RPC update; no deployment

## Change executed
Migration `series3_owner_decision_read_stale_source_guard` succeeded. The existing owner-only `get_series3_owner_third_decisions()` now compares every stored Series 3 decision against its original group head-to-head match: event/group, source match ID, version, double_no_show status, NULL scores, exact two registration IDs and Plato IDs. Any stale or inconsistent decision raises an error instead of returning it as verified. Exact approved reason and decision_version=1 remain in response.

## Verified by read-only SQL
- Stale-source guard present in function definition: true
- Decision version field present: true
- Anonymous EXECUTE: false
- Authenticated EXECUTE: true (actual authorization is checked inside function via auth.uid() and private.has_role)
- Decision rows: 0
- Knockout result rows: 0

## Scope and limitations
This is a schema/function change to the Series 3 owner decision RPC only. No decisions were inserted; no scores, bracket, other series, or published website changed. Full owner-session end-to-end test, complete TypeScript typecheck, Vite build, and iPhone UI test are outstanding. Do not merge/deploy without separate permission.
