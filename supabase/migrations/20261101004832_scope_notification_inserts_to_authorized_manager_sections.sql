drop policy if exists user_notifications_insert_self_or_manager on public.user_notifications;
drop policy if exists user_notifications_insert_manager on public.user_notifications;
create policy user_notifications_insert_self_or_authorized_manager
on public.user_notifications for insert to authenticated
with check (
  user_id=(select auth.uid())
  or (
    tournament_id is not null
    and (
      private.can_manage_tournament_section(tournament_id,'registrations')
      or private.can_manage_tournament_section(tournament_id,'schedule')
      or private.can_manage_tournament_section(tournament_id,'results')
    )
    and exists (
      select 1 from public.registrations r
      where r.player_id=user_notifications.user_id
        and r.tournament_id=user_notifications.tournament_id
    )
  )
);
