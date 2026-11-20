-- Public-safe, read-only projection for the Series 3 public gallery.
-- Source tables and their owner-only RLS policies are intentionally unchanged.
create table if not exists public.plato_land_series3_public_draw (
 event_key text primary key check(event_key='series3'),
 ranking_snapshot jsonb not null default '[]'::jsonb,
 pots_snapshot jsonb not null default '[]'::jsonb,
 groups_snapshot jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now()
);
create table if not exists public.plato_land_series3_public_fixtures (
 match_id text primary key,event_key text not null default 'series3' check(event_key='series3'),
 match_date date not null,round_no integer not null,group_name text not null,match_no integer not null,
 player_a_plato_id text not null,player_b_plato_id text not null,
 result_status text not null,score_a smallint,score_b smallint,updated_at timestamptz not null default now()
);
create table if not exists public.plato_land_series3_public_bracket (
 event_key text primary key check(event_key='series3'),bracket_snapshot jsonb not null,
 created_at timestamptz not null,updated_at timestamptz not null default now()
);
alter table public.plato_land_series3_public_draw enable row level security;
alter table public.plato_land_series3_public_fixtures enable row level security;
alter table public.plato_land_series3_public_bracket enable row level security;
create policy "Series 3 public draw read" on public.plato_land_series3_public_draw for select to anon,authenticated using(event_key='series3');
create policy "Series 3 public fixtures read" on public.plato_land_series3_public_fixtures for select to anon,authenticated using(event_key='series3');
create policy "Series 3 public bracket read" on public.plato_land_series3_public_bracket for select to anon,authenticated using(event_key='series3');
revoke all on public.plato_land_series3_public_draw,public.plato_land_series3_public_fixtures,public.plato_land_series3_public_bracket from public,anon,authenticated;
grant select on public.plato_land_series3_public_draw,public.plato_land_series3_public_fixtures,public.plato_land_series3_public_bracket to anon,authenticated;

create or replace function public.sync_series3_public_draw() returns trigger
language plpgsql security definer set search_path=''
as $$
declare r jsonb;p jsonb;g jsonb;
begin
 select coalesce(jsonb_agg(x.value-'id'-'registration_status' order by x.n),'[]'::jsonb) into r
 from jsonb_array_elements(new.ranking_snapshot) with ordinality x(value,n);
 select coalesce(jsonb_agg((select coalesce(jsonb_agg(y.value-'id'-'registration_status' order by y.n),'[]'::jsonb)
  from jsonb_array_elements(z.value) with ordinality y(value,n)) order by z.n),'[]'::jsonb) into p
 from jsonb_array_elements(new.pots_snapshot) with ordinality z(value,n);
 select coalesce(jsonb_agg(jsonb_build_object('name',z.value->>'name','players',
  (select coalesce(jsonb_agg(y.value-'id'-'registration_status' order by y.n),'[]'::jsonb)
   from jsonb_array_elements(coalesce(z.value->'players','[]'::jsonb)) with ordinality y(value,n))) order by z.n),'[]'::jsonb) into g
 from jsonb_array_elements(new.groups_snapshot) with ordinality z(value,n);
 insert into public.plato_land_series3_public_draw values(new.event_key,r,p,g,now())
 on conflict(event_key) do update set ranking_snapshot=excluded.ranking_snapshot,pots_snapshot=excluded.pots_snapshot,groups_snapshot=excluded.groups_snapshot,updated_at=now();
 return new;
end $$;
revoke all on function public.sync_series3_public_draw() from public,anon,authenticated;

