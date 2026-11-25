begin;
-- Only currently active Series 4 rule images are discoverable while registration is open.
create function public.series4_registration_rule_slides()
returns table(slot text, object_key text)
language sql stable security definer set search_path = ''
as $$
  select m.slot, m.object_key
  from public.plato_land_series4_media m
  where public.series4_registration_status()
    and m.is_active and m.slot ~ '^slide-(0[1-9]|1[0-7])$'
  order by m.slot;
$$;
revoke all on function public.series4_registration_rule_slides() from public, anon, authenticated;
grant execute on function public.series4_registration_rule_slides() to anon, authenticated;
commit;
