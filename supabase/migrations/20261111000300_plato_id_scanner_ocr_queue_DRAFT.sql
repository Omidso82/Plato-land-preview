-- PLATO ID Scanner OCR job queue — DRAFT ONLY.
-- Do not apply to the primary Supabase project without explicit owner approval.
-- All queue operations are server-side; authenticated browser users receive no
-- direct privileges on these tables or RPCs.

create table if not exists public.plato_id_scanner_ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null unique references public.plato_id_scanner_uploads(id) on delete restrict,
  status text not null default 'queued'
    check (status in ('queued','processing','succeeded','failed')),
  attempt integer not null default 0 check (attempt >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  available_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  worker_id uuid,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'processing' and lease_expires_at is not null and worker_id is not null)
    or status <> 'processing'
  )
);

create index if not exists plato_id_scanner_ocr_jobs_claim_idx
  on public.plato_id_scanner_ocr_jobs(status, available_at, lease_expires_at, created_at);

create table if not exists public.plato_id_scanner_ocr_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.plato_id_scanner_ocr_jobs(id) on delete restrict,
  scan_id uuid not null references public.plato_id_scanner_uploads(id) on delete restrict,
  attempt integer not null check (attempt > 0),
  outcome text not null check (outcome in ('processing','succeeded','failed','lease_expired')),
  engine_name text,
  engine_version text,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  result_payload jsonb,
  error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique(job_id, attempt),
  check (result_payload is null or jsonb_typeof(result_payload) = 'object')
);

create index if not exists plato_id_scanner_ocr_attempts_scan_idx
  on public.plato_id_scanner_ocr_attempts(scan_id, attempt desc);

alter table public.plato_id_scanner_ocr_jobs enable row level security;
alter table public.plato_id_scanner_ocr_attempts enable row level security;
revoke all on public.plato_id_scanner_ocr_jobs from anon, authenticated;
revoke all on public.plato_id_scanner_ocr_attempts from anon, authenticated;
revoke all on public.plato_id_scanner_ocr_jobs from public;
revoke all on public.plato_id_scanner_ocr_attempts from public;
grant select, insert, update on public.plato_id_scanner_ocr_jobs to service_role;
grant select, insert, update on public.plato_id_scanner_ocr_attempts to service_role;

-- Atomically claims available work. Expired leases are reclaimed with a new
-- attempt number, so callbacks from an older worker are fenced out.
create or replace function public.claim_plato_id_scanner_ocr_jobs(
  p_worker_id uuid,
  p_limit integer default 1,
  p_lease_seconds integer default 120
)
returns setof public.plato_id_scanner_ocr_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.jwt()->>'role') is distinct from 'service_role' then
    raise exception 'service role required';
  end if;
  if p_worker_id is null or p_limit < 1 or p_limit > 10
     or p_lease_seconds < 30 or p_lease_seconds > 600 then
    raise exception 'invalid claim parameters';
  end if;

  return query
  with candidates as (
    select j.id, j.status as prior_status, j.attempt as prior_attempt
      from public.plato_id_scanner_ocr_jobs j
     where (
         (j.status = 'queued' and j.available_at <= now() and j.attempt < j.max_attempts)
         or (j.status = 'processing' and j.lease_expires_at < now())
       )
     order by j.available_at, j.created_at
     for update skip locked
     limit p_limit
  ), expired_attempts as (
    update public.plato_id_scanner_ocr_attempts a
       set outcome = 'lease_expired', finished_at = now()
      from candidates c
     where c.prior_status = 'processing'
       and a.job_id = c.id
       and a.attempt = c.prior_attempt
       and a.outcome = 'processing'
     returning a.job_id
  ), terminalized as (
    update public.plato_id_scanner_ocr_jobs j
       set status = 'failed',
           lease_expires_at = null,
           worker_id = null,
           last_error_code = 'OCR_LEASE_EXPIRED_MAX_ATTEMPTS',
           updated_at = now()
      from candidates c
      cross join (select count(*) from expired_attempts) expired_barrier
     where j.id = c.id
       and c.prior_status = 'processing'
       and c.prior_attempt >= j.max_attempts
     returning j.scan_id
  ), terminal_uploads as (
    update public.plato_id_scanner_uploads u
       set status = 'failed',
           updated_at = now()
      from terminalized t
     where u.id = t.scan_id
       and u.status in ('uploaded','queued','processing')
     returning u.id
  ), reclaimed as (
    update public.plato_id_scanner_ocr_jobs j
       set status = 'processing',
           attempt = j.attempt + 1,
           worker_id = p_worker_id,
           lease_expires_at = now() + make_interval(secs => p_lease_seconds),
           updated_at = now()
      from candidates c
      cross join (select count(*) from terminal_uploads) terminal_barrier
     where j.id = c.id
       and c.prior_attempt < j.max_attempts
     returning j.*
  ), started_attempts as (
    insert into public.plato_id_scanner_ocr_attempts
      (job_id, scan_id, attempt, outcome, source_sha256, started_at)
    select r.id, r.scan_id, r.attempt, 'processing', r.source_sha256, now()
      from reclaimed r
    returning job_id
  )
  select r.* from reclaimed r;
