# PLATO LAND — Staging Database Rebuild Execution Report

**Executed:** 2026-11-04  
**Target:** Supabase project `vgezfuztgzxbmvkmaoqn` (`Plato_Land`, eu-west-1)  
**Production reference:** `dfrppbapaaydbjeflozw` (read-only during this work)  
**Result:** Application database schema reconstructed and verified against Production catalog.

## Verified schema parity

| Component | Production | Staging after rebuild |
|---|---:|---:|
| Public application tables | 29 | 29 |
| Public views | 1 | 1 |
| Public functions | 13 | 13 |
| Private functions | 6 | 6 |
| Table constraints | 135 | 135 |
| Indexes (including constraint indexes) | 87 | 87 |
| Foreign keys | 44 | 44 |
| RLS-enabled public tables | 29 | 29 |
| Public RLS policies | 102 | 102 |
| Application trigger objects | 12 | 12 |
| Storage object policies | 21 | 21 |
| Storage buckets | 5 | 5 |
| Realtime publication tables | 2 | 2 |

The complete public table-name sets were queried independently from both projects and match exactly. Supabase's verbose table inventory reports zero rows in all 29 Staging application tables.

## Executed work

- Removed the authorized legacy application schema from Staging only. Supabase-managed schemas were preserved.
- Recreated the application tables, non-FK constraints, foreign keys, indexes, private/public functions, view, RLS policies, triggers, and reviewed grants in dependency order.
- Replaced the four duplicate legacy avatar policies.
- Configured all five Storage buckets with Production-equivalent settings.
- Added the two Production Realtime publication tables.
- Revoked default PUBLIC EXECUTE from the 19 recreated application functions, then applied the captured role-specific grants.
- Recorded the executed DDL in the Staging migration ledger. The ledger now has 18 entries: 2 original Staging history entries and 16 rebuild operations.

## Verification and security observations

- Public function EXECUTE grants to PostgreSQL PUBLIC: 0.
- Anonymous access to `public.profiles` is denied by table privileges.
- Authenticated access without a JWT sees zero profile rows.
- Three temporary operational tables (`plato_land_prediction_votes`, `plato_land_semifinal_prediction_votes`, and `plato_land_series2_registration_requests`) have RLS enabled and intentionally no client policies, matching Production.
- Security Advisor still reports the same two Production-equivalent SECURITY DEFINER warnings for `public.admin_list_site_users()` and `public.withdraw_tournament_registration(uuid)`; both have explicit authenticated grants and internal authorization/ownership checks. These should receive a separate security review before public-facing Staging testing.
- Auth leaked-password protection remains disabled in the Staging project settings; this is an Auth project setting, not part of the SQL schema rebuild.
- Performance Advisor reports 42 unused indexes because the newly rebuilt Staging database has not yet had normal workload. No indexes were removed.

## Data isolation

- No Production application rows, Auth users, Storage objects, secrets, or Edge Function environment variables were copied.
- Staging's pre-existing four Auth users and one Storage object were retained; they are pre-existing Staging resources, not Production data.
- All 29 recreated public application tables are empty.
- Production was not modified, and no website deployment or frontend Supabase connection change was made.

## Remaining before full application-level Staging QA

1. Deploy and configure the seven Production Edge Functions using Staging-specific secrets and reviewed JWT settings. They have not been deployed.
2. Create/assign synthetic Staging owner and test accounts; do not import Production identities or roles.
3. Run authenticated end-to-end RPC, RLS, registration-evidence Storage, public avatar, news video, slide, and Realtime tests.
4. Review the two SECURITY DEFINER advisor findings and enable leaked-password protection in Staging Auth settings where supported.
5. The SQL schema snapshots are committed under `supabase/schema_snapshot/`. The database migration ledger is populated; the executed DDL's full historical migration-file set still needs a final repository reconciliation before treating Staging as a fully reproducible CLI-managed environment.

## Change boundary

Only the approved second Supabase project was modified. Production database, Production website, and production data remain untouched.
