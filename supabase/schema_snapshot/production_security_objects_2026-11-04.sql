-- Phase 2: RLS, policies, and triggers. Apply after core objects and function definitions.
-- Extracted from Production catalog on 2026-11-04.

-- 5) Row Level Security enablement
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plato_land_prediction_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plato_land_semifinal_prediction_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plato_land_series2_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_news_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_manager_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_manager_section_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6) Public RLS policies
CREATE POLICY "Authenticated users can view enabled site announcement" ON public.site_announcements AS PERMISSIVE FOR SELECT TO authenticated USING (((enabled = true) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text])))))));
CREATE POLICY "Owners can delete site announcement" ON public.site_announcements AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text]))))));
CREATE POLICY "Owners can insert site announcement" ON public.site_announcements AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text]))))));
CREATE POLICY "Owners can update site announcement" ON public.site_announcements AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['owner'::text, 'مالک کل'::text]))))));
CREATE POLICY audit_insert_actor ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((actor_id = ( SELECT auth.uid() AS uid)) AND (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) OR (( SELECT private.has_role(ARRAY['tournament_admin'::text]) AS has_role) AND ((details ->> 'tournament_id'::text) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND private.can_manage_tournament(((details ->> 'tournament_id'::text))::uuid)))));
CREATE POLICY audit_select ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) OR (( SELECT private.has_role(ARRAY['tournament_admin'::text]) AS has_role) AND ((details ->> 'tournament_id'::text) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::text) AND private.can_manage_tournament(((details ->> 'tournament_id'::text))::uuid))));
CREATE POLICY bans_delete ON public.player_bans AS PERMISSIVE FOR DELETE TO authenticated USING (private.has_role(ARRAY['owner'::text]));
CREATE POLICY bans_insert ON public.player_bans AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.has_role(ARRAY['owner'::text]) AND ((created_by IS NULL) OR (created_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY bans_select ON public.player_bans AS PERMISSIVE FOR SELECT TO authenticated USING (private.has_role(ARRAY['owner'::text]));
CREATE POLICY bans_update ON public.player_bans AS PERMISSIVE FOR UPDATE TO authenticated USING (private.has_role(ARRAY['owner'::text])) WITH CHECK (private.has_role(ARRAY['owner'::text]));
CREATE POLICY competition_snapshots_manager_delete ON public.competition_snapshots AS PERMISSIVE FOR DELETE TO authenticated USING (private.can_manage_tournament_section(tournament_id, 'groups'::text));
CREATE POLICY competition_snapshots_manager_insert ON public.competition_snapshots AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (private.can_manage_tournament_section(tournament_id, 'groups'::text));
CREATE POLICY competition_snapshots_manager_or_participant_read ON public.competition_snapshots AS PERMISSIVE FOR SELECT TO authenticated USING ((private.can_manage_tournament_section(tournament_id, 'groups'::text) OR (EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.tournament_id = competition_snapshots.tournament_id) AND (r.player_id = ( SELECT auth.uid() AS uid)) AND (r.status = ANY (ARRAY['approved'::text, 'registered'::text])) AND (r.is_reserve = false))))));
CREATE POLICY competition_snapshots_manager_update ON public.competition_snapshots AS PERMISSIVE FOR UPDATE TO authenticated USING (private.can_manage_tournament_section(tournament_id, 'groups'::text)) WITH CHECK (private.can_manage_tournament_section(tournament_id, 'groups'::text));
CREATE POLICY matches_delete ON public.matches AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY matches_insert ON public.matches AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.can_manage_tournament_section(tournament_id, 'groups'::text) OR private.can_manage_tournament_section(tournament_id, 'schedule'::text)));
CREATE POLICY matches_select ON public.matches AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = matches.tournament_id) AND (t.status = ANY (ARRAY['published'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])) AND private.is_tournament_public(t.id)))) OR private.can_manage_tournament_section(tournament_id, 'groups'::text) OR private.can_manage_tournament_section(tournament_id, 'schedule'::text) OR private.can_manage_tournament_section(tournament_id, 'results'::text)));
CREATE POLICY matches_update ON public.matches AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.can_manage_tournament_section(tournament_id, 'schedule'::text) OR private.can_manage_tournament_section(tournament_id, 'results'::text))) WITH CHECK ((private.can_manage_tournament_section(tournament_id, 'schedule'::text) OR private.can_manage_tournament_section(tournament_id, 'results'::text)));
CREATE POLICY owner_admin_tasks_owner_delete ON public.owner_admin_tasks AS PERMISSIVE FOR DELETE TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY owner_admin_tasks_owner_insert ON public.owner_admin_tasks AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY owner_admin_tasks_owner_read ON public.owner_admin_tasks AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY owner_admin_tasks_owner_update ON public.owner_admin_tasks AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid)))) WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY owner_private_notes_owner_delete ON public.owner_private_notes AS PERMISSIVE FOR DELETE TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY owner_private_notes_owner_insert ON public.owner_private_notes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY owner_private_notes_owner_read ON public.owner_private_notes AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY owner_private_notes_owner_update ON public.owner_private_notes AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid)))) WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY profiles_delete ON public.profiles AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY profiles_insert ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((id = ( SELECT auth.uid() AS uid)));
CREATE POLICY profiles_public_completed_results_read ON public.profiles AS PERMISSIVE FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM (tournament_results r
     JOIN tournaments t ON ((t.id = r.tournament_id)))
  WHERE ((r.player_id = profiles.id) AND (t.status = 'completed'::text) AND (t.completed_at IS NOT NULL) AND private.is_tournament_public(t.id)))));
