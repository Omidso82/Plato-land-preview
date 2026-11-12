-- PLATO ID Scanner manual Telegram report delivery — source-only draft.
-- Apply only after owner review and explicit database activation approval.
alter table public.plato_id_scanner_report_versions
  drop constraint if exists plato_id_scanner_report_versions_report_kind_check;
alter table public.plato_id_scanner_report_versions
  add constraint plato_id_scanner_report_versions_report_kind_check
  check (report_kind in ('daily','weekly','per_scan','telegram_ids'));

create table if not exists public.plato_id_scanner_telegram_deliveries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  report_version_id uuid not null references public.plato_id_scanner_report_versions(id) on delete restrict,
  destination_key text not null default 'test_group' check (destination_key = 'test_group'),
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending','sending','sent','failed')),
  message_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(message_ids) = 'array'),
  message_count integer not null default 0 check (message_count >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists plato_id_scanner_telegram_deliveries_report_idx
  on public.plato_id_scanner_telegram_deliveries(report_version_id, created_at desc);
alter table public.plato_id_scanner_telegram_deliveries enable row level security;
revoke all on public.plato_id_scanner_telegram_deliveries from public, anon, authenticated;
grant select, insert, update on public.plato_id_scanner_telegram_deliveries to service_role;
