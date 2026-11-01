-- The public maintenance gate filters on the singleton key; grant that key
-- alongside the public message and enabled flag, without write privileges.
revoke all privileges on table public.site_maintenance from anon;
grant select (singleton,enabled,message,updated_at) on public.site_maintenance to anon;
