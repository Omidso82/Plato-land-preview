-- Use a dedicated tournament-scoped permission table. The legacy user_admin_permissions
-- table has a global (user_id, permission_key) primary key and must not be overloaded.
drop index if exists public.user_admin_permissions_tournament_user_key_uidx;
alter table public.user_admin_permissions drop column if exists tournament_id;

create table if not exists public.tournament_manager_section_permissions (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_key text not null check (permission_key = any(array['registrations','groups','schedule','results']::text[])),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (tournament_id,user_id,permission_key)
);

alter table public.tournament_manager_section_permissions enable row level security;
revoke all on public.tournament_manager_section_permissions from public,anon;
grant select,insert,update,delete on public.tournament_manager_section_permissions to authenticated;

drop policy if exists tournament_manager_section_permissions_read_own_or_owner on public.tournament_manager_section_permissions;
create policy tournament_manager_section_permissions_read_own_or_owner
on public.tournament_manager_section_permissions for select to authenticated
using (user_id=(select auth.uid()) or private.has_role(array['owner']::text[]));

drop policy if exists tournament_manager_section_permissions_owner_insert on public.tournament_manager_section_permissions;
create policy tournament_manager_section_permissions_owner_insert
on public.tournament_manager_section_permissions for insert to authenticated
with check (private.has_role(array['owner']::text[]) and (granted_by is null or granted_by=(select auth.uid())));

drop policy if exists tournament_manager_section_permissions_owner_update on public.tournament_manager_section_permissions;
create policy tournament_manager_section_permissions_owner_update
on public.tournament_manager_section_permissions for update to authenticated
using (private.has_role(array['owner']::text[]))
with check (private.has_role(array['owner']::text[]) and (granted_by is null or granted_by=(select auth.uid())));

drop policy if exists tournament_manager_section_permissions_owner_delete on public.tournament_manager_section_permissions;
create policy tournament_manager_section_permissions_owner_delete
on public.tournament_manager_section_permissions for delete to authenticated
using (private.has_role(array['owner']::text[]));

create or replace function private.can_manage_tournament_section(p_tournament_id uuid,p_permission_key text)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select auth.uid() is not null
    and p_permission_key = any(array['registrations','groups','schedule','results']::text[])
    and (
      private.has_role(array['owner']::text[])
      or exists (
        select 1 from public.tournament_manager_access a
        where a.tournament_id=p_tournament_id and a.user_id=auth.uid()
          and (
            a.permissions_configured=false
            or exists (
              select 1 from public.tournament_manager_section_permissions p
              where p.tournament_id=a.tournament_id
                and p.user_id=a.user_id
                and p.permission_key=p_permission_key
            )
          )
      )
    );
$function$;

revoke all on function private.can_manage_tournament_section(uuid,text) from public,anon;
grant execute on function private.can_manage_tournament_section(uuid,text) to authenticated,service_role;
