-- Draft. Review before assigning a migration version or applying.
begin;

create table public.plato_land_series4_registration_settings (
  singleton boolean primary key default true check (singleton),
  capacity integer not null default 32 check (capacity in (32, 48)),
  public_enabled boolean not null default false,
  registration_open boolean not null default false,
  check (public_enabled or not registration_open)
);
insert into public.plato_land_series4_registration_settings (singleton) values (true);
alter table public.plato_land_series4_registration_settings enable row level security;
revoke all on public.plato_land_series4_registration_settings from public, anon, authenticated;

create table public.plato_land_series4_registration_requests (
  id uuid primary key default gen_random_uuid(),
  plato_id text not null,
  plato_id_normalized text generated always as (lower(btrim(plato_id))) stored unique,
  rules_accepted boolean not null check (rules_accepted),
  created_at timestamptz not null default now(),
  registration_status text not null check (registration_status in ('main','waitlist','withdrawn'))
);
create index on public.plato_land_series4_registration_requests (registration_status, created_at, id);
alter table public.plato_land_series4_registration_requests enable row level security;
revoke all on public.plato_land_series4_registration_requests from public, anon, authenticated;
grant select on public.plato_land_series4_registration_requests to authenticated;
create policy "Series 4 owner reads registrations"
  on public.plato_land_series4_registration_requests for select to authenticated
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role in ('owner','مالک کل')
  ));

create function public.series4_assert_registration_owner()
returns void language plpgsql stable security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('owner','مالک کل')
  ) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.series4_assert_registration_owner() from public, anon, authenticated;

create function public.series4_owner_registration_settings()
returns table (capacity integer, public_enabled boolean, registration_open boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.series4_assert_registration_owner();
  return query select s.capacity, s.public_enabled, s.registration_open
  from public.plato_land_series4_registration_settings s where s.singleton;
end;
$$;

create function public.series4_owner_set_registration_open(p_open boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform public.series4_assert_registration_owner();
  update public.plato_land_series4_registration_settings
  set registration_open = p_open
  where singleton and (not p_open or public_enabled);
  if not found then
    raise exception 'Series 4 public access is disabled' using errcode = '55000';
  end if;
  return p_open;
end;
$$;

create function public.series4_owner_withdraw_request(p_request_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
begin
  perform public.series4_assert_registration_owner();
  perform 1 from public.plato_land_series4_registration_settings where singleton for update;
  update public.plato_land_series4_registration_requests
  set registration_status = 'withdrawn'
  where id = p_request_id and registration_status in ('main','waitlist');
  if not found then
    raise exception 'Registration not found or already withdrawn' using errcode = 'P0002';
  end if;
  return 'withdrawn';
end;
$$;

create function public.series4_owner_promote_waitlist(p_request_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_capacity integer;
  v_count integer;
  v_first uuid;
begin
  perform public.series4_assert_registration_owner();
  select capacity into strict v_capacity from public.plato_land_series4_registration_settings
  where singleton for update;
  select count(*) into v_count from public.plato_land_series4_registration_requests
  where registration_status = 'main';
  if v_count >= v_capacity then
    raise exception 'Main roster is full' using errcode = '23514';
  end if;
  select id into v_first from public.plato_land_series4_registration_requests
  where registration_status = 'waitlist' order by created_at, id limit 1;
  if v_first is null or v_first is distinct from p_request_id then
    raise exception 'Only the first waitlist request can be promoted' using errcode = '23514';
  end if;
  update public.plato_land_series4_registration_requests
  set registration_status = 'main' where id = v_first;
  return v_count + 1;
end;
$$;

revoke all on function public.series4_owner_registration_settings(),
  public.series4_owner_set_registration_open(boolean), public.series4_owner_withdraw_request(uuid),
  public.series4_owner_promote_waitlist(uuid) from public, anon, authenticated;
grant execute on function public.series4_owner_registration_settings(),
  public.series4_owner_set_registration_open(boolean), public.series4_owner_withdraw_request(uuid),
  public.series4_owner_promote_waitlist(uuid) to authenticated;

create function public.series4_registration_status()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select public_enabled and registration_open
    from public.plato_land_series4_registration_settings where singleton
  ), false);
$$;

create function public.series4_register_request(p_plato_id text, p_rules_accepted boolean)
returns table (status text, queue_position integer, main_count integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_settings public.plato_land_series4_registration_settings%rowtype;
  v_id text := btrim(coalesce(p_plato_id, ''));
  v_main_count integer;
  v_wait_count integer;
  v_status text;
begin
  select * into strict v_settings
  from public.plato_land_series4_registration_settings where singleton for update;
  if not (v_settings.public_enabled and v_settings.registration_open) then
    raise exception 'Series 4 registration is closed' using errcode = '55000';
  end if;
  if p_rules_accepted is distinct from true or v_id !~ '^[A-Za-z0-9_]{2,30}$' then
    raise exception 'Valid Plato ID and rules acceptance required' using errcode = '22023';
  end if;

  select count(*) filter (where registration_status = 'main'),
         count(*) filter (where registration_status = 'waitlist')
  into v_main_count, v_wait_count from public.plato_land_series4_registration_requests;

  if exists (
    select 1 from public.plato_land_series4_registration_requests
    where plato_id_normalized = lower(v_id)
  ) then
    return query select 'duplicate'::text, null::integer, v_main_count;
    return;
  end if;
  if v_main_count + v_wait_count >= 48 then
    raise exception 'Series 4 registration capacity reached' using errcode = '23514';
  end if;

  -- When a slot opens, the owner promotes the existing queue head.
  v_status := case when v_main_count < v_settings.capacity and v_wait_count = 0
                   then 'main' else 'waitlist' end;
  insert into public.plato_land_series4_registration_requests(plato_id, rules_accepted, registration_status)
  values (v_id, true, v_status);
  if v_status = 'main' then
    return query select v_status, null::integer, v_main_count + 1;
  else
    return query select v_status, v_wait_count + 1, v_main_count;
  end if;
end;
$$;

revoke all on function public.series4_registration_status(),
  public.series4_register_request(text,boolean) from public, anon, authenticated;
grant execute on function public.series4_registration_status(),
  public.series4_register_request(text,boolean) to anon, authenticated;

commit;
