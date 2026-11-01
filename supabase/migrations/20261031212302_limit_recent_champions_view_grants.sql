-- Views receive broad default grants in this project. The champions view is
-- public read-only data, so revoke all other privileges explicitly.
revoke all privileges on table public.recent_tournament_champions from anon, authenticated;
grant select on public.recent_tournament_champions to anon, authenticated;
