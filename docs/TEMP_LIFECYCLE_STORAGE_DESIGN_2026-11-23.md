# PLATO LAND Temporary Projects — lifecycle storage design (development only)
Date: 2026-11-23. Owner authorized development-branch work and necessary primary-database changes; production deployment NOT authorized.

## Live schema facts
- public.plato_land_league_series contains series 3, 4, 5 and independent lifecycle_status / registration_status.
- public.plato_land_league_series_events is restricted to official_start and official_cancellation; do not repurpose it.
- Generic public.tournaments belongs to Main Website; do not touch it.
- Series 1 and 2 are not mapped to this canonical registry. Do not backfill or alter them.
- Series 3 knockout result tables currently contain zero rows; Series 4 is planned. No verified-complete evidence exists for either.

## Minimal additive schema proposed
- private lifecycle_transition_events: id, series_id FK, previous_status, new_status, actor_id nullable only for system, actor_kind, reason, evidence_version, correlation_id UNIQUE, created_at server timestamp. Append-only, RLS enabled, no anon/authenticated direct writes.
- private lifecycle_archive_holds: series_id PK, held_evidence_version, reason, created_by, created_at, released_by, released_at; server-authorized only.
- private lifecycle_evidence_snapshots: series_id, evidence_version, source_refs, verdict, final_approval_actor, evaluated_at, created_at; immutable and verified server-side.
- Controlled RPCs must check owner permissions on server, lock target series row, reject stale evidence, verify idempotency, and write transition+audit atomically.
- Never infer official final approval from dates, closed registration, or complete group fixtures.

## Release gates
1. Verify RLS, existing grants and security-definer patterns.
2. Verify adapter evidence for each eligible series against source tables.
3. Run pure contract tests, then integration tests against a safe non-production transaction strategy (no separate paid DB).
4. Review migration and rollback before applying any live DDL; avoid modifying existing production tables until required.
5. Integrate UI into existing /series2-slides-manager only, with owner role check.
6. No merge/deploy until separate explicit owner authorization.

## Non-goals
No automatic archiving now; no status updates; no registration changes; no Series 1 import; no Series 2 backfill; no Main Website changes.
