-- Generated for primary Supabase migration 20261115143405_series3_owner_registration_controls_and_waitlist
alter table public.plato_land_series3_registration_requests
  add column if not exists registration_status text not null default 'main'
  check (registration_status in ('main','waitlist','withdrawn'));
create index if not exists plato_land_series3_status_created_idx
  on public.plato_land_series3_registration_requests (registration_status, created_at, id);
create table if not exists public.plato_land_series3_registration_settings (
  singleton boolean primary key default true check (singleton),
  registration_open boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.plato_land_series3_registration_settings enable row level security;
revoke all on public.plato_land_series3_registration_settings from public, anon, authenticated;
insert into public.plato_land_series3_registration_settings(singleton,registration_open)
values (true,true) on conflict (singleton) do nothing;
drop policy if exists "Series 3 public registration insert" on public.plato_land_series3_registration_requests;
revoke insert on public.plato_land_series3_registration_requests from anon, authenticated;
create or replace function public.series3_registration_status()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce((select s.registration_open from public.plato_land_series3_registration_settings s where s.singleton=true),false); $$;
revoke all on function public.series3_registration_status() from public;
grant execute on function public.series3_registration_status() to anon, authenticated;
create or replace function public.series3_register_request(p_plato_id text,p_rules_accepted boolean)
returns table(status text,queue_position integer,main_count integer)
language plpgsql security definer set search_path = ''
as $$
declare v_id text:=btrim(coalesce(p_plato_id,'')); v_main_count integer; v_status text; v_queue integer;
begin
 if p_rules_accepted is distinct from true then raise exception 'Rules acceptance is required' using errcode='22023'; end if;
 if length(v_id)<2 or length(v_id)>30 or v_id !~ '^[A-Za-z0-9_]+$' then raise exception 'Invalid Plato ID' using errcode='22023'; end if;
 if not public.series3_registration_status() then raise exception 'Series 3 registration is closed' using errcode='55000'; end if;
 perform pg_advisory_xact_lock(hashtext('plato-land-series3-registration-capacity'));
 if exists(select 1 from public.plato_land_series3_registration_requests r where r.plato_id_normalized=lower(v_id)) then
  return query select 'duplicate'::text,null::integer,(select count(*)::integer from public.plato_land_series3_registration_requests r where r.registration_status='main'); return;
 end if;
 select count(*)::integer into v_main_count from public.plato_land_series3_registration_requests r where r.registration_status='main';
 v_status:=case when v_main_count<32 then 'main' else 'waitlist' end;
 insert into public.plato_land_series3_registration_requests(plato_id,rules_accepted,registration_status) values(v_id,true,v_status);
 if v_status='waitlist' then select count(*)::integer into v_queue from public.plato_land_series3_registration_requests r where r.registration_status='waitlist'; v_main_count:=32;
 else v_main_count:=v_main_count+1; v_queue:=null; end if;
 return query select v_status,v_queue,v_main_count;
end; $$;
revoke all on function public.series3_register_request(text,boolean) from public;
grant execute on function public.series3_register_request(text,boolean) to anon,authenticated;
create or replace function public.series3_owner_set_registration_open(p_open boolean)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role in ('owner','مالک کل')) then raise exception 'Owner access required' using errcode='42501'; end if;
 update public.plato_land_series3_registration_settings set registration_open=p_open,updated_at=now(),updated_by=auth.uid() where singleton=true;
 return p_open;
end; $$;
revoke all on function public.series3_owner_set_registration_open(boolean) from public,anon;
grant execute on function public.series3_owner_set_registration_open(boolean) to authenticated;
create or replace function public.series3_owner_withdraw_request(p_request_id uuid)
returns text language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role in ('owner','مالک کل')) then raise exception 'Owner access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtext('plato-land-series3-registration-capacity'));
 update public.plato_land_series3_registration_requests r set registration_status='withdrawn' where r.id=p_request_id and r.registration_status in ('main','waitlist');
 if not found then raise exception 'Registration not found or already withdrawn' using errcode='P0002'; end if;
 return 'withdrawn';
end; $$;
revoke all on function public.series3_owner_withdraw_request(uuid) from public,anon;
grant execute on function public.series3_owner_withdraw_request(uuid) to authenticated;
create or replace function public.series3_owner_promote_waitlist(p_request_id uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
 if auth.uid() is null or not exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role in ('owner','مالک کل')) then raise exception 'Owner access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtext('plato-land-series3-registration-capacity'));
 select count(*)::integer into v_count from public.plato_land_series3_registration_requests r where r.registration_status='main';
 if v_count>=32 then raise exception 'Main roster is full' using errcode='23514'; end if;
 if not exists(select 1 from public.plato_land_series3_registration_requests r where r.id=p_request_id and r.registration_status='waitlist'
 and r.id=(select q.id from public.plato_land_series3_registration_requests q where q.registration_status='waitlist' order by q.created_at asc,q.id asc limit 1))
 then raise exception 'Only the first waitlist request can be promoted' using errcode='23514'; end if;
 update public.plato_land_series3_registration_requests r set registration_status='main' where r.id=p_request_id and r.registration_status='waitlist';
 return v_count+1;
end; $$;
revoke all on function public.series3_owner_promote_waitlist(uuid) from public,anon;
grant execute on function public.series3_owner_promote_waitlist(uuid) to authenticated;
