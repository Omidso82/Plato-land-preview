-- PLATO LAND Temporary Projects only. Match-history projection from Series 2 and Series 3 sources.
insert into public.plato_land_temp_player_matches(
 event_key,source_match_key,stage,group_name,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,
 score_a,score_b,winner_player_id,result_status,played_at,source_table,source_payload
)
select 'series2',coalesce(m->>'id','s2-group-'||md5(m::text)),'group',m->>'group',
 pa.id,m->>'player1',pb.id,m->>'player2',nullif(m->>'score1','')::integer,nullif(m->>'score2','')::integer,
 case when m->>'winner'=m->>'player1' then pa.id when m->>'winner'=m->>'player2' then pb.id else null end,
 case when m->>'result_status'='double_no_show' then 'double_no_show'
 when m->>'winner' in(m->>'player1',m->>'player2') and m->>'score1' is not null and m->>'score2' is not null then 'completed' else 'pending' end,
 nullif(m#>>'{result_history,0,recorded_at}','')::timestamptz,'plato_land_series2_tournament_progression',m
from public.plato_land_series2_tournament_progression s
cross join lateral jsonb_array_elements(coalesce(s.progression->'group_fixtures','[]'::jsonb)) m
left join public.plato_land_temp_players pa on pa.plato_id_normalized=lower(btrim(m->>'player1'))
left join public.plato_land_temp_players pb on pb.plato_id_normalized=lower(btrim(m->>'player2'))
where s.tournament_key='series2' and coalesce(m->>'player1','')<>'' and coalesce(m->>'player2','')<>''
on conflict(event_key,source_match_key) do update set score_a=excluded.score_a,score_b=excluded.score_b,winner_player_id=excluded.winner_player_id,result_status=excluded.result_status,played_at=excluded.played_at,source_payload=excluded.source_payload,updated_at=now();
insert into public.plato_land_temp_player_matches(
 event_key,source_match_key,stage,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,
 score_a,score_b,winner_player_id,result_status,played_at,source_table,source_payload
)
select 'series2',coalesce(m->>'id','s2-'||e.key||'-'||md5(m::text)),e.key,
 pa.id,m->>'player1',pb.id,m->>'player2',nullif(m->>'score1','')::integer,nullif(m->>'score2','')::integer,
 case when m->>'winner'=m->>'player1' then pa.id when m->>'winner'=m->>'player2' then pb.id else null end,
 case when m->>'winner' in(m->>'player1',m->>'player2') and m->>'score1' is not null and m->>'score2' is not null then 'completed' else 'pending' end,
 nullif(m#>>'{result_history,0,recorded_at}','')::timestamptz,'plato_land_series2_tournament_progression',m
from public.plato_land_series2_tournament_progression s
cross join lateral jsonb_each(coalesce(s.progression->'brackets','{}'::jsonb)) e
cross join lateral jsonb_array_elements(case when jsonb_typeof(e.value)='array' then e.value else '[]'::jsonb end) m
left join public.plato_land_temp_players pa on pa.plato_id_normalized=lower(btrim(m->>'player1'))
left join public.plato_land_temp_players pb on pb.plato_id_normalized=lower(btrim(m->>'player2'))
where s.tournament_key='series2' and e.key in('round16','quarter','semi','final','third_place') and coalesce(m->>'player1','')<>'' and coalesce(m->>'player2','')<>''
on conflict(event_key,source_match_key) do update set player_a_id=excluded.player_a_id,player_b_id=excluded.player_b_id,score_a=excluded.score_a,score_b=excluded.score_b,winner_player_id=excluded.winner_player_id,result_status=excluded.result_status,played_at=excluded.played_at,source_payload=excluded.source_payload,updated_at=now();
insert into public.plato_land_temp_player_matches(
 event_key,source_match_key,stage,group_name,match_date,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,
 score_a,score_b,result_status,source_table,source_payload
)
select 'series3',r.match_id,'group',r.group_name,r.match_date,pa.id,r.player_a_plato_id,pb.id,r.player_b_plato_id,
 r.score_a,r.score_b,'pending','plato_land_series3_group_match_results',to_jsonb(r)
from public.plato_land_series3_group_match_results r
left join public.plato_land_temp_players pa on pa.plato_id_normalized=lower(btrim(r.player_a_plato_id))
left join public.plato_land_temp_players pb on pb.plato_id_normalized=lower(btrim(r.player_b_plato_id))
where r.event_key='series3'
on conflict(event_key,source_match_key) do update set score_a=excluded.score_a,score_b=excluded.score_b,result_status=excluded.result_status,source_payload=excluded.source_payload,updated_at=now();
create or replace function public.plato_land_temp_sync_series3_match()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_a uuid;v_b uuid;v_winner uuid;
begin
 v_a:=public.plato_land_temp_upsert_player(NEW.player_a_plato_id);
 v_b:=public.plato_land_temp_upsert_player(NEW.player_b_plato_id);
 if NEW.result_status='completed' and NEW.score_a is not null and NEW.score_b is not null then
  if NEW.score_a>NEW.score_b then v_winner:=v_a;elsif NEW.score_b>NEW.score_a then v_winner:=v_b;end if;
 end if;
 insert into public.plato_land_temp_player_matches(event_key,source_match_key,stage,group_name,match_date,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,score_a,score_b,winner_player_id,result_status,source_table,source_payload)
 values('series3',NEW.match_id,'group',NEW.group_name,NEW.match_date,v_a,NEW.player_a_plato_id,v_b,NEW.player_b_plato_id,NEW.score_a,NEW.score_b,v_winner,NEW.result_status,'plato_land_series3_group_match_results',to_jsonb(NEW))
 on conflict(event_key,source_match_key) do update set player_a_id=excluded.player_a_id,player_b_id=excluded.player_b_id,score_a=excluded.score_a,score_b=excluded.score_b,winner_player_id=excluded.winner_player_id,result_status=excluded.result_status,match_date=excluded.match_date,source_payload=excluded.source_payload,updated_at=now();
 return NEW;
end;$$;
revoke all on function public.plato_land_temp_sync_series3_match() from public,anon,authenticated;
create trigger plato_land_temp_sync_series3_match after insert or update on public.plato_land_series3_group_match_results for each row execute function public.plato_land_temp_sync_series3_match();
create or replace function public.plato_land_temp_sync_series2_progression()
returns trigger language plpgsql security definer set search_path=''
as $$
declare e record;m jsonb;v_a uuid;v_b uuid;v_winner uuid;v_stage text;v_status text;
begin
 for m in select value from jsonb_array_elements(coalesce(NEW.progression->'group_fixtures','[]'::jsonb)) loop
  v_a:=public.plato_land_temp_upsert_player(m->>'player1');v_b:=public.plato_land_temp_upsert_player(m->>'player2');
  v_winner:=case when m->>'winner'=m->>'player1' then v_a when m->>'winner'=m->>'player2' then v_b else null end;
  v_status:=case when m->>'result_status'='double_no_show' then 'double_no_show' when v_winner is not null and m->>'score1' is not null and m->>'score2' is not null then 'completed' else 'pending' end;
  insert into public.plato_land_temp_player_matches(event_key,source_match_key,stage,group_name,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,score_a,score_b,winner_player_id,result_status,played_at,source_table,source_payload)
  values('series2',coalesce(m->>'id','s2-group-'||md5(m::text)),'group',m->>'group',v_a,m->>'player1',v_b,m->>'player2',nullif(m->>'score1','')::integer,nullif(m->>'score2','')::integer,v_winner,v_status,nullif(m#>>'{result_history,0,recorded_at}','')::timestamptz,'plato_land_series2_tournament_progression',m)
  on conflict(event_key,source_match_key) do update set player_a_id=excluded.player_a_id,player_b_id=excluded.player_b_id,score_a=excluded.score_a,score_b=excluded.score_b,winner_player_id=excluded.winner_player_id,result_status=excluded.result_status,played_at=excluded.played_at,source_payload=excluded.source_payload,updated_at=now();
 end loop;
 for e in select key,value from jsonb_each(coalesce(NEW.progression->'brackets','{}'::jsonb)) where key in('round16','quarter','semi','final','third_place') loop
  v_stage:=e.key;
  for m in select value from jsonb_array_elements(case when jsonb_typeof(e.value)='array' then e.value else '[]'::jsonb end) loop
   v_a:=public.plato_land_temp_upsert_player(m->>'player1');v_b:=public.plato_land_temp_upsert_player(m->>'player2');
   v_winner:=case when m->>'winner'=m->>'player1' then v_a when m->>'winner'=m->>'player2' then v_b else null end;
   v_status:=case when v_winner is not null and m->>'score1' is not null and m->>'score2' is not null then 'completed' else 'pending' end;
   insert into public.plato_land_temp_player_matches(event_key,source_match_key,stage,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,score_a,score_b,winner_player_id,result_status,played_at,source_table,source_payload)
   values('series2',coalesce(m->>'id','s2-'||v_stage||'-'||md5(m::text)),v_stage,v_a,m->>'player1',v_b,m->>'player2',nullif(m->>'score1','')::integer,nullif(m->>'score2','')::integer,v_winner,v_status,nullif(m#>>'{result_history,0,recorded_at}','')::timestamptz,'plato_land_series2_tournament_progression',m)
   on conflict(event_key,source_match_key) do update set player_a_id=excluded.player_a_id,player_b_id=excluded.player_b_id,score_a=excluded.score_a,score_b=excluded.score_b,winner_player_id=excluded.winner_player_id,result_status=excluded.result_status,played_at=excluded.played_at,source_payload=excluded.source_payload,updated_at=now();
  end loop;
 end loop;return NEW;
end;$$;
revoke all on function public.plato_land_temp_sync_series2_progression() from public,anon,authenticated;
create trigger plato_land_temp_sync_series2_progression after insert or update of progression on public.plato_land_series2_tournament_progression for each row execute function public.plato_land_temp_sync_series2_progression();
create or replace view public.plato_land_temp_player_event_stats as
select p.id player_id,p.plato_id,p.plato_id_normalized,e.event_key,
 count(m.id) filter(where m.result_status in('completed','double_no_show'))::bigint games_played,
 count(m.id) filter(where m.result_status='completed' and m.winner_player_id=p.id)::bigint games_won,
 count(m.id) filter(where m.result_status='completed' and m.winner_player_id is not null and m.winner_player_id<>p.id)::bigint games_lost,
 count(m.id) filter(where m.result_status='pending')::bigint pending_matches
from public.plato_land_temp_players p join public.plato_land_temp_player_entries e on e.player_id=p.id
left join public.plato_land_temp_player_matches m on m.event_key=e.event_key and (m.player_a_id=p.id or m.player_b_id=p.id)
group by p.id,p.plato_id,p.plato_id_normalized,e.event_key;
revoke all on public.plato_land_temp_player_event_stats from public,anon,authenticated;
grant select on public.plato_land_temp_player_event_stats to authenticated;