CREATE POLICY profiles_select ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) OR (EXISTS ( SELECT 1
   FROM (tournament_results r
     JOIN tournaments t ON ((t.id = r.tournament_id)))
  WHERE ((r.player_id = profiles.id) AND (t.status = 'completed'::text) AND (t.completed_at IS NOT NULL) AND private.is_tournament_public(t.id))))));
CREATE POLICY profiles_update ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role))) WITH CHECK (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)));
CREATE POLICY registration_evidence_admin_review ON public.registration_evidence AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.id = registration_evidence.registration_id) AND private.can_manage_tournament_section(r.tournament_id, 'registrations'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.id = registration_evidence.registration_id) AND private.can_manage_tournament_section(r.tournament_id, 'registrations'::text)))));
CREATE POLICY registration_evidence_insert_own ON public.registration_evidence AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((submitted_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.id = registration_evidence.registration_id) AND (r.player_id = ( SELECT auth.uid() AS uid)) AND (r.evidence_path = registration_evidence.storage_path))))));
CREATE POLICY registration_evidence_read_own_or_admin ON public.registration_evidence AS PERMISSIVE FOR SELECT TO authenticated USING (((submitted_by = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.id = registration_evidence.registration_id) AND private.can_manage_tournament_section(r.tournament_id, 'registrations'::text))))));
CREATE POLICY registration_members_insert_own ON public.registration_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.id = registration_members.registration_id) AND (r.tournament_id = registration_members.tournament_id) AND (r.player_id = ( SELECT auth.uid() AS uid)) AND (r.status = 'pending'::text)))));
CREATE POLICY registration_members_public_approved_read ON public.registration_members AS PERMISSIVE FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.id = registration_members.registration_id) AND (r.tournament_id = registration_members.tournament_id) AND (r.status = ANY (ARRAY['approved'::text, 'registered'::text])) AND (COALESCE(r.is_reserve, false) = false) AND private.is_tournament_public(r.tournament_id)))));
CREATE POLICY registration_members_read_own_or_manager ON public.registration_members AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.id = registration_members.registration_id) AND ((r.player_id = ( SELECT auth.uid() AS uid)) OR private.can_manage_tournament_section(r.tournament_id, 'registrations'::text) OR ((r.status = ANY (ARRAY['approved'::text, 'registered'::text])) AND (COALESCE(r.is_reserve, false) = false) AND (private.can_manage_tournament_section(r.tournament_id, 'groups'::text) OR private.can_manage_tournament_section(r.tournament_id, 'schedule'::text) OR private.can_manage_tournament_section(r.tournament_id, 'results'::text))))))));
CREATE POLICY registrations_delete ON public.registrations AS PERMISSIVE FOR DELETE TO authenticated USING ((((player_id = ( SELECT auth.uid() AS uid)) AND (status = 'pending'::text)) OR private.can_manage_tournament_section(tournament_id, 'registrations'::text)));
CREATE POLICY registrations_insert ON public.registrations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((player_id = ( SELECT auth.uid() AS uid)) AND (rules_accepted_at IS NOT NULL) AND ((evidence_path IS NULL) OR (((storage.foldername(evidence_path))[1] = (( SELECT auth.uid() AS uid))::text) AND (EXISTS ( SELECT 1
   FROM storage.objects o
  WHERE ((o.bucket_id = 'registration-evidence'::text) AND (o.name = registrations.evidence_path)))))) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (NOT private.is_banned(p.plato_id, registrations.tournament_id))))) AND (EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = registrations.tournament_id) AND (t.status = 'published'::text) AND (t.registration_open = true) AND ((t.registration_starts_at IS NULL) OR (t.registration_starts_at <= now())) AND ((t.registration_ends_at IS NULL) OR (t.registration_ends_at > now())) AND ((registrations.evidence_path IS NOT NULL) OR (COALESCE(((t.platform_settings ->> 'require_profile_screenshot'::text))::boolean, true) = false)))))));
