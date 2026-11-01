-- Public news cards do not need the creator's auth user UUID.
-- Keep the public select policy, but expose only the columns used by the
-- public NewsCenter component.

revoke select on public.site_news from anon;
grant select (
  id, title, summary, body, image_url, status, featured,
  featured_starts_at, featured_ends_at, published_at, created_at, updated_at
) on public.site_news to anon;
