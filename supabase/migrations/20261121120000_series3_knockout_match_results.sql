-- Series 3 knockout match results: isolated owner-managed result records.
create table if not exists public.plato_land_series3_knockout_match_results (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'series3' check (event_key = 'series3'),
  stage_key text not null check (stage_key in ('round32','round16','quarterfinals','semifinals','thirdPlace','final')),
  match_id text not null,
  match_no integer not null check (match_no > 0),
  player_a_plato_id text not null,
  player_b_plato_id text not null,
  score_a smallint,
  score_b smallint,
  result_status text not null default 'pending' check (result_status in ('pending','completed')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id),
  constraint series3_knockout_distinct_players check (lower(player_a_plato_id) <> lower(player_b_plato_id)),
  constraint series3_knockout_score_pair check ((score_a is null and score_b is null) or (score_a is not null and score_b is not null)),
  constraint series3_knockout_result_consistency check (
    (result_status = 'pending' and score_a is null and score_b is null)
    or
    (result_status = 'completed' and score_a is not null and score_b is not null and score_a <> score_b)
  ),
  constraint series3_knockout_match_unique unique (event_key, match_id)
);
create index if not exists idx_series3_knockout_results_stage
  on public.plato_land_series3_knockout_match_results(event_key, stage_key, match_no);

alter table public.plato_land_series3_knockout_match_results enable row level security;
drop policy if exists "Series 3 knockout results owner read" on public.plato_land_series3_knockout_match_results;
create policy "Series 3 knockout results owner read"
  on public.plato_land_series3_knockout_match_results for select to authenticated
  using ((select private.has_role(array['owner'::text,'مالک کل'::text])));
drop policy if exists "Series 3 knockout results owner insert" on public.plato_land_series3_knockout_match_results;
create policy "Series 3 knockout results owner insert"
  on public.plato_land_series3_knockout_match_results for insert to authenticated
  with check (
    (select private.has_role(array['owner'::text,'مالک کل'::text]))
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
  );
drop policy if exists "Series 3 knockout results owner update" on public.plato_land_series3_knockout_match_results;
create policy "Series 3 knockout results owner update"
  on public.plato_land_series3_knockout_match_results for update to authenticated
  using ((select private.has_role(array['owner'::text,'مالک کل'::text])))
  with check (
    (select private.has_role(array['owner'::text,'مالک کل'::text]))
    and updated_by = (select auth.uid())
  );

create table if not exists public.plato_land_series3_knockout_match_result_history (
  id bigint generated always as identity primary key,
  result_id uuid not null,
  event_key text not null default 'series3',
  match_id text not null,
  version integer not null,
  operation text not null check (operation in ('INSERT','UPDATE')),
  old_record jsonb,
  new_record jsonb,
  changed_at timestamptz not null default now(),
  changed_by uuid
);
alter table public.plato_land_series3_knockout_match_result_history enable row level security;
drop policy if exists "Series 3 knockout result history owner read" on public.plato_land_series3_knockout_match_result_history;
create policy "Series 3 knockout result history owner read"
  on public.plato_land_series3_knockout_match_result_history for select to authenticated
  using ((select private.has_role(array['owner'::text,'مالک کل'::text])));

create or replace function private.log_series3_knockout_match_result_history()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.plato_land_series3_knockout_match_result_history
    (result_id,event_key,match_id,version,operation,old_record,new_record,changed_by)
  values
    (new.id,new.event_key,new.match_id,new.version,TG_OP,
     case when TG_OP='UPDATE' then to_jsonb(old) else null end,
     to_jsonb(new),new.updated_by);
  return new;
end;
$$;
drop trigger if exists trg_series3_knockout_result_history on public.plato_land_series3_knockout_match_results;
create trigger trg_series3_knockout_result_history
  after insert or update on public.plato_land_series3_knockout_match_results
  for each row execute function private.log_series3_knockout_match_result_history();

comment on table public.plato_land_series3_knockout_match_results is
  'Owner-only official result records for PLATO LAND Series 3 knockout matches; separate from group-stage results.';
