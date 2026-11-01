-- Public participant lists show approved/registered, non-reserve entries only.
-- Pending, rejected, reserve and registration evidence remain private.
drop policy if exists registrations_public_approved_read on public.registrations;
create policy registrations_public_approved_read
  on public.registrations
  for select
  to anon
  using (status in ('approved', 'registered') and coalesce(is_reserve, false) = false);

drop policy if exists registration_members_public_approved_read on public.registration_members;
create policy registration_members_public_approved_read
  on public.registration_members
  for select
  to anon
  using (
    exists (
      select 1
      from public.registrations r
      where r.id = registration_members.registration_id
        and r.tournament_id = registration_members.tournament_id
        and r.status in ('approved', 'registered')
        and coalesce(r.is_reserve, false) = false
    )
  );

revoke all privileges on table public.registrations from anon;
grant select (
  id, tournament_id, status, registration_type, is_reserve,
  display_name, plato_id, team_name, slot_count, created_at
) on public.registrations to anon;

revoke all privileges on table public.registration_members from anon;
grant select (
  id, registration_id, tournament_id, display_name, plato_id, is_captain, created_at
) on public.registration_members to anon;
