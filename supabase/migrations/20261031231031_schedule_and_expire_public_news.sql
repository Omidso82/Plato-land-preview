-- Support scheduled publication and optional archive expiry for news items.
-- The public role sees published items only within their active publication window.
alter table public.site_news
  add column publish_at timestamptz,
  add column expires_at timestamptz;

update public.site_news
set publish_at = coalesce(publish_at, published_at, created_at)
where status = 'published';

drop policy if exists site_news_public_read on public.site_news;
create policy site_news_public_read
  on public.site_news
  for select
  to anon
  using (
    status = 'published'
    and coalesce(publish_at, published_at, created_at) <= now()
    and (expires_at is null or expires_at > now())
  );

drop policy if exists site_news_authenticated_read on public.site_news;
create policy site_news_authenticated_read
  on public.site_news
  for select
  to authenticated
  using (
    (
      status = 'published'
      and coalesce(publish_at, published_at, created_at) <= now()
      and (expires_at is null or expires_at > now())
    )
    or (select private.has_role(array['owner']))
  );

revoke all privileges on table public.site_news from anon;
grant select (
  id, title, summary, body, image_url, status, featured,
  featured_starts_at, featured_ends_at, published_at,
  publish_at, expires_at, created_at, updated_at
) on public.site_news to anon;
