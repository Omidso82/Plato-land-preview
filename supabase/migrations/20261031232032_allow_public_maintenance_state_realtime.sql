-- Public can read the non-sensitive enabled flag/message even when disabled so
-- realtime subscribers receive both activation and deactivation updates.
drop policy if exists site_maintenance_public_read on public.site_maintenance;
create policy site_maintenance_public_read on public.site_maintenance for select to anon using (true);
