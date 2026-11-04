# Staging schema reconstruction — execution order

Use only against Supabase project `vgezfuztgzxbmvkmaoqn`. Never execute these snapshots against Production.

## Extracted files

1. `production_bootstrap_prelude_2026-11-04.sql` — creates the application-owned `private` schema.
2. `production_core_objects_2026-11-04.sql` — 29 public table shells, 135 constraints, and 49 non-constraint indexes.
3. `production_functions_2026-11-04.sql` — all 13 public and 6 private function definitions.
4. `production_views_2026-11-04.sql` — `recent_tournament_champions`, applied after its `private.is_tournament_public()` helper; retains `security_invoker=true` and `security_barrier=true`.
5. `production_security_objects_2026-11-04.sql` — 29 RLS enablement statements, 102 public policies, and 12 application trigger objects (29 event registrations).
6. `production_grants_2026-11-04.sql` — captured app schema, table/view, and routine grants for anon/authenticated/service_role; review before use.
7. `production_storage_buckets_2026-11-04.json` — exact five-bucket configuration manifest; configure through supported Storage administration without copying objects.
8. `production_storage_policies_2026-11-04.sql` — 21 application Storage object policies. Apply only after bucket configuration and dependencies are ready.
9. `production_realtime_publication_2026-11-04.sql` — adds `site_maintenance` and `user_notifications` to the existing `supabase_realtime` publication.
10. `production_application_schema_2026-11-04.sql` — combined raw catalog snapshot retained as a reference; do not use as a single migration because functions must precede RLS policies and triggers.

## Required order

1. Confirm Staging target project ref before every destructive or DDL operation.
2. Clear/reconcile only the legacy application objects in Staging, according to the approved reset authorization. Do not drop Supabase-managed schemas.
3. Apply bootstrap prelude.
4. Apply core tables, constraints, and indexes.
5. Apply function definitions.
6. Apply the champion view after its private helper function exists.
7. Apply RLS enablement, policies, and application triggers.
8. Apply reviewed least-privilege grants (the script revokes default PUBLIC function execution and omits TRUNCATE/TRIGGER/REFERENCES table grants).
9. Create/verify the five bucket configurations using supported Storage administration, without copying objects.
10. Apply Storage policies.
11. Add the two Realtime publication tables.
12. Deploy Edge Functions separately using Staging-specific secrets; do not copy Production secrets.
13. Run schema comparison, advisors, RLS access tests, RPC tests, Storage tests, and synthetic-data QA.

## Important compatibility and safety notes

- Production has 81 migration-ledger entries, but only 61 corresponding SQL files exist in the repository; 20 historical baseline SQL files are absent. This snapshot reconstructs live catalog objects directly and is intended to bridge that missing history, but it still requires a target-side dry-run/review before execution.
- Do not replay the 61 already-applied Production migration files on Production.
- Do not copy Production Auth users, application rows, Storage objects, secrets, or operational prediction/Series 2 data.
- Three Production prediction/request tables intentionally have RLS enabled and no client policies. Preserve this unless a separate security design is approved.
- Check the grants snapshot against the function definitions, especially SECURITY DEFINER routines. The Production advisors currently flag `admin_list_site_users()` and `withdraw_tournament_registration(uuid)` for authenticated EXECUTE access.
- Edge Function list is seven active functions in Production and zero in Staging. Deployment is a separate phase and is not covered by these SQL files.
