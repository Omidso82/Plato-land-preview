-- Consolidate overlapping SELECT policies without changing the effective access rules.
drop policy if exists profiles_authenticated_completed_results_read on public.profiles;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select private.has_role(array['owner'::text]))
  or exists (
    select 1
    from public.tournament_results r
    join public.tournaments t on t.id = r.tournament_id
    where r.player_id = profiles.id
      and t.status = 'completed'
      and t.completed_at is not null
      and private.is_tournament_public(t.id)
  )
);

drop policy if exists results_authenticated_completed_read on public.tournament_results;

drop policy if exists site_settings_owner_select on public.site_settings;
drop policy if exists site_settings_public_invite_read on public.site_settings;
create policy site_settings_authenticated_select
on public.site_settings for select to authenticated
using (
  key = 'group_invite'
  or (select private.has_role(array['owner'::text]))
);
create policy site_settings_public_invite_read
on public.site_settings for select to anon
using (key = 'group_invite');
