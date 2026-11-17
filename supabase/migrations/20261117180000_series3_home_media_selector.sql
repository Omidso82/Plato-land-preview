-- Series 3 homepage media selector.
-- Additive only: keeps the existing poster and rules-video settings untouched.
create table if not exists public.plato_land_series3_home_media_settings (
  id smallint primary key default 1 check (id = 1),
  media_mode text not null default 'poster' check (media_mode in ('poster', 'video')),
  storage_path text not null default 'teaser/series3-home-teaser.mp4',
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null
);

alter table public.plato_land_series3_home_media_settings enable row level security;

drop policy if exists "Series 3 homepage media public read" on public.plato_land_series3_home_media_settings;
create policy "Series 3 homepage media public read"
  on public.plato_land_series3_home_media_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "Series 3 homepage media owner insert" on public.plato_land_series3_home_media_settings;
create policy "Series 3 homepage media owner insert"
  on public.plato_land_series3_home_media_settings
  for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role = any (array['owner'::text, 'مالک کل'::text])
    )
  );

drop policy if exists "Series 3 homepage media owner update" on public.plato_land_series3_home_media_settings;
create policy "Series 3 homepage media owner update"
  on public.plato_land_series3_home_media_settings
  for update to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role = any (array['owner'::text, 'مالک کل'::text])
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role = any (array['owner'::text, 'مالک کل'::text])
    )
  );

grant select on public.plato_land_series3_home_media_settings to anon, authenticated;
grant insert, update on public.plato_land_series3_home_media_settings to authenticated;

insert into public.plato_land_series3_home_media_settings (id, media_mode, storage_path)
values (1, 'poster', 'teaser/series3-home-teaser.mp4')
on conflict (id) do nothing;
