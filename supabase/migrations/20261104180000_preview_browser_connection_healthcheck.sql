-- Minimal, read-only health check used only by the isolated Cloudflare Preview.
-- It exposes no user, tournament, profile, or operational data.
create or replace function public.preview_connection_check()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object(
    'status', 'ok',
    'environment', 'staging',
    'checked_at', pg_catalog.clock_timestamp()
  );
$function$;

revoke all on function public.preview_connection_check() from public;
grant execute on function public.preview_connection_check() to anon, authenticated;
