-- Record the actual completion instant and expose a narrowly projected,
-- public-safe view of the three most recently completed tournament champions.
-- Ambiguous tournaments with multiple placement-1 rows are intentionally omitted.

alter table public.tournaments
  add column completed_at timestamptz;

create or replace view public.recent_tournament_champions
with (security_barrier = true)
as
with candidates as (
  select
    t.id as tournament_id,
    t.title as tournament_title,
    t.game_type,
    t.series_name,
    coalesce(t.prize_details->>'text', t.prize_details->>'display', '') as prize_text,
    t.completed_at,
    p.display_name,
    p.plato_id,
    count(*) over (partition by t.id) as champion_rows
  from public.tournaments t
  join public.tournament_results r
    on r.tournament_id = t.id
   and r.placement = 1
  join public.profiles p
    on p.id = r.player_id
  where t.status = 'completed'
    and t.completed_at is not null
)
select
  tournament_id,
  tournament_title,
  game_type,
  series_name,
  prize_text,
  completed_at,
  display_name,
  plato_id
from candidates
where champion_rows = 1
order by completed_at desc
limit 3;

grant select on public.recent_tournament_champions to anon, authenticated;
