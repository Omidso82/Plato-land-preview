-- Installed main Supabase; source-derived fingerprint invalidates stale evidence.
CREATE OR REPLACE FUNCTION plato_temp_internal.series3_source_fingerprint()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
select md5(
 coalesce((select bracket_snapshot::text from public.plato_land_series3_public_bracket where event_key='series3'),'missing-bracket') || '|' ||
 coalesce((select jsonb_agg(jsonb_build_array(match_id,result_status,score_a,score_b) order by match_id)::text
 from public.plato_land_series3_group_match_results where event_key='series3'),'[]') || '|' ||
 coalesce((select jsonb_agg(jsonb_build_array(stage_key,match_id,result_status,score_a,score_b) order by stage_key,match_id)::text
 from public.plato_land_series3_knockout_match_results where event_key='series3'),'[]') || '|' ||
 coalesce((select jsonb_agg(jsonb_build_array(result_status,score_a,score_b) order by event_key)::text
 from public.plato_land_series3_third_place_playoff where event_key='series3'),'[]')
)
$function$
;
revoke all on function plato_temp_internal.series3_source_fingerprint() from public,anon,authenticated;
