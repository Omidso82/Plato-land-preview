-- Permit the owner to persist the configured state of a manager's section permissions.
drop policy if exists tournament_manager_access_update_owner_only on public.tournament_manager_access;
create policy tournament_manager_access_update_owner_only
on public.tournament_manager_access for update to authenticated
using (private.has_role(array['owner']::text[]))
with check (private.has_role(array['owner']::text[]));

-- A manager with group-draw permission may see only confirmed, non-reserve participants
-- needed to construct groups; pending requests and private evidence remain registration-only.
drop policy if exists registrations_select on public.registrations;
create policy registrations_select
on public.registrations for select to authenticated
using (
  player_id = (select auth.uid())
  or private.can_manage_tournament_section(tournament_id,'registrations')
  or (
    status = any(array['approved','registered']::text[])
    and coalesce(is_reserve,false)=false
    and private.can_manage_tournament_section(tournament_id,'groups')
  )
);

drop policy if exists registration_members_read_own_or_manager on public.registration_members;
create policy registration_members_read_own_or_manager
on public.registration_members for select to authenticated
using (
  exists (
    select 1 from public.registrations r
    where r.id=registration_members.registration_id
      and (
        r.player_id=(select auth.uid())
        or private.can_manage_tournament_section(r.tournament_id,'registrations')
        or (
          r.status=any(array['approved','registered']::text[])
          and coalesce(r.is_reserve,false)=false
          and private.can_manage_tournament_section(r.tournament_id,'groups')
        )
      )
  )
);
