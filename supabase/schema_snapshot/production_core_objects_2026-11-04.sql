-- Phase 1: application tables, constraints, indexes, and view.
-- Apply after creating the private schema and before installing functions.
-- This file does not create Supabase-managed schemas/tables or transfer row data.

-- PLATO LAND Production application schema snapshot
-- Extracted read-only from live Production catalogs on 2026-11-04.
-- NOT a turnkey migration: review dependency ordering and Supabase-managed objects.
-- Do not apply to Production. Target only the approved Staging project after review.
-- Function definitions are stored separately in production_functions_2026-11-04.sql.

-- 1) Application tables (all table shells first)
CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.competition_snapshots (
  tournament_id uuid NOT NULL,
  snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.matches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tournament_id uuid NOT NULL,
  round_name text,
  player_one_id uuid,
  player_two_id uuid,
  player_one_score integer,
  player_two_score integer,
  winner_id uuid,
  scheduled_at timestamp with time zone,
  status text DEFAULT 'scheduled'::text NOT NULL,
  reported_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.owner_admin_tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  due_at timestamp with time zone,
  status text DEFAULT 'pending'::text NOT NULL,
  priority text DEFAULT 'normal'::text NOT NULL,
  created_by uuid NOT NULL,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.owner_private_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  priority text DEFAULT 'normal'::text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.plato_land_prediction_votes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  voter_plato_id text NOT NULL,
  voter_plato_id_normalized text GENERATED ALWAYS AS (lower(btrim(voter_plato_id))) STORED,
  predicted_player_key text NOT NULL,
  predicted_player_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.plato_land_semifinal_prediction_votes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  voter_plato_id text NOT NULL,
  voter_plato_id_normalized text GENERATED ALWAYS AS (lower(btrim(voter_plato_id))) STORED,
  semifinal_one_winner_key text NOT NULL,
  semifinal_two_winner_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.plato_land_series2_registration_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plato_id text NOT NULL,
  plato_id_normalized text GENERATED ALWAYS AS (lower(btrim(plato_id))) STORED,
  rules_accepted boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.player_bans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  plato_id text NOT NULL,
  tournament_id uuid,
  reason text NOT NULL,
  starts_at timestamp with time zone DEFAULT now() NOT NULL,
  ends_at timestamp with time zone,
  active boolean DEFAULT true NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  normalized_plato_id text GENERATED ALWAYS AS (lower(btrim(plato_id))) STORED
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text NOT NULL,
  plato_id text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  public_avatar_path text
);

CREATE TABLE public.registration_evidence (
  registration_id uuid NOT NULL,
  submitted_by uuid NOT NULL,
  storage_path text NOT NULL,
  rules_accepted_at timestamp with time zone NOT NULL,
  extracted_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  extraction_status text DEFAULT 'not_started'::text NOT NULL,
  reviewer_id uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.registration_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  registration_id uuid NOT NULL,
  tournament_id uuid NOT NULL,
  display_name text NOT NULL,
  plato_id text NOT NULL,
  is_captain boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.registrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tournament_id uuid NOT NULL,
  player_id uuid NOT NULL,
  status text DEFAULT 'registered'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  rules_accepted_at timestamp with time zone,
  evidence_path text,
  registration_type text DEFAULT 'individual'::text NOT NULL,
  is_reserve boolean DEFAULT false NOT NULL,
  display_name text,
  plato_id text,
  team_name text,
  reserve_position bigint,
  slot_count integer DEFAULT 1 NOT NULL
);

