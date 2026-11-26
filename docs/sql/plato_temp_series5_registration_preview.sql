begin;

create table plato_temp_internal.series5_registration_preview (
  series_id uuid primary key references plato_temp_internal.series_onboarding_drafts(series_id),
  draft_revision integer not null check (draft_revision > 0),
  rules_text text not null check (char_length(btrim(rules_text)) between 1 and 20000),
  revision integer not null default 1 check (revision > 0),
  saved_by uuid not null,
  saved_at timestamptz not null default now()
);
alter table plato_temp_internal.series5_registration_preview enable row level security;
revoke all on plato_temp_internal.series5_registration_preview from public, anon, authenticated;

create function public.plato_temp_owner_series5_registration_preview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'owner' then
    raise exception 'owner authorization required' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'capacity', d.capacity, 'rules_version', d.rules_version, 'draft_revision', d.revision,
      'rules_text', case when p.draft_revision = d.revision then p.rules_text end,
      'preview_revision', coalesce(p.revision, 0),
      'needs_review', coalesce(p.draft_revision <> d.revision, false)
    )
    from public.plato_land_league_series s
    join plato_temp_internal.series_onboarding_drafts d on d.series_id = s.id
    left join plato_temp_internal.series5_registration_preview p on p.series_id = s.id
    where s.league_code = 'official_backgammon' and s.series_number = 5
      and s.lifecycle_status = 'planned' and s.registration_status = 'not_open'
      and s.registration_source_table is null
  );
end;
$$;

create function public.plato_temp_owner_save_series5_registration_preview(
  p_rules_text text, p_draft_revision integer, p_preview_revision integer
)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_series_id uuid;
  v_draft_revision integer;
  v_preview_revision integer;
  v_rules_text text := btrim(p_rules_text, E' \n\r\t');
begin
  if auth.uid() is null or public.current_user_role() is distinct from 'owner' then
    raise exception 'owner authorization required' using errcode = '42501';
  end if;
  if v_rules_text is null or char_length(v_rules_text) not between 1 and 20000
      or p_draft_revision is null or p_draft_revision < 1
      or p_preview_revision is null or p_preview_revision < 0 then
    raise exception 'invalid preview settings' using errcode = '22023';
  end if;

  -- A draft update takes the same registry lock before advancing its revision.
  select s.id into v_series_id
    from public.plato_land_league_series s
    where s.league_code = 'official_backgammon' and s.series_number = 5
      and s.lifecycle_status = 'planned' and s.registration_status = 'not_open'
      and s.registration_source_table is null
    for update;
  if not found then
    raise exception 'Series 5 is not eligible for preview' using errcode = '55000';
  end if;

  select d.revision into v_draft_revision
    from plato_temp_internal.series_onboarding_drafts d where d.series_id = v_series_id;
  select p.revision into v_preview_revision
    from plato_temp_internal.series5_registration_preview p where p.series_id = v_series_id;
  if v_draft_revision is distinct from p_draft_revision
      or coalesce(v_preview_revision, 0) <> p_preview_revision then
    raise exception 'preview settings changed' using errcode = '40001';
  end if;

  insert into plato_temp_internal.series5_registration_preview as p
    (series_id, draft_revision, rules_text, saved_by)
  values (v_series_id, v_draft_revision, v_rules_text, auth.uid())
  on conflict (series_id) do update set draft_revision = excluded.draft_revision,
    rules_text = excluded.rules_text, saved_by = excluded.saved_by, saved_at = clock_timestamp(),
    revision = p.revision + 1
  returning revision into v_preview_revision;
  return v_preview_revision;
end;
$$;

revoke all on function public.plato_temp_owner_series5_registration_preview(),
  public.plato_temp_owner_save_series5_registration_preview(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.plato_temp_owner_series5_registration_preview(),
  public.plato_temp_owner_save_series5_registration_preview(text, integer, integer)
  to authenticated;

commit;
