-- Cache auth.uid()/role helper evaluation in existing RLS predicates using scalar SELECTs.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id=(select auth.uid()) or (select private.has_role(array['owner'])));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id=(select auth.uid()) or (select private.has_role(array['owner']))) with check (id=(select auth.uid()) or (select private.has_role(array['owner'])));

drop policy if exists registrations_delete on public.registrations;
create policy registrations_delete on public.registrations for delete to authenticated using ((player_id=(select auth.uid()) and status='pending') or (select private.can_manage_tournament(tournament_id)));
drop policy if exists registrations_select on public.registrations;
create policy registrations_select on public.registrations for select to authenticated using (player_id=(select auth.uid()) or (select private.can_manage_tournament(tournament_id)));

drop policy if exists registration_evidence_read_own_or_admin on public.registration_evidence;
create policy registration_evidence_read_own_or_admin on public.registration_evidence for select to authenticated using (submitted_by=(select auth.uid()) or exists (select 1 from public.registrations r where r.id=registration_evidence.registration_id and (select private.can_manage_tournament(r.tournament_id))));

drop policy if exists registration_members_insert_own on public.registration_members;
create policy registration_members_insert_own on public.registration_members for insert to authenticated with check (exists (select 1 from public.registrations r where r.id=registration_members.registration_id and r.tournament_id=registration_members.tournament_id and r.player_id=(select auth.uid()) and r.status='pending'));
drop policy if exists registration_members_read_own_or_manager on public.registration_members;
create policy registration_members_read_own_or_manager on public.registration_members for select to authenticated using (exists (select 1 from public.registrations r where r.id=registration_members.registration_id and (r.player_id=(select auth.uid()) or (select private.can_manage_tournament(r.tournament_id)))));

drop policy if exists site_settings_owner_insert on public.site_settings;
create policy site_settings_owner_insert on public.site_settings for insert to authenticated with check ((select private.has_role(array['owner'])) and (updated_by is null or updated_by=(select auth.uid())));
drop policy if exists site_settings_owner_update on public.site_settings;
create policy site_settings_owner_update on public.site_settings for update to authenticated using ((select private.has_role(array['owner']))) with check ((select private.has_role(array['owner'])) and (updated_by is null or updated_by=(select auth.uid())));

drop policy if exists "Authenticated users can view enabled site announcement" on public.site_announcements;
create policy "Authenticated users can view enabled site announcement" on public.site_announcements for select to authenticated using (enabled=true or exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role=any(array['owner','مالک کل']::text[])));
drop policy if exists "Owners can delete site announcement" on public.site_announcements;
create policy "Owners can delete site announcement" on public.site_announcements for delete to authenticated using (exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role=any(array['owner','مالک کل']::text[])));
drop policy if exists "Owners can insert site announcement" on public.site_announcements;
create policy "Owners can insert site announcement" on public.site_announcements for insert to authenticated with check (exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role=any(array['owner','مالک کل']::text[])));
drop policy if exists "Owners can update site announcement" on public.site_announcements;
create policy "Owners can update site announcement" on public.site_announcements for update to authenticated using (exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role=any(array['owner','مالک کل']::text[]))) with check (exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role=any(array['owner','مالک کل']::text[])));
