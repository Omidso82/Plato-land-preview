begin;

create or replace function public.plato_temp_public_series1_archive()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'stage', m.stage, 'group', m.group_name,
      'a', m.player_a_plato_id, 'b', m.player_b_plato_id,
      'score_a', case when m.result_status = 'completed' then m.score_a end,
      'score_b', case when m.result_status = 'completed' then m.score_b end,
      'status', m.result_status
    ) order by m.stage, m.group_name, m.source_payload->>'key', m.player_a_plato_id, m.player_b_plato_id
  ), '[]'::jsonb)
  from public.plato_land_temp_player_matches m
  where m.event_key = 'series1' and m.game_type_key = 'backgammon'
    and m.stage in ('group','round32','round16','quarter','semi','third_place','final')
    and m.result_status in ('completed','bye','cancelled','double_no_show');
$$;

revoke all on function public.plato_temp_public_series1_archive() from public;
grant execute on function public.plato_temp_public_series1_archive() to anon, authenticated;

commit;
