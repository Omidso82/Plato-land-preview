-- PLATO ID Scanner append-only review and report history.
-- Draft migration only: do not apply to production without separate approval.

create table if not exists public.plato_id_scanner_review_revisions (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.plato_id_scanner_uploads(id) on delete restrict,
  revision integer not null check (revision > 0),
  previous_revision integer,
  status text not null check (status in ('approved')),
  canonical_ids jsonb not null,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  note text,
  unique (scan_id, revision),
  check (previous_revision is null or (previous_revision > 0 and previous_revision < revision)),
  check (jsonb_typeof(canonical_ids) = 'array'),
  check (not jsonb_path_exists(canonical_ids, '$[*] ? (@.type() != "string")'))
);

create index if not exists plato_id_scanner_review_scan_revision_idx
  on public.plato_id_scanner_review_revisions(scan_id, revision desc);

alter table public.plato_id_scanner_review_revisions enable row level security;
revoke all on public.plato_id_scanner_review_revisions from anon, authenticated;
grant select, insert on public.plato_id_scanner_review_revisions to authenticated;

create policy scanner_review_read_owner_or_approved_operator
on public.plato_id_scanner_review_revisions
for select to authenticated
using (
  (select private.has_role(array['owner']::text[]))
  or exists (
    select 1 from public.plato_id_scanner_uploads u
    join public.plato_id_scanner_access a on a.user_id = u.operator_id
    where u.id = scan_id
      and u.operator_id = (select auth.uid())
      and a.status = 'approved'
  )
);

create policy scanner_review_insert_owner_or_approved_operator
on public.plato_id_scanner_review_revisions
for insert to authenticated
with check (
  reviewer_id = (select auth.uid())
  and exists (
    select 1 from public.plato_id_scanner_uploads u
    where u.id = scan_id
      and (
        (select private.has_role(array['owner']::text[]))
        or (
          u.operator_id = (select auth.uid())
          and exists (
            select 1 from public.plato_id_scanner_access a
            where a.user_id = (select auth.uid()) and a.status = 'approved'
          )
        )
      )
  )
);

-- No UPDATE or DELETE grants/policies: a correction is a new revision.

create table if not exists public.plato_id_scanner_report_versions (
  id uuid primary key default gen_random_uuid(),
  report_kind text not null check (report_kind in ('daily','weekly','per_scan')),
  period_key text not null,
  version integer not null check (version > 0),
  previous_version integer,
  payload jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  note text,
  unique (report_kind, period_key, version),
  check (previous_version is null or (previous_version > 0 and previous_version < version)),
  check (jsonb_typeof(payload) = 'object')
);

create index if not exists plato_id_scanner_report_period_version_idx
  on public.plato_id_scanner_report_versions(report_kind, period_key, version desc);

alter table public.plato_id_scanner_report_versions enable row level security;
revoke all on public.plato_id_scanner_report_versions from anon, authenticated;
grant select, insert on public.plato_id_scanner_report_versions to authenticated;

create policy scanner_report_read_owner_or_approved_operator
on public.plato_id_scanner_report_versions
for select to authenticated
using (
  (select private.has_role(array['owner']::text[]))
  or (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.plato_id_scanner_access a
      where a.user_id = (select auth.uid()) and a.status = 'approved'
    )
  )
);

create policy scanner_report_insert_owner_or_approved_operator
on public.plato_id_scanner_report_versions
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    (select private.has_role(array['owner']::text[]))
    or exists (
      select 1 from public.plato_id_scanner_access a
      where a.user_id = (select auth.uid()) and a.status = 'approved'
    )
  )
);

-- Telegram delivery is deliberately not enabled by this migration.
-- A separate authenticated server-side sender/outbox must be implemented and reviewed.

-- Enforce exact uniqueness and contiguous revision chains inside PostgreSQL.
-- The trigger runs for every insert, regardless of client-side validation.
create or replace function private.plato_id_scanner_validate_review_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_revision integer;
  canonical_count integer;
  distinct_count integer;
begin
  select coalesce(max(r.revision), 0)
    into latest_revision
    from public.plato_id_scanner_review_revisions r
   where r.scan_id = new.scan_id;

  if new.revision <> latest_revision + 1 then
    raise exception 'Scanner review revision must be the next sequential version';
  end if;

  if latest_revision = 0 and new.previous_revision is not null then
    raise exception 'First Scanner review revision cannot reference a previous version';
  end if;

  if latest_revision > 0 and new.previous_revision is distinct from latest_revision then
    raise exception 'Scanner review revision must reference the latest previous version';
  end if;

  select count(*), count(distinct value)
    into canonical_count, distinct_count
    from jsonb_array_elements_text(new.canonical_ids) as values_table(value);

  if canonical_count <> distinct_count then
    raise exception 'Canonical Scanner IDs must not contain exact duplicates';
  end if;

  return new;
end;
$$;

drop trigger if exists plato_id_scanner_review_revision_guard
  on public.plato_id_scanner_review_revisions;
create trigger plato_id_scanner_review_revision_guard
before insert on public.plato_id_scanner_review_revisions
for each row execute function private.plato_id_scanner_validate_review_revision();

create or replace function private.plato_id_scanner_validate_report_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_version integer;
begin
  select coalesce(max(r.version), 0)
    into latest_version
    from public.plato_id_scanner_report_versions r
   where r.report_kind = new.report_kind
     and r.period_key = new.period_key;

  if new.version <> latest_version + 1 then
    raise exception 'Scanner report version must be the next sequential version';
  end if;

  if latest_version = 0 and new.previous_version is not null then
    raise exception 'First Scanner report version cannot reference a previous version';
  end if;

  if latest_version > 0 and new.previous_version is distinct from latest_version then
    raise exception 'Scanner report version must reference the latest previous version';
  end if;

  return new;
end;
$$;

drop trigger if exists plato_id_scanner_report_version_guard
  on public.plato_id_scanner_report_versions;
create trigger plato_id_scanner_report_version_guard
before insert on public.plato_id_scanner_report_versions
for each row execute function private.plato_id_scanner_validate_report_version();

-- Explicitly revoke direct mutation privileges. The trigger functions are
-- private-schema implementation details and are not executable by API roles.
revoke all on function private.plato_id_scanner_validate_review_revision() from public, anon, authenticated;
revoke all on function private.plato_id_scanner_validate_report_version() from public, anon, authenticated;
