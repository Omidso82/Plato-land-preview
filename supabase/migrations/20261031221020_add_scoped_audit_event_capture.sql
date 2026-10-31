-- Capture operational changes without recording private evidence or profile fields.
-- Audit reads for tournament managers are limited to their assigned tournaments.
drop policy if exists audit_select on public.audit_logs;
create policy audit_select
  on public.audit_logs
  for select
  to authenticated
  using (
    (select private.has_role(array['owner']))
    or (
      (select private.has_role(array['tournament_admin']))
      and details->>'tournament_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and private.can_manage_tournament((details->>'tournament_id')::uuid)
    )
  );

drop policy if exists audit_insert_actor on public.audit_logs;
create policy audit_insert_actor
  on public.audit_logs
  for insert
  to authenticated
  with check (
    actor_id = (select auth.uid())
    and (
      (select private.has_role(array['owner']))
      or (
        (select private.has_role(array['tournament_admin']))
        and details->>'tournament_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and private.can_manage_tournament((details->>'tournament_id')::uuid)
      )
    )
  );

create index if not exists audit_logs_created_at_desc_idx on public.audit_logs(created_at desc);

create or replace function public.capture_audit_event()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
declare
  v_new jsonb;
  v_old jsonb;
  v_row jsonb;
  v_entity_id text;
  v_tournament_id text;
  v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then v_new := to_jsonb(new); v_row := v_new;
  elsif tg_op = 'UPDATE' then v_new := to_jsonb(new); v_old := to_jsonb(old); v_row := v_new;
  else v_old := to_jsonb(old); v_row := v_old;
  end if;
  v_entity_id := coalesce(v_row->>'id', v_row->>'slug');
  if v_entity_id is null and v_row ? 'player_id' then
    v_entity_id := coalesce(v_row->>'tournament_id','') || ':' || coalesce(v_row->>'player_id','');
  end if;
  v_tournament_id := coalesce(v_new->>'tournament_id', v_old->>'tournament_id');
  if tg_table_name = 'tournaments' then v_tournament_id := coalesce(v_new->>'id', v_old->>'id'); end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,details,created_at)
  values(v_actor,lower(tg_op),tg_table_name,v_entity_id,
    jsonb_strip_nulls(jsonb_build_object('tournament_id',v_tournament_id,'status_before',v_old->>'status','status_after',v_new->>'status')),now());
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;
revoke all on function public.capture_audit_event() from public,anon,authenticated;

drop trigger if exists audit_tournaments_changes on public.tournaments;
create trigger audit_tournaments_changes after insert or update or delete on public.tournaments for each row execute function public.capture_audit_event();
drop trigger if exists audit_registrations_changes on public.registrations;
create trigger audit_registrations_changes after insert or update or delete on public.registrations for each row execute function public.capture_audit_event();
drop trigger if exists audit_results_changes on public.tournament_results;
create trigger audit_results_changes after insert or update or delete on public.tournament_results for each row execute function public.capture_audit_event();
drop trigger if exists audit_news_changes on public.site_news;
create trigger audit_news_changes after insert or update or delete on public.site_news for each row execute function public.capture_audit_event();
drop trigger if exists audit_pages_changes on public.site_pages;
create trigger audit_pages_changes after insert or update or delete on public.site_pages for each row execute function public.capture_audit_event();
drop trigger if exists audit_games_changes on public.site_games;
create trigger audit_games_changes after insert or update or delete on public.site_games for each row execute function public.capture_audit_event();
drop trigger if exists audit_maintenance_changes on public.site_maintenance;
create trigger audit_maintenance_changes after insert or update or delete on public.site_maintenance for each row execute function public.capture_audit_event();
