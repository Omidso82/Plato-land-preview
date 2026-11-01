drop policy if exists competition_snapshots_admin_read on public.competition_snapshots;

create policy competition_snapshots_admin_or_participant_read
on public.competition_snapshots
for select
to authenticated
using (
  (select private.has_role(array['owner'::text, 'tournament_admin'::text]))
  or exists (
    select 1
    from public.registrations r
    where r.tournament_id = competition_snapshots.tournament_id
      and r.player_id = (select auth.uid())
      and r.status in ('approved'::text, 'registered'::text)
      and r.is_reserve = false
  )
);
