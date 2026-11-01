-- Expose only catalog display fields to anonymous visitors, including the
-- explicitly selected game slugs for mixed-competition cards.
revoke all privileges on table public.site_games from anon;
grant select (
  id, slug, name, description, image_url, enabled, is_mixed,
  included_game_slugs, sort_order, created_at, updated_at
) on public.site_games to anon;
