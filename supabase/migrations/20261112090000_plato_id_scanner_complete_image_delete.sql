-- Permanently remove one Scanner upload and its dependent OCR/review history.
-- The private Storage object is removed through the Storage API by the client first.
create or replace function public.delete_plato_id_scanner_upload(p_scan_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_path text;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if not (
    private.has_role(array['owner']::text[])
    or exists (select 1 from public.plato_id_scanner_access a where a.user_id = v_uid and a.status = 'approved')
  ) then raise exception 'Scanner access is not approved'; end if;

  select u.storage_path into v_path
  from public.plato_id_scanner_uploads u
  where u.id = p_scan_id
  for update;
  if v_path is null then raise exception 'Scanner image not found'; end if;

  delete from public.plato_id_scanner_ocr_attempts where scan_id = p_scan_id;
  delete from public.plato_id_scanner_ocr_jobs where scan_id = p_scan_id;
  delete from public.plato_id_scanner_review_revisions where scan_id = p_scan_id;
  delete from public.plato_id_scanner_uploads where id = p_scan_id;
  return v_path;
end;
$$;

revoke all on function public.delete_plato_id_scanner_upload(uuid) from public, anon;
grant execute on function public.delete_plato_id_scanner_upload(uuid) to authenticated;
