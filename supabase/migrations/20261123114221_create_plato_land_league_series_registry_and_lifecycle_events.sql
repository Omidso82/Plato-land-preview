-- Applied migration version: 20261123114221
-- Migration name: create_plato_land_league_series_registry_and_lifecycle_events
-- PLATO LAND Temporary Projects — Central Suspension & Eligibility — B1
-- Creates an empty official-series registry and append-only lifecycle events.
-- No historical series are imported in this migration.

create table public.plato_land_league_series (
  id uuid primary key default gen_random_uuid(),
  series_number integer not null unique check (series_number > 0),
  series_name text not null check (length(btrim(series_name)) > 0),
  league_code text not null default 'official_backgammon'
    check (league_code = 'official_backgammon'),
  lifecycle_status text not null default 'planned'
    check (lifecycle_status in ('planned', 'started', 'completed', 'archived', 'cancelled')),
  registration_status text not null default 'not_open'
    check (registration_status in ('not_open', 'open', 'closed')),
  registration_source_table text,
  registration_source_key text,
  created_at timestamptz not null default clock_timestamp(),
  created_by uuid not null,
  constraint plato_land_league_series_source_pair_check
    check (
      (registration_source_table is null and registration_source_key is null)
      or
      (registration_source_table is not null and length(btrim(registration_source_table)) > 0
       and registration_source_key is not null and length(btrim(registration_source_key)) > 0)
    )
);

comment on table public.plato_land_league_series is
  'Canonical registry for official PLATO LAND backgammon league series. Historical series are not populated until verified mapping is approved.';
comment on column public.plato_land_league_series.series_number is
  'Official sequential series number; never inferred from UUID, date, route, or event key.';
comment on column public.plato_land_league_series.lifecycle_status is
  'Lifecycle only. Registration open/closed is tracked separately; only cancelled is excluded from suspension target counting.';
comment on column public.plato_land_league_series.registration_status is
  'Registration state; closing registration does not mean the series is cancelled.';
comment on column public.plato_land_league_series.registration_source_table is
  'Optional exact source table for this series registration data; populated only after verified mapping.';
comment on column public.plato_land_league_series.registration_source_key is
  'Optional exact source key identifying this series in its registration source.';

create table public.plato_land_league_series_events (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null
    references public.plato_land_league_series(id) on delete restrict,
  event_type text not null
    check (event_type in ('official_start', 'official_cancellation')),
  actor_id uuid not null,
  occurred_at timestamptz not null default clock_timestamp(),
  reason text,
  constraint plato_land_league_series_events_cancellation_reason_check
    check (event_type <> 'official_cancellation' or length(btrim(coalesce(reason, ''))) > 0)
);

comment on table public.plato_land_league_series_events is
  'Append-only authoritative lifecycle events. Actor and server timestamp are mandatory; cancellation requires a reason.';
comment on column public.plato_land_league_series_events.actor_id is
  'Authenticated manager identity captured by a future controlled server-side RPC; not supplied as trusted client input.';
comment on column public.plato_land_league_series_events.occurred_at is
  'Server-generated event timestamp. Scheduled starts_at values are not official-start events.';

create unique index plato_land_league_series_events_one_type_per_series_idx
  on public.plato_land_league_series_events (series_id, event_type);

create or replace function private.plato_land_reject_series_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'PLATO LAND lifecycle events are append-only; UPDATE and DELETE are forbidden.'
    using errcode = '55000';
end;
$$;

create trigger plato_land_league_series_events_append_only
before update or delete on public.plato_land_league_series_events
for each row execute function private.plato_land_reject_series_event_mutation();

create or replace function private.plato_land_protect_series_registry_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'PLATO LAND official series registry rows cannot be deleted.'
      using errcode = '55000';
  end if;

  if new.id is distinct from old.id
     or new.series_number is distinct from old.series_number
     or new.league_code is distinct from old.league_code
     or new.created_at is distinct from old.created_at
     or new.created_by is distinct from old.created_by then
    raise exception 'PLATO LAND official series identity fields are immutable.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create trigger plato_land_league_series_identity_guard
before update or delete on public.plato_land_league_series
for each row execute function private.plato_land_protect_series_registry_identity();

-- The public schema has broad default table grants in this project.
-- Explicitly revoke every API/service role; future access must be through
-- narrowly scoped server-side functions introduced in later approved stages.
revoke all on table public.plato_land_league_series
  from public, anon, authenticated, service_role;
revoke all on table public.plato_land_league_series_events
  from public, anon, authenticated, service_role;

revoke all on function private.plato_land_reject_series_event_mutation()
  from public, anon, authenticated, service_role;
revoke all on function private.plato_land_protect_series_registry_identity()
  from public, anon, authenticated, service_role;

alter table public.plato_land_league_series enable row level security;
alter table public.plato_land_league_series_events enable row level security;

-- Deliberately no RLS policies and no rows are inserted in B1.
-- Access is intentionally closed until later approved RPC/UI stages.
