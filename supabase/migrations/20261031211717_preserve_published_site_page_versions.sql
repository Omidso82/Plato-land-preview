-- Preserve the last published About/Guide version when the owner saves a
-- newer draft. Anonymous users can only read the published snapshot columns.

alter table public.site_pages
  add column published_title text,
  add column published_content jsonb,
  add column published_at timestamptz;

drop policy if exists site_pages_public_read on public.site_pages;
create policy site_pages_public_read
  on public.site_pages
  for select
  to anon
  using (published_content is not null);

drop policy if exists site_pages_authenticated_read on public.site_pages;
create policy site_pages_authenticated_read
  on public.site_pages
  for select
  to authenticated
  using (published_content is not null or (select private.has_role(array['owner'])));

revoke all privileges on table public.site_pages from anon;
grant select (slug, published_title, published_content, published_at, created_at, updated_at)
  on public.site_pages to anon;
