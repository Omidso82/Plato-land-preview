-- Harden the Temporary Projects stats view so caller permissions and underlying RLS apply.
-- This view is not used by the Player Bank UI, but remains available for owner-only reporting.
alter view public.plato_land_temp_player_event_stats set (security_invoker = true);
comment on view public.plato_land_temp_player_event_stats is
  'Temporary Projects owner-only player event stats; security_invoker ensures underlying table RLS is enforced.';
