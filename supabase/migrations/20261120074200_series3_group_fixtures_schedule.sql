-- Series 3 immutable group fixture schedule snapshot.
-- Applied to the primary Supabase project with owner approval.
create table public.plato_land_series3_group_fixtures (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'series3'
    constraint plato_land_series3_group_fixtures_event_key_check check (event_key = 'series3')
    constraint plato_land_series3_group_fixtures_event_key_key unique,
  schedule_snapshot jsonb not null
    constraint plato_land_series3_group_fixtures_schedule_object_check check (jsonb_typeof(schedule_snapshot) = 'object'),
  schedule_fingerprint text not null
    constraint plato_land_series3_group_fixtures_fingerprint_check check (schedule_fingerprint ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.plato_land_series3_group_fixtures enable row level security;

revoke all on table public.plato_land_series3_group_fixtures from public, anon, authenticated;
grant select, insert on table public.plato_land_series3_group_fixtures to authenticated;

create policy "Series 3 group fixtures owner read"
on public.plato_land_series3_group_fixtures
for select
to authenticated
using ((select private.has_role(ARRAY['owner', 'مالک کل']::text[])));

create policy "Series 3 group fixtures owner insert"
on public.plato_land_series3_group_fixtures
for insert
to authenticated
with check (
  (select private.has_role(ARRAY['owner', 'مالک کل']::text[]))
  and created_by = (select auth.uid())
);
