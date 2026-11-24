-- Applied on primary Supabase. Explicit owner approval only, no status change.
CREATE OR REPLACE FUNCTION public.plato_temp_owner_approve_series3_final(p_confirm text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid; v_series public.plato_land_league_series%rowtype; v_preflight jsonb; v_version text; v_id uuid;
begin
 v_actor:=auth.uid();
 if v_actor is null or public.current_user_role() is distinct from 'owner' then
  raise exception 'owner authorization required' using errcode='42501';
 end if;
 if p_confirm is distinct from 'APPROVE_SERIES3_FINAL_RESULTS' then
  raise exception 'explicit final-results approval confirmation required' using errcode='22023';
 end if;
 select * into v_series from public.plato_land_league_series where series_number=3 for update;
 if not found then raise exception 'Series 3 not found'; end if;
 if v_series.lifecycle_status<>'completed' then
  return jsonb_build_object('approved',false,'reason','series_not_marked_completed');
 end if;
 v_preflight:=plato_temp_internal.series3_completion_preflight();
 if coalesce((v_preflight->>'ready_for_approval')::boolean,false) is not true then
  return jsonb_build_object('approved',false,'reason','official_results_not_ready','preflight',v_preflight);
 end if;
 if exists(select 1 from plato_temp_internal.lifecycle_archive_holds where series_id=v_series.id and released_at is null) then
  return jsonb_build_object('approved',false,'reason','manager_archive_hold_active');
 end if;
 v_version:=v_preflight->>'source_fingerprint';
 if v_version is null or v_version not like 'series3:%' then
  raise exception 'source fingerprint missing';
 end if;
 insert into plato_temp_internal.lifecycle_evidence(series_id,evidence_version,verdict,source_refs,approved_by,evaluated_at)
 values(v_series.id,v_version,'verified_complete',
  jsonb_build_array('public.plato_land_series3_public_bracket:series3',
   'public.plato_land_series3_group_match_results:series3',
   'public.plato_land_series3_knockout_match_results:series3',
   'public.plato_land_series3_third_place_playoff:series3'),
  v_actor,clock_timestamp())
 on conflict(series_id,evidence_version) do update
 set verdict='verified_complete',source_refs=excluded.source_refs,approved_by=excluded.approved_by,evaluated_at=excluded.evaluated_at
 returning id into v_id;
 return jsonb_build_object('approved',true,'series_number',3,'evidence_id',v_id,'evidence_version',v_version);
end $function$
;
revoke all on function public.plato_temp_owner_approve_series3_final(text) from public,anon,authenticated;
grant execute on function public.plato_temp_owner_approve_series3_final(text) to authenticated;
