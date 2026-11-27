begin;

-- Return public lifecycle and official stage start times for Series 3 only.
-- The private schedule snapshot and its participant/registration metadata stay private.
create function public.plato_temp_public_series3_active()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'active', s.lifecycle_status = 'started',
    'stages', case when s.lifecycle_status = 'started' then coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', slot.value->>'stage',
        'starts_at', ((slot.value->>'date') || ' ' || (slot.value->>'time'))::timestamp
          at time zone 'Asia/Tehran'
      ) order by slot.ordinality)
      from public.plato_land_series3_group_fixtures f
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(f.schedule_snapshot->'knockout') = 'array'
             then f.schedule_snapshot->'knockout' else '[]'::jsonb end
      ) with ordinality as slot(value, ordinality)
      where f.event_key = 'series3'
        and f.schedule_snapshot->>'timezone' = 'Asia/Tehran'
        and slot.value->>'stage' in ('round32','round16','quarterfinals','semifinals','third_place_and_final')
        and pg_input_is_valid((slot.value->>'date') || ' ' || (slot.value->>'time'), 'timestamp without time zone')
        and slot.value->>'date' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        and slot.value->>'time' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from public.plato_land_league_series s
  where s.league_code = 'official_backgammon' and s.series_number = 3;
$$;

revoke all on function public.plato_temp_public_series3_active() from public;
grant execute on function public.plato_temp_public_series3_active() to anon, authenticated;

commit;
