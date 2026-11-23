-- PLATO LAND temporary lifecycle metadata, applied 2026-11-23
-- Production database migration name: plato_temp_lifecycle_metadata_20261123
-- Additive only. No changes to tournament status or existing tables.
create schema if not exists plato_temp_internal;
revoke all on schema plato_temp_internal from public, anon, authenticated;
create table if not exists plato_temp_internal.lifecycle_evidence (
 id uuid primary key default gen_random_uuid(),
 series_id uuid not null references public.plato_land_league_series(id),
 evidence_version text not null check(length(btrim(evidence_version))>0),
 verdict text not null check(verdict in ('not_ready','needs_review','verified_complete')),
 source_refs jsonb not null default '[]'::jsonb check(jsonb_typeof(source_refs)='array'),
 approved_by uuid,
 evaluated_at timestamptz not null default clock_timestamp(),
 unique(series_id,evidence_version)
);
create table if not exists plato_temp_internal.lifecycle_archive_holds (
 series_id uuid primary key references public.plato_land_league_series(id),
 evidence_version text not null,
 reason text not null check(length(btrim(reason))>=5),
 created_by uuid not null,
 created_at timestamptz not null default clock_timestamp(),
 released_by uuid,
 released_at timestamptz,
 check((released_at is null and released_by is null) or (released_at is not null and released_by is not null))
);
create table if not exists plato_temp_internal.lifecycle_transitions (
 id uuid primary key default gen_random_uuid(),
 series_id uuid not null references public.plato_land_league_series(id),
 from_status text not null,
 to_status text not null,
 actor_kind text not null check(actor_kind in ('system','manager')),
 actor_id uuid,
 reason text not null check(length(btrim(reason))>=5),
 evidence_version text,
 correlation_id uuid not null unique,
 occurred_at timestamptz not null default clock_timestamp(),
 check(from_status<>to_status),
 check((actor_kind='manager' and actor_id is not null) or (actor_kind='system' and actor_id is null))
);
alter table plato_temp_internal.lifecycle_evidence enable row level security;
alter table plato_temp_internal.lifecycle_archive_holds enable row level security;
alter table plato_temp_internal.lifecycle_transitions enable row level security;
revoke all on all tables in schema plato_temp_internal from public, anon, authenticated;
comment on schema plato_temp_internal is 'PLATO LAND temporary-project lifecycle metadata. Not exposed to browser roles.';
