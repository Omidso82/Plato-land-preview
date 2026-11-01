-- Players may mark a notification as read but cannot rewrite notification content or ownership.
revoke update on table public.user_notifications from authenticated;
grant update (read_at) on table public.user_notifications to authenticated;
