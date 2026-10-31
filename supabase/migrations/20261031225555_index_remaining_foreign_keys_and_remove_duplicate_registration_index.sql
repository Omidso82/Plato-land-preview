-- Add missing FK indexes identified by Supabase Performance Advisor.
create index if not exists competition_snapshots_updated_by_idx on public.competition_snapshots(updated_by);
create index if not exists matches_player_one_id_idx on public.matches(player_one_id);
create index if not exists matches_player_two_id_idx on public.matches(player_two_id);
create index if not exists matches_reported_by_idx on public.matches(reported_by);
create index if not exists matches_winner_id_idx on public.matches(winner_id);
create index if not exists player_bans_created_by_idx on public.player_bans(created_by);
create index if not exists player_bans_tournament_id_idx on public.player_bans(tournament_id);
create index if not exists registration_evidence_reviewer_id_idx on public.registration_evidence(reviewer_id);
create index if not exists site_announcements_updated_by_idx on public.site_announcements(updated_by);
create index if not exists site_news_versions_changed_by_idx on public.site_news_versions(changed_by);
create index if not exists site_page_versions_changed_by_idx on public.site_page_versions(changed_by);
create index if not exists site_settings_updated_by_idx on public.site_settings(updated_by);
create index if not exists tournament_manager_access_granted_by_idx on public.tournament_manager_access(granted_by);
create index if not exists tournament_settings_updated_by_idx on public.tournament_settings(updated_by);
create index if not exists user_admin_permissions_granted_by_idx on public.user_admin_permissions(granted_by);

-- This index duplicates the unique constraint index exactly.
drop index if exists public.registrations_unique_player_per_tournament;
