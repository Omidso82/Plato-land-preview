-- PLATO ID Scanner foundation; draft only, NOT applied to production.
create table if not exists public.plato_id_scanner_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','disabled')),
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id)
);
create table if not exists public.plato_id_scanner_uploads (
 id uuid primary key default gen_random_uuid(),
 operator_id uuid not null references auth.users(id) on delete cascade,
 storage_path text not null unique,
 file_name text not null,
 content_type text not null check(content_type in ('image/jpeg','image/png','image/webp')),
 file_size bigint not null check(file_size>0 and file_size<=15728640),
 status text not null default 'uploaded' check(status in ('uploaded','queued','processing','needs_review','completed','failed')),
 ocr_result jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists plato_id_scanner_access_status_requested_idx on public.plato_id_scanner_access(status,requested_at desc);
create index if not exists plato_id_scanner_uploads_operator_created_idx on public.plato_id_scanner_uploads(operator_id,created_at desc);
alter table public.plato_id_scanner_access enable row level security;
alter table public.plato_id_scanner_uploads enable row level security;
-- Start from an explicit deny baseline; then grant only the operations
-- required by the Scanner UI. RLS policies remain an additional row-level gate.
revoke all on public.plato_id_scanner_access from anon, authenticated;
revoke all on public.plato_id_scanner_uploads from anon, authenticated;
grant select,insert,update on public.plato_id_scanner_access to authenticated;
grant select,insert on public.plato_id_scanner_uploads to authenticated;
create policy scanner_access_read_self_or_owner on public.plato_id_scanner_access for select to authenticated using(user_id=(select auth.uid()) or (select private.has_role(array['owner']::text[])));
create policy scanner_access_insert_self_pending on public.plato_id_scanner_access for insert to authenticated with check(user_id=(select auth.uid()) and status='pending' and reviewed_by is null and reviewed_at is null and email=(select auth.jwt()->>'email'));
create policy scanner_access_owner_update on public.plato_id_scanner_access for update to authenticated using((select private.has_role(array['owner']::text[]))) with check((select private.has_role(array['owner']::text[])));
create policy scanner_uploads_read_owner_or_approved_self on public.plato_id_scanner_uploads for select to authenticated using((select private.has_role(array['owner']::text[])) or (operator_id=(select auth.uid()) and exists(select 1 from public.plato_id_scanner_access a where a.user_id=(select auth.uid()) and a.status='approved')));
create policy scanner_uploads_insert_approved_self_or_owner on public.plato_id_scanner_uploads for insert to authenticated with check(operator_id=(select auth.uid()) and storage_path like ((select auth.uid())::text || '/%') and status='uploaded' and ocr_result='{}'::jsonb and ((select private.has_role(array['owner']::text[])) or exists(select 1 from public.plato_id_scanner_access a where a.user_id=(select auth.uid()) and a.status='approved')));

-- Create the private bucket if absent. Never silently accept a pre-existing bucket
-- whose security or upload constraints differ from the Scanner contract.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('plato-id-scans','plato-id-scans',false,15728640,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

do $$
declare
  scanner_bucket record;
begin
  select id, name, public, file_size_limit, allowed_mime_types
    into scanner_bucket
    from storage.buckets
   where id = 'plato-id-scans';

  if not found then
    raise exception 'PLATO ID Scanner bucket was not created; stop migration and inspect Storage configuration.';
  end if;

  if scanner_bucket.name is distinct from 'plato-id-scans'
     or scanner_bucket.public is distinct from false
     or scanner_bucket.file_size_limit is distinct from 15728640
     or scanner_bucket.allowed_mime_types is distinct from array['image/jpeg','image/png','image/webp']::text[] then
    raise exception 'Existing plato-id-scans bucket does not match the required private 15 MiB JPG/PNG/WEBP contract. Reconcile it through Supabase Storage before retrying; no automatic overwrite was attempted.';
  end if;
end
$$;

create policy scanner_storage_read_owner_or_self on storage.objects for select to authenticated using(bucket_id='plato-id-scans' and ((select private.has_role(array['owner']::text[])) or ((storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.plato_id_scanner_access a where a.user_id=(select auth.uid()) and a.status='approved'))));
create policy scanner_storage_insert_approved_self_or_owner on storage.objects for insert to authenticated with check(bucket_id='plato-id-scans' and (storage.foldername(name))[1]=(select auth.uid())::text and ((select private.has_role(array['owner']::text[])) or exists(select 1 from public.plato_id_scanner_access a where a.user_id=(select auth.uid()) and a.status='approved')));
-- Operator correction/deletion intentionally excluded until audited backend RPCs are implemented.

-- Allow an approved operator to clean up an orphaned object if the upload-row insert fails.
-- Existing objects referenced by an upload row remain non-deletable by operators; owner retains full cleanup access.
create policy scanner_storage_delete_orphan_self_or_owner on storage.objects for delete to authenticated using(
 bucket_id='plato-id-scans' and (
  (select private.has_role(array['owner']::text[])) or (
   (storage.foldername(name))[1]=(select auth.uid())::text
   and exists(select 1 from public.plato_id_scanner_access a where a.user_id=(select auth.uid()) and a.status='approved')
   and not exists(select 1 from public.plato_id_scanner_uploads u where u.storage_path=name and u.operator_id=(select auth.uid()))
  )
 )
);
