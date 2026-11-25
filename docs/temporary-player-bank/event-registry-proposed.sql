begin;
create table public.plato_land_temp_events(event_key text primary key, label text not null, game_type_key text not null references public.plato_land_temp_game_types(game_key), sort_order integer not null default 100, registration_source text unique);
alter table public.plato_land_temp_events enable row level security;
revoke all on public.plato_land_temp_events from public,anon,authenticated;
grant select on public.plato_land_temp_events to authenticated;
create policy "Temporary events owner read" on public.plato_land_temp_events for select to authenticated using (exists(select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role in ('owner','مالک کل')));
insert into public.plato_land_temp_events values
('series1','سری اول تخته','backgammon',1,null),
('series2','سری دوم تخته','backgammon',2,'plato_land_series2_registration_requests'),
('series3','سری سوم تخته','backgammon',3,'plato_land_series3_registration_requests'),
('series4','سری چهارم تخته','backgammon',4,'plato_land_series4_registration_requests'),
('black_friday','تورنمنت حذفی Black Friday','backgammon',5,'plato_land_black_friday_registration_requests');
alter table public.plato_land_temp_events add unique (event_key,game_type_key);
alter table public.plato_land_temp_player_entries drop constraint plato_land_temp_player_entries_event_key_check, add constraint temp_entries_event_fk foreign key(event_key,game_type_key) references public.plato_land_temp_events(event_key,game_type_key);
alter table public.plato_land_temp_player_matches drop constraint plato_land_temp_player_matches_event_key_check, add constraint temp_matches_event_fk foreign key(event_key,game_type_key) references public.plato_land_temp_events(event_key,game_type_key);
-- Block source writes between the initial snapshot and trigger installation.
lock table public.plato_land_black_friday_registration_requests,
           public.plato_land_series4_registration_requests in share row exclusive mode;

create or replace function public.plato_land_temp_capture_registration() returns trigger language plpgsql security definer set search_path='' as $$
declare v_event text; v_game text; v_id uuid; v_status text;
begin
select event_key,game_type_key into strict v_event,v_game from public.plato_land_temp_events where registration_source=TG_TABLE_NAME and TG_TABLE_SCHEMA='public';
v_id:=public.plato_land_temp_upsert_player(NEW.plato_id);
if v_id is null then return NEW; end if;
v_status:=coalesce(to_jsonb(NEW)->>'registration_status',to_jsonb(NEW)->>'selection_status','main');
insert into public.plato_land_temp_player_entries(player_id,event_key,registration_id,registration_status,registered_at,source_table,game_type_key)
values(v_id,v_event,NEW.id,v_status,NEW.created_at,TG_TABLE_NAME,v_game)
on conflict(event_key,player_id) do update set registration_id=coalesce(public.plato_land_temp_player_entries.registration_id,excluded.registration_id),registration_status=excluded.registration_status,registered_at=least(public.plato_land_temp_player_entries.registered_at,excluded.registered_at),updated_at=now();
return NEW;
end; $$;
revoke execute on function public.plato_land_temp_capture_registration() from public,anon,authenticated;
create trigger plato_land_temp_capture_friday_registration after insert or update on public.plato_land_black_friday_registration_requests for each row execute function public.plato_land_temp_capture_registration();
create trigger plato_land_temp_capture_series4_registration after insert or update on public.plato_land_series4_registration_requests for each row execute function public.plato_land_temp_capture_registration();
-- Populate both sources, including applications added before this migration.
with applications as (
  select plato_id,created_at from public.plato_land_black_friday_registration_requests
  union all
  select plato_id,created_at from public.plato_land_series4_registration_requests
)
insert into public.plato_land_temp_players as p(plato_id,first_seen_at,last_seen_at)
select min(plato_id),min(created_at),max(created_at)
from applications group by lower(btrim(plato_id))
on conflict(plato_id_normalized) do update
set first_seen_at=least(p.first_seen_at,excluded.first_seen_at),
    last_seen_at=greatest(p.last_seen_at,excluded.last_seen_at),updated_at=now();

insert into public.plato_land_temp_player_entries as entry
  (player_id,event_key,registration_id,registration_status,registered_at,source_table,game_type_key)