CREATE POLICY registrations_public_approved_read ON public.registrations AS PERMISSIVE FOR SELECT TO anon USING (((status = ANY (ARRAY['approved'::text, 'registered'::text])) AND (COALESCE(is_reserve, false) = false) AND private.is_tournament_public(tournament_id)));
CREATE POLICY registrations_select ON public.registrations AS PERMISSIVE FOR SELECT TO authenticated USING (((player_id = ( SELECT auth.uid() AS uid)) OR private.can_manage_tournament_section(tournament_id, 'registrations'::text) OR ((status = ANY (ARRAY['approved'::text, 'registered'::text])) AND (COALESCE(is_reserve, false) = false) AND (private.can_manage_tournament_section(tournament_id, 'groups'::text) OR private.can_manage_tournament_section(tournament_id, 'schedule'::text) OR private.can_manage_tournament_section(tournament_id, 'results'::text)))));
CREATE POLICY registrations_update ON public.registrations AS PERMISSIVE FOR UPDATE TO authenticated USING (private.can_manage_tournament_section(tournament_id, 'registrations'::text)) WITH CHECK (private.can_manage_tournament_section(tournament_id, 'registrations'::text));
CREATE POLICY results_delete ON public.tournament_results AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY results_insert ON public.tournament_results AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (private.can_manage_tournament_section(tournament_id, 'results'::text));
CREATE POLICY results_public_completed_read ON public.tournament_results AS PERMISSIVE FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = tournament_results.tournament_id) AND (t.status = 'completed'::text) AND (t.completed_at IS NOT NULL) AND private.is_tournament_public(t.id)))));
CREATE POLICY results_select ON public.tournament_results AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM tournaments t
  WHERE ((t.id = tournament_results.tournament_id) AND (t.status = ANY (ARRAY['published'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])) AND private.is_tournament_public(t.id)))) OR private.can_manage_tournament_section(tournament_id, 'results'::text)));
