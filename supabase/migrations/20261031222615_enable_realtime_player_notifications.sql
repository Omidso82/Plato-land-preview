-- Publish only the player's private notification table to Supabase Realtime; RLS remains enforced for subscribers.
alter publication supabase_realtime add table public.user_notifications;
