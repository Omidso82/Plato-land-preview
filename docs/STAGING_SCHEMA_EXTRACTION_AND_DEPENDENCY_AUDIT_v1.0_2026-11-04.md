# PLATO LAND — Production Schema Extraction & Staging Dependency Audit

**Snapshot date:** 2026-11-04  
**Repository:** `Omidso82/Plato-land-preview`  
**Audit branch:** `staging/schema-inventory-audit-2026-11-04`  
**Production Supabase project:** `dfrppbapaaydbjeflozw` (read-only inspection only)  
**Staging Supabase project:** `vgezfuztgzxbmvkmaoqn` (read-only inspection only)

## 1. Safety boundary

- All Production inspection in this phase was read-only SQL against PostgreSQL catalogs and Supabase metadata.
- No Production DDL/DML, migration, deployment, storage mutation, or user-data export was performed.
- No Staging DDL/DML, reset, migration, deployment, or storage mutation was performed in this audit phase.
- The intended Staging database remains the existing second project. No third project is created.
- No Production user, tournament, registration, match, prediction, or storage-object data is to be copied into Staging.
- A schema-only reconstruction must retain security boundaries and object dependencies; a table-only copy is not sufficient.

## 2. Production object inventory (live catalog)

| Object | Count / status |
|---|---:|
| Public base tables | 29 |
| Public views | 1 |
| Public functions/procedures | 13 |
| Private-schema functions | 6 |
| Public triggers | 29 |
| Public RLS policies | 102 |
| Public constraints | 135 (53 CHECK, 44 FOREIGN KEY, 29 PRIMARY KEY, 9 UNIQUE) |
| Public indexes | Present; extracted by table from `pg_indexes` |
| Public tables with RLS enabled | 29 / 29 |
| Storage buckets | 5 |
| Storage object policies | 21 |
| Edge Functions | 7 active |
| Applied Production migrations | 81 |
| SQL migration files currently in repository | 61 |
| Historical applied baseline migrations missing from repository | 20 |

### Public tables

`audit_logs`, `competition_snapshots`, `matches`, `owner_admin_tasks`, `owner_private_notes`, `plato_land_prediction_votes`, `plato_land_semifinal_prediction_votes`, `plato_land_series2_registration_requests`, `player_bans`, `profiles`, `registration_evidence`, `registration_members`, `registrations`, `site_announcements`, `site_games`, `site_maintenance`, `site_news`, `site_news_versions`, `site_page_versions`, `site_pages`, `site_settings`, `tournament_manager_access`, `tournament_manager_section_permissions`, `tournament_results`, `tournament_settings`, `tournaments`, `user_admin_permissions`, `user_notifications`, `user_roles`.

### Public view

- `recent_tournament_champions`

### Public functions (signature inventory)

- `admin_list_site_users()`
- `capture_audit_event()`
- `capture_site_news_version()`
- `capture_site_page_version()`
- `current_user_role()`
- `notify_registration_change()`
- `protect_player_display_name()`
- `remove_tournament_registration(p_registration_id uuid)`
- `review_tournament_registration(p_registration_id uuid, p_approved boolean)`
- `save_tournament_manager_access(p_tournament_id uuid, p_assignments jsonb)`
- `submit_tournament_registration(p_tournament_id uuid, p_evidence_path text, p_extracted_data jsonb)`
- `submit_tournament_registration(p_tournament_id uuid, p_evidence_path text, p_extracted_data jsonb, p_display_name text, p_plato_id text, p_rules_text text, p_registration_type text, p_team_name text, p_members jsonb)`
- `withdraw_tournament_registration(p_registration_id uuid)`

### Private-schema functions

- `private.assign_registration_reserve()`
- `private.can_manage_tournament(p_tournament_id uuid)`
- `private.can_manage_tournament_section(p_tournament_id uuid, p_permission_key text)`
- `private.has_role(required_roles text[])`
- `private.is_banned(p_plato_id text, p_tournament_id uuid)`
- `private.is_tournament_public(p_tournament_id uuid)`

### Storage buckets (configuration only; no objects exported)

| Bucket | Public | Max file size | Allowed MIME types |
|---|---:|---:|---|
| avatars | No | Unspecified | Unspecified |
| public-profile-avatars | Yes | 2 MiB | JPEG, PNG, WebP, GIF |
| registration-evidence | No | 10 MiB | JPEG, PNG, WebP |
| series2-slides | Yes | 10 MiB | JPEG, PNG, WebP |
| site-announcements | No | 50 MiB | MP4, WebM, QuickTime |

### Edge Functions (Production)

- `admin-delete-user` — ACTIVE, JWT verification enabled
- `plato-land-prediction-vote` — ACTIVE, JWT verification disabled
- `plato-land-prediction-owner-votes` — ACTIVE, JWT verification disabled
- `plato-land-semifinal-prediction-vote` — ACTIVE, JWT verification disabled
- `plato-land-semifinal-prediction-owner-votes` — ACTIVE, JWT verification disabled
- `plato-land-series2-registration` — ACTIVE, JWT verification disabled
- `plato-land-series2-registration-report` — ACTIVE, JWT verification enabled

Edge Function source and environment-specific secrets are not included in a database schema export. They require a separate reviewed Staging deployment plan. Do not copy Production secrets.

## 3. Dependency findings

