begin;

create table plato_temp_internal.series_onboarding_drafts (
  series_id uuid primary key references public.plato_land_league_series(id),
  capacity integer not null check (capacity > 0),
  rules_version text not null check (length(btrim(rules_version)) between 1 and 80),
  revision integer not null default 1 check (revision > 0),
  updated_by uuid not null,
  updated_at timestamptz not null default now()
);
alter table plato_temp_internal.series_onboarding_drafts enable row level security;
revoke all on plato_temp_internal.series_onboarding_drafts from public, anon, authenticated;

create function public.plato_temp_owner_onboarding_drafts()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'owner' then
    raise exception 'owner authorization required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'series_number', s.series_number, 'series_name', s.series_name,
      'capacity', d.capacity, 'rules_version', d.rules_version, 'revision', coalesce(d.revision, 0)
    ) order by s.series_number)
    from public.plato_land_league_series s
    left join plato_temp_internal.series_onboarding_drafts d on d.series_id = s.id
    where s.league_code = 'official_backgammon' and s.lifecycle_status = 'planned'
      and s.registration_status = 'not_open' and s.registration_source_table is null
  ), '[]'::jsonb);
end;
$$;

create function public.plato_temp_owner_save_onboarding_draft(
  p_series_number integer, p_capacity integer, p_rules_version text, p_expected_revision integer
)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  v_series_id uuid;
  v_revision integer;
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'owner' then
    raise exception 'owner authorization required' using errcode = '42501';
  end if;
  if p_capacity is null or p_capacity <= 0 or p_rules_version is null
      or length(btrim(p_rules_version)) not between 1 and 80
      or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'invalid draft settings' using errcode = '22023';
  end if;

  select id into v_series_id from public.plato_land_league_series
  where league_code = 'official_backgammon' and series_number = p_series_number
    and lifecycle_status = 'planned' and registration_status = 'not_open'
    and registration_source_table is null for update;
  if not found then
    raise exception 'series is not eligible for onboarding' using errcode = '55000';
  end if;

  select revision into v_revision from plato_temp_internal.series_onboarding_drafts where series_id = v_series_id;
  if coalesce(v_revision, 0) <> p_expected_revision then
    raise exception 'draft revision changed' using errcode = '40001';
  end if;
  insert into plato_temp_internal.series_onboarding_drafts as d
    (series_id, capacity, rules_version, updated_by)
  values (v_series_id, p_capacity, btrim(p_rules_version), auth.uid())
  on conflict (series_id) do update set capacity = excluded.capacity, rules_version = excluded.rules_version,
    updated_by = excluded.updated_by, updated_at = clock_timestamp(), revision = d.revision + 1
  returning revision into v_revision;
  return v_revision;
end;
$$;

revoke all on function public.plato_temp_owner_onboarding_drafts(),
  public.plato_temp_owner_save_onboarding_draft(integer, integer, text, integer) from public, anon, authenticated;
grant execute on function public.plato_temp_owner_onboarding_drafts(),
  public.plato_temp_owner_save_onboarding_draft(integer, integer, text, integer) to authenticated;

commit;
