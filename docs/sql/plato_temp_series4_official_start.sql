begin;

create function public.plato_temp_owner_series4_start(p_confirm_start boolean)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_series public.plato_land_league_series%rowtype;
  v_settings public.plato_land_series4_registration_settings%rowtype;
  v_actor uuid := auth.uid();
  v_groups jsonb;
  v_group_count integer;
  v_fixture_count integer;
begin
  perform public.series4_assert_registration_owner();
  if p_confirm_start is null then
    raise exception 'Start confirmation state required' using errcode = '22023';
  end if;

  if p_confirm_start then
    -- Same lock order as opening registration: series first, settings second.
    perform 1 from public.plato_land_league_series
    where league_code = 'official_backgammon' and series_number = 4 for update;
  end if;

  select * into strict v_series from public.plato_land_league_series
  where league_code = 'official_backgammon' and series_number = 4;

  if v_series.lifecycle_status = 'started' then
    return jsonb_build_object('started', true, 'ready', false, 'reason', 'already_started');
  end if;
  if v_series.lifecycle_status <> 'planned' then
    return jsonb_build_object('started', false, 'ready', false, 'reason', 'series_not_planned');
  end if;

  select * into strict v_settings
  from public.plato_land_series4_registration_settings where singleton;
  if v_settings.registration_open or not v_settings.public_enabled then
    return jsonb_build_object('started', false, 'ready', false, 'reason', 'registration_not_finished');
  end if;

  if p_confirm_start then
    perform 1 from public.plato_land_series4_seeding_draws where event_key = 'series4' for share;
    lock table public.plato_land_series4_group_match_results in share mode;
  end if;

  select groups_snapshot into v_groups
  from public.plato_land_series4_seeding_draws where event_key = 'series4';
  if v_groups is null then
    return jsonb_build_object('started', false, 'ready', false, 'reason', 'group_draw_missing');
  end if;
  v_group_count := jsonb_array_length(v_groups);
  select count(*) into v_fixture_count from public.plato_land_series4_group_match_results where event_key = 'series4';
  if v_group_count not in (8, 12) or v_fixture_count <> v_group_count * 6 then
    return jsonb_build_object('started', false, 'ready', false, 'reason', 'group_schedule_missing');
  end if;

  if not p_confirm_start then
    return jsonb_build_object('started', false, 'ready', true, 'reason', 'ready');
  end if;

  update public.plato_land_league_series set lifecycle_status = 'started' where id = v_series.id;
  insert into plato_temp_internal.lifecycle_transitions
    (series_id, from_status, to_status, actor_kind, actor_id, reason, correlation_id)
  values (v_series.id, 'planned', 'started', 'manager', v_actor,
    'Official start confirmed from Series 4 manager', gen_random_uuid());
  return jsonb_build_object('started', true, 'ready', false, 'reason', 'started');
end;
$$;

revoke all on function public.plato_temp_owner_series4_start(boolean) from public, anon, authenticated;
grant execute on function public.plato_temp_owner_series4_start(boolean) to authenticated;

commit;
