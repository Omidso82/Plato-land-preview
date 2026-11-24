CREATE OR REPLACE FUNCTION plato_temp_internal.series3_completion_preflight()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_bracket jsonb; v_expected integer; v_distinct integer; v_matched integer; v_extra integer;
v_group_total integer; v_group_pending integer; v_third integer; v_bad_ids integer;
begin
 select bracket_snapshot into v_bracket from public.plato_land_series3_public_bracket where event_key='series3';
 select count(*),count(*) filter(where result_status is null or result_status not in ('completed','double_no_show') or (result_status='double_no_show' and (score_a is not null or score_b is not null)) or (result_status='completed' and (score_a is null or score_b is null or score_a<0 or score_b<0 or score_a=score_b)))
 into v_group_total,v_group_pending from public.plato_land_series3_group_match_results where event_key='series3';
 if v_bracket is null then
  return jsonb_build_object('series_number',3,'ready_for_approval',false,'reason','missing_official_bracket',
   'group_total',v_group_total,'group_pending',v_group_pending,'expected_knockout',0,'matched_knockout',0);
 end if;
 if exists(select 1 from (values ('round32',16),('round16',8),('quarterfinals',4),('semifinals',2),('final',1),('thirdPlace',1)) stages(k,n)
  where jsonb_typeof(v_bracket->k) is distinct from 'array' or jsonb_array_length(v_bracket->k)<>n) then
  return jsonb_build_object('series_number',3,'ready_for_approval',false,'reason','bracket_shape_mismatch',
   'group_total',v_group_total,'group_pending',v_group_pending,'expected_knockout',31,'matched_knockout',0);
 end if;
 with expected as (
  select stage,item->>'id' match_id
  from (values ('round32',v_bracket->'round32'),('round16',v_bracket->'round16'),
   ('quarterfinals',v_bracket->'quarterfinals'),('semifinals',v_bracket->'semifinals'),
   ('final',v_bracket->'final')) stages(stage,arr)
  cross join lateral jsonb_array_elements(arr) item
 ), matched as (
  select e.stage,e.match_id,r.id,r.result_status,r.score_a,r.score_b
  from expected e left join public.plato_land_series3_knockout_match_results r
  on r.event_key='series3' and r.stage_key=e.stage and r.match_id=e.match_id
 )
 select count(*),count(distinct match_id),count(id) filter(where result_status='completed' and score_a is not null and score_b is not null and score_a<>score_b and score_a>=0 and score_b>=0),
 count(*) filter(where match_id is null or length(btrim(match_id))=0)
 into v_expected,v_distinct,v_matched,v_bad_ids from matched;
 with expected as (
  select stage,item->>'id' match_id from
   (values ('round32',v_bracket->'round32'),('round16',v_bracket->'round16'),
    ('quarterfinals',v_bracket->'quarterfinals'),('semifinals',v_bracket->'semifinals'),
    ('final',v_bracket->'final')) stages(stage,arr)
   cross join lateral jsonb_array_elements(arr) item
 )
 select count(*) into v_extra from public.plato_land_series3_knockout_match_results r
 where r.event_key='series3' and not exists(select 1 from expected e where e.stage=r.stage_key and e.match_id=r.match_id) and not (r.stage_key='thirdPlace' and r.match_id=v_bracket->'thirdPlace'->0->>'id');
 select count(*) into v_third from public.plato_land_series3_knockout_match_results
 where event_key='series3' and stage_key='thirdPlace' and match_id=v_bracket->'thirdPlace'->0->>'id' and result_status='completed' and score_a is not null and score_b is not null and score_a<>score_b and score_a>=0 and score_b>=0;
 return jsonb_build_object(
  'series_number',3,'group_total',v_group_total,'group_pending',v_group_pending,
  'expected_knockout',v_expected,'distinct_match_ids',v_distinct,'matched_knockout',v_matched,
  'extra_results',v_extra,'invalid_match_ids',v_bad_ids,'third_place_completed',v_third,
  'source_fingerprint','series3:'||plato_temp_internal.series3_source_fingerprint(),
  'ready_for_approval',v_group_total=72 and v_group_pending=0 and v_expected=31
    and v_distinct=31 and v_bad_ids=0 and v_matched=31 and v_extra=0 and v_third=1
    and (select count(*) from public.plato_land_series3_knockout_match_results where event_key='series3' and stage_key='thirdPlace')=1,
  'reason',case when v_matched<31 then 'knockout_results_incomplete' when v_third<>1 then 'third_place_unresolved'
    when v_extra>0 or v_bad_ids>0 or v_distinct<>31 then 'bracket_result_mismatch'
    when v_group_pending>0 then 'group_stage_unresolved' else 'verify_final_approval' end);
end $function$
;
revoke all on function plato_temp_internal.series3_completion_preflight() from public,anon,authenticated;
