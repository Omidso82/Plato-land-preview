begin;

create or replace function plato_temp_internal.series4_completion_preflight()
returns jsonb language plpgsql stable set search_path = '' as $$
declare
  v_draw public.plato_land_series4_knockout_draw%rowtype;
  v_groups integer;
  v_pending integer;
  v_versions jsonb;
  v_group_source jsonb;
  v_expected integer;
  v_scores jsonb;
  v_matched integer;
  v_matches text[];
begin
  select * into v_draw from public.plato_land_series4_knockout_draw where singleton;
  select count(*),
         count(*) filter (where result_status is null or result_status not in ('completed', 'double_no_show')
           or (result_status = 'completed' and (score_a is null or score_b is null or score_a < 0 or score_b < 0 or score_a = score_b))
           or (result_status = 'double_no_show' and (score_a is not null or score_b is not null))),
         jsonb_object_agg(match_id, version),
         jsonb_agg(jsonb_build_array(match_id, version, result_status, score_a, score_b) order by match_id)
    into v_groups, v_pending, v_versions, v_group_source
    from public.plato_land_series4_group_match_results;

  if v_draw.bracket is null then
    return jsonb_build_object('ready_for_approval', false, 'reason', 'missing_official_bracket');
  end if;
  if v_groups not in (48, 72) or v_pending <> 0 or v_versions is distinct from v_draw.group_versions then
    return jsonb_build_object('ready_for_approval', false, 'reason', 'group_stage_unresolved');
  end if;

  v_expected := case v_groups when 48 then 16 else 32 end;
  -- The existing save RPC validates round sizes, entrant uniqueness, and all predecessor links.
  select array_agg(item->>'id') into v_matches
  from (
    select jsonb_array_elements(v_draw.bracket->'firstRound') as item
    union all
    select jsonb_array_elements(round.matches)
    from jsonb_array_elements(v_draw.bracket->'laterRounds') as round(matches)
    union all
    select v_draw.bracket->'thirdPlace'
  ) bracket_matches;

  if cardinality(v_matches) is distinct from v_expected
     or (select count(distinct match_id) from unnest(v_matches) as matches(match_id)
          where nullif(btrim(match_id), '') is not null) <> v_expected
     or v_draw.bracket->'thirdPlace'->>'id' is distinct from 'THIRD-1'
     or not ('R2-1' = any(v_matches)) then
    return jsonb_build_object('ready_for_approval', false, 'reason', 'bracket_result_mismatch');
  end if;

  select count(*) filter (where match_id = any(v_matches)
      and ((score_a = 5 and score_b between 0 and 4) or (score_b = 5 and score_a between 0 and 4))),
      jsonb_agg(jsonb_build_array(match_id, score_a, score_b, version) order by match_id)
    into v_matched, v_scores from public.plato_land_series4_knockout_scores;
  if v_matched <> v_expected or jsonb_array_length(v_scores) is distinct from v_expected then
    return jsonb_build_object('ready_for_approval', false, 'reason', 'knockout_results_incomplete',
      'matched_knockout', v_matched, 'expected_knockout', v_expected);
  end if;
  return jsonb_build_object('ready_for_approval', true, 'reason', 'verify_final_approval',
    'matched_knockout', v_matched, 'expected_knockout', v_expected,
    'source_fingerprint', 'series4:' || md5(jsonb_build_array(v_draw.bracket, v_group_source, v_scores)::text));
end;
$$;

create or replace function plato_temp_internal.archive_preflight(p_series_number integer)
returns jsonb language sql stable set search_path = '' as $$
  select case p_series_number when 3 then plato_temp_internal.series3_completion_preflight()
    when 4 then plato_temp_internal.series4_completion_preflight() end;
$$;