CREATE TABLE public.site_announcements (
  id text NOT NULL,
  title text NOT NULL,
  video_path text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.site_games (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  image_url text,
  enabled boolean DEFAULT true NOT NULL,
  is_mixed boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  included_game_slugs text[] DEFAULT '{}'::text[] NOT NULL
);

CREATE TABLE public.site_maintenance (
  singleton boolean DEFAULT true NOT NULL,
  enabled boolean DEFAULT false NOT NULL,
  message text DEFAULT 'سایت در حال به‌روزرسانی است. لطفاً کمی بعد دوباره مراجعه کنید.'::text NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.site_news (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  summary text DEFAULT ''::text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  image_url text,
  status text DEFAULT 'draft'::text NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  featured_starts_at timestamp with time zone,
  featured_ends_at timestamp with time zone,
  published_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  publish_at timestamp with time zone,
  expires_at timestamp with time zone
);

CREATE TABLE public.site_news_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  news_id uuid NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  summary text DEFAULT ''::text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  image_url text,
  status text NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  featured_starts_at timestamp with time zone,
  featured_ends_at timestamp with time zone,
  published_at timestamp with time zone,
  publish_at timestamp with time zone,
  expires_at timestamp with time zone,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.site_page_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  status text NOT NULL,
  published_title text,
  published_content jsonb,
  published_at timestamp with time zone,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.site_pages (
  slug text NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'published'::text NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  published_title text,
  published_content jsonb,
  published_at timestamp with time zone
);

CREATE TABLE public.site_settings (
  key text NOT NULL,
  value jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tournament_manager_access (
  tournament_id uuid NOT NULL,
  user_id uuid NOT NULL,
  granted_by uuid DEFAULT auth.uid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  permissions_configured boolean DEFAULT false NOT NULL
);

CREATE TABLE public.tournament_manager_section_permissions (
  tournament_id uuid NOT NULL,
  user_id uuid NOT NULL,
  permission_key text NOT NULL,
  granted_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tournament_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  tournament_id uuid NOT NULL,
  player_id uuid NOT NULL,
  points numeric(8,2) DEFAULT 0 NOT NULL,
  wins integer DEFAULT 0 NOT NULL,
  losses integer DEFAULT 0 NOT NULL,
  score_for integer DEFAULT 0 NOT NULL,
  score_against integer DEFAULT 0 NOT NULL,
  placement integer,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tournament_settings (
  tournament_id uuid NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  visibility jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tournaments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  game_type text NOT NULL,
  series_name text,
  description text,
  rules text,
  status text DEFAULT 'draft'::text NOT NULL,
  registration_open boolean DEFAULT false NOT NULL,
  capacity integer,
  prize_details jsonb DEFAULT '{}'::jsonb NOT NULL,
  registration_starts_at timestamp with time zone,
  registration_ends_at timestamp with time zone,
  starts_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  platform_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  completed_at timestamp with time zone
);

CREATE TABLE public.user_admin_permissions (
  user_id uuid NOT NULL,
  permission_key text NOT NULL,
  granted_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  tournament_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2) Table constraints and foreign keys
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.competition_snapshots ADD CONSTRAINT competition_snapshots_object_check CHECK (jsonb_typeof(snapshot) = 'object'::text);
ALTER TABLE public.competition_snapshots ADD CONSTRAINT competition_snapshots_pkey PRIMARY KEY (tournament_id);
ALTER TABLE public.competition_snapshots ADD CONSTRAINT competition_snapshots_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.competition_snapshots ADD CONSTRAINT competition_snapshots_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.competition_snapshots ADD CONSTRAINT competition_snapshots_version_check CHECK (version > 0);
ALTER TABLE public.matches ADD CONSTRAINT matches_pkey PRIMARY KEY (id);
ALTER TABLE public.matches ADD CONSTRAINT matches_player_one_id_fkey FOREIGN KEY (player_one_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD CONSTRAINT matches_player_one_score_check CHECK (player_one_score IS NULL OR player_one_score >= 0);
ALTER TABLE public.matches ADD CONSTRAINT matches_player_two_id_fkey FOREIGN KEY (player_two_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD CONSTRAINT matches_player_two_score_check CHECK (player_two_score IS NULL OR player_two_score >= 0);
ALTER TABLE public.matches ADD CONSTRAINT matches_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check CHECK (status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'disputed'::text, 'cancelled'::text]));
ALTER TABLE public.matches ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD CONSTRAINT matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.owner_admin_tasks ADD CONSTRAINT owner_admin_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.owner_admin_tasks ADD CONSTRAINT owner_admin_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.owner_admin_tasks ADD CONSTRAINT owner_admin_tasks_priority_check CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text]));
ALTER TABLE public.owner_admin_tasks ADD CONSTRAINT owner_admin_tasks_status_check CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'done'::text]));
ALTER TABLE public.owner_admin_tasks ADD CONSTRAINT owner_admin_tasks_title_check CHECK (char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 160);
ALTER TABLE public.owner_private_notes ADD CONSTRAINT owner_private_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.owner_private_notes ADD CONSTRAINT owner_private_notes_pkey PRIMARY KEY (id);
ALTER TABLE public.owner_private_notes ADD CONSTRAINT owner_private_notes_priority_check CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text]));
ALTER TABLE public.owner_private_notes ADD CONSTRAINT owner_private_notes_title_check CHECK (char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 160);
ALTER TABLE public.plato_land_prediction_votes ADD CONSTRAINT plato_land_prediction_votes_pkey PRIMARY KEY (id);
ALTER TABLE public.plato_land_prediction_votes ADD CONSTRAINT plato_land_prediction_votes_plato_id_format CHECK (voter_plato_id ~ '^[A-Za-z0-9_]{2,30}$'::text);
ALTER TABLE public.plato_land_prediction_votes ADD CONSTRAINT plato_land_prediction_votes_predicted_player_key_check CHECK (predicted_player_key = ANY (ARRAY['abi'::text, 'ramesh'::text, 'danesh'::text, 'saeed'::text, 'lavin'::text, 'narges'::text, 'hana'::text, 'fatemeh'::text]));
ALTER TABLE public.plato_land_prediction_votes ADD CONSTRAINT plato_land_prediction_votes_voter_plato_id_unique UNIQUE (voter_plato_id_normalized);
ALTER TABLE public.plato_land_semifinal_prediction_votes ADD CONSTRAINT plato_land_semifinal_prediction__semifinal_one_winner_key_check CHECK (semifinal_one_winner_key = ANY (ARRAY['ramesh'::text, 'saeed'::text]));
ALTER TABLE public.plato_land_semifinal_prediction_votes ADD CONSTRAINT plato_land_semifinal_prediction__semifinal_two_winner_key_check CHECK (semifinal_two_winner_key = ANY (ARRAY['hana'::text, 'lavin'::text]));
ALTER TABLE public.plato_land_semifinal_prediction_votes ADD CONSTRAINT plato_land_semifinal_prediction_voter_unique UNIQUE (voter_plato_id_normalized);
ALTER TABLE public.plato_land_semifinal_prediction_votes ADD CONSTRAINT plato_land_semifinal_prediction_votes_pkey PRIMARY KEY (id);
ALTER TABLE public.plato_land_semifinal_prediction_votes ADD CONSTRAINT plato_land_semifinal_prediction_votes_voter_plato_id_check CHECK (voter_plato_id ~ '^[A-Za-z0-9_]{2,30}$'::text);
ALTER TABLE public.plato_land_series2_registration_requests ADD CONSTRAINT plato_land_series2_registration_plato_id_unique UNIQUE (plato_id_normalized);
ALTER TABLE public.plato_land_series2_registration_requests ADD CONSTRAINT plato_land_series2_registration_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.plato_land_series2_registration_requests ADD CONSTRAINT plato_land_series2_registration_requests_plato_id_check CHECK (plato_id ~ '^[A-Za-z0-9_]{2,30}$'::text);
ALTER TABLE public.plato_land_series2_registration_requests ADD CONSTRAINT plato_land_series2_registration_requests_rules_accepted_check CHECK (rules_accepted = true);
ALTER TABLE public.player_bans ADD CONSTRAINT player_bans_check CHECK (ends_at IS NULL OR ends_at > starts_at);
ALTER TABLE public.player_bans ADD CONSTRAINT player_bans_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.player_bans ADD CONSTRAINT player_bans_pkey PRIMARY KEY (id);
ALTER TABLE public.player_bans ADD CONSTRAINT player_bans_reason_check CHECK (length(TRIM(BOTH FROM reason)) >= 1 AND length(TRIM(BOTH FROM reason)) <= 1000);
ALTER TABLE public.player_bans ADD CONSTRAINT player_bans_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_display_name_check CHECK (length(TRIM(BOTH FROM display_name)) >= 1 AND length(TRIM(BOTH FROM display_name)) <= 80);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plato_id_check CHECK (length(TRIM(BOTH FROM plato_id)) >= 1 AND length(TRIM(BOTH FROM plato_id)) <= 80);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plato_id_key UNIQUE (plato_id);
ALTER TABLE public.registration_evidence ADD CONSTRAINT registration_evidence_data_check CHECK (jsonb_typeof(extracted_data) = 'object'::text);
ALTER TABLE public.registration_evidence ADD CONSTRAINT registration_evidence_extraction_status_check CHECK (extraction_status = ANY (ARRAY['not_started'::text, 'pending_review'::text, 'reviewed'::text, 'failed'::text]));
ALTER TABLE public.registration_evidence ADD CONSTRAINT registration_evidence_pkey PRIMARY KEY (registration_id);
ALTER TABLE public.registration_evidence ADD CONSTRAINT registration_evidence_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE;
ALTER TABLE public.registration_evidence ADD CONSTRAINT registration_evidence_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.registration_evidence ADD CONSTRAINT registration_evidence_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.registration_members ADD CONSTRAINT registration_members_display_name_check CHECK (length(btrim(display_name)) >= 1 AND length(btrim(display_name)) <= 80);
ALTER TABLE public.registration_members ADD CONSTRAINT registration_members_pkey PRIMARY KEY (id);
ALTER TABLE public.registration_members ADD CONSTRAINT registration_members_plato_id_check CHECK (length(btrim(plato_id)) >= 1 AND length(btrim(plato_id)) <= 80);
ALTER TABLE public.registration_members ADD CONSTRAINT registration_members_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE;
ALTER TABLE public.registration_members ADD CONSTRAINT registration_members_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_pkey PRIMARY KEY (id);
ALTER TABLE public.registrations ADD CONSTRAINT registrations_player_id_fkey FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_status_check CHECK (status = ANY (ARRAY['pending'::text, 'registered'::text, 'approved'::text, 'rejected'::text, 'withdrawn'::text]));
ALTER TABLE public.registrations ADD CONSTRAINT registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_tournament_id_player_id_key UNIQUE (tournament_id, player_id);
ALTER TABLE public.site_announcements ADD CONSTRAINT site_announcements_id_check CHECK (id = 'main'::text);
ALTER TABLE public.site_announcements ADD CONSTRAINT site_announcements_pkey PRIMARY KEY (id);
ALTER TABLE public.site_announcements ADD CONSTRAINT site_announcements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_games ADD CONSTRAINT site_games_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_games ADD CONSTRAINT site_games_description_check CHECK (char_length(description) <= 500);
ALTER TABLE public.site_games ADD CONSTRAINT site_games_mixed_competition_members_valid CHECK (is_mixed = false AND cardinality(included_game_slugs) = 0 OR is_mixed = true AND cardinality(included_game_slugs) >= 2);
ALTER TABLE public.site_games ADD CONSTRAINT site_games_name_check CHECK (char_length(btrim(name)) >= 1 AND char_length(btrim(name)) <= 80);
ALTER TABLE public.site_games ADD CONSTRAINT site_games_pkey PRIMARY KEY (id);
ALTER TABLE public.site_games ADD CONSTRAINT site_games_slug_check CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'::text);
ALTER TABLE public.site_games ADD CONSTRAINT site_games_slug_key UNIQUE (slug);
ALTER TABLE public.site_maintenance ADD CONSTRAINT site_maintenance_pkey PRIMARY KEY (singleton);
ALTER TABLE public.site_maintenance ADD CONSTRAINT site_maintenance_singleton_check CHECK (singleton = true);
ALTER TABLE public.site_maintenance ADD CONSTRAINT site_maintenance_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_news ADD CONSTRAINT site_news_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_news ADD CONSTRAINT site_news_featured_window_valid CHECK (featured_starts_at IS NULL OR featured_ends_at IS NULL OR featured_ends_at > featured_starts_at);
ALTER TABLE public.site_news ADD CONSTRAINT site_news_pkey PRIMARY KEY (id);
ALTER TABLE public.site_news ADD CONSTRAINT site_news_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text]));
ALTER TABLE public.site_news ADD CONSTRAINT site_news_summary_check CHECK (char_length(summary) <= 400);
ALTER TABLE public.site_news ADD CONSTRAINT site_news_title_check CHECK (char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 160);
ALTER TABLE public.site_news_versions ADD CONSTRAINT site_news_versions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_news_versions ADD CONSTRAINT site_news_versions_news_id_version_number_key UNIQUE (news_id, version_number);
ALTER TABLE public.site_news_versions ADD CONSTRAINT site_news_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.site_page_versions ADD CONSTRAINT site_page_versions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_page_versions ADD CONSTRAINT site_page_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.site_page_versions ADD CONSTRAINT site_page_versions_slug_check CHECK (slug = ANY (ARRAY['about'::text, 'guide'::text]));
ALTER TABLE public.site_page_versions ADD CONSTRAINT site_page_versions_slug_version_number_key UNIQUE (slug, version_number);
ALTER TABLE public.site_pages ADD CONSTRAINT site_pages_content_check CHECK (jsonb_typeof(content) = 'object'::text);
ALTER TABLE public.site_pages ADD CONSTRAINT site_pages_pkey PRIMARY KEY (slug);
ALTER TABLE public.site_pages ADD CONSTRAINT site_pages_slug_check CHECK (slug = ANY (ARRAY['about'::text, 'guide'::text]));
ALTER TABLE public.site_pages ADD CONSTRAINT site_pages_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text]));
ALTER TABLE public.site_pages ADD CONSTRAINT site_pages_title_check CHECK (char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 160);
ALTER TABLE public.site_pages ADD CONSTRAINT site_pages_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);
ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tournament_manager_access ADD CONSTRAINT tournament_manager_access_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id);
ALTER TABLE public.tournament_manager_access ADD CONSTRAINT tournament_manager_access_pkey PRIMARY KEY (tournament_id, user_id);
ALTER TABLE public.tournament_manager_access ADD CONSTRAINT tournament_manager_access_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_manager_access ADD CONSTRAINT tournament_manager_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_manager_section_permissions ADD CONSTRAINT tournament_manager_section_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tournament_manager_section_permissions ADD CONSTRAINT tournament_manager_section_permissions_permission_key_check CHECK (permission_key = ANY (ARRAY['registrations'::text, 'groups'::text, 'schedule'::text, 'results'::text]));
ALTER TABLE public.tournament_manager_section_permissions ADD CONSTRAINT tournament_manager_section_permissions_pkey PRIMARY KEY (tournament_id, user_id, permission_key);
ALTER TABLE public.tournament_manager_section_permissions ADD CONSTRAINT tournament_manager_section_permissions_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_manager_section_permissions ADD CONSTRAINT tournament_manager_section_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_losses_check CHECK (losses >= 0);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_pkey PRIMARY KEY (id);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_placement_check CHECK (placement IS NULL OR placement > 0);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_player_id_fkey FOREIGN KEY (player_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_tournament_id_player_id_key UNIQUE (tournament_id, player_id);
ALTER TABLE public.tournament_results ADD CONSTRAINT tournament_results_wins_check CHECK (wins >= 0);
ALTER TABLE public.tournament_settings ADD CONSTRAINT tournament_settings_json_check CHECK (jsonb_typeof(settings) = 'object'::text AND jsonb_typeof(visibility) = 'object'::text);
ALTER TABLE public.tournament_settings ADD CONSTRAINT tournament_settings_pkey PRIMARY KEY (tournament_id);
ALTER TABLE public.tournament_settings ADD CONSTRAINT tournament_settings_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.tournament_settings ADD CONSTRAINT tournament_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_capacity_check CHECK (capacity IS NULL OR capacity > 0);
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text]));
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_title_check CHECK (length(TRIM(BOTH FROM title)) >= 1 AND length(TRIM(BOTH FROM title)) <= 160);
ALTER TABLE public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_key_check CHECK (permission_key = ANY (ARRAY['accounts.view'::text, 'games.view'::text, 'games.manage'::text, 'tournaments.view'::text, 'tournaments.create'::text, 'tournaments.edit'::text, 'tournaments.publish'::text, 'tournaments.delete'::text, 'registrations.view'::text, 'registrations.review'::text, 'registrations.evidence.view'::text, 'tables.view'::text, 'results.manage'::text, 'players.bans.manage'::text]));
ALTER TABLE public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_pkey PRIMARY KEY (user_id, permission_key);
ALTER TABLE public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_notifications ADD CONSTRAINT user_notifications_notification_type_check CHECK (notification_type = ANY (ARRAY['registration_pending'::text, 'registration_approved'::text, 'registration_rejected'::text, 'reserve_added'::text, 'reserve_promoted'::text, 'registration_withdrawn'::text]));
ALTER TABLE public.user_notifications ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.user_notifications ADD CONSTRAINT user_notifications_title_check CHECK (char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 160);
ALTER TABLE public.user_notifications ADD CONSTRAINT user_notifications_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
ALTER TABLE public.user_notifications ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role = ANY (ARRAY['owner'::text, 'tournament_admin'::text]));
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3) Non-constraint indexes
CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs USING btree (actor_id);
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX competition_snapshots_updated_by_idx ON public.competition_snapshots USING btree (updated_by);
CREATE INDEX matches_player_one_id_idx ON public.matches USING btree (player_one_id);
CREATE INDEX matches_player_two_id_idx ON public.matches USING btree (player_two_id);
CREATE INDEX matches_reported_by_idx ON public.matches USING btree (reported_by);
CREATE INDEX matches_tournament_idx ON public.matches USING btree (tournament_id, scheduled_at);
CREATE INDEX matches_winner_id_idx ON public.matches USING btree (winner_id);
CREATE INDEX owner_admin_tasks_owner_due_idx ON public.owner_admin_tasks USING btree (created_by, due_at) WHERE (status <> 'done'::text);
CREATE INDEX owner_private_notes_owner_updated_idx ON public.owner_private_notes USING btree (created_by, updated_at DESC);
CREATE INDEX player_bans_created_by_idx ON public.player_bans USING btree (created_by);
CREATE INDEX player_bans_normalized_lookup ON public.player_bans USING btree (normalized_plato_id, active, starts_at, ends_at);
CREATE INDEX player_bans_plato_id_idx ON public.player_bans USING btree (lower(plato_id), active);
CREATE INDEX player_bans_tournament_id_idx ON public.player_bans USING btree (tournament_id);
CREATE INDEX registration_evidence_reviewer_id_idx ON public.registration_evidence USING btree (reviewer_id);
CREATE INDEX registration_evidence_submitter_idx ON public.registration_evidence USING btree (submitted_by);
CREATE INDEX registration_members_tournament_plato_id_normalized_idx ON public.registration_members USING btree (tournament_id, lower(btrim(plato_id)));
CREATE INDEX registrations_capacity_order ON public.registrations USING btree (tournament_id, created_at, id) WHERE (status = ANY (ARRAY['pending'::text, 'approved'::text, 'registered'::text]));
CREATE INDEX registrations_player_idx ON public.registrations USING btree (player_id);
CREATE INDEX registrations_tournament_idx ON public.registrations USING btree (tournament_id);
CREATE INDEX registrations_tournament_status_idx ON public.registrations USING btree (tournament_id, status);
CREATE INDEX site_announcements_updated_by_idx ON public.site_announcements USING btree (updated_by);
CREATE INDEX site_games_created_by_idx ON public.site_games USING btree (created_by);
CREATE INDEX site_games_public_order_idx ON public.site_games USING btree (sort_order, name) WHERE (enabled = true);
CREATE INDEX site_maintenance_updated_by_idx ON public.site_maintenance USING btree (updated_by);
CREATE INDEX site_news_created_by_idx ON public.site_news USING btree (created_by);
CREATE INDEX site_news_featured_window_idx ON public.site_news USING btree (featured, featured_starts_at, featured_ends_at) WHERE (status = 'published'::text);
CREATE INDEX site_news_publication_order_idx ON public.site_news USING btree (published_at DESC) WHERE (status = 'published'::text);
CREATE INDEX site_news_versions_changed_by_idx ON public.site_news_versions USING btree (changed_by);
CREATE INDEX site_news_versions_news_created_idx ON public.site_news_versions USING btree (news_id, created_at DESC);
CREATE INDEX site_page_versions_changed_by_idx ON public.site_page_versions USING btree (changed_by);
CREATE INDEX site_page_versions_slug_created_idx ON public.site_page_versions USING btree (slug, created_at DESC);
CREATE INDEX site_pages_updated_by_idx ON public.site_pages USING btree (updated_by);
CREATE INDEX site_settings_updated_by_idx ON public.site_settings USING btree (updated_by);
CREATE INDEX tournament_manager_access_granted_by_idx ON public.tournament_manager_access USING btree (granted_by);
CREATE INDEX tournament_manager_access_user_id_idx ON public.tournament_manager_access USING btree (user_id);
CREATE INDEX tournament_manager_section_permissions_granted_by_idx ON public.tournament_manager_section_permissions USING btree (granted_by) WHERE (granted_by IS NOT NULL);
CREATE INDEX tournament_manager_section_permissions_user_id_idx ON public.tournament_manager_section_permissions USING btree (user_id);
CREATE INDEX tournament_results_player_id_idx ON public.tournament_results USING btree (player_id);
CREATE INDEX tournament_settings_updated_by_idx ON public.tournament_settings USING btree (updated_by);
CREATE INDEX tournaments_created_by_idx ON public.tournaments USING btree (created_by);
CREATE INDEX tournaments_status_idx ON public.tournaments USING btree (status, starts_at);
CREATE INDEX user_admin_permissions_granted_by_idx ON public.user_admin_permissions USING btree (granted_by);
CREATE INDEX user_admin_permissions_user_idx ON public.user_admin_permissions USING btree (user_id);
CREATE INDEX user_notifications_tournament_id_idx ON public.user_notifications USING btree (tournament_id);
CREATE INDEX user_notifications_unread_idx ON public.user_notifications USING btree (user_id, created_at DESC) WHERE (read_at IS NULL);
CREATE INDEX user_notifications_user_created_idx ON public.user_notifications USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX profiles_plato_id_lower_idx ON public.profiles USING btree (lower(plato_id));
CREATE UNIQUE INDEX registration_members_unique_registration_plato ON public.registration_members USING btree (registration_id, lower(btrim(plato_id)));

-- Public view creation is deferred until private helper functions are installed.
