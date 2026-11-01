-- Owner-controlled maintenance mode. Anonymous visitors can read only an
-- enabled flag and public message; all writes are owner-only.
create table public.site_maintenance (
  singleton boolean primary key default true check (singleton = true),
  enabled boolean not null default false,
  message text not null default 'سایت در حال به‌روزرسانی است. لطفاً کمی بعد دوباره مراجعه کنید.',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.site_maintenance enable row level security;
create policy site_maintenance_public_read on public.site_maintenance for select to anon using (enabled = true);
create policy site_maintenance_authenticated_read on public.site_maintenance for select to authenticated using (enabled = true or (select private.has_role(array['owner'])));
create policy site_maintenance_owner_insert on public.site_maintenance for insert to authenticated with check ((select private.has_role(array['owner'])) and (updated_by is null or updated_by=(select auth.uid())));
create policy site_maintenance_owner_update on public.site_maintenance for update to authenticated using ((select private.has_role(array['owner']))) with check ((select private.has_role(array['owner'])));
revoke all privileges on table public.site_maintenance from anon;
grant select (enabled,message,updated_at) on public.site_maintenance to anon;
