-- Owner-only read-only strict source verification.
CREATE OR REPLACE FUNCTION public.plato_temp_owner_series3_completion_preflight()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or public.current_user_role() is distinct from 'owner' then
  raise exception 'owner authorization required' using errcode='42501';
 end if;
 return plato_temp_internal.series3_completion_preflight();
end $function$
;
revoke all on function public.plato_temp_owner_series3_completion_preflight() from public,anon,authenticated;
grant execute on function public.plato_temp_owner_series3_completion_preflight() to authenticated;
