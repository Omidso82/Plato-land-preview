-- Application Storage object policies extracted from Production on 2026-11-04.
-- Apply only after confirming bucket creation and dependencies in Staging.
-- Does not create Supabase-managed storage tables or copy any objects.

CREATE POLICY "Authenticated users can view site announcement videos" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING ((bucket_id = 'site-announcements'::text));

CREATE POLICY "Only site owner can delete Series 2 rule slides" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'series2-slides'::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'owner'::text))))));

CREATE POLICY "Only site owner can replace Series 2 rule slides" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'series2-slides'::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'owner'::text)))))) WITH CHECK (((bucket_id = 'series2-slides'::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'owner'::text))))));

CREATE POLICY "Only site owner can upload Series 2 rule slides" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'series2-slides'::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'owner'::text))))));

CREATE POLICY "Owners can delete site announcement videos" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'site-announcements'::text) AND ((storage.foldername(name))[1] = 'promo'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text])))))));

CREATE POLICY "Owners can update site announcement videos" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'site-announcements'::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text]))))))) WITH CHECK (((bucket_id = 'site-announcements'::text) AND ((storage.foldername(name))[1] = 'promo'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text])))))));

CREATE POLICY "Owners can upload site announcement videos" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'site-announcements'::text) AND ((storage.foldername(name))[1] = 'promo'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text])))))));

CREATE POLICY "Public can view Series 2 rule slides" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((bucket_id = 'series2-slides'::text));

CREATE POLICY "Users delete own avatar" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "Users update own avatar" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))) WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "Users upload own avatar" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "Users view own avatar" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "public_profile_avatars_delete_own" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'public-profile-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "public_profile_avatars_insert_own" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'public-profile-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "public_profile_avatars_read" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((bucket_id = 'public-profile-avatars'::text));

CREATE POLICY "public_profile_avatars_update_own" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'public-profile-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))) WITH CHECK (((bucket_id = 'public-profile-avatars'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "registration_evidence_delete_own_upload" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'registration-evidence'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "registration_evidence_delete_owner_or_admin" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'registration-evidence'::text) AND ((EXISTS ( SELECT 1
   FROM (registration_evidence e
     JOIN registrations r ON ((r.id = e.registration_id)))
  WHERE ((e.storage_path = objects.name) AND ((e.submitted_by = ( SELECT auth.uid() AS uid)) OR private.can_manage_tournament_section(r.tournament_id, 'registrations'::text))))) OR ((split_part(name, '/'::text, 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND private.can_manage_tournament_section((split_part(name, '/'::text, 2))::uuid, 'registrations'::text)))));

CREATE POLICY "registration_evidence_read_own_uploads" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'registration-evidence'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "registration_evidence_read_owner_or_admin" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'registration-evidence'::text) AND (EXISTS ( SELECT 1
   FROM (registration_evidence e
     LEFT JOIN registrations r ON ((r.id = e.registration_id)))
  WHERE ((e.storage_path = objects.name) AND ((e.submitted_by = ( SELECT auth.uid() AS uid)) OR ((r.id IS NOT NULL) AND private.can_manage_tournament_section(r.tournament_id, 'registrations'::text))))))));

CREATE POLICY "registration_evidence_upload_own" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'registration-evidence'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
