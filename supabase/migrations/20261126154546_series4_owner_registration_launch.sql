begin;

create function public.series4_owner_registration_readiness()
returns table (active_rule_slides integer, can_open boolean)
language plpgsql stable security definer set search_path=''
as $$
declare
  slide_count integer;
begin
  perform public.series4_assert_registration_owner();
  select count(*) into slide_count
  from public.plato_land_series4_media
  where is_active and slot ~ '^slide-(0[1-9]|1[0-7])$';
  return query select slide_count, slide_count=17 and exists (
    select 1 from public.plato_land_league_series
    where series_number=4 and league_code='official_backgammon' and lifecycle_status='planned'
  );
end;
$$;
revoke all on function public.series4_owner_registration_readiness() from public, anon, authenticated;
grant execute on function public.series4_owner_registration_readiness() to authenticated;

create or replace function public.series4_owner_set_registration_open(p_open boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
  perform public.series4_assert_registration_owner();
  if p_open is null then
    raise exception 'Registration state required' using errcode='22023';
  end if;
  if p_open then
    perform 1 from public.plato_land_league_series
    where series_number=4 and league_code='official_backgammon' and lifecycle_status='planned'
    for share;
    if not found then
      raise exception 'سری چهارم در وضعیت مجاز برای بازگشایی ثبت‌نام نیست.' using errcode='55000';
    end if;
    if (select count(*) from (
      select slot from public.plato_land_series4_media
      where is_active and slot ~ '^slide-(0[1-9]|1[0-7])$'
      for share
    ) ready)<>17 then
      raise exception 'برای بازگشایی ثبت‌نام، هر ۱۷ تصویر قوانین باید فعال باشد.' using errcode='55000';
    end if;
  end if;
  update public.plato_land_series4_registration_settings
  set registration_open=p_open,public_enabled=public_enabled or p_open
  where singleton;
  if not found then
    raise exception 'Series 4 registration settings missing' using errcode='55000';
  end if;
  return p_open;
end;
$$;
revoke all on function public.series4_owner_set_registration_open(boolean) from public, anon, authenticated;
grant execute on function public.series4_owner_set_registration_open(boolean) to authenticated;
commit;
