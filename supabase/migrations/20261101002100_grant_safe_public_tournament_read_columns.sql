-- Public pages read only the fields needed to display published tournaments.
-- Sensitive/internal ownership fields remain unavailable to anon.
grant select (
  id,
  title,
  game_type,
  series_name,
  description,
  rules,
  status,
  registration_open,
  capacity,
  prize_details,
  registration_starts_at,
  registration_ends_at,
  starts_at,
  completed_at,
  platform_settings,
  created_at,
  updated_at
) on public.tournaments to anon;