end;
$$;

-- Accepts exactly the current leased attempt and matching source digest.
-- Late callbacks from prior leases are rejected. The upload remains provisional.
create or replace function public.complete_plato_id_scanner_ocr_job(
  p_job_id uuid,
  p_attempt integer,
  p_worker_id uuid,
  p_source_sha256 text,
  p_result jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_job public.plato_id_scanner_ocr_jobs%rowtype;
begin
  if (select auth.jwt()->>'role') is distinct from 'service_role' then
    raise exception 'service role required';
  end if;
  select * into current_job
    from public.plato_id_scanner_ocr_jobs
   where id = p_job_id
   for update;
  if not found
     or current_job.status <> 'processing'
     or current_job.attempt <> p_attempt
     or current_job.worker_id is distinct from p_worker_id
     or current_job.lease_expires_at <= now()
     or current_job.source_sha256 <> lower(p_source_sha256)
     or jsonb_typeof(p_result) <> 'object'
     or p_result->>'outcome' <> 'succeeded'
     or p_result->>'job_id' <> p_job_id::text
     or p_result->>'scan_id' <> current_job.scan_id::text
     or p_result->>'source_sha256' <> current_job.source_sha256 then
    raise exception 'stale, mismatched or invalid OCR result';
  end if;

  update public.plato_id_scanner_uploads
     set status = 'needs_review',
         ocr_result = p_result,
         updated_at = now()
   where id = current_job.scan_id
     and status in ('uploaded','queued','processing');
  if not found then
    raise exception 'upload is not in a processable state';
  end if;

  update public.plato_id_scanner_ocr_jobs
     set status = 'succeeded', lease_expires_at = null,
         worker_id = null, updated_at = now()
   where id = p_job_id;

  update public.plato_id_scanner_ocr_attempts
     set outcome = 'succeeded',
         engine_name = p_result#>>'{engine,name}',
         engine_version = p_result#>>'{engine,version}',
         result_payload = p_result,
         finished_at = now()
   where job_id = p_job_id and attempt = p_attempt and outcome = 'processing';

  return true;
end;
$$;

create or replace function public.fail_plato_id_scanner_ocr_job(
  p_job_id uuid,
  p_attempt integer,
  p_worker_id uuid,
  p_error_code text,
  p_retryable boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_job public.plato_id_scanner_ocr_jobs%rowtype;
  next_status text;
begin
  if (select auth.jwt()->>'role') is distinct from 'service_role' then
    raise exception 'service role required';
  end if;
  select * into current_job
    from public.plato_id_scanner_ocr_jobs
   where id = p_job_id
   for update;
  if not found
     or current_job.status <> 'processing'
     or current_job.attempt <> p_attempt
     or current_job.worker_id is distinct from p_worker_id
     or current_job.lease_expires_at <= now() then
    raise exception 'stale or mismatched OCR failure callback';
  end if;

  next_status := case
    when p_retryable and current_job.attempt < current_job.max_attempts then 'queued'
    else 'failed'
  end;

  update public.plato_id_scanner_ocr_jobs
     set status = next_status,
         available_at = case when next_status = 'queued'
           then now() + make_interval(secs => least(300, 5 * (2 ^ (attempt - 1))::integer))
           else available_at end,
         last_error_code = left(coalesce(nullif(p_error_code,''),'OCR_FAILED'), 80),
         lease_expires_at = null, worker_id = null, updated_at = now()
   where id = p_job_id;

  update public.plato_id_scanner_ocr_attempts
     set outcome = 'failed',
         error_code = left(coalesce(nullif(p_error_code,''),'OCR_FAILED'), 80),
         finished_at = now()
   where job_id = p_job_id and attempt = p_attempt and outcome = 'processing';

  update public.plato_id_scanner_uploads
     set status = case when next_status = 'queued' then 'queued' else 'failed' end,
         updated_at = now()
   where id = current_job.scan_id and status in ('uploaded','queued','processing');

  return true;
end;
$$;

revoke all on function public.claim_plato_id_scanner_ocr_jobs(uuid,integer,integer) from public, anon, authenticated;
revoke all on function public.complete_plato_id_scanner_ocr_job(uuid,integer,uuid,text,jsonb) from public, anon, authenticated;
revoke all on function public.fail_plato_id_scanner_ocr_job(uuid,integer,uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.claim_plato_id_scanner_ocr_jobs(uuid,integer,integer) to service_role;
grant execute on function public.complete_plato_id_scanner_ocr_job(uuid,integer,uuid,text,jsonb) to service_role;
grant execute on function public.fail_plato_id_scanner_ocr_job(uuid,integer,uuid,text,boolean) to service_role;

-- Deliberately no automatic enqueue trigger: a trusted dispatcher must verify
-- operator approval, upload ownership, object existence and source digest first.

-- Trusted dispatcher enqueue RPC. This remains part of the DRAFT migration.
-- It performs the queue insert and upload-state transition atomically after
-- the dispatcher has authenticated the operator and verified the object bytes.
create or replace function public.enqueue_plato_id_scanner_ocr_job(
  p_scan_id uuid,
  p_source_sha256 text
)
returns public.plato_id_scanner_ocr_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_upload public.plato_id_scanner_uploads%rowtype;
  queued_job public.plato_id_scanner_ocr_jobs%rowtype;
begin
  if (select auth.jwt()->>'role') is distinct from 'service_role' then
    raise exception 'service role required';
  end if;
  if p_scan_id is null or p_source_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid enqueue parameters';
  end if;

  select * into source_upload
    from public.plato_id_scanner_uploads
   where id = p_scan_id
   for update;
  if not found then
    raise exception 'scanner upload not found';
  end if;
  if source_upload.status not in ('uploaded','queued','failed') then
    raise exception 'scanner upload is not eligible for OCR';
  end if;

  insert into public.plato_id_scanner_ocr_jobs(scan_id, source_sha256)
  values (p_scan_id, lower(p_source_sha256))
  on conflict (scan_id) do nothing;

  select * into queued_job
    from public.plato_id_scanner_ocr_jobs
   where scan_id = p_scan_id
   for update;
  if not found or queued_job.source_sha256 <> lower(p_source_sha256) then
    raise exception 'existing OCR job source digest mismatch';
  end if;

  if queued_job.status = 'failed' then
    if queued_job.attempt >= queued_job.max_attempts then
      raise exception 'OCR retry limit has been reached';
    end if;
    update public.plato_id_scanner_ocr_jobs
       set status = 'queued', available_at = now(), last_error_code = null,
           updated_at = now()
     where id = queued_job.id
     returning * into queued_job;
  end if;

  if queued_job.status not in ('queued','processing','succeeded') then
    raise exception 'existing OCR job is not enqueueable';
  end if;

  update public.plato_id_scanner_uploads
     set status = case when queued_job.status = 'succeeded' then 'needs_review' else 'queued' end,
         updated_at = now()
   where id = p_scan_id and status in ('uploaded','failed');

  return queued_job;
end;
$$;

revoke all on function public.enqueue_plato_id_scanner_ocr_job(uuid,text) from public, anon, authenticated;
grant execute on function public.enqueue_plato_id_scanner_ocr_job(uuid,text) to service_role;
