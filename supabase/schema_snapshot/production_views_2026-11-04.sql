-- Apply after production_functions_2026-11-04.sql because the view calls private.is_tournament_public().
-- Preserves Production security_invoker and security_barrier options.

CREATE OR REPLACE VIEW public.recent_tournament_champions WITH (security_invoker=true, security_barrier=true) AS
 WITH candidates AS (
         SELECT t.id AS tournament_id,
            t.title AS tournament_title,
            t.game_type,
            t.series_name,
            COALESCE(t.prize_details ->> 'text'::text, t.prize_details ->> 'display'::text, ''::text) AS prize_text,
            t.completed_at,
            p.display_name,
            p.plato_id,
            p.public_avatar_path,
            count(*) OVER (PARTITION BY t.id) AS champion_rows
           FROM tournaments t
             JOIN tournament_results r ON r.tournament_id = t.id AND r.placement = 1
             JOIN profiles p ON p.id = r.player_id
          WHERE t.status = 'completed'::text AND t.completed_at IS NOT NULL AND private.is_tournament_public(t.id)
        )
 SELECT tournament_id,
    tournament_title,
    game_type,
    series_name,
    prize_text,
    completed_at,
    display_name,
    plato_id,
    public_avatar_path
   FROM candidates
  WHERE champion_rows = 1
  ORDER BY completed_at DESC
 LIMIT 3;;
