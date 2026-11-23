-- Snapshot of installed primary-database function, 2026-11-23.
-- Do not run as a replacement for a reviewed migration.
CREATE OR REPLACE FUNCTION public.plato_temp_owner_restore_active(p_series_number integer, p_reason text, p_correlation_id uuid DEFAULT gen_random_uuid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid; v_series public.plato_land_league_series%rowtype; v_existing uuid; v_evidence text;
begin
 v_actor:=auth.uid();
 if v_actor is null or public.current_user_role() <> 'owner' then raise exception 'owner authorization required' using errcode='42501'; end if;
 if length(btrim(coalesce(p_reason,'')))<5 then raise exception 'reason must contain at least 5 characters'; end if;
 if p_correlation_id is null then raise exception 'correlation id required'; end if;
 select id into v_existing from plato_temp_internal.lifecycle_transitions where correlation_id=p_correlation_id;
 if found then return jsonb_build_object('already_processed',true,'transition_id',v_existing); end if;
 select * into v_series from public.plato_land_league_series where series_number=p_series_number for update;
 if not found then raise exception 'series not found'; end if;
 if v_series.lifecycle_status<>'archived' then raise exception 'series must be archived to restore'; end if;
 select evidence_version into v_evidence from plato_temp_internal.lifecycle_evidence where series_id=v_series.id order by evaluated_at desc limit 1;
 update public.plato_land_league_series set lifecycle_status='started' where id=v_series.id;
 insert into plato_temp_internal.lifecycle_archive_holds(series_id,evidence_version,reason,created_by)
 values(v_series.id,coalesce(v_evidence,'manual-restore-no-evidence'),p_reason,v_actor)
 on conflict(series_id) do update set evidence_version=excluded.evidence_version,reason=excluded.reason,created_by=excluded.created_by,created_at=clock_timestamp(),released_by=null,released_at=null;
 insert into plato_temp_internal.lifecycle_transitions(series_id,from_status,to_status,actor_kind,actor_id,reason,evidence_version,correlation_id)
 values(v_series.id,'archived','started','manager',v_actor,p_reason,v_evidence,p_correlation_id)
 returning id into v_existing;
 return jsonb_build_object('restored',true,'series_number',p_series_number,'transition_id',v_existing);
end $function$
;
revoke all on function public.plato_temp_owner_restore_active(integer,text,uuid) from public, anon, authenticated;
grant execute on function public.plato_temp_owner_restore_active(integer,text,uuid) to authenticated;