1. The schema is not self-contained in `public`: RLS policies and triggers call functions in `private`.
2. `registrations` reserve assignment depends on `private.assign_registration_reserve()`, tournament capacity/status/deadline fields, and row locking.
3. Tournament manager authorization depends on `user_roles`, `tournament_manager_access`, `tournament_manager_section_permissions`, and the `private.can_manage_*` / `private.has_role` functions.
4. Registration evidence Storage policies depend on `registration_evidence`, `registrations`, and `private.can_manage_tournament_section`.
5. Public champion/history views depend on tournament results, profiles, and tournament records. Preserve the view and its dependencies.
6. Audit and versioning triggers depend on `audit_logs`, `site_news_versions`, `site_page_versions`, and their trigger functions.
7. The two prediction tables and Series 2 registration-request table are temporary operational features. Their schema may be retained for code compatibility, but Staging must receive no Production rows.
8. Storage policy SQL references Supabase-managed schemas/tables/functions. Do not recreate Supabase-managed `storage.objects`, `storage.buckets`, Auth tables, or internal Storage triggers manually. Create bucket configuration and application policies through supported Supabase mechanisms.
9. The Production extension inventory includes `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, and `uuid-ossp`. Supabase-managed extensions/services must be validated against the target project rather than blindly reinstalled.

## 4. Staging drift (live inspection)

Staging currently contains only five legacy public tables:
- `profiles`
- `user_roles`
- `tournaments`
- `registrations`
- `matches`

Their definitions do not match Production. Examples:
- Staging `profiles` contains `approval_status` and `role`; Production uses a separate `user_roles` authorization table and has `public_avatar_path`.
- Staging `tournaments` uses `name` and `game`; Production uses `title`, `game_type`, `series_name`, registration/capacity fields, and additional configuration.
- Staging `registrations` references `user_id`; Production references stable `player_id` and includes registration evidence, team, reserve, and display fields.
- Staging `matches` uses `player1_id/player2_id/score1/score2`; Production uses `player_one_id/player_two_id/player_one_score/player_two_score` and additional status/reporting fields.

Current Staging row counts observed:
- `profiles`: 9
- `user_roles`: 1
- `tournaments`: 0
- `registrations`: 0
- `matches`: 0

Staging has the same five extensions listed above, two migration-ledger entries (`20261030005708`, `20261030005719`), and zero Edge Functions. The row counts above are metadata only; no row contents were read or exported.

## 5. Migration-history reconciliation — hard dependency

The repository file `supabase/migrations/README.md` states:
- Production has 81 applied migrations.
- The repository contains 61 SQL migration files whose version/name pairs match the Production ledger.
- 20 earlier applied baseline migrations are not present as SQL files in the repository.
- Two historical SQL files in `supabase/migrations_reviewed_not_applied/` are explicitly not to be executed.

Therefore, replaying the 61 available files onto a reset Staging database is not a valid bootstrap: their earlier baseline dependencies are absent. The 61 files also represent migrations already applied to Production, so they must not be replayed against Production.

## 6. Security review observations (do not silently change Production)

Production Security Advisor findings at audit time:
- Three prediction/request tables have RLS enabled but no policies. These appear intentionally restricted from client-side table access; preserve that restriction unless a reviewed access design says otherwise.
- `public.admin_list_site_users()` and `public.withdraw_tournament_registration(uuid)` are SECURITY DEFINER functions callable by authenticated users; verify intended grants and authorization before reproducing them.
- Leaked-password protection is disabled in Auth.

Staging Security Advisor findings:
- `public.is_admin()` is a SECURITY DEFINER function callable by authenticated users.
- Leaked-password protection is disabled in Auth.

These are recorded for review. No security settings or grants were changed.

## 7. Required reconstruction order for Staging

1. Reconcile the missing 20 baseline migrations from trustworthy historical source or reconstruct equivalent DDL from the live Production catalogs.
2. Install only required non-managed extensions and create required schemas, helper functions, and types in dependency order.
3. Create the 29 application tables with exact column types, defaults, identity/sequence behavior, constraints, and indexes.
4. Create the champion/history view after its base tables.
5. Create public and private functions, preserving argument signatures, volatility, SECURITY DEFINER/INVOKER, fixed search_path, and grants.
6. Create triggers after their trigger functions.
7. Enable RLS on all application tables and reproduce all 102 policies exactly, including intentionally policy-less restricted tables.
8. Configure the five Storage buckets and application Storage policies without copying any Storage objects.
9. Deploy reviewed Edge Functions separately, using Staging-specific environment secrets and the correct JWT verification setting.
10. Run schema-diff, RLS, advisor, RPC, Storage, and synthetic-data QA. Only synthetic fixtures may be inserted.

## 8. Current completion state

**Completed in this phase:** live catalog inventory, object counts, public/private function signature inventory, RLS inventory, constraints summary, Storage bucket/policy inventory, Edge Function inventory, Staging drift comparison, and migration-history dependency analysis.

**Not yet completed:** a portable, executable, complete schema-only SQL bundle; reconstruction/recovery of the 20 baseline migrations; Staging reset; schema application; Storage policy recreation; Edge Function deployment; QA.

**Release gate:** do not reset Staging until the complete reviewed schema bundle and dependency order are ready. Do not modify Production or deploy application code as part of this database-preparation task.
