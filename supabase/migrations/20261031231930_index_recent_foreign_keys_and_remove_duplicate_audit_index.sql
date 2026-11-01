-- Add covering indexes for recently introduced FK/query paths and remove
-- the duplicate descending audit timestamp index (the existing B-tree can scan backwards).
create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists site_maintenance_updated_by_idx on public.site_maintenance(updated_by);
create index if not exists user_notifications_tournament_id_idx on public.user_notifications(tournament_id);
create index if not exists tournament_results_player_id_idx on public.tournament_results(player_id);
drop index if exists public.audit_logs_created_at_desc_idx;
