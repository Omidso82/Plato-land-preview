-- Installed main Supabase; idempotent retry after row lock.
CREATE OR REPLACE FUNCTION public.plato_temp_system_archive_verified(p_series_number integer, p_evidence_version text, p_correlation_id uuid DEFAULT gen_random_uuid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_series public.plato_land_league_series%rowtype; v_evidence plato_temp_internal.lifecycle_evidence%rowtype;
v_transition plato_temp_internal.lifecycle_transitions%rowtype; v_expected integer; v_matched integer;
begin
 if coalesce(current_setting('request.jwt.claim.role',true),'')<>'service_role' then
  raise exception 'service role only' using errcode='42501';
 end if;
 if p_correlation_id is null then raise exception 'correlation id required'; end if;
 select * into v_transition from plato_temp_internal.lifecycle_transitions where correlation_id=p_correlation_id;
 if found then
  if v_transition.actor_kind<>'system' or v_transition.from_status<>'completed' or v_transition.to_status<>'archived'
     or v_transition.evidence_version is distinct from p_evidence_version
     or not exists(select 1 from public.plato_land_league_series s where s.id=v_transition.series_id and s.series_number=p_series_number) then
    raise exception 'correlation id belongs to another request' using errcode='23505';
  end if;
  return jsonb_build_object('already_processed',true,'transition_id',v_transition.id);
 end if;
 select * into v_series from public.plato_land_league_series where series_number=p_series_number for update;
 if not found then raise exception 'series not found'; end if;
 if v_series.lifecycle_status<>'completed' then
  select * into v_transition from plato_temp_internal.lifecycle_transitions where correlation_id=p_correlation_id;
  if found and v_transition.actor_kind='system' and v_transition.series_id=v_series.id
    and v_transition.from_status='completed' and v_transition.to_status='archived'
    and v_transition.evidence_version is not distinct from p_evidence_version then
   return jsonb_build_object('already_processed',true,'transition_id',v_transition.id);
  end if;
  return jsonb_build_object('archived',false,'reason','series_not_completed');
 end if;
 select * into v_evidence from plato_temp_internal.lifecycle_evidence
 where series_id=v_series.id and evidence_version=p_evidence_version order by evaluated_at desc limit 1;
 if not found or v_evidence.verdict<>'verified_complete' or v_evidence.approved_by is null
 or jsonb_array_length(v_evidence.source_refs)=0
 or v_evidence.evaluated_at<clock_timestamp()-interval '24 hours'
 or v_evidence.evaluated_at>clock_timestamp()+interval '5 minutes' then
  return jsonb_build_object('archived',false,'reason','missing_unapproved_or_stale_evidence');
 end if;
 if exists(select 1 from plato_temp_internal.lifecycle_archive_holds h where h.series_id=v_series.id and h.released_at is null) then
  return jsonb_build_object('archived',false,'reason','manager_hold');
 end if;
 if p_series_number<>3 then
  return jsonb_build_object('archived',false,'reason','series_specific_final_verifier_not_implemented');
 end if;
 if p_evidence_version is distinct from ('series3:'||plato_temp_internal.series3_source_fingerprint()) then
  return jsonb_build_object('archived',false,'reason','source_fingerprint_changed_or_unverified');
 end if;
 if not exists(select 1 from public.plato_land_series3_public_bracket where event_key='series3') then
  return jsonb_build_object('archived',false,'reason','missing_official_bracket');
 end if;
 if (select count(*) from public.plato_land_series3_group_match_results where event_key='series3')=0
 or exists(select 1 from public.plato_land_series3_group_match_results where event_key='series3'
  and (result_status is null or result_status not in ('completed','double_no_show'))) then
  return jsonb_build_object('archived',false,'reason','group_stage_unresolved');
 end if;
 with b as (select bracket_snapshot from public.plato_land_series3_public_bracket where event_key='series3'),
 expected as (
  select stage, item->>'id' match_id
  from b cross join lateral (values
   ('round32',b.bracket_snapshot->'round32'),('round16',b.bracket_snapshot->'round16'),
   ('quarterfinals',b.bracket_snapshot->'quarterfinals'),('semifinals',b.bracket_snapshot->'semifinals'),
   ('final',b.bracket_snapshot->'final')) stages(stage,arr)
  cross join lateral jsonb_array_elements(stages.arr) item
 )
 select count(*),count(r.id) into v_expected,v_matched from expected e
 left join public.plato_land_series3_knockout_match_results r on r.event_key='series3'
  and r.match_id=e.match_id and r.stage_key=e.stage and r.result_status='completed';
 if v_expected<>31 or v_matched<>v_expected
 or (select count(*) from public.plato_land_series3_knockout_match_results where event_key='series3' and result_status='completed')<>v_expected
 or (select count(*) from public.plato_land_series3_third_place_playoff where event_key='series3' and result_status='completed')<>1 then
  return jsonb_build_object('archived',false,'reason','official_knockout_or_third_place_unresolved');
 end if;
 update public.plato_land_league_series set lifecycle_status='archived' where id=v_series.id;
 insert into plato_temp_internal.lifecycle_transitions
 (series_id,from_status,to_status,actor_kind,actor_id,reason,evidence_version,correlation_id)
 values(v_series.id,'completed','archived','system',null,'Verified final results and completed stages',p_evidence_version,p_correlation_id)
 returning * into v_transition;
 return jsonb_build_object('archived',true,'transition_id',v_transition.id,'series_number',p_series_number);
end $function$
;
revoke all on function public.plato_temp_system_archive_verified(integer,text,uuid) from public,anon,authenticated;
grant execute on function public.plato_temp_system_archive_verified(integer,text,uuid) to service_role;
