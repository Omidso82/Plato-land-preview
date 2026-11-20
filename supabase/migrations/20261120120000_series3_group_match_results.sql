-- Series 3 group match result storage and immutable correction history.
-- Applied to the primary Supabase project only.
create table public.plato_land_series3_group_match_results (
  match_id text primary key,
  event_key text not null default 'series3' check (event_key = 'series3'),
  match_date date not null,
  round_no integer not null check (round_no between 1 and 3),
  group_name text not null check (group_name in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  match_no integer not null check (match_no between 1 and 6),
  player_a_registration_id uuid not null references public.plato_land_series3_registration_requests(id),
  player_a_plato_id text not null,
  player_b_registration_id uuid not null references public.plato_land_series3_registration_requests(id),
  player_b_plato_id text not null,
  result_status text not null default 'pending' check (result_status in ('pending','completed','double_no_show')),
  score_a smallint, score_b smallint,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint series3_group_result_distinct_players check (player_a_registration_id <> player_b_registration_id),
  constraint series3_group_result_score_shape check (
    (result_status in ('pending','double_no_show') and score_a is null and score_b is null)
    or (result_status = 'completed' and score_a between 0 and 5 and score_b between 0 and 5
      and ((score_a = 5 and score_b < 5) or (score_b = 5 and score_a < 5)))
  )
);
create table public.plato_land_series3_group_match_result_history (
  id bigint generated always as identity primary key,
  match_id text not null,
  event_key text not null default 'series3' check (event_key = 'series3'),
  version integer not null,
  operation text not null check (operation in ('INSERT','UPDATE')),
  old_record jsonb, new_record jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id),
  unique(match_id, version)
);
create index series3_group_results_group_idx on public.plato_land_series3_group_match_results(group_name, round_no);
create index series3_group_results_status_idx on public.plato_land_series3_group_match_results(result_status);
alter table public.plato_land_series3_group_match_results enable row level security;
alter table public.plato_land_series3_group_match_result_history enable row level security;
revoke all on public.plato_land_series3_group_match_results from public, anon, authenticated;
grant select, insert, update on public.plato_land_series3_group_match_results to authenticated;
revoke all on public.plato_land_series3_group_match_result_history from public, anon, authenticated;
grant select on public.plato_land_series3_group_match_result_history to authenticated;
create policy "Series 3 group results owner read" on public.plato_land_series3_group_match_results for select to authenticated using ((select private.has_role(ARRAY['owner','مالک کل']::text[])));
create policy "Series 3 group results owner insert" on public.plato_land_series3_group_match_results for insert to authenticated with check ((select private.has_role(ARRAY['owner','مالک کل']::text[])) and created_by = (select auth.uid()));
create policy "Series 3 group results owner update" on public.plato_land_series3_group_match_results for update to authenticated using ((select private.has_role(ARRAY['owner','مالک کل']::text[]))) with check ((select private.has_role(ARRAY['owner','مالک کل']::text[])));
create policy "Series 3 group result history owner read" on public.plato_land_series3_group_match_result_history for select to authenticated using ((select private.has_role(ARRAY['owner','مالک کل']::text[])));
create or replace function public.series3_group_result_before_update() returns trigger language plpgsql set search_path = public as $$
begin
  if new.match_id <> old.match_id or new.event_key <> old.event_key or new.match_date <> old.match_date
    or new.round_no <> old.round_no or new.group_name <> old.group_name or new.match_no <> old.match_no
    or new.player_a_registration_id <> old.player_a_registration_id or new.player_a_plato_id <> old.player_a_plato_id
    or new.player_b_registration_id <> old.player_b_registration_id or new.player_b_plato_id <> old.player_b_plato_id then
    raise exception 'Fixture identity and participants are immutable';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end; $$;
create or replace function public.series3_group_result_write_history() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.plato_land_series3_group_match_result_history(match_id,event_key,version,operation,old_record,new_record,changed_by)
    values(new.match_id,new.event_key,new.version,'INSERT',null,to_jsonb(new),auth.uid());
    return new;
  else
    insert into public.plato_land_series3_group_match_result_history(match_id,event_key,version,operation,old_record,new_record,changed_by)
    values(new.match_id,new.event_key,new.version,'UPDATE',to_jsonb(old),to_jsonb(new),auth.uid());
    return new;
  end if;
end; $$;
create trigger series3_group_result_before_update before update on public.plato_land_series3_group_match_results for each row execute function public.series3_group_result_before_update();
create trigger series3_group_result_history after insert or update on public.plato_land_series3_group_match_results for each row execute function public.series3_group_result_write_history();
insert into public.plato_land_series3_group_match_results
  (match_id,match_date,round_no,group_name,match_no,player_a_registration_id,player_a_plato_id,player_b_registration_id,player_b_plato_id)
select fixture->>'id',(day->>'date')::date,(fixture->>'round')::integer,fixture->>'group',(fixture->>'match_no')::integer,
  (fixture->'player_a'->>'registration_id')::uuid,fixture->'player_a'->>'plato_id',
  (fixture->'player_b'->>'registration_id')::uuid,fixture->'player_b'->>'plato_id'
from public.plato_land_series3_group_fixtures g
cross join lateral jsonb_array_elements(g.schedule_snapshot->'group_stage'->'days') day
cross join lateral jsonb_array_elements(day->'matches') fixture
where g.event_key='series3';
