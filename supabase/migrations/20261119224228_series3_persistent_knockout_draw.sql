-- Series 3 knockout draw: independent immutable snapshot.
-- The existing Series 3 group draw table is intentionally untouched.
create table public.plato_land_series3_knockout_draws (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'series3'
    constraint plato_land_series3_knockout_draws_event_key_check check (event_key = 'series3')
    constraint plato_land_series3_knockout_draws_event_key_key unique,
  entrants_snapshot jsonb not null
    constraint plato_land_series3_knockout_draws_entrants_array_check check (jsonb_typeof(entrants_snapshot) = 'array'),
  bracket_snapshot jsonb not null
    constraint plato_land_series3_knockout_draws_bracket_object_check check (jsonb_typeof(bracket_snapshot) = 'object'),
  draw_fingerprint text not null
    constraint plato_land_series3_knockout_draws_fingerprint_check check (draw_fingerprint ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.plato_land_series3_knockout_draws enable row level security;

revoke all on table public.plato_land_series3_knockout_draws from public, anon, authenticated;
grant select, insert on table public.plato_land_series3_knockout_draws to authenticated;

create policy "Series 3 knockout draw owner read"
on public.plato_land_series3_knockout_draws
for select
to authenticated
using ((select private.has_role(ARRAY['owner', 'مالک کل']::text[])));

create policy "Series 3 knockout draw owner insert"
on public.plato_land_series3_knockout_draws
for insert
to authenticated
with check (
  (select private.has_role(ARRAY['owner', 'مالک کل']::text[]))
  and created_by = (select auth.uid())
);

comment on table public.plato_land_series3_knockout_draws is
'Immutable owner-only snapshot of the Series 3 knockout draw. Separate from the immutable group draw; one draw per event.';
