create table public.plato_land_semifinal_prediction_votes (
  id uuid primary key default gen_random_uuid(),
  voter_plato_id text not null
    check (voter_plato_id ~ '^[A-Za-z0-9_]{2,30}$'),
  voter_plato_id_normalized text
    generated always as (lower(btrim(voter_plato_id))) stored,
  semifinal_one_winner_key text not null
    check (semifinal_one_winner_key in ('ramesh', 'saeed')),
  semifinal_two_winner_key text not null
    check (semifinal_two_winner_key in ('hana', 'lavin')),
  created_at timestamptz not null default now(),
  constraint plato_land_semifinal_prediction_voter_unique unique (voter_plato_id_normalized)
);
alter table public.plato_land_semifinal_prediction_votes enable row level security;
revoke all on table public.plato_land_semifinal_prediction_votes from anon, authenticated;
grant all on table public.plato_land_semifinal_prediction_votes to service_role;
