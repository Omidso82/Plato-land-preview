-- Series 3 registration capacity, waitlist, and owner-controlled availability.
-- This migration is intentionally staged in GitHub only; it has NOT been applied to Supabase.

create table if not exists public.plato_land_series3_registration_settings (
  singleton boolean primary key default true check (singleton),
  capacity integer not null default 32 check (capacity > 0),
  registration_open boolean not null default true,
  replacement_cutoff_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.plato_land_series3_registration_settings(singleton, capacity, registration_open)
values (true, 32, true)
on conflict (singleton) do nothing;

alter table public.plato_land_series3_registration_requests
  add column if not exists registration_status text not null default 'main';

alter table public.plato_land_series3_registration_requests
  drop constraint if exists series3_registration_status_check;
alter table public.plato_land_series3_registration_requests
  add constraint series3_registration_status_check
  check (registration_status in ('main','waitlist','withdrawn'));

-- Preserve all historical rows and their original timestamps. The oldest 32
-- active requests become main entries; later requests remain in FIFO waitlist.
with ranked as (
  select id, row_number() over (order by created_at asc, id asc) as position
  from public.plato_land_series3_registration_requests
)
update public.plato_land_series3_registration_requests r
set registration_status = case when ranked.position <= 32 then 'main' else 'waitlist' end
from ranked
where ranked.id = r.id;

alter table public.plato_land_series3_registration_settings enable row level security;
revoke all on public.plato_land_series3_registration_settings from anon, authenticated;
grant select on public.plato_land_series3_registration_settings to anon, authenticated;

drop policy if exists "Series 3 public settings read" on public.plato_land_series3_registration_settings;
create policy "Series 3 public settings read"
on public.plato_land_series3_registration_settings for select to anon, authenticated
using (singleton);

create or replace function public.series3_registration_status()
returns table(registration_open boolean, capacity integer, main_count bigint, waitlist_count bigint, replacement_cutoff_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.registration_open, s.capacity,
    (select count(*) from public.plato_land_series3_registration_requests r where r.registration_status='main') as main_count,
    (select count(*) from public.plato_land_series3_registration_requests r where r.registration_status='waitlist') as waitlist_count,
    s.replacement_cutoff_at
  from public.plato_land_series3_registration_settings s
  where s.singleton = true;
$$;

create or replace function public.submit_series3_registration(p_plato_id text)
returns table(result_status text, queue_position bigint, main_count bigint, capacity integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.plato_land_series3_registration_settings%rowtype;
  v_normalized text;
  v_status text;
  v_position bigint;
  v_main_count bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('plato-land-series3-registration', 0));

  select * into v_settings
  from public.plato_land_series3_registration_settings
  where singleton = true
  for update;

  if not found then raise exception 'Series 3 registration settings are missing'; end if;
  if not v_settings.registration_open then raise exception 'ثبت‌نام سری سوم در حال حاضر بسته است.' using errcode='P0001'; end if;
  if p_plato_id is null or length(btrim(p_plato_id)) not between 2 and 30
     or btrim(p_plato_id) !~ '^[A-Za-z0-9_]+$' then
    raise exception 'Plato ID معتبر نیست.' using errcode='22023';
  end if;

  v_normalized := lower(btrim(p_plato_id));
  if exists (
    select 1 from public.plato_land_series3_registration_requests r
    where coalesce(r.plato_id_normalized, lower(btrim(r.plato_id))) = v_normalized
  ) then
    raise exception 'این Plato ID قبلاً برای سری سوم ثبت شده است.' using errcode='23505';
  end if;

  select count(*) into v_main_count
  from public.plato_land_series3_registration_requests r
  where r.registration_status='main';

  -- Once the configured replacement cutoff has passed, later requests
  -- remain in the waitlist even if a main player withdrew after the cutoff.
  v_status := case
    when v_main_count < v_settings.capacity
      and (v_settings.replacement_cutoff_at is null or now() < v_settings.replacement_cutoff_at)
    then 'main'
    else 'waitlist'
  end;

  -- plato_id_normalized is a GENERATED ALWAYS column in the live table;
  -- PostgreSQL computes it from plato_id, so it must not appear in INSERT.
  insert into public.plato_land_series3_registration_requests
    (plato_id, rules_accepted, registration_status)
  values (btrim(p_plato_id), true, v_status);

  if v_status='waitlist' then
    select count(*) into v_position
    from public.plato_land_series3_registration_requests r
    where r.registration_status='waitlist';
  else
    v_main_count := v_main_count + 1;
  end if;

  return query select v_status, v_position, v_main_count, v_settings.capacity;
end;
$$;

create or replace function public.set_series3_registration_open(p_open boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('owner','مالک کل')
  ) then
    raise exception 'Owner access required' using errcode='42501';
  end if;
  update public.plato_land_series3_registration_settings
  set registration_open = p_open, updated_at = now(), updated_by = auth.uid()
  where singleton = true;
end;
$$;

create or replace function public.set_series3_replacement_cutoff(p_cutoff timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('owner','مالک کل')
  ) then
    raise exception 'Owner access required' using errcode='42501';
  end if;
  update public.plato_land_series3_registration_settings
  set replacement_cutoff_at = p_cutoff, updated_at = now(), updated_by = auth.uid()
  where singleton = true;
end;
$$;

create or replace function public.withdraw_series3_main_registration(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.plato_land_series3_registration_settings%rowtype;
  v_next_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('owner','مالک کل')
  ) then
    raise exception 'Owner access required' using errcode='42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('plato-land-series3-registration', 0));
  select * into v_settings from public.plato_land_series3_registration_settings where singleton=true for update;

  -- Require the owner to configure the real cutoff before any withdrawal can
  -- change the roster; otherwise a missing setting could strand a vacant slot.
  if v_settings.replacement_cutoff_at is null then
    raise exception 'ابتدا زمان دقیق پایان جایگزینی را در پنل مدیریت ثبت کن.' using errcode='P0001';
  end if;

  update public.plato_land_series3_registration_requests
  set registration_status='withdrawn'
  where id=p_request_id and registration_status='main';
  if not found then raise exception 'Active main registration not found'; end if;

  -- At or after the configured cutoff, record withdrawal but do not promote.
  if now() >= v_settings.replacement_cutoff_at then
    return null;
  end if;

  select id into v_next_id
  from public.plato_land_series3_registration_requests
  where registration_status='waitlist'
  order by created_at asc, id asc
  limit 1
  for update;

  if v_next_id is not null then
    update public.plato_land_series3_registration_requests
    set registration_status='main'
    where id=v_next_id;
  end if;
  return v_next_id;
end;
$$;

-- Public users must submit only through the validated, serialized RPC.
drop policy if exists "Series 3 public registration insert" on public.plato_land_series3_registration_requests;
revoke insert on public.plato_land_series3_registration_requests from anon, authenticated;
grant execute on function public.series3_registration_status() to anon, authenticated;
grant execute on function public.submit_series3_registration(text) to anon, authenticated;
grant execute on function public.set_series3_registration_open(boolean) to authenticated;
grant execute on function public.set_series3_replacement_cutoff(timestamptz) to authenticated;
grant execute on function public.withdraw_series3_main_registration(uuid) to authenticated;

-- Remove default PUBLIC execution. Only the intended roles can call each RPC.
revoke all on function public.series3_registration_status() from public;
revoke all on function public.submit_series3_registration(text) from public;
revoke all on function public.set_series3_registration_open(boolean) from public;
revoke all on function public.set_series3_replacement_cutoff(timestamptz) from public;
revoke all on function public.withdraw_series3_main_registration(uuid) from public;
grant execute on function public.series3_registration_status() to anon, authenticated;
grant execute on function public.submit_series3_registration(text) to anon, authenticated;
grant execute on function public.set_series3_registration_open(boolean) to authenticated;
grant execute on function public.set_series3_replacement_cutoff(timestamptz) to authenticated;
grant execute on function public.withdraw_series3_main_registration(uuid) to authenticated;
