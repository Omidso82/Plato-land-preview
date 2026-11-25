begin;

create or replace function plato_temp_internal.public_archive_available(p_series integer)
returns boolean language plpgsql stable set search_path = '' as $$
declare
  v_version text;
  v_review jsonb;
begin
  if p_series is null or p_series not in (3, 4) then
    return false;
  end if;
  if p_series = 4 and not exists (
    select 1 from public.plato_land_series4_registration_settings
    where singleton and public_enabled
  ) then
    return false;
  end if;
  select t.evidence_version into v_version
  from public.plato_land_league_series s
  join plato_temp_internal.lifecycle_transitions t on t.series_id = s.id
  where s.league_code = 'official_backgammon' and s.series_number = p_series
    and s.lifecycle_status = 'archived' and t.to_status = 'archived'
  order by t.occurred_at desc, t.id desc limit 1;
  if v_version is null then
    return false;
  end if;
  v_review := plato_temp_internal.archive_preflight(p_series);
  return coalesce((v_review->>'ready_for_approval')::boolean
    and (v_review->>'source_fingerprint') = v_version, false);
end;
$$;

create or replace function public.plato_temp_public_archive_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'series3', plato_temp_internal.public_archive_available(3),
    'series4', plato_temp_internal.public_archive_available(4)
  );
$$;

create or replace function public.plato_temp_public_series4_archive()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_bracket jsonb;
begin
  if not plato_temp_internal.public_archive_available(4) then
    return null;
  end if;
  select bracket into strict v_bracket from public.plato_land_series4_knockout_draw where singleton;
  return jsonb_build_object(
    'bracket', jsonb_build_object(
      'firstRound', (select jsonb_agg(jsonb_build_object(
        'id', item->>'id',
        'a', jsonb_build_object('plato_id', item->'a'->>'plato_id'),
        'b', jsonb_build_object('plato_id', item->'b'->>'plato_id')
      ) order by pos) from jsonb_array_elements(v_bracket->'firstRound') with ordinality as x(item,pos)),
      'laterRounds', (select jsonb_agg((
        select jsonb_agg(jsonb_build_object(
          'id', item->>'id', 'fromA', item->>'fromA', 'fromB', item->>'fromB'
        ) order by pos) from jsonb_array_elements(stage) with ordinality as x(item,pos)
      ) order by round_no) from jsonb_array_elements(v_bracket->'laterRounds') with ordinality as r(stage,round_no)),
      'thirdPlace', jsonb_build_object('id',v_bracket->'thirdPlace'->>'id',
        'fromA',v_bracket->'thirdPlace'->>'fromA','fromB',v_bracket->'thirdPlace'->>'fromB')
    ),
    'scores', (select jsonb_agg(jsonb_build_object(
      'match_id', match_id, 'score_a', score_a, 'score_b', score_b
    ) order by match_id) from public.plato_land_series4_knockout_scores),
    'groups', (select jsonb_agg(jsonb_build_object(
      'match_id', match_id, 'group_name', group_name,
      'player_a', player_a_plato_id, 'player_b', player_b_plato_id,
      'result_status', result_status, 'score_a', score_a, 'score_b', score_b
    ) order by group_name, round_no, match_no) from public.plato_land_series4_group_match_results)
  );
end;
$$;

revoke all on function plato_temp_internal.public_archive_available(integer) from public, anon, authenticated;
revoke all on function public.plato_temp_public_archive_status(), public.plato_temp_public_series4_archive() from public;
grant execute on function public.plato_temp_public_archive_status(), public.plato_temp_public_series4_archive() to anon, authenticated;

commit;
