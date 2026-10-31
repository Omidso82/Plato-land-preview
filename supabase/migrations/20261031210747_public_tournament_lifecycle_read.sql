-- Public visitors can read non-draft tournament lifecycle states for the public
-- tournaments page, active competition section, and completed archive.
-- Private/draft tournaments remain hidden; manager scope remains unchanged.

drop policy if exists tournaments_public_published_select on public.tournaments;
create policy tournaments_public_visible_lifecycle_select
on public.tournaments
for select
to anon
using (status in ('published', 'ongoing', 'completed', 'cancelled'));

drop policy if exists tournaments_select on public.tournaments;
create policy tournaments_select
on public.tournaments
for select
to authenticated
using (
  status in ('published', 'ongoing', 'completed', 'cancelled')
  or private.can_manage_tournament(id)
);
