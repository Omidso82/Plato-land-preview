-- Snapshot of installed primary-database function, 2026-11-23.
-- Do not run as a replacement for a reviewed migration.
CREATE OR REPLACE FUNCTION public.plato_temp_system_archive_verified(p_series_number integer, p_evidence_version text, p_correlation_id uuid DEFAULT gen_random_uuid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_series public.plato_land_league_series%rowtype; v_evidence plato_temp_internal.lifecycle_evidence%rowtype; v_transition uuid;
begin
 if coalesce(current_setting('request.jwt.claim.role',true),'') <> 'service_role' then
   raise exception 'service role only' using errcode='42501';
 end if;
 if p_correlation_id is null then raise exception 'correlation id required'; end if;
 select id into v_transition from plato_temp_internal.lifecycle_transitions where correlation_id=p_correlation_id;
 if found then return jsonb_build_object('already_processed',true,'transition_id',v_transition); end if;
 select * into v_series from public.plato_land_league_series where series_number=p_series_number for update;
 if not found then raise exception 'series not found'; end if;
 if v_series.lifecycle_status <> 'completed' then
   return jsonb_build_object('archived',false,'reason','series_not_completed');
 end if;
 select * into v_evidence from plato_temp_internal.lifecycle_evidence
 where series_id=v_series.id and evidence_version=p_evidence_version order by evaluated_at desc limit 1;
 if not found or v_evidence.verdict <> 'verified_complete' or v_evidence.approved_by is null
 or jsonb_array_length(v_evidence.source_refs)=0
 or v_evidence.evaluated_at < clock_timestamp()-interval '24 hours'
 or v_evidence.evaluated_at > clock_timestamp()+interval '5 minutes' then
   return jsonb_build_object('archived',false,'reason','missing_unapproved_or_stale_evidence');
 end if;
 if exists(select 1 from plato_temp_internal.lifecycle_archive_holds h
  where h.series_id=v_series.id and h.released_at is null) then
   return jsonb_build_object('archived',false,'reason','manager_hold');
 end if;
 update public.plato_land_league_series set lifecycle_status='archived' where id=v_series.id;
 insert into plato_temp_internal.lifecycle_transitions
 (series_id,from_status,to_status,actor_kind,actor_id,reason,evidence_version,correlation_id)
 values(v_series.id,'completed','archived','system',null,'Verified final results and completed stages',p_evidence_version,p_correlation_id)
 returning id into v_transition;
 return jsonb_build_object('archived',true,'transition_id',v_transition,'series_number',p_series_number);
end $function$
;
revoke all on function public.plato_temp_system_archive_verified(integer,text,uuid) from public, anon, authenticated;
grant execute on function public.plato_temp_system_archive_verified(integer,text,uuid) to service_role;
