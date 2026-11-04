# PLATO LAND — Staging Schema Package Validation

**Date:** 2026-11-04  
**Branch:** `staging/schema-inventory-audit-2026-11-04`  
**Scope:** schema extraction and dependency validation only

## Extracted package verification

| Artifact | Live-source count / validation |
|---|---:|
| Production public application tables | 29 |
| Table constraints | 135 (53 CHECK, 44 FK, 29 PK, 9 UNIQUE) |
| Non-constraint indexes | 49 |
| Public/private function definitions captured | 19 (13 public, 6 private) |
| Public view definitions | 1 |
| Public RLS enablement statements | 29 |
| Public RLS policies | 102 |
| Public trigger objects | 12 (29 event registrations) |
| Storage buckets | 5 |
| Storage object policies | 21 |
| Realtime publication tables | 2 |
| Production Edge Functions inventoried | 7 |

The generated schema TypeScript snapshot was also captured from the live Production project.

## Dependency and security corrections made during packaging

1. The champion view was separated from core table DDL because it calls `private.is_tournament_public()`. It is now applied only after functions and retains both `security_invoker=true` and `security_barrier=true`.
2. RLS policies and triggers are separated into a post-function phase because they call application helper functions.
3. Function grants explicitly revoke PostgreSQL's default `PUBLIC EXECUTE` before restoring only the captured role grants.
4. The Staging grant script omits direct `TRUNCATE`, `TRIGGER`, and `REFERENCES` table privileges found in Production direct grants. These are not required for the application CRUD/RLS model and should not be copied into Staging by default.
5. Storage policy definitions are separate from bucket configuration. The bucket manifest is configuration-only; no Storage objects are included.
6. Realtime publication membership is captured separately for `site_maintenance` and `user_notifications`.
7. Supabase-managed schemas/tables/triggers are not recreated by the application DDL package.

## Live Staging drift observed

- Public objects: 5 tables, 0 views, 4 functions, 1 application trigger, 11 public policies.
- Storage: one existing private `avatars` bucket and four existing Storage object policies.
- Migration ledger: 2 entries.
- Edge Functions: 0.
- The five existing table schemas differ materially from Production.
- Existing Staging `avatars` bucket limits/MIME configuration differ from Production; reconcile through supported Storage administration rather than overwriting it blindly.

## Still outstanding before applying the package

- Recover/reconstruct the missing 20 historical migration baselines; the repository has only 61 SQL files against 81 applied Production migrations. The catalog snapshot is the reconstruction source, not a substitute for reviewing the final ordered migration.
- Review the grant snapshot and function security behavior.
- Resolve the existing Staging avatar bucket configuration and object-retention decision.
- Perform the approved Staging-only legacy-object reset, then apply the package in the documented order.
- Configure the other four buckets, apply Storage policies, add Realtime membership, and deploy reviewed Edge Functions with Staging-specific secrets.
- Verify with a schema diff and functional/RLS/Storage QA.

## Change boundary

No Production changes. No Staging changes. No Production data, Auth users, Storage objects, Edge Function secrets, or operational prediction/Series 2 rows copied. This branch contains only schema snapshots and audit/runbook documentation.
