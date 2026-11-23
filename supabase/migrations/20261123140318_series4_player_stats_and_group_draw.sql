-- Draft only. Apply after explicit approval.
begin;
create table public.plato_land_series4_player_stats (
  request_id uuid primary key references public.plato_land_series4_registration_requests(id) on delete cascade,
  games_played bigint not null default 0 check (games_played >= 0),
  games_won bigint not null default 0 check (games_won >= 0 and games_won <= games_played),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.plato_land_series4_player_stats enable row level security;
revoke all on public.plato_land_series4_player_stats from public, anon, authenticated;
grant select, insert, update on public.plato_land_series4_player_stats to authenticated;

create policy "Series 4 stats owner select"
on public.plato_land_series4_player_stats for select to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
));

create policy "Series 4 stats owner insert"
on public.plato_land_series4_player_stats for insert to authenticated
with check (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
));

create policy "Series 4 stats owner update"
on public.plato_land_series4_player_stats for update to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
))
with check (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
));

create table public.plato_land_series4_seeding_draws (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'series4'
    constraint plato_land_series4_seeding_draws_event_key_check check (event_key = 'series4')
    constraint plato_land_series4_seeding_draws_event_key_key unique,
  ranking_snapshot jsonb not null
    constraint plato_land_series4_seeding_draws_ranking_array_check check (jsonb_typeof(ranking_snapshot) = 'array'),
  pots_snapshot jsonb not null
    constraint plato_land_series4_seeding_draws_pots_array_check check (jsonb_typeof(pots_snapshot) = 'array'),
  groups_snapshot jsonb not null
    constraint plato_land_series4_seeding_draws_groups_array_check check (jsonb_typeof(groups_snapshot) = 'array'),
  stats_fingerprint text not null
    constraint plato_land_series4_seeding_draws_fingerprint_check check (stats_fingerprint ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.plato_land_series4_seeding_draws enable row level security;

revoke all on table public.plato_land_series4_seeding_draws from public, anon, authenticated;
grant select, insert on table public.plato_land_series4_seeding_draws to authenticated;

create policy "Series 4 seeding draw owner read"
on public.plato_land_series4_seeding_draws
for select
to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')));

create policy "Series 4 seeding draw owner insert"
on public.plato_land_series4_seeding_draws
for insert
to authenticated
with check (
  exists (select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل'))
  and created_by = (select auth.uid())
  and jsonb_array_length(pots_snapshot) = 4
  and jsonb_array_length(ranking_snapshot) = 4 * jsonb_array_length(groups_snapshot)
  and jsonb_array_length(groups_snapshot) in (8, 12)
);
commit;
