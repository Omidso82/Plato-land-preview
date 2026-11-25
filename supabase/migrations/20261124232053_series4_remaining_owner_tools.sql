begin;

create table public.plato_land_series4_knockout_schedule (
  singleton boolean primary key default true check (singleton),
  dates jsonb not null check (jsonb_typeof(dates)='object'),
  version integer not null default 1
);

create table public.plato_land_series4_cutoff_playoff (
  singleton boolean primary key default true check (singleton),
  player_a text not null,
  player_b text not null check (player_a<>player_b),
  score_a integer not null,
  score_b integer not null,
  group_versions jsonb not null,
  saved_at timestamptz not null default now(),
  saved_by uuid not null references auth.users(id),
  check (least(score_a,score_b) between 0 and 4 and greatest(score_a,score_b)=5)
);

create table public.plato_land_series4_video_analytics (
  singleton boolean primary key default true check (singleton),
  modal_opens bigint not null default 0 check (modal_opens>=0)
);
insert into public.plato_land_series4_video_analytics default values;

alter table public.plato_land_series4_knockout_schedule enable row level security;
alter table public.plato_land_series4_cutoff_playoff enable row level security;
alter table public.plato_land_series4_video_analytics enable row level security;
revoke all on public.plato_land_series4_knockout_schedule,public.plato_land_series4_cutoff_playoff,
  public.plato_land_series4_video_analytics from public,anon,authenticated;
grant select on public.plato_land_series4_knockout_schedule,public.plato_land_series4_cutoff_playoff,
  public.plato_land_series4_video_analytics to authenticated;

create policy "Series 4 owner reads knockout schedule" on public.plato_land_series4_knockout_schedule for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
create policy "Series 4 owner reads cutoff playoff" on public.plato_land_series4_cutoff_playoff for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
create policy "Series 4 owner reads video count" on public.plato_land_series4_video_analytics for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));

create function public.series4_owner_save_knockout_schedule(p_dates jsonb,p_version integer)
returns integer language plpgsql security definer set search_path='' as $$
declare
  allowed text[] := array['R32','R16','R8','R4','R2','THIRD'];
  stage text;
  stage_date date;
  previous_date date;
  semifinal_date date;
  current_version integer;
  first_round_count integer;
