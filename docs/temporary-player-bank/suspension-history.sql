-- Apply to the temporary projects database before deploying the player-file UI.
create function public.plato_land_temp_player_suspension_history(p_player_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  history jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles u where u.user_id = auth.uid() and u.role = 'owner'
  ) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'plato_id', r.plato_id,
    'reason', r.reason,
    'created_at', r.created_at,
    'source_name', origin.series_name,
    'status', case
      when r.record_status = 'lifted' then 'lifted'
      when cardinality(effective.ids) = 2 and not exists (
        select 1 from public.plato_land_league_series s
        where s.id = any(effective.ids) and s.lifecycle_status not in ('completed', 'archived')
      ) then 'completed'
      else r.record_status
    end,
    'issued_targets', array(
      select s.series_name
      from public.plato_land_suspension_target_assignments a
      join public.plato_land_league_series s on s.id = a.target_series_id
      where a.suspension_record_id = r.id
      order by a.target_position
    ),
    'current_targets', array(
      select s.series_name
      from unnest(effective.ids) with ordinality as target(id, position)
      join public.plato_land_league_series s on s.id = target.id
      order by target.position
    ),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'type', e.event_type, 'reason', e.reason, 'occurred_at', e.occurred_at
      ) order by e.occurred_at, e.id)
      from public.plato_land_suspension_events e
      where e.suspension_record_id = r.id
    ), '[]'::jsonb)
  ) order by r.created_at desc, r.id desc), '[]'::jsonb)
  into history
  from public.plato_land_temp_players p
  join public.plato_land_suspension_records r
    on lower(btrim(r.plato_id)) = p.plato_id_normalized
  left join public.plato_land_league_series origin on origin.id = r.source_series_id
  cross join lateral (
    select case when r.record_status = 'active'
      then private.plato_land_suspension_targets(r.source_series_id)
      else '{}'::uuid[] end as ids
  ) effective
  where p.id = p_player_id;

  return history;
end;
$$;

revoke all on function public.plato_land_temp_player_suspension_history(uuid) from public, anon, authenticated;
grant execute on function public.plato_land_temp_player_suspension_history(uuid) to authenticated;
