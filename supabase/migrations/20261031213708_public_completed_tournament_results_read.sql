-- Public result tables are available only for completed tournaments.
-- Expose result/profile display columns only; private profile/evidence fields remain hidden.

drop policy if exists results_public_champion_read on public.tournament_results;
create policy results_public_completed_read
  on public.tournament_results
  for select
  to anon
  using (
    exists (
      select 1
      from public.tournaments t
      where t.id = tournament_results.tournament_id
        and t.status = 'completed'
        and t.completed_at is not null
    )
  );

drop policy if exists profiles_public_champion_read on public.profiles;
create policy profiles_public_completed_results_read
  on public.profiles
  for select
  to anon
  using (
    exists (
      select 1
      from public.tournament_results r
      join public.tournaments t on t.id = r.tournament_id
      where r.player_id = profiles.id
        and t.status = 'completed'
        and t.completed_at is not null
    )
  );

revoke all privileges on table public.tournament_results from anon;
grant select (
  tournament_id, player_id, points, wins, losses,
  score_for, score_against, placement, updated_at
) on public.tournament_results to anon;

revoke all privileges on table public.profiles from anon;
grant select (id, display_name, plato_id) on public.profiles to anon;
