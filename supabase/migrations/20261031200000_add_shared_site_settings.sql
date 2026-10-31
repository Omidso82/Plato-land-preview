-- Central shared settings. Public clients can read only the group invite setting.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists site_settings_public_invite_read on public.site_settings;
create policy site_settings_public_invite_read on public.site_settings
 for select to anon, authenticated using (key = 'group_invite');
drop policy if exists site_settings_owner_select on public.site_settings;
create policy site_settings_owner_select on public.site_settings
 for select to authenticated using (private.has_role(array['owner'::text]));
drop policy if exists site_settings_owner_insert on public.site_settings;
create policy site_settings_owner_insert on public.site_settings
 for insert to authenticated with check (private.has_role(array['owner'::text]) and (updated_by is null or updated_by = auth.uid()));
drop policy if exists site_settings_owner_update on public.site_settings;
create policy site_settings_owner_update on public.site_settings
 for update to authenticated using (private.has_role(array['owner'::text]))
 with check (private.has_role(array['owner'::text]) and (updated_by is null or updated_by = auth.uid()));
drop policy if exists site_settings_owner_delete on public.site_settings;
create policy site_settings_owner_delete on public.site_settings
 for delete to authenticated using (private.has_role(array['owner'::text]));
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
