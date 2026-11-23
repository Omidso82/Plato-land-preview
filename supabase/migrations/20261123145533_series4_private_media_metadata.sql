-- Apply only after explicit approval.
begin;
create table public.plato_land_series4_media (
  slot text primary key check (slot ~ '^(poster|teaser|rules|slide-(0[1-9]|1[0-7]))$'),
  object_key text not null check (
    object_key like ('plato-land/backgammon/series-4/owner-media/' || slot || '/%')
    and split_part(object_key,'/',6) ~ '^[a-f0-9-]{36}$'
    and array_length(string_to_array(object_key,'/'),1)=6
  ),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id)
);
alter table public.plato_land_series4_media enable row level security;
revoke all on public.plato_land_series4_media from public,anon,authenticated;
grant select,insert,update on public.plato_land_series4_media to authenticated;
create policy "Series 4 owner reads media" on public.plato_land_series4_media for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
create policy "Series 4 owner inserts media" on public.plato_land_series4_media for insert to authenticated
with check (updated_by=(select auth.uid()) and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
create policy "Series 4 owner updates media" on public.plato_land_series4_media for update to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')))
with check (updated_by=(select auth.uid()) and exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
commit;
