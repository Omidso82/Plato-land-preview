create table if not exists public.plato_land_series3_telegram_delivery_history (
  id uuid primary key default gen_random_uuid(),
  event_key text not null default 'series3' check (event_key = 'series3'),
  destination text not null check (destination in ('test_group','main_channel')),
  status text not null check (status in ('sent','partial','failed')),
  total_count integer not null default 0 check (total_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0 and sent_count <= total_count),
  failed_section text,
  error_message text,
  telegram_results jsonb not null default '[]'::jsonb,
  sent_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_series3_telegram_history_created
  on public.plato_land_series3_telegram_delivery_history (created_at desc);
create index if not exists idx_series3_telegram_history_destination_created
  on public.plato_land_series3_telegram_delivery_history (destination, created_at desc);

alter table public.plato_land_series3_telegram_delivery_history enable row level security;
revoke all on public.plato_land_series3_telegram_delivery_history from anon, authenticated;
grant select on public.plato_land_series3_telegram_delivery_history to authenticated;

drop policy if exists "series3 telegram history owner read" on public.plato_land_series3_telegram_delivery_history;
create policy "series3 telegram history owner read"
on public.plato_land_series3_telegram_delivery_history
for select
to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = 'owner'
  )
);

comment on table public.plato_land_series3_telegram_delivery_history is
  'Owner-only delivery audit for manual Series 3 Telegram publishing. One row per destination attempt; no message body or bot credentials are stored.';
