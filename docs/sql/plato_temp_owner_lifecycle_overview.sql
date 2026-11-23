-- Snapshot of installed primary-database function, 2026-11-23.
-- Do not run as a replacement for a reviewed migration.
CREATE OR REPLACE FUNCTION public.plato_temp_owner_lifecycle_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or public.current_user_role()<>'owner' then raise exception 'owner authorization required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('series_number',s.series_number,'series_name',s.series_name,'lifecycle_status',s.lifecycle_status,'registration_status',s.registration_status,'has_hold',exists(select 1 from plato_temp_internal.lifecycle_archive_holds h where h.series_id=s.id and h.released_at is null)) order by s.series_number) from public.plato_land_league_series s),'[]'::jsonb);
end $function$
;
revoke all on function public.plato_temp_owner_lifecycle_overview() from public, anon, authenticated;
grant execute on function public.plato_temp_owner_lifecycle_overview() to authenticated;