create or replace function public.plato_temp_owner_archive_review(p_series_number integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_series public.plato_land_league_series%rowtype;
  v_review jsonb;
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'owner' then
    raise exception 'owner authorization required' using errcode = '42501';
  end if;
  if p_series_number is null or p_series_number not in (3, 4) then
    raise exception 'unsupported series' using errcode = '22023';
  end if;
  select * into strict v_series from public.plato_land_league_series where series_number = p_series_number;
  v_review := plato_temp_internal.archive_preflight(p_series_number);
  if exists (
    select 1 from plato_temp_internal.lifecycle_archive_holds h
    where h.series_id = v_series.id and h.released_at is null
      and h.evidence_version is not distinct from (v_review->>'source_fingerprint')
  ) then
    v_review := v_review || jsonb_build_object('ready_for_approval', false, 'reason', 'archive_hold');
  end if;
  return v_review || jsonb_build_object('lifecycle_status', v_series.lifecycle_status);
end;
$$;

create or replace function public.plato_temp_owner_approve_final_and_archive(
  p_series_number integer, p_expected_fingerprint text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_series public.plato_land_league_series%rowtype;
  v_review jsonb;
  v_version text;
  v_refs jsonb;
begin
  if v_actor is null or public.current_user_role() is distinct from 'owner' then
    raise exception 'owner authorization required' using errcode = '42501';
  end if;
  if p_series_number is null or p_series_number not in (3, 4) or p_expected_fingerprint is null then
    raise exception 'series and reviewed result version required' using errcode = '22023';
  end if;

  select * into strict v_series from public.plato_land_league_series
  where series_number = p_series_number for update;
  if v_series.lifecycle_status = 'archived' and exists (
    select 1 from plato_temp_internal.lifecycle_transitions
    where series_id = v_series.id and to_status = 'archived' and evidence_version = p_expected_fingerprint
  ) then
    return jsonb_build_object('archived', true, 'already_processed', true);
  end if;
  if v_series.lifecycle_status not in ('started', 'completed') then
    return jsonb_build_object('archived', false, 'reason', 'series_not_active');
  end if;

  if p_series_number = 3 then
    lock table public.plato_land_series3_public_bracket, public.plato_land_series3_group_match_results,
      public.plato_land_series3_knockout_match_results, public.plato_land_series3_third_place_playoff in share mode;
    v_refs := '["public.plato_land_series3_public_bracket", "public.plato_land_series3_group_match_results",
      "public.plato_land_series3_knockout_match_results", "public.plato_land_series3_third_place_playoff"]';
  else
    -- Match the score writer's lock order and freeze all input tables for the transition.
    lock table public.plato_land_series4_knockout_draw in share row exclusive mode;
    lock table public.plato_land_series4_group_match_results, public.plato_land_series4_knockout_scores in share mode;
    v_refs := '["public.plato_land_series4_group_match_results", "public.plato_land_series4_knockout_draw",
      "public.plato_land_series4_knockout_scores"]';
  end if;

  v_review := plato_temp_internal.archive_preflight(p_series_number);
  if (v_review->>'ready_for_approval')::boolean is distinct from true then
    return jsonb_build_object('archived', false, 'reason', v_review->>'reason');
  end if;
  v_version := v_review->>'source_fingerprint';
  if v_version is distinct from p_expected_fingerprint then
    return jsonb_build_object('archived', false, 'reason', 'results_changed');
  end if;
  if exists (select 1 from plato_temp_internal.lifecycle_archive_holds
    where series_id = v_series.id and released_at is null and evidence_version = v_version) then
    return jsonb_build_object('archived', false, 'reason', 'archive_hold');
  end if;

  insert into plato_temp_internal.lifecycle_evidence
    (series_id, evidence_version, verdict, source_refs, approved_by, evaluated_at)
  values (v_series.id, v_version, 'verified_complete', v_refs, v_actor, clock_timestamp())
  on conflict (series_id, evidence_version) do update
    set verdict = excluded.verdict, source_refs = excluded.source_refs,
        approved_by = excluded.approved_by, evaluated_at = excluded.evaluated_at;

  update plato_temp_internal.lifecycle_archive_holds set released_at = clock_timestamp(), released_by = v_actor
  where series_id = v_series.id and released_at is null;
  if v_series.lifecycle_status = 'started' then
    insert into plato_temp_internal.lifecycle_transitions
      (series_id, from_status, to_status, actor_kind, actor_id, reason, evidence_version, correlation_id)
    values (v_series.id, 'started', 'completed', 'manager', v_actor,
      'Official final results approved', v_version, gen_random_uuid());
  end if;
  update public.plato_land_league_series set lifecycle_status = 'archived' where id = v_series.id;
  insert into plato_temp_internal.lifecycle_transitions
    (series_id, from_status, to_status, actor_kind, reason, evidence_version, correlation_id)
  values (v_series.id, 'completed', 'archived', 'system',
    'Verified final results and completed stages', v_version, gen_random_uuid());
  return jsonb_build_object('archived', true);
end;
$$;

revoke all on function plato_temp_internal.series4_completion_preflight(),
  plato_temp_internal.archive_preflight(integer) from public, anon, authenticated;
revoke all on function public.plato_temp_owner_archive_review(integer),
  public.plato_temp_owner_approve_final_and_archive(integer, text) from public, anon, authenticated;
grant execute on function public.plato_temp_owner_archive_review(integer),
  public.plato_temp_owner_approve_final_and_archive(integer, text) to authenticated;

commit;
