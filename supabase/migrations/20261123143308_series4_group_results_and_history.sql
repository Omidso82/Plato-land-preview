-- Draft only. Apply after explicit approval.
begin;
create table public.plato_land_series4_group_match_results (
  match_id text primary key,
  event_key text not null default 'series4' check (event_key = 'series4'),
  match_date date not null,
  round_no integer not null check (round_no between 1 and 3),
  group_name text not null check (group_name in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  match_no integer not null check (match_no between 1 and 6),
  player_a_registration_id uuid not null references public.plato_land_series4_registration_requests(id),
  player_a_plato_id text not null,
  player_b_registration_id uuid not null references public.plato_land_series4_registration_requests(id),
  player_b_plato_id text not null,
  result_status text not null default 'pending' check (result_status in ('pending','completed','double_no_show')),
  score_a smallint, score_b smallint,
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint series4_group_result_distinct_players check (player_a_registration_id <> player_b_registration_id),
  constraint series4_group_result_score_shape check (
    (result_status in ('pending','double_no_show') and score_a is null and score_b is null)
    or (result_status = 'completed' and score_a is not null and score_b is not null and score_a between 0 and 5 and score_b between 0 and 5
      and ((score_a = 5 and score_b < 5) or (score_b = 5 and score_a < 5)))
  )
);
create table public.plato_land_series4_group_match_result_history (
  id bigint generated always as identity primary key,
  match_id text not null,
  event_key text not null default 'series4' check (event_key = 'series4'),
  version integer not null,
  operation text not null check (operation in ('INSERT','UPDATE')),
  old_record jsonb, new_record jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id),
  unique(match_id, version)
);
create index series4_group_results_group_idx on public.plato_land_series4_group_match_results(group_name, round_no);
create index series4_group_results_status_idx on public.plato_land_series4_group_match_results(result_status);
alter table public.plato_land_series4_group_match_results enable row level security;
alter table public.plato_land_series4_group_match_result_history enable row level security;
revoke all on public.plato_land_series4_group_match_results from public, anon, authenticated;
grant select on public.plato_land_series4_group_match_results to authenticated;
grant update (result_status,score_a,score_b) on public.plato_land_series4_group_match_results to authenticated;
revoke all on public.plato_land_series4_group_match_result_history from public, anon, authenticated;
grant select on public.plato_land_series4_group_match_result_history to authenticated;
create policy "Series 4 group results owner read" on public.plato_land_series4_group_match_results for select to authenticated using (exists (select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')));
create policy "Series 4 group results owner update" on public.plato_land_series4_group_match_results for update to authenticated using (exists (select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل'))) with check (exists (select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')));
create policy "Series 4 group result history owner read" on public.plato_land_series4_group_match_result_history for select to authenticated using (exists (select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')));
create or replace function public.series4_group_result_before_update() returns trigger language plpgsql set search_path = '' as $$
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
create or replace function public.series4_group_result_write_history() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.plato_land_series4_group_match_result_history(match_id,event_key,version,operation,old_record,new_record,changed_by)
    values(new.match_id,new.event_key,new.version,'INSERT',null,to_jsonb(new),auth.uid());
    return new;
  else
    insert into public.plato_land_series4_group_match_result_history(match_id,event_key,version,operation,old_record,new_record,changed_by)
    values(new.match_id,new.event_key,new.version,'UPDATE',to_jsonb(old),to_jsonb(new),auth.uid());
    return new;
  end if;
end; $$;
create trigger series4_group_result_before_update before update on public.plato_land_series4_group_match_results for each row execute function public.series4_group_result_before_update();
create trigger series4_group_result_history after insert or update on public.plato_land_series4_group_match_results for each row execute function public.series4_group_result_write_history();
create function public.series4_owner_init_group_results(p_dates date[])
returns integer language plpgsql security definer set search_path = '' as $$
declare
  saved_groups jsonb;
  group_count integer;
  inserted integer;
begin
  perform public.series4_assert_registration_owner();
  if coalesce(array_length(p_dates, 1), 0) <> 3
      or p_dates[1] is null or p_dates[2] is null or p_dates[3] is null
      or p_dates[1] > p_dates[2] or p_dates[2] > p_dates[3] then
    raise exception 'Provide three ordered round dates';
  end if;
  select groups_snapshot into saved_groups
  from public.plato_land_series4_seeding_draws where event_key = 'series4' for update;
  if not found then raise exception 'Save the group draw first'; end if;
  if exists(select 1 from public.plato_land_series4_group_match_results) then
    raise exception 'Group schedule is already saved';
  end if;
  group_count := jsonb_array_length(saved_groups);
  if group_count not in (8,12) or exists (
    select 1 from jsonb_array_elements(saved_groups) g
    where jsonb_array_length(g->'players') is distinct from 4
  ) then raise exception 'Invalid group draw'; end if;
  if (select count(distinct (p->>'id')) from jsonb_array_elements(saved_groups) g
    cross join lateral jsonb_array_elements(g->'players') p) <> group_count * 4 then
    raise exception 'The group draw contains duplicate or missing registrations';
  end if;
  insert into public.plato_land_series4_group_match_results
    (match_id, match_date, round_no, group_name, match_no,
     player_a_registration_id, player_a_plato_id,
     player_b_registration_id, player_b_plato_id, created_by)
  select concat('S4-', g->>'name', '-', m.match_no), p_dates[m.round_no],
    m.round_no, g->>'name', m.match_no,
    a.id, a.plato_id, b.id, b.plato_id, auth.uid()
  from jsonb_array_elements(saved_groups) g
  cross join (values (1,1,0,3),(2,1,1,2),(3,2,0,2),(4,2,1,3),(5,3,0,1),(6,3,2,3)) m(match_no,round_no,a_pos,b_pos)
  join public.plato_land_series4_registration_requests a on a.id = (g->'players'->m.a_pos->>'id')::uuid
  join public.plato_land_series4_registration_requests b on b.id = (g->'players'->m.b_pos->>'id')::uuid;
  get diagnostics inserted = row_count;
  if inserted <> group_count * 6 then raise exception 'Incomplete group schedule'; end if;
  return inserted;
end;
$$;
revoke all on function public.series4_owner_init_group_results(date[]) from public, anon, authenticated;
grant execute on function public.series4_owner_init_group_results(date[]) to authenticated;
commit;
