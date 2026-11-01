-- Reduce anonymous access to private owner and user records.
-- Keep the current-user role RPC SECURITY INVOKER; user_roles RLS permits reading only the caller's own role.
create or replace function public.current_user_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $function$
  select ur.role
  from public.user_roles as ur
  where ur.user_id = (select auth.uid())
  limit 1;
$function$;

revoke all on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated, service_role;

-- Remove unnecessary anonymous column grants from tables that contain private owner,
-- registration-evidence, manager-permission, notification, or snapshot data.
do $migration$
declare
  v_table record;
begin
  for v_table in
    select table_name, string_agg(quote_ident(column_name), ', ' order by column_name) as columns
    from information_schema.column_privileges
    where table_schema = 'public'
      and grantee = 'anon'
      and privilege_type = 'SELECT'
      and table_name = any (array[
        'competition_snapshots',
        'owner_admin_tasks',
        'owner_private_notes',
        'registration_evidence',
        'site_news_versions',
        'site_page_versions',
        'tournament_settings',
        'user_admin_permissions',
        'user_notifications'
      ])
    group by table_name
  loop
    execute format(
      'revoke select (%s) on table public.%I from anon',
      v_table.columns,
      v_table.table_name
    );
    execute format('revoke all privileges on table public.%I from anon', v_table.table_name);
  end loop;
end;
$migration$;
