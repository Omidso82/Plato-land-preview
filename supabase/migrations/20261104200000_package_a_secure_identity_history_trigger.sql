-- Harden Package A Plato ID history writes: only the profile update trigger may insert history.
revoke insert on public.profile_plato_id_history from authenticated;
drop policy if exists profile_plato_id_history_insert_own on public.profile_plato_id_history;
create or replace function private.record_profile_plato_id_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.plato_id is distinct from old.plato_id then
    insert into public.profile_plato_id_history(player_id, previous_plato_id, changed_by)
    values (old.id, old.plato_id, (select auth.uid()));
  end if;
  return new;
end;
$function$;
revoke all on function private.record_profile_plato_id_change() from public, anon, authenticated;
drop trigger if exists record_profile_plato_id_change on public.profiles;
create trigger record_profile_plato_id_change
before update of plato_id on public.profiles
for each row execute function private.record_profile_plato_id_change();
