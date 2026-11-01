-- Broadcast maintenance enable/disable changes to open public sessions; RLS restricts payload visibility.
alter publication supabase_realtime add table public.site_maintenance;