begin
  perform public.series4_assert_registration_owner();
  select jsonb_array_length(bracket->'firstRound') into strict first_round_count
  from public.plato_land_series4_knockout_draw where singleton for update;
  if first_round_count=8 then allowed:=allowed[2:6]; end if;
  if jsonb_typeof(p_dates) is distinct from 'object'
     or exists(select 1 from jsonb_object_keys(p_dates) k where not(k=any(allowed))) then
    raise exception 'Invalid knockout stages';
  end if;
  foreach stage in array allowed loop
    if not (p_dates ? stage) then continue; end if;
    if coalesce(p_dates->>stage,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'Invalid knockout date';
    end if;
    stage_date := (p_dates->>stage)::date;
    if (stage='THIRD' and stage_date<semifinal_date)
       or (stage<>'THIRD' and stage_date<previous_date) then
      raise exception 'Knockout stages must follow chronological order';
    end if;
    if stage='R4' then semifinal_date:=stage_date; end if;
    previous_date:=stage_date;
  end loop;
  select version into current_version from public.plato_land_series4_knockout_schedule where singleton;
  if p_version is distinct from coalesce(current_version,0) then raise exception 'Schedule version changed'; end if;
  insert into public.plato_land_series4_knockout_schedule(dates,version) values(p_dates,p_version+1)
  on conflict(singleton) do update set dates=excluded.dates,version=excluded.version
  returning version into current_version;
  return current_version;
end;
$$;

create function public.series4_cutoff_tie()
returns text[] language sql stable security invoker set search_path='' as $$
  with games as (
    select * from public.plato_land_series4_group_match_results
  ), statistics as (
    select group_name,player,
      sum(case when won then 3 else 0 end) points,
      sum(coalesce(scored-opposed,0)) diff,sum(coalesce(scored,0)) sets_for
    from games cross join lateral (values
      (player_a_plato_id,score_a,score_b,score_a>score_b),
      (player_b_plato_id,score_b,score_a,score_b>score_a)
    ) sides(player,scored,opposed,won)
    group by group_name,player
  ), positions as (
    select *,rank() over(partition by group_name order by points desc,diff desc,sets_for desc) position,
      count(*) over(partition by group_name,points,diff,sets_for) tie_size
    from statistics
  ), ordered as (
    select p.*,p.position+case when p.tie_size=2 and exists(
      select 1 from games g join positions opponent on opponent.group_name=p.group_name
        and opponent.position=p.position and opponent.player<>p.player
      where g.group_name=p.group_name and g.result_status='completed' and (
        (g.player_a_plato_id=p.player and g.player_b_plato_id=opponent.player and g.score_a<g.score_b) or
        (g.player_b_plato_id=p.player and g.player_a_plato_id=opponent.player and g.score_b<g.score_a)
      )
    ) then 1 else 0 end resolved
    from positions p
  ), thirds as (
    select player,rank() over(order by points desc,diff desc,sets_for desc) position
    from ordered where resolved=3
  )
  select array_agg(player order by player) from thirds
  where position<=8 and position+(select count(*) from thirds other where other.position=thirds.position)-1>8
    and (select count(*) from games)=72 and not exists(select 1 from games where result_status='pending')
    and not exists (select 1 from ordered where resolved<=3 group by group_name,resolved having count(*)>1)
    and (select count(*) from thirds)=12;
$$;

create function public.series4_owner_save_cutoff_playoff(
  p_player_a text,p_player_b text,p_score_a integer,p_score_b integer,p_group_versions jsonb
)
returns void language plpgsql security definer set search_path='' as $$
declare
  candidates text[];
  current_versions jsonb;
begin
  perform public.series4_assert_registration_owner();
  lock table public.plato_land_series4_group_match_results in share mode;
  lock table public.plato_land_series4_knockout_draw in share row exclusive mode;
  if exists(select 1 from public.plato_land_series4_knockout_draw) then raise exception 'Knockout draw is already saved'; end if;
  select jsonb_object_agg(match_id,version) into current_versions from public.plato_land_series4_group_match_results;
  candidates:=public.series4_cutoff_tie();
  if current_versions is distinct from p_group_versions or cardinality(candidates) is distinct from 2
     or p_player_a is null or p_player_b is null or p_player_a=p_player_b
     or not(p_player_a=any(candidates) and p_player_b=any(candidates)) then
    raise exception 'Cutoff playoff candidates or group results have changed';
  end if;
  insert into public.plato_land_series4_cutoff_playoff(player_a,player_b,score_a,score_b,group_versions,saved_by)
  values(p_player_a,p_player_b,p_score_a,p_score_b,current_versions,auth.uid())
  on conflict(singleton) do update set player_a=excluded.player_a,player_b=excluded.player_b,
    score_a=excluded.score_a,score_b=excluded.score_b,group_versions=excluded.group_versions,
    saved_at=excluded.saved_at,saved_by=excluded.saved_by
  where plato_land_series4_cutoff_playoff.group_versions is distinct from excluded.group_versions;
  if not found then raise exception 'Playoff result is already saved'; end if;
end;
$$;

create function public.series4_check_cutoff_before_draw()
returns trigger language plpgsql security invoker set search_path='' as $$
declare
  candidates text[]:=public.series4_cutoff_tie();
  winner text;
begin
  if candidates is null then return new; end if;
  if cardinality(candidates)<>2 then raise exception 'Cutoff tie requires a decision'; end if;
  select case when score_a>score_b then player_a else player_b end into winner
  from public.plato_land_series4_cutoff_playoff where group_versions=new.group_versions;
  if winner is null or (select count(*) from jsonb_array_elements(new.bracket->'firstRound') item
    cross join lateral (values(item->'a'->>'plato_id'),(item->'b'->>'plato_id')) entrants(player)
    where player=any(candidates))<>1 or not exists(
      select 1 from jsonb_array_elements(new.bracket->'firstRound') item
      where winner in (item->'a'->>'plato_id',item->'b'->>'plato_id')
    ) then raise exception 'The recorded cutoff playoff winner must enter the draw'; end if;
  return new;
end;
$$;
create trigger series4_check_cutoff_before_draw before insert on public.plato_land_series4_knockout_draw
for each row execute function public.series4_check_cutoff_before_draw();

-- Series 4 campaign drafts cannot become public before the official activation release.
alter table public.plato_land_prediction_campaigns add constraint series4_prediction_owner_only
  check(event_key is distinct from 'series4' or (is_open is false and coalesce(status in ('draft','archived'),false)));

-- Call only when opening the public Series 4 rules-video modal after official activation.
create function public.series4_record_rules_video_open()
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if not exists(
    select 1 from public.plato_land_series4_registration_settings s
    join public.plato_land_series4_media_preferences p using(singleton)
    join public.plato_land_series4_media m on m.slot='rules'
    where s.singleton and s.public_enabled and p.rules_enabled and m.is_active
  ) then return false; end if;
  update public.plato_land_series4_video_analytics set modal_opens=modal_opens+1 where singleton;
  return found;
end;
$$;

revoke all on function public.series4_owner_save_knockout_schedule(jsonb,integer),
  public.series4_owner_save_cutoff_playoff(text,text,integer,integer,jsonb),
  public.series4_cutoff_tie(),public.series4_check_cutoff_before_draw(),
  public.series4_record_rules_video_open() from public,anon,authenticated;
grant execute on function public.series4_owner_save_knockout_schedule(jsonb,integer),
  public.series4_owner_save_cutoff_playoff(text,text,integer,integer,jsonb) to authenticated;
grant execute on function public.series4_record_rules_video_open() to anon,authenticated;
commit;