create or replace function public.sync_series3_public_fixture() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into public.plato_land_series3_public_fixtures(match_id,event_key,match_date,round_no,group_name,match_no,player_a_plato_id,player_b_plato_id,result_status,score_a,score_b,updated_at)
 values(new.match_id,new.event_key,new.match_date,new.round_no,new.group_name,new.match_no,new.player_a_plato_id,new.player_b_plato_id,new.result_status,new.score_a,new.score_b,now())
 on conflict(match_id) do update set match_date=excluded.match_date,round_no=excluded.round_no,group_name=excluded.group_name,match_no=excluded.match_no,player_a_plato_id=excluded.player_a_plato_id,player_b_plato_id=excluded.player_b_plato_id,result_status=excluded.result_status,score_a=excluded.score_a,score_b=excluded.score_b,updated_at=now();
 return new;
end $$;
revoke all on function public.sync_series3_public_fixture() from public,anon,authenticated;

create or replace function public.sync_series3_public_bracket() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into public.plato_land_series3_public_bracket values(new.event_key,new.bracket_snapshot,new.created_at,now())
 on conflict(event_key) do update set bracket_snapshot=excluded.bracket_snapshot,created_at=excluded.created_at,updated_at=now();
 return new;
end $$;
revoke all on function public.sync_series3_public_bracket() from public,anon,authenticated;

create trigger trg_series3_public_draw_sync after insert or update of ranking_snapshot,pots_snapshot,groups_snapshot on public.plato_land_series3_seeding_draws for each row execute function public.sync_series3_public_draw();
create trigger trg_series3_public_fixture_sync after insert or update of match_date,round_no,group_name,match_no,player_a_plato_id,player_b_plato_id,result_status,score_a,score_b on public.plato_land_series3_group_match_results for each row execute function public.sync_series3_public_fixture();
create trigger trg_series3_public_bracket_sync after insert or update of bracket_snapshot on public.plato_land_series3_knockout_draws for each row execute function public.sync_series3_public_bracket();

insert into public.plato_land_series3_public_draw
select d.event_key,
 (select coalesce(jsonb_agg(x.value-'id'-'registration_status' order by x.n),'[]'::jsonb) from jsonb_array_elements(d.ranking_snapshot) with ordinality x(value,n)),
 (select coalesce(jsonb_agg((select coalesce(jsonb_agg(y.value-'id'-'registration_status' order by y.n),'[]'::jsonb) from jsonb_array_elements(z.value) with ordinality y(value,n)) order by z.n),'[]'::jsonb) from jsonb_array_elements(d.pots_snapshot) with ordinality z(value,n)),
 (select coalesce(jsonb_agg(jsonb_build_object('name',z.value->>'name','players',(select coalesce(jsonb_agg(y.value-'id'-'registration_status' order by y.n),'[]'::jsonb) from jsonb_array_elements(coalesce(z.value->'players','[]'::jsonb)) with ordinality y(value,n))) order by z.n),'[]'::jsonb) from jsonb_array_elements(d.groups_snapshot) with ordinality z(value,n)),
 now()
from public.plato_land_series3_seeding_draws d where d.event_key='series3'
on conflict(event_key) do update set ranking_snapshot=excluded.ranking_snapshot,pots_snapshot=excluded.pots_snapshot,groups_snapshot=excluded.groups_snapshot,updated_at=now();

insert into public.plato_land_series3_public_fixtures
select match_id,event_key,match_date,round_no,group_name,match_no,player_a_plato_id,player_b_plato_id,result_status,score_a,score_b,now()
from public.plato_land_series3_group_match_results where event_key='series3'
on conflict(match_id) do update set match_date=excluded.match_date,round_no=excluded.round_no,group_name=excluded.group_name,match_no=excluded.match_no,player_a_plato_id=excluded.player_a_plato_id,player_b_plato_id=excluded.player_b_plato_id,result_status=excluded.result_status,score_a=excluded.score_a,score_b=excluded.score_b,updated_at=now();

insert into public.plato_land_series3_public_bracket
select event_key,bracket_snapshot,created_at,now() from public.plato_land_series3_knockout_draws where event_key='series3'
on conflict(event_key) do update set bracket_snapshot=excluded.bracket_snapshot,created_at=excluded.created_at,updated_at=now();
