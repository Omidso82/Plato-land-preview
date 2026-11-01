-- Owner-managed public news and announcement articles.
-- Draft rows remain private; public visitors can read published articles only.

create table public.site_news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  summary text not null default '' check (char_length(summary) <= 400),
  body text not null default '',
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  featured_starts_at timestamptz,
  featured_ends_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_news_featured_window_valid
    check (featured_starts_at is null or featured_ends_at is null or featured_ends_at > featured_starts_at)
);

create index site_news_publication_order_idx
  on public.site_news (published_at desc)
  where status = 'published';

create index site_news_featured_window_idx
  on public.site_news (featured, featured_starts_at, featured_ends_at)
  where status = 'published';

alter table public.site_news enable row level security;

create policy site_news_public_read
  on public.site_news
  for select
  to anon
  using (status = 'published');

create policy site_news_authenticated_read
  on public.site_news
  for select
  to authenticated
  using (status = 'published' or private.has_role(array['owner']));

create policy site_news_owner_insert
  on public.site_news
  for insert
  to authenticated
  with check (
    private.has_role(array['owner'])
    and (created_by is null or created_by = auth.uid())
  );

create policy site_news_owner_update
  on public.site_news
  for update
  to authenticated
  using (private.has_role(array['owner']))
  with check (private.has_role(array['owner']));

create policy site_news_owner_delete
  on public.site_news
  for delete
  to authenticated
  using (private.has_role(array['owner']));
