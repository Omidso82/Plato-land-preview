-- PLATO LAND Temporary Projects only. Applied to primary Supabase project dfrppbapaaydbjeflozw.
-- Creates an isolated persistent Plato ID registry. Does not touch Main Website profiles.
create table if not exists public.plato_land_temp_players (
 id uuid primary key default gen_random_uuid(),
 plato_id text not null,
 plato_id_normalized text generated always as (lower(btrim(plato_id))) stored,
 first_seen_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 source_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint plato_land_temp_players_plato_id_nonblank check(length(btrim(plato_id)) between 2 and 80),
 constraint plato_land_temp_players_normalized_unique unique(plato_id_normalized)
);
create table if not exists public.plato_land_temp_player_entries (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.plato_land_temp_players(id) on delete restrict,
 event_key text not null check(event_key in ('series2','series3')),
 registration_id uuid,
 registration_status text,
 registered_at timestamptz,
 first_seen_at timestamptz not null default now(),
 source_table text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint plato_land_temp_player_entries_event_player_unique unique(event_key,player_id),
 constraint plato_land_temp_player_entries_registration_unique unique(event_key,registration_id)
);
create table if not exists public.plato_land_temp_player_matches (
 id uuid primary key default gen_random_uuid(),
 event_key text not null check(event_key in ('series2','series3')),
 source_match_key text not null,
 stage text not null,
 group_name text,
 match_date date,
 player_a_id uuid references public.plato_land_temp_players(id) on delete restrict,
 player_a_plato_id text,
 player_b_id uuid references public.plato_land_temp_players(id) on delete restrict,
 player_b_plato_id text,
 score_a integer,
 score_b integer,
 winner_player_id uuid references public.plato_land_temp_players(id) on delete restrict,
 result_status text not null default 'pending',
 played_at timestamptz,
 source_table text not null,
 source_payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint plato_land_temp_player_matches_source_unique unique(event_key,source_match_key)
);
create index if not exists plato_land_temp_players_normalized_idx on public.plato_land_temp_players(plato_id_normalized);
create index if not exists plato_land_temp_entries_player_idx on public.plato_land_temp_player_entries(player_id,event_key);
create index if not exists plato_land_temp_matches_player_a_idx on public.plato_land_temp_player_matches(player_a_id,event_key);
create index if not exists plato_land_temp_matches_player_b_idx on public.plato_land_temp_player_matches(player_b_id,event_key);
alter table public.plato_land_temp_players enable row level security;
alter table public.plato_land_temp_player_entries enable row level security;
alter table public.plato_land_temp_player_matches enable row level security;
revoke all on public.plato_land_temp_players,public.plato_land_temp_player_entries,public.plato_land_temp_player_matches from public,anon,authenticated;
grant select on public.plato_land_temp_players,public.plato_land_temp_player_entries,public.plato_land_temp_player_matches to authenticated;
create policy "Temporary player registry owner read" on public.plato_land_temp_players for select to authenticated using(exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role in ('owner','مالک کل')));
create policy "Temporary player entries owner read" on public.plato_land_temp_player_entries for select to authenticated using(exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role in ('owner','مالک کل')));
create policy "Temporary player matches owner read" on public.plato_land_temp_player_matches for select to authenticated using(exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role in ('owner','مالک کل')));
create or replace function public.plato_land_temp_upsert_player(p_plato_id text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_plato text:=btrim(coalesce(p_plato_id,''));
begin
 if length(v_plato)<2 or length(v_plato)>80 then return null; end if;
 insert into public.plato_land_temp_players(plato_id) values(v_plato)
 on conflict(plato_id_normalized) do update set last_seen_at=now(),updated_at=now()
 returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.plato_land_temp_upsert_player(text) from public,anon,authenticated;
create or replace function public.plato_land_temp_capture_registration()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_event text; v_id uuid; v_status text;
begin
 v_event:=case when TG_TABLE_NAME='plato_land_series2_registration_requests' then 'series2' else 'series3' end;
 v_id:=public.plato_land_temp_upsert_player(NEW.plato_id);
 if v_id is null then return NEW; end if;
 v_status:=case when v_event='series3' then coalesce(to_jsonb(NEW)->>'registration_status','main') else 'main' end;
 insert into public.plato_land_temp_player_entries(player_id,event_key,registration_id,registration_status,registered_at,source_table)
 values(v_id,v_event,NEW.id,v_status,NEW.created_at,TG_TABLE_NAME)
 on conflict(event_key,player_id) do update set
 registration_id=coalesce(public.plato_land_temp_player_entries.registration_id,excluded.registration_id),
 registration_status=excluded.registration_status,
 registered_at=least(public.plato_land_temp_player_entries.registered_at,excluded.registered_at),
 updated_at=now();
 return NEW;
end; $$;
revoke all on function public.plato_land_temp_capture_registration() from public,anon,authenticated;
create trigger plato_land_temp_capture_series2_registration after insert or update of plato_id on public.plato_land_series2_registration_requests for each row execute function public.plato_land_temp_capture_registration();
create trigger plato_land_temp_capture_series3_registration after insert or update of plato_id,registration_status on public.plato_land_series3_registration_requests for each row execute function public.plato_land_temp_capture_registration();
insert into public.plato_land_temp_players(plato_id)
select distinct on(lower(btrim(plato_id))) btrim(plato_id) from (
 select plato_id,created_at from public.plato_land_series2_registration_requests
 union all select plato_id,created_at from public.plato_land_series3_registration_requests
) r where btrim(coalesce(plato_id,''))<>''
order by lower(btrim(plato_id)),created_at
on conflict(plato_id_normalized) do update set last_seen_at=now(),updated_at=now();
insert into public.plato_land_temp_player_entries(player_id,event_key,registration_id,registration_status,registered_at,source_table)
select p.id,'series2',r.id,'main',r.created_at,'plato_land_series2_registration_requests'
from public.plato_land_series2_registration_requests r join public.plato_land_temp_players p on p.plato_id_normalized=lower(btrim(r.plato_id))
on conflict(event_key,player_id) do update set registration_id=excluded.registration_id,registered_at=least(public.plato_land_temp_player_entries.registered_at,excluded.registered_at),updated_at=now();
insert into public.plato_land_temp_player_entries(player_id,event_key,registration_id,registration_status,registered_at,source_table)
select p.id,'series3',r.id,r.registration_status,r.created_at,'plato_land_series3_registration_requests'
from public.plato_land_series3_registration_requests r join public.plato_land_temp_players p on p.plato_id_normalized=lower(btrim(r.plato_id))
on conflict(event_key,player_id) do update set registration_id=excluded.registration_id,registration_status=excluded.registration_status,registered_at=least(public.plato_land_temp_player_entries.registered_at,excluded.registered_at),updated_at=now();
update public.plato_land_temp_players p set first_seen_at=x.first_seen,last_seen_at=x.last_seen,updated_at=now()
from (select lower(btrim(plato_id)) normalized,min(created_at) first_seen,max(created_at) last_seen from (
 select plato_id,created_at from public.plato_land_series2_registration_requests union all
 select plato_id,created_at from public.plato_land_series3_registration_requests
) z where btrim(coalesce(plato_id,''))<>'' group by lower(btrim(plato_id))) x
where p.plato_id_normalized=x.normalized;
