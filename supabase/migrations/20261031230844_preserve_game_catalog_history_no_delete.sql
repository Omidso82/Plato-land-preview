-- Game catalog items are hidden by setting enabled=false. Prevent deletion so
-- historical tournament references and the public archive remain intact.
drop policy if exists site_games_owner_delete on public.site_games;
