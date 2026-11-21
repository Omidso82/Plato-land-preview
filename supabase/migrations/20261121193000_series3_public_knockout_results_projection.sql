-- Public-safe projection of Series 3 knockout results.
-- Source result rows remain Owner-only; this projection exposes only tournament display fields.
create table public.plato_land_series3_public_knockout_results (
  event_key text not null default 'series3' check (event_key = 'series3'),
  stage_key text not null check (stage_key in ('round32','round16','quarterfinals','semifinals','thirdPlace','final')),
  match_id text not null,
  match_no integer not null check (match_no > 0),
  player_a_plato_id text not null,
  player_b_plato_id text not null,
  score_a smallint,
  score_b smallint,
  result_status text not null check (result_status in ('pending','completed')),
  updated_at timestamptz not null default now(),
  primary key (event_key, match_id),
  constraint series3_public_knockout_distinct_players check (player_a_plato_id <> player_b_plato_id),
  constraint series3_public_knockout_score_shape check (
    (result_status = 'pending' and score_a is null and score_b is null)
    or (result_status = 'completed' and score_a is not null and score_b is not null and score_a >= 0 and score_b >= 0 and score_a <> score_b)
  )
);

alter table public.plato_land_series3_public_knockout_results enable row level security;
revoke all on public.plato_land_series3_public_knockout_results from public, anon, authenticated;
grant select on public.plato_land_series3_public_knockout_results to anon, authenticated;
create policy "Series 3 public knockout results read"
on public.plato_land_series3_public_knockout_results
for select to anon, authenticated
using (event_key = 'series3');

create or replace function public.sync_series3_public_knockout_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.plato_land_series3_public_knockout_results
    where event_key = old.event_key and match_id = old.match_id;
    return old;
  end if;

  insert into public.plato_land_series3_public_knockout_results
    (event_key,stage_key,match_id,match_no,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status,updated_at)
  values
    (new.event_key,new.stage_key,new.match_id,new.match_no,new.player_a_plato_id,new.player_b_plato_id,new.score_a,new.score_b,new.result_status,now())
  on conflict (event_key,match_id) do update set
    stage_key=excluded.stage_key,
    match_no=excluded.match_no,
    player_a_plato_id=excluded.player_a_plato_id,
    player_b_plato_id=excluded.player_b_plato_id,
    score_a=excluded.score_a,
    score_b=excluded.score_b,
    result_status=excluded.result_status,
    updated_at=now();
  return new;
end;
$$;

revoke all on function public.sync_series3_public_knockout_result() from public, anon, authenticated;
create trigger trg_series3_public_knockout_result_sync
after insert or update or delete on public.plato_land_series3_knockout_match_results
for each row execute function public.sync_series3_public_knockout_result();

insert into public.plato_land_series3_public_knockout_results
  (event_key,stage_key,match_id,match_no,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status,updated_at)
select event_key,stage_key,match_id,match_no,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status,now()
from public.plato_land_series3_knockout_match_results
where event_key='series3'
on conflict (event_key,match_id) do update set
  stage_key=excluded.stage_key,
  match_no=excluded.match_no,
  player_a_plato_id=excluded.player_a_plato_id,
  player_b_plato_id=excluded.player_b_plato_id,
  score_a=excluded.score_a,
  score_b=excluded.score_b,
  result_status=excluded.result_status,
  updated_at=now();

-- Publish only the public-safe projections for realtime read updates.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='plato_land_series3_public_knockout_results'
  ) then
    alter publication supabase_realtime add table public.plato_land_series3_public_knockout_results;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='plato_land_series3_public_fixtures'
  ) then
    alter publication supabase_realtime add table public.plato_land_series3_public_fixtures;
  end if;
end;
$$;
