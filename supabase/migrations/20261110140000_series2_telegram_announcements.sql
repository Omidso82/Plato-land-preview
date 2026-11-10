-- PLATO LAND Temporary Projects: Series 2 Telegram announcements
-- Version 1.0 · 2026-11-10
create table if not exists public.plato_land_telegram_announcements (
  id uuid primary key default gen_random_uuid(),
  tournament_key text not null default 'series2' check (tournament_key = 'series2'),
  event_key text not null unique,
  announcement_type text not null check (announcement_type in ('today_schedule','round16_bracket','bracket_update')),
  payload jsonb not null default '{}'::jsonb,
  message_text text not null,
  delivery_status text not null default 'pending' check (delivery_status in ('pending','sending','sent','failed')),
  telegram_message_id bigint,
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.plato_land_telegram_announcements enable row level security;
revoke all on table public.plato_land_telegram_announcements from anon, authenticated;
grant select, insert, update on table public.plato_land_telegram_announcements to service_role;
create index if not exists plato_land_telegram_announcements_status_idx
  on public.plato_land_telegram_announcements (delivery_status, created_at desc);
