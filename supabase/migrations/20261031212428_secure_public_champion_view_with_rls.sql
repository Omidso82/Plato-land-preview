-- Make the recent champions view security-invoker and let anon read only the
-- minimum public columns for confirmed champions of completed tournaments.
-- This avoids a SECURITY DEFINER view and keeps non-champion profiles private.

drop policy if exists results_public_champion_read on public.tournament_results;
create policy results_public_champion_read
  on public.tournament_results
  for select
  to anon
  using (
    placement = 1
    and exists (
      select 1
      from public.tournaments t
      where t.id = tournament_results.tournament_id
        and t.status = 'completed'
        and t.completed_at is not null
    )
  );

drop policy if exists profiles_public_champion_read on public.profiles;
create policy profiles_public_champion_read
  on public.profiles
  for select
  to anon
  using (
    exists (
      select 1
      from public.tournament_results r
      where r.player_id = profiles.id
        and r.placement = 1
    )
  );

revoke all privileges on table public.tournament_results from anon;
grant select (tournament_id, player_id, placement) on public.tournament_results to anon;

revoke all privileges on table public.profiles from anon;
grant select (id, display_name, plato_id) on public.profiles to anon;

alter view public.recent_tournament_champions
  set (security_invoker = true, security_barrier = true);
