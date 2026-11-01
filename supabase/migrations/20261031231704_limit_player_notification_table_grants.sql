-- Authenticated players need only read and mark their own notifications; scoped
-- manager-triggered inserts are protected by the INSERT RLS policy.
revoke all privileges on table public.user_notifications from authenticated;
grant select, insert, update on table public.user_notifications to authenticated;
