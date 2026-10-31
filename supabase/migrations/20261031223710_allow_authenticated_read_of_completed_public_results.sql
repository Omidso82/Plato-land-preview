-- Signed-in visitors should see the same published completed results as anonymous visitors.
-- The existing public result projection remains limited by the page's selected columns.
drop policy if exists results_authenticated_completed_read on public.tournament_results;
create policy results_authenticated_completed_read on public.tournament_results for select to authenticated
using (exists (select 1 from public.tournaments t where t.id=tournament_results.tournament_id and t.status='completed' and t.completed_at is not null));

drop policy if exists profiles_authenticated_completed_results_read on public.profiles;
create policy profiles_authenticated_completed_results_read on public.profiles for select to authenticated
using (exists (select 1 from public.tournament_results r join public.tournaments t on t.id=r.tournament_id where r.player_id=profiles.id and t.status='completed' and t.completed_at is not null));
