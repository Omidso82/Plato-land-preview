-- Player display names are fixed after account creation; only the site owner may change them.
create or replace function public.protect_player_display_name()
returns trigger language plpgsql security invoker set search_path=''
as $function$
begin
  if old.id=(select auth.uid()) and not (select private.has_role(array['owner']))
     and new.display_name is distinct from old.display_name then
    raise exception 'Display name changes require the site owner.' using errcode='42501';
  end if;
  return new;
end;
$function$;
revoke all on function public.protect_player_display_name() from public,anon,authenticated;
drop trigger if exists protect_player_display_name on public.profiles;
create trigger protect_player_display_name before update of display_name on public.profiles for each row execute function public.protect_player_display_name();
