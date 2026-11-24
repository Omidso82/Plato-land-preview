CREATE OR REPLACE FUNCTION plato_temp_internal.series3_source_fingerprint()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
select md5(jsonb_build_array(
 (select bracket_snapshot from public.plato_land_series3_public_bracket where event_key='series3'),
 (select jsonb_agg(to_jsonb(g) - array['created_at','created_by','updated_at','updated_by'] order by match_id) from public.plato_land_series3_group_match_results g where event_key='series3'),
 (select jsonb_agg(to_jsonb(k) - array['created_at','created_by','updated_at','updated_by'] order by stage_key,match_id) from public.plato_land_series3_knockout_match_results k where event_key='series3'),
 (select jsonb_agg(to_jsonb(p) - array['created_at','created_by','updated_at','updated_by'] order by event_key) from public.plato_land_series3_third_place_playoff p where event_key='series3')
)::text)
$function$
;
revoke all on function plato_temp_internal.series3_source_fingerprint() from public,anon,authenticated;
