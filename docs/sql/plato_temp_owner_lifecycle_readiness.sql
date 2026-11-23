-- Snapshot of installed primary database function, 2026-11-23.
CREATE OR REPLACE FUNCTION public.plato_temp_owner_lifecycle_readiness()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_series3_expected integer; v_series3_bracket boolean;
begin
 if auth.uid() is null or public.current_user_role()<>'owner' then
  raise exception 'owner authorization required' using errcode='42501';
 end if;
 select coalesce(
  jsonb_array_length(bracket_snapshot->'round32')+
  jsonb_array_length(bracket_snapshot->'round16')+
  jsonb_array_length(bracket_snapshot->'quarterfinals')+
  jsonb_array_length(bracket_snapshot->'semifinals')+
  jsonb_array_length(bracket_snapshot->'final'),0)
 into v_series3_expected
 from public.plato_land_series3_public_bracket where event_key='series3';
 v_series3_bracket:=found;
 return jsonb_build_array(
  jsonb_build_object(
   'series_number',3,
   'group_total',(select count(*) from public.plato_land_series3_group_match_results where event_key='series3'),
   'group_pending',(select count(*) from public.plato_land_series3_group_match_results where event_key='series3' and (result_status not in ('completed','double_no_show') or result_status is null)),
   'knockout_draw_exists',v_series3_bracket,
   'knockout_expected',coalesce(v_series3_expected,0),
   'knockout_result_count',(select count(*) from public.plato_land_series3_knockout_match_results where event_key='series3' and result_status='completed'),
   'third_place_result_count',(select count(*) from public.plato_land_series3_third_place_playoff where event_key='series3' and result_status='completed'),
   'ready_for_archive',false,
   'reason','Independent final verification and explicit owner approval required'
  ),
  jsonb_build_object(
   'series_number',4,
   'group_total',(select count(*) from public.plato_land_series4_group_match_results),
   'group_pending',(select count(*) from public.plato_land_series4_group_match_results where result_status not in ('completed','double_no_show') or result_status is null),
   'knockout_draw_exists',exists(select 1 from public.plato_land_series4_knockout_draw),
   'knockout_expected',null,
   'knockout_result_count',(select count(*) from public.plato_land_series4_knockout_scores where score_a is not null and score_b is not null),
   'third_place_result_count',null,
   'ready_for_archive',false,
   'reason','Independent final verification and explicit owner approval required'
  )
 );
end $function$
;
revoke all on function public.plato_temp_owner_lifecycle_readiness() from public, anon, authenticated;
grant execute on function public.plato_temp_owner_lifecycle_readiness() to authenticated;
