-- PLATO LAND Temporary Projects only: separate game type from tournament series.
-- Existing Series 2 and Series 3 player history is classified as backgammon.
create table public.plato_land_temp_game_types (
  game_key text primary key,
  label text not null check (length(btrim(label)) between 1 and 80),
  icon text not null default '🎮',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plato_land_temp_game_types (game_key, label, icon, sort_order, is_active)
values ('backgammon', 'تخته‌نرد', '🎲', 10, true);

alter table public.plato_land_temp_player_entries
  add column game_type_key text not null default 'backgammon'
  references public.plato_land_temp_game_types(game_key);

alter table public.plato_land_temp_player_matches
  add column game_type_key text not null default 'backgammon'
  references public.plato_land_temp_game_types(game_key);

create index plato_land_temp_entries_player_game_idx
  on public.plato_land_temp_player_entries(player_id, game_type_key, event_key);
create index plato_land_temp_matches_player_game_idx
  on public.plato_land_temp_player_matches(player_a_id, player_b_id, game_type_key, event_key);

alter table public.plato_land_temp_game_types enable row level security;
revoke all on public.plato_land_temp_game_types from public, anon, authenticated;
grant select on public.plato_land_temp_game_types to authenticated;
create policy "Temporary game types owner read"
  on public.plato_land_temp_game_types
  for select to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('owner', 'مالک کل')
  ));

create or replace view public.plato_land_temp_player_event_stats
with (security_invoker = true) as
select
  p.id as player_id,
  p.plato_id,
  p.plato_id_normalized,
  e.event_key,
  count(m.id) filter (where m.result_status in ('completed','double_no_show'))::bigint as games_played,
  count(m.id) filter (where m.result_status = 'completed' and m.winner_player_id = p.id)::bigint as games_won,
  count(m.id) filter (where m.result_status = 'completed' and m.winner_player_id is not null and m.winner_player_id <> p.id)::bigint as games_lost,
  count(m.id) filter (where m.result_status = 'pending')::bigint as pending_matches,
  e.game_type_key
from public.plato_land_temp_players p
join public.plato_land_temp_player_entries e on e.player_id = p.id
left join public.plato_land_temp_player_matches m
  on m.event_key = e.event_key
 and m.game_type_key = e.game_type_key
 and (m.player_a_id = p.id or m.player_b_id = p.id)
group by p.id, p.plato_id, p.plato_id_normalized, e.event_key, e.game_type_key;

revoke all on public.plato_land_temp_player_event_stats from public, anon, authenticated;
grant select on public.plato_land_temp_player_event_stats to authenticated;

comment on table public.plato_land_temp_game_types is
  'Game-type catalog for PLATO LAND Temporary Projects Player Bank only; independent from Main Website game catalog.';
comment on column public.plato_land_temp_player_entries.game_type_key is
  'Game type for this player participation; series/event key remains separately stored in event_key.';
comment on column public.plato_land_temp_player_matches.game_type_key is
  'Game type for this match; tournament series/event key remains separately stored in event_key.';
