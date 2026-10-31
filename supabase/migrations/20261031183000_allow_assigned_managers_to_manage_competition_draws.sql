drop policy if exists competition_snapshots_admin_or_participant_read on public.competition_snapshots;
drop policy if exists competition_snapshots_owner_insert on public.competition_snapshots;
drop policy if exists competition_snapshots_owner_update on public.competition_snapshots;
drop policy if exists competition_snapshots_owner_delete on public.competition_snapshots;

create policy competition_snapshots_manager_or_participant_read
on public.competition_snapshots for select to authenticated
using (
  private.can_manage_tournament(tournament_id)
  or exists (
    select 1 from public.registrations r
    where r.tournament_id = competition_snapshots.tournament_id
      and r.player_id = (select auth.uid())
      and r.status in ('approved','registered')
      and r.is_reserve = false
  )
);

create policy competition_snapshots_manager_insert
on public.competition_snapshots for insert to authenticated
with check (private.can_manage_tournament(tournament_id));

create policy competition_snapshots_manager_update
on public.competition_snapshots for update to authenticated
using (private.can_manage_tournament(tournament_id))
with check (private.can_manage_tournament(tournament_id));

create policy competition_snapshots_manager_delete
on public.competition_snapshots for delete to authenticated
using (private.can_manage_tournament(tournament_id));
