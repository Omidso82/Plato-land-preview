-- Package A: persistent player identity and private Plato ID history.
create table if not exists public.profile_plato_id_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles(id) on delete cascade,
  previous_plato_id text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid not null references auth.users(id)
);
alter table public.profile_plato_id_history enable row level security;
revoke all on public.profile_plato_id_history from anon, authenticated;
grant select, insert on public.profile_plato_id_history to authenticated;
drop policy if exists profile_plato_id_history_select_own_or_owner on public.profile_plato_id_history;
create policy profile_plato_id_history_select_own_or_owner
on public.profile_plato_id_history for select to authenticated
using (player_id = (select auth.uid()) or (select private.has_role(array['owner'])));
drop policy if exists profile_plato_id_history_insert_own on public.profile_plato_id_history;
create policy profile_plato_id_history_insert_own
on public.profile_plato_id_history for insert to authenticated
with check (player_id=(select auth.uid()) and changed_by=(select auth.uid()));
create unique index if not exists profiles_plato_id_lower_unique
on public.profiles (lower(btrim(plato_id)));
alter table public.profiles drop constraint if exists profiles_plato_id_format_check;
alter table public.profiles add constraint profiles_plato_id_format_check
check (plato_id ~ '^[A-Za-z0-9_-]{1,80}$');
-- Account owners may edit their own display name per the approved Account Specification.
create or replace function public.protect_player_display_name()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  return new;
end;
$function$;
create or replace function public.record_profile_plato_id_change()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
begin
  if new.plato_id is distinct from old.plato_id then
    insert into public.profile_plato_id_history(player_id, previous_plato_id, changed_by)
    values (old.id, old.plato_id, (select auth.uid()));
  end if;
  return new;
end;
$function$;
drop trigger if exists record_profile_plato_id_change on public.profiles;
create trigger record_profile_plato_id_change
before update of plato_id on public.profiles
for each row execute function public.record_profile_plato_id_change();