select p.id,e.event_key,r.id,r.status,r.created_at,e.registration_source,e.game_type_key
from (
  select 'black_friday' event_key,id,plato_id_normalized,selection_status status,created_at
  from public.plato_land_black_friday_registration_requests
  union all
  select 'series4',id,plato_id_normalized,registration_status,created_at
  from public.plato_land_series4_registration_requests
) r
join public.plato_land_temp_players p using(plato_id_normalized)
join public.plato_land_temp_events e using(event_key)
on conflict(event_key,player_id) do update
set registration_id=excluded.registration_id,registration_status=excluded.registration_status,
    registered_at=least(entry.registered_at,excluded.registered_at),updated_at=now();

-- Resolve Series 4 entrants in bracket order using the official scores.
create function public.plato_land_temp_series4_knockout_results()
returns table(match_key text,stage text,plato_a text,plato_b text,points_a integer,points_b integer)
language plpgsql stable security invoker set search_path='' as $$
declare
  resolved jsonb := '{}'::jsonb;
  fixture record;
begin
  for fixture in
    select item,round_order,position
    from public.plato_land_series4_knockout_draw d
    cross join lateral (
      select item,0::bigint round_order,position
      from jsonb_array_elements(d.bracket->'firstRound') with ordinality f(item,position)
      union all
      select item,round_order,position
      from jsonb_array_elements(d.bracket->'laterRounds') with ordinality r(items,round_order)
      cross join lateral jsonb_array_elements(r.items) with ordinality f(item,position)
      union all
      select d.bracket->'thirdPlace',100::bigint,1::bigint
    ) ordered_fixtures
    order by round_order,position
  loop
    match_key := fixture.item->>'id';
    stage := case split_part(match_key,'-',1)
      when 'R32' then 'round32' when 'R16' then 'round16' when 'R8' then 'quarter'
      when 'R4' then 'semi' when 'R2' then 'final' when 'THIRD' then 'third_place' end;
    if fixture.round_order=0 then
      plato_a := fixture.item#>>'{a,plato_id}';
      plato_b := fixture.item#>>'{b,plato_id}';
    else
      plato_a := resolved #>> array[fixture.item->>'fromA',case when stage='third_place' then 'loser' else 'winner' end];
      plato_b := resolved #>> array[fixture.item->>'fromB',case when stage='third_place' then 'loser' else 'winner' end];
    end if;
    if plato_a is null or plato_b is null then continue; end if;
    select s.score_a,s.score_b into points_a,points_b
    from public.plato_land_series4_knockout_scores s where s.match_id=match_key;
    if found then
      resolved := resolved || jsonb_build_object(match_key,jsonb_build_object(
        'winner',case when points_a>points_b then plato_a else plato_b end,
        'loser',case when points_a>points_b then plato_b else plato_a end
      ));
    end if;
    return next;
  end loop;
end;
$$;
revoke all on function public.plato_land_temp_series4_knockout_results() from public,anon,authenticated;
grant execute on function public.plato_land_temp_series4_knockout_results() to authenticated;

-- Friday's source tables are deliberately unavailable to authenticated clients.
-- Expose only the fields used by the bank and require the existing owner role.
create function public.plato_land_temp_friday_individual_results()
returns table(event_key text,match_key text,stage text,group_name text,match_date date,
              plato_a text,plato_b text,points_a integer,points_b integer,result_status text,played_at timestamptz)
language sql stable security definer set search_path='' as $$
  select 'black_friday',format('game:%s:%s',g.match_slot,g.game_no),
         case when g.game_no=5 then 'individual_decider' else 'individual_game' end,
         null::text,null::date,a.plato_id,b.plato_id,g.score_a,g.score_b,'completed',null::timestamptz
  from public.plato_land_black_friday_games g
  join public.plato_land_black_friday_registration_requests a on a.id=g.player_a
  join public.plato_land_black_friday_registration_requests b on b.id=g.player_b
  where exists(select 1 from public.user_roles u
    where u.user_id=(select auth.uid()) and u.role in ('owner','مالک کل'));
$$;
revoke all on function public.plato_land_temp_friday_individual_results() from public,anon,authenticated;
grant execute on function public.plato_land_temp_friday_individual_results() to authenticated;

