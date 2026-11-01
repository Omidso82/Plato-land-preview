-- Owner-managed About and Guide pages.
-- Public visitors can read published page content only; draft content stays private.

create table public.site_pages (
  slug text primary key check (slug in ('about', 'guide')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  status text not null default 'published' check (status in ('draft', 'published')),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;

create policy site_pages_public_read
  on public.site_pages
  for select
  to anon
  using (status = 'published');

create policy site_pages_authenticated_read
  on public.site_pages
  for select
  to authenticated
  using (status = 'published' or (select private.has_role(array['owner'])));

create policy site_pages_owner_insert
  on public.site_pages
  for insert
  to authenticated
  with check (
    (select private.has_role(array['owner']))
    and (updated_by is null or updated_by = (select auth.uid()))
  );

create policy site_pages_owner_update
  on public.site_pages
  for update
  to authenticated
  using ((select private.has_role(array['owner'])))
  with check ((select private.has_role(array['owner'])));

create policy site_pages_owner_delete
  on public.site_pages
  for delete
  to authenticated
  using ((select private.has_role(array['owner'])));

revoke all privileges on table public.site_pages from anon;
grant select (slug, title, content, status, created_at, updated_at)
  on public.site_pages to anon;
