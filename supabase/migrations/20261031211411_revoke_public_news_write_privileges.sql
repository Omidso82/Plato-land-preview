-- The public API only needs to read published news. Remove any default
-- table-level write grants inherited by anon and restore the limited read list.

revoke all privileges on table public.site_news from anon;
grant select (
  id, title, summary, body, image_url, status, featured,
  featured_starts_at, featured_ends_at, published_at, created_at, updated_at
) on public.site_news to anon;
