-- Public visitors may read only published tournaments.
-- Authenticated owners/admins retain access through the existing tournaments_select policy.
create policy tournaments_public_published_select
on public.tournaments
for select
to anon
using (status = 'published');