CREATE POLICY results_update ON public.tournament_results AS PERMISSIVE FOR UPDATE TO authenticated USING (private.can_manage_tournament_section(tournament_id, 'results'::text)) WITH CHECK (private.can_manage_tournament_section(tournament_id, 'results'::text));
CREATE POLICY roles_own_select ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY roles_owner_delete ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY roles_owner_insert ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY roles_owner_update ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY site_games_authenticated_read ON public.site_games AS PERMISSIVE FOR SELECT TO authenticated USING (((enabled = true) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)));
CREATE POLICY site_games_owner_insert ON public.site_games AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((created_by IS NULL) OR (created_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_games_owner_update ON public.site_games AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY site_games_public_read ON public.site_games AS PERMISSIVE FOR SELECT TO anon USING ((enabled = true));
CREATE POLICY site_maintenance_authenticated_read ON public.site_maintenance AS PERMISSIVE FOR SELECT TO authenticated USING (((enabled = true) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)));
CREATE POLICY site_maintenance_owner_insert ON public.site_maintenance AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((updated_by IS NULL) OR (updated_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_maintenance_owner_update ON public.site_maintenance AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY site_maintenance_public_read ON public.site_maintenance AS PERMISSIVE FOR SELECT TO anon USING (true);
CREATE POLICY site_news_authenticated_read ON public.site_news AS PERMISSIVE FOR SELECT TO authenticated USING ((((status = 'published'::text) AND (COALESCE(publish_at, published_at, created_at) <= now()) AND ((expires_at IS NULL) OR (expires_at > now()))) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)));
CREATE POLICY site_news_owner_delete ON public.site_news AS PERMISSIVE FOR DELETE TO authenticated USING (private.has_role(ARRAY['owner'::text]));
CREATE POLICY site_news_owner_insert ON public.site_news AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((created_by IS NULL) OR (created_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_news_owner_update ON public.site_news AS PERMISSIVE FOR UPDATE TO authenticated USING (private.has_role(ARRAY['owner'::text])) WITH CHECK (private.has_role(ARRAY['owner'::text]));
CREATE POLICY site_news_public_read ON public.site_news AS PERMISSIVE FOR SELECT TO anon USING (((status = 'published'::text) AND (COALESCE(publish_at, published_at, created_at) <= now()) AND ((expires_at IS NULL) OR (expires_at > now()))));
CREATE POLICY site_news_versions_owner_insert ON public.site_news_versions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((changed_by IS NULL) OR (changed_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_news_versions_owner_read ON public.site_news_versions AS PERMISSIVE FOR SELECT TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY site_page_versions_owner_insert ON public.site_page_versions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((changed_by IS NULL) OR (changed_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_page_versions_owner_read ON public.site_page_versions AS PERMISSIVE FOR SELECT TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY site_pages_authenticated_read ON public.site_pages AS PERMISSIVE FOR SELECT TO authenticated USING (((published_content IS NOT NULL) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)));
CREATE POLICY site_pages_owner_delete ON public.site_pages AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY site_pages_owner_insert ON public.site_pages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((updated_by IS NULL) OR (updated_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_pages_owner_update ON public.site_pages AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY site_pages_public_read ON public.site_pages AS PERMISSIVE FOR SELECT TO anon USING ((published_content IS NOT NULL));
CREATE POLICY site_settings_authenticated_select ON public.site_settings AS PERMISSIVE FOR SELECT TO authenticated USING (((key = 'group_invite'::text) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)));
CREATE POLICY site_settings_owner_delete ON public.site_settings AS PERMISSIVE FOR DELETE TO authenticated USING (private.has_role(ARRAY['owner'::text]));
CREATE POLICY site_settings_owner_insert ON public.site_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((updated_by IS NULL) OR (updated_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_settings_owner_update ON public.site_settings AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((updated_by IS NULL) OR (updated_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY site_settings_public_invite_read ON public.site_settings AS PERMISSIVE FOR SELECT TO anon USING ((key = 'group_invite'::text));
CREATE POLICY tournament_manager_access_delete_owner_only ON public.tournament_manager_access AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY tournament_manager_access_insert_owner_only ON public.tournament_manager_access AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND (granted_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM tournaments t
  WHERE (t.id = tournament_manager_access.tournament_id)))));
CREATE POLICY tournament_manager_access_select_owner_or_assignee ON public.tournament_manager_access AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) OR (user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY tournament_manager_access_update_owner_only ON public.tournament_manager_access AS PERMISSIVE FOR UPDATE TO authenticated USING (private.has_role(ARRAY['owner'::text])) WITH CHECK (private.has_role(ARRAY['owner'::text]));
CREATE POLICY tournament_manager_section_permissions_owner_delete ON public.tournament_manager_section_permissions AS PERMISSIVE FOR DELETE TO authenticated USING (private.has_role(ARRAY['owner'::text]));
CREATE POLICY tournament_manager_section_permissions_owner_insert ON public.tournament_manager_section_permissions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.has_role(ARRAY['owner'::text]) AND ((granted_by IS NULL) OR (granted_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY tournament_manager_section_permissions_owner_update ON public.tournament_manager_section_permissions AS PERMISSIVE FOR UPDATE TO authenticated USING (private.has_role(ARRAY['owner'::text])) WITH CHECK ((private.has_role(ARRAY['owner'::text]) AND ((granted_by IS NULL) OR (granted_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY tournament_manager_section_permissions_read_own_or_owner ON public.tournament_manager_section_permissions AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR private.has_role(ARRAY['owner'::text])));
CREATE POLICY tournament_settings_admin_read ON public.tournament_settings AS PERMISSIVE FOR SELECT TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text, 'tournament_admin'::text]) AS has_role));
CREATE POLICY tournament_settings_owner_delete ON public.tournament_settings AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY tournament_settings_owner_insert ON public.tournament_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY tournament_settings_owner_update ON public.tournament_settings AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY tournaments_delete ON public.tournaments AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY tournaments_insert ON public.tournaments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((( SELECT private.has_role(ARRAY['owner'::text]) AS has_role) AND ((created_by IS NULL) OR (created_by = ( SELECT auth.uid() AS uid)))));
CREATE POLICY tournaments_public_visible_lifecycle_select ON public.tournaments AS PERMISSIVE FOR SELECT TO anon USING (((status = ANY (ARRAY['published'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])) AND private.is_tournament_public(id)));
CREATE POLICY tournaments_select ON public.tournaments AS PERMISSIVE FOR SELECT TO authenticated USING ((((status = ANY (ARRAY['published'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])) AND private.is_tournament_public(id)) OR private.can_manage_tournament(id)));
CREATE POLICY tournaments_update ON public.tournaments AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY user_admin_permissions_owner_delete ON public.user_admin_permissions AS PERMISSIVE FOR DELETE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY user_admin_permissions_owner_insert ON public.user_admin_permissions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY user_admin_permissions_owner_update ON public.user_admin_permissions AS PERMISSIVE FOR UPDATE TO authenticated USING (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)) WITH CHECK (( SELECT private.has_role(ARRAY['owner'::text]) AS has_role));
CREATE POLICY user_admin_permissions_read_own_or_owner ON public.user_admin_permissions AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT private.has_role(ARRAY['owner'::text]) AS has_role)));
CREATE POLICY user_notifications_insert_self_or_authorized_manager ON public.user_notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR ((tournament_id IS NOT NULL) AND (private.can_manage_tournament_section(tournament_id, 'registrations'::text) OR private.can_manage_tournament_section(tournament_id, 'schedule'::text) OR private.can_manage_tournament_section(tournament_id, 'results'::text)) AND (EXISTS ( SELECT 1
   FROM registrations r
  WHERE ((r.player_id = user_notifications.user_id) AND (r.tournament_id = user_notifications.tournament_id)))))));
CREATE POLICY user_notifications_select_own ON public.user_notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY user_notifications_update_own ON public.user_notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

-- 7) Application triggers
CREATE TRIGGER audit_games_changes AFTER INSERT OR DELETE OR UPDATE ON site_games FOR EACH ROW EXECUTE FUNCTION capture_audit_event();
CREATE TRIGGER audit_maintenance_changes AFTER INSERT OR DELETE OR UPDATE ON site_maintenance FOR EACH ROW EXECUTE FUNCTION capture_audit_event();
CREATE TRIGGER audit_news_changes AFTER INSERT OR DELETE OR UPDATE ON site_news FOR EACH ROW EXECUTE FUNCTION capture_audit_event();
CREATE TRIGGER audit_pages_changes AFTER INSERT OR DELETE OR UPDATE ON site_pages FOR EACH ROW EXECUTE FUNCTION capture_audit_event();
CREATE TRIGGER audit_registrations_changes AFTER INSERT OR DELETE OR UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION capture_audit_event();
CREATE TRIGGER audit_results_changes AFTER INSERT OR DELETE OR UPDATE ON tournament_results FOR EACH ROW EXECUTE FUNCTION capture_audit_event();
CREATE TRIGGER audit_tournaments_changes AFTER INSERT OR DELETE OR UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION capture_audit_event();
CREATE TRIGGER notify_registration_change AFTER INSERT OR UPDATE OF status, is_reserve ON registrations FOR EACH ROW EXECUTE FUNCTION notify_registration_change();
CREATE TRIGGER protect_player_display_name BEFORE UPDATE OF display_name ON profiles FOR EACH ROW EXECUTE FUNCTION protect_player_display_name();
CREATE TRIGGER registrations_assign_reserve BEFORE INSERT ON registrations FOR EACH ROW EXECUTE FUNCTION private.assign_registration_reserve();
CREATE TRIGGER site_news_version_before_change BEFORE DELETE OR UPDATE ON site_news FOR EACH ROW EXECUTE FUNCTION capture_site_news_version();
CREATE TRIGGER site_page_version_before_change BEFORE DELETE OR UPDATE ON site_pages FOR EACH ROW EXECUTE FUNCTION capture_site_page_version();
