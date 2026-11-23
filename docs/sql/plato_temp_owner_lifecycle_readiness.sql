-- Snapshot of installed primary-database function, 2026-11-23.
-- Do not run as a replacement for a reviewed migration.
CREATE OR REPLACE FUNCTION public.plato_temp_owner_lifecycle_readiness()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_data jsonb;
begin
 if auth.uid() is null or public.current_user_role()<>'owner' then
  raise exception 'owner authorization required' using errcode='42501';
 end if;
 select jsonb_build_array(
  jsonb_build_object(
   'series_number',3,
   'group_total',(select count(*) from public.plato_land_series3_group_match_results),
   'group_pending',(select count(*) from public.plato_land_series3_group_match_results where result_status not in ('completed','double_no_show') or result_status is null),
   'knockout_result_count',(select count(*) from public.plato_land_series3_knockout_match_results),
   'third_place_result_count',(select count(*) from public.plato_land_series3_third_place_playoff),
   'ready_for_archive',false,
   'reason','Final and knockout verification plus owner approval are required'
  ),
  jsonb_build_object(
   'series_number',4,
   'group_total',(select count(*) from public.plato_land_series4_group_match_results),
   'group_pending',(select count(*) from public.plato_land_series4_group_match_results where result_status not in ('completed','double_no_show') or result_status is null),
   'knockout_result_count',(select count(*) from public.plato_land_series4_knockout_scores),
   'third_place_result_count',0,
   'ready_for_archive',false,
   'reason','No automatic completion inferred from partial scores'
  )
 ) into v_data;
 return v_data;
end $function$
;
revoke all on function public.plato_temp_owner_lifecycle_readiness() from public, anon, authenticated;
grant execute on function public.plato_temp_owner_lifecycle_readiness() to authenticated;
