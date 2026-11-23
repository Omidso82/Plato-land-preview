begin;
alter table public.plato_land_series4_media add column is_active boolean not null default true;
create table public.plato_land_series4_media_preferences (
  singleton boolean primary key default true check(singleton),
  homepage_slot text not null default 'poster' check(homepage_slot in ('poster','teaser')),
  rules_enabled boolean not null default false
);
insert into public.plato_land_series4_media_preferences default values;
alter table public.plato_land_series4_media_preferences enable row level security;
revoke all on public.plato_land_series4_media_preferences from public,anon,authenticated;
grant select,update on public.plato_land_series4_media_preferences to authenticated;
create policy "Series 4 owner manages media preferences"
on public.plato_land_series4_media_preferences for all to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')))
with check (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));

create table public.plato_land_series4_telegram_delivery_history (
  request_id uuid not null,
  destination text not null check(destination in ('main_channel','test_group')),
  status text not null check(status in ('sending','sent','failed','uncertain')),
  message_id bigint,
  sent_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key(request_id,destination)
);
alter table public.plato_land_series4_telegram_delivery_history enable row level security;
revoke all on public.plato_land_series4_telegram_delivery_history from public,anon,authenticated;
grant select on public.plato_land_series4_telegram_delivery_history to authenticated;
grant select,insert,update on public.plato_land_series4_telegram_delivery_history to service_role;
create policy "Series 4 owner reads Telegram delivery history"
on public.plato_land_series4_telegram_delivery_history for select to authenticated
using (exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role in ('owner','مالک کل')));
commit;
