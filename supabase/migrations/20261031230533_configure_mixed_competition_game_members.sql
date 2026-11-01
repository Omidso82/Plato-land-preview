-- A mixed competition must explicitly include at least two distinct catalog games.
alter table public.site_games
  add column included_game_slugs text[] not null default '{}'::text[];

alter table public.site_games
  add constraint site_games_mixed_competition_members_valid
  check (
    (is_mixed = false and cardinality(included_game_slugs) = 0)
    or
    (is_mixed = true and cardinality(included_game_slugs) >= 2)
  );
