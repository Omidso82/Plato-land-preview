-- Realtime publication membership extracted from Production, 2026-11-04.
-- Apply after the application tables exist; do not recreate the Supabase-managed publication.
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_maintenance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
