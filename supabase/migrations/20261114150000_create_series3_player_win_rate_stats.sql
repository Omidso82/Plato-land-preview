create table public.plato_land_series3_player_stats (
  request_id uuid primary key references public.plato_land_series3_registration_requests(id) on delete cascade,
  games_played bigint not null default 0 check (games_played >= 0),
  games_won bigint not null default 0 check (games_won >= 0 and games_won <= games_played),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.plato_land_series3_player_stats enable row level security;
grant select, insert, update, delete on public.plato_land_series3_player_stats to authenticated;

create policy "Series 3 stats owner select"
on public.plato_land_series3_player_stats for select to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
));

create policy "Series 3 stats owner insert"
on public.plato_land_series3_player_stats for insert to authenticated
with check (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
));

create policy "Series 3 stats owner update"
on public.plato_land_series3_player_stats for update to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
))
with check (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
));

create policy "Series 3 stats owner delete"
on public.plato_land_series3_player_stats for delete to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'مالک کل')
));
