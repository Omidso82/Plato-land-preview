-- Series 3: immutable owner-only ranking, seeding pots and group draw snapshot.
-- The primary Supabase migration was applied with the owner's explicit approval.
create table public.plato_land_series3_seeding_draws (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'series3'
    constraint plato_land_series3_seeding_draws_event_key_check check (event_key = 'series3')
    constraint plato_land_series3_seeding_draws_event_key_key unique,
  ranking_snapshot jsonb not null
    constraint plato_land_series3_seeding_draws_ranking_array_check check (jsonb_typeof(ranking_snapshot) = 'array'),
  pots_snapshot jsonb not null
    constraint plato_land_series3_seeding_draws_pots_array_check check (jsonb_typeof(pots_snapshot) = 'array'),
  groups_snapshot jsonb not null
    constraint plato_land_series3_seeding_draws_groups_array_check check (jsonb_typeof(groups_snapshot) = 'array'),
  stats_fingerprint text not null
    constraint plato_land_series3_seeding_draws_fingerprint_check check (stats_fingerprint ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.plato_land_series3_seeding_draws enable row level security;

revoke all on table public.plato_land_series3_seeding_draws from public, anon, authenticated;
grant select, insert on table public.plato_land_series3_seeding_draws to authenticated;

create policy "Series 3 seeding draw owner read"
on public.plato_land_series3_seeding_draws
for select
to authenticated
using ((select private.has_role(ARRAY['owner', 'مالک کل']::text[])));

create policy "Series 3 seeding draw owner insert"
on public.plato_land_series3_seeding_draws
for insert
to authenticated
with check (
  (select private.has_role(ARRAY['owner', 'مالک کل']::text[]))
  and created_by = (select auth.uid())
);