-- Keep historical projections for Series 1–3. Read new events from canonical
-- results so score corrections appear immediately and cannot create duplicate wins.
create view public.plato_land_temp_player_match_feed with (security_invoker=true) as
with source_results as (
  select 'series4' event_key,'group:'||r.match_id match_key,'group' stage,r.group_name,r.match_date,
         r.player_a_plato_id plato_a,r.player_b_plato_id plato_b,r.score_a::integer points_a,
         r.score_b::integer points_b,r.result_status,r.updated_at played_at
  from public.plato_land_series4_group_match_results r where r.event_key='series4'
  union all
  select 'series4','knockout:'||k.match_key,k.stage,null,null,k.plato_a,k.plato_b,k.points_a,k.points_b,
         case when k.points_a is null then 'pending' else 'completed' end,h.saved_at
  from public.plato_land_temp_series4_knockout_results() k
  left join public.plato_land_series4_knockout_scores s on s.match_id=k.match_key
  left join public.plato_land_series4_knockout_score_history h on (h.match_id,h.version)=(s.match_id,s.version)
  union all
  select 'series4','cutoff:1','cutoff_playoff',null,null,p.player_a,p.player_b,p.score_a,p.score_b,
         'completed',p.saved_at
  from public.plato_land_series4_cutoff_playoff p
  union all
  select 'series3','knockout:'||r.match_id,
         case r.stage_key when 'quarterfinals' then 'quarter' when 'semifinals' then 'semi'
                          when 'thirdPlace' then 'third_place' else r.stage_key end,
         null,null,r.player_a_plato_id,r.player_b_plato_id,r.score_a::integer,r.score_b::integer,
         r.result_status,r.updated_at
  from public.plato_land_series3_knockout_match_results r where r.event_key='series3'
  union all
  select 'series3','cutoff:1','cutoff_playoff',null,null,p.player_a_plato_id,p.player_b_plato_id,
         p.score_a,p.score_b,p.result_status,p.updated_at
  from public.plato_land_series3_third_place_playoff p where p.event_key='series3'
  union all
  select * from public.plato_land_temp_friday_individual_results()
)
select id::text id,event_key,game_type_key,source_match_key,stage,group_name,match_date,
       player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,score_a,score_b,
       winner_player_id,result_status,played_at
from public.plato_land_temp_player_matches
where event_key not in ('series4','black_friday')
  and not exists (
    select 1 from source_results r
    where r.event_key=plato_land_temp_player_matches.event_key
      and (r.match_key=plato_land_temp_player_matches.source_match_key or
           (r.match_key='knockout:'||plato_land_temp_player_matches.source_match_key
            and r.stage=plato_land_temp_player_matches.stage))
  )
union all
select r.event_key||':'||r.match_key,r.event_key,e.game_type_key,r.match_key,r.stage,r.group_name,r.match_date,
       a.id,r.plato_a,b.id,r.plato_b,r.points_a,r.points_b,
       case when r.result_status='completed' and r.points_a>r.points_b then a.id
            when r.result_status='completed' and r.points_b>r.points_a then b.id end,
       r.result_status,case when r.result_status<>'pending' then r.played_at end
from source_results r
join public.plato_land_temp_events e using(event_key)
join public.plato_land_temp_players a on a.plato_id_normalized=lower(btrim(r.plato_a))
join public.plato_land_temp_players b on b.plato_id_normalized=lower(btrim(r.plato_b));

create function public.plato_land_temp_player_team_results(p_player_id uuid)
returns table(event_key text,game_type_key text,slot integer,team_name text,opponent_name text,result text)
language sql stable security definer set search_path='' as $$

select e.event_key,e.game_type_key,m.slot,t.name team_name,o.name opponent_name,
       case when m.winner=t.id then 'won' when m.winner=o.id then 'lost' else 'pending' end result
from public.plato_land_black_friday_matches m
cross join lateral (values (m.team_a,m.team_b),(m.team_b,m.team_a)) sides(team_id,opponent_id)
join public.plato_land_black_friday_teams t on t.id=sides.team_id
join public.plato_land_black_friday_teams o on o.id=sides.opponent_id
cross join lateral (values(t.player_a),(t.player_b)) members(registration_id)
join public.plato_land_black_friday_registration_requests r on r.id=members.registration_id
join public.plato_land_temp_players p using(plato_id_normalized)
join public.plato_land_temp_events e on e.event_key='black_friday'
where p.id=p_player_id and exists(select 1 from public.user_roles u
  where u.user_id=(select auth.uid()) and u.role in ('owner','مالک کل'));
$$;

revoke all on public.plato_land_temp_player_match_feed
  from public,anon,authenticated;
grant select on public.plato_land_temp_player_match_feed
  to authenticated;

revoke all on function public.plato_land_temp_player_team_results(uuid) from public,anon,authenticated;
grant execute on function public.plato_land_temp_player_team_results(uuid) to authenticated;

commit;
