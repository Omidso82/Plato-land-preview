create or replace function public.current_user_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $function$
  select case
    when exists (
      select 1 from public.user_roles ur
      where ur.user_id=(select auth.uid())
        and ur.role in ('owner','مالک کل')
    ) then 'owner'
    when exists (
      select 1 from public.tournament_manager_access a
      where a.user_id=(select auth.uid())
    ) then 'tournament_admin'
    else (
      select ur.role from public.user_roles ur
      where ur.user_id=(select auth.uid())
      limit 1
    )
  end;
$function$;

revoke all on function public.current_user_role() from public,anon;
grant execute on function public.current_user_role() to authenticated,service_role;
