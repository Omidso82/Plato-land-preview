create table if not exists public.plato_land_series2_player_stats (
  request_id uuid primary key references public.plato_land_series2_registration_requests(id) on delete cascade,
  games_played bigint not null default 0 check (games_played >= 0),
  games_won bigint not null default 0 check (games_won >= 0 and games_won <= games_played),
  updated_at timestamptz not null default now()
);
alter table public.plato_land_series2_player_stats enable row level security;
revoke all on public.plato_land_series2_player_stats from anon, authenticated;
comment on table public.plato_land_series2_player_stats is 'Owner-managed private Series 2 player game and win counts; only accessed by the owner-authenticated registration report Edge Function.';
