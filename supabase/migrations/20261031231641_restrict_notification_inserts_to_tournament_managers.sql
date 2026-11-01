-- Players can read/update only their own notifications. Notification creation is
-- restricted to managers of the relevant tournament; SECURITY DEFINER
-- registration RPCs create the player's pending/reserve notices atomically.
drop policy if exists user_notifications_insert_self_or_manager on public.user_notifications;
create policy user_notifications_insert_manager
  on public.user_notifications
  for insert
  to authenticated
  with check (
    tournament_id is not null
    and private.can_manage_tournament(tournament_id)
    and exists (
      select 1 from public.registrations r
      where r.player_id=user_notifications.user_id
        and r.tournament_id=user_notifications.tournament_id
    )
  );
