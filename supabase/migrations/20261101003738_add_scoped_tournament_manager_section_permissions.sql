alter table public.tournament_manager_access
  add column if not exists permissions_configured boolean not null default false;

alter table public.user_admin_permissions
  add column if not exists tournament_id uuid references public.tournaments(id) on delete cascade;

create unique index if not exists user_admin_permissions_tournament_user_key_uidx
  on public.user_admin_permissions(tournament_id,user_id,permission_key)
  where tournament_id is not null;

create or replace function private.can_manage_tournament_section(
  p_tournament_id uuid,
  p_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and p_permission_key = any(array['registrations','groups','schedule','results']::text[])
    and (
      private.has_role(array['owner']::text[])
      or exists (
        select 1 from public.tournament_manager_access a
        where a.tournament_id = p_tournament_id
          and a.user_id = auth.uid()
          and (
            a.permissions_configured = false
            or exists (
              select 1 from public.user_admin_permissions p
              where p.tournament_id = a.tournament_id
                and p.user_id = a.user_id
                and p.permission_key = p_permission_key
            )
          )
      )
    );
$function$;

revoke all on function private.can_manage_tournament_section(uuid,text) from public,anon;
grant execute on function private.can_manage_tournament_section(uuid,text) to authenticated,service_role;

drop policy if exists registrations_select on public.registrations;
create policy registrations_select on public.registrations for select to authenticated
using (player_id = (select auth.uid()) or private.can_manage_tournament_section(tournament_id,'registrations'));

drop policy if exists registrations_update on public.registrations;
create policy registrations_update on public.registrations for update to authenticated
using (private.can_manage_tournament_section(tournament_id,'registrations'))
with check (private.can_manage_tournament_section(tournament_id,'registrations'));

drop policy if exists registrations_delete on public.registrations;
create policy registrations_delete on public.registrations for delete to authenticated
using ((player_id = (select auth.uid()) and status = 'pending') or private.can_manage_tournament_section(tournament_id,'registrations'));

drop policy if exists registration_members_read_own_or_manager on public.registration_members;
create policy registration_members_read_own_or_manager on public.registration_members for select to authenticated
using (exists (
  select 1 from public.registrations r
  where r.id = registration_members.registration_id
    and (r.player_id = (select auth.uid()) or private.can_manage_tournament_section(r.tournament_id,'registrations'))
));

drop policy if exists registration_evidence_read_own_or_admin on public.registration_evidence;
create policy registration_evidence_read_own_or_admin on public.registration_evidence for select to authenticated
using (submitted_by = (select auth.uid()) or exists (
  select 1 from public.registrations r
  where r.id = registration_evidence.registration_id
    and private.can_manage_tournament_section(r.tournament_id,'registrations')
));

drop policy if exists registration_evidence_admin_review on public.registration_evidence;
create policy registration_evidence_admin_review on public.registration_evidence for update to authenticated
using (exists (select 1 from public.registrations r where r.id = registration_evidence.registration_id and private.can_manage_tournament_section(r.tournament_id,'registrations')))
with check (exists (select 1 from public.registrations r where r.id = registration_evidence.registration_id and private.can_manage_tournament_section(r.tournament_id,'registrations')));

drop policy if exists competition_snapshots_manager_delete on public.competition_snapshots;
create policy competition_snapshots_manager_delete on public.competition_snapshots for delete to authenticated
using (private.can_manage_tournament_section(tournament_id,'groups'));

drop policy if exists competition_snapshots_manager_insert on public.competition_snapshots;
create policy competition_snapshots_manager_insert on public.competition_snapshots for insert to authenticated
with check (private.can_manage_tournament_section(tournament_id,'groups'));

drop policy if exists competition_snapshots_manager_update on public.competition_snapshots;
create policy competition_snapshots_manager_update on public.competition_snapshots for update to authenticated
using (private.can_manage_tournament_section(tournament_id,'groups'))
with check (private.can_manage_tournament_section(tournament_id,'groups'));

drop policy if exists competition_snapshots_manager_or_participant_read on public.competition_snapshots;
create policy competition_snapshots_manager_or_participant_read on public.competition_snapshots for select to authenticated
using (
  private.can_manage_tournament_section(tournament_id,'groups')
  or exists (
    select 1 from public.registrations r
    where r.tournament_id = competition_snapshots.tournament_id
      and r.player_id = (select auth.uid())
      and r.status = any(array['approved','registered']::text[])
      and r.is_reserve = false
  )
);

drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches for select to authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = matches.tournament_id
      and t.status = any(array['published','ongoing','completed','cancelled']::text[])
      and private.is_tournament_public(t.id)
  )
  or private.can_manage_tournament_section(tournament_id,'groups')
  or private.can_manage_tournament_section(tournament_id,'schedule')
  or private.can_manage_tournament_section(tournament_id,'results')
);

drop policy if exists matches_insert on public.matches;
create policy matches_insert on public.matches for insert to authenticated
with check (private.can_manage_tournament_section(tournament_id,'groups') or private.can_manage_tournament_section(tournament_id,'schedule'));

drop policy if exists matches_update on public.matches;
create policy matches_update on public.matches for update to authenticated
using (private.can_manage_tournament_section(tournament_id,'schedule') or private.can_manage_tournament_section(tournament_id,'results'))
with check (private.can_manage_tournament_section(tournament_id,'schedule') or private.can_manage_tournament_section(tournament_id,'results'));

drop policy if exists results_select on public.tournament_results;
create policy results_select on public.tournament_results for select to authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = tournament_results.tournament_id
      and t.status = any(array['published','ongoing','completed','cancelled']::text[])
      and private.is_tournament_public(t.id)
  )
  or private.can_manage_tournament_section(tournament_id,'results')
);

drop policy if exists results_insert on public.tournament_results;
create policy results_insert on public.tournament_results for insert to authenticated
with check (private.can_manage_tournament_section(tournament_id,'results'));

drop policy if exists results_update on public.tournament_results;
create policy results_update on public.tournament_results for update to authenticated
using (private.can_manage_tournament_section(tournament_id,'results'))
with check (private.can_manage_tournament_section(tournament_id,'results'));

drop policy if exists user_notifications_insert_manager on public.user_notifications;
create policy user_notifications_insert_manager on public.user_notifications for insert to authenticated
with check (
  tournament_id is not null
  and (private.can_manage_tournament_section(tournament_id,'schedule') or private.can_manage_tournament_section(tournament_id,'results'))
  and exists (select 1 from public.registrations r where r.player_id = user_notifications.user_id and r.tournament_id = user_notifications.tournament_id)
);

drop policy if exists registration_evidence_read_owner_or_admin on storage.objects;
create policy registration_evidence_read_owner_or_admin on storage.objects for select to authenticated
using (
  bucket_id = 'registration-evidence'
  and exists (
    select 1 from public.registration_evidence e
    left join public.registrations r on r.id = e.registration_id
    where e.storage_path = objects.name
      and (e.submitted_by = (select auth.uid()) or (r.id is not null and private.can_manage_tournament_section(r.tournament_id,'registrations')))
  )
);

drop policy if exists registration_evidence_delete_owner_or_admin on storage.objects;
create policy registration_evidence_delete_owner_or_admin on storage.objects for delete to authenticated
using (
  bucket_id = 'registration-evidence'
  and exists (
    select 1 from public.registration_evidence e
    join public.registrations r on r.id = e.registration_id
    where e.storage_path = objects.name
      and (e.submitted_by = (select auth.uid()) or private.can_manage_tournament_section(r.tournament_id,'registrations'))
  )
);

create or replace function public.review_tournament_registration(p_registration_id uuid,p_approved boolean)
returns void language plpgsql set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament_id uuid;
  v_was_reserve boolean;
  v_rows integer;
  v_next_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_approved is null then raise exception 'Review decision is required' using errcode='22023'; end if;
  select r.tournament_id,r.is_reserve into v_tournament_id,v_was_reserve
  from public.registrations r where r.id=p_registration_id and r.status='pending' for update;
  if v_tournament_id is null then raise exception 'Pending registration not found' using errcode='P0002'; end if;
  if not private.can_manage_tournament_section(v_tournament_id,'registrations') then raise exception 'Not authorized to review this tournament' using errcode='42501'; end if;
  update public.registration_evidence set reviewer_id=v_user_id,reviewed_at=now(),extraction_status='reviewed' where registration_id=p_registration_id;
  update public.registrations set status=case when p_approved then 'approved' else 'rejected' end where id=p_registration_id and status='pending';
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Pending registration changed during review'; end if;
  if not p_approved and not v_was_reserve then
    select r.id into v_next_id from public.registrations r
    where r.tournament_id=v_tournament_id and r.is_reserve=true and r.status='pending'
    order by r.reserve_position nulls last,r.created_at,r.id limit 1 for update;
    if v_next_id is not null then update public.registrations set is_reserve=false,reserve_position=null where id=v_next_id; end if;
  end if;
end;
$function$;

create or replace function public.remove_tournament_registration(p_registration_id uuid)
returns text language plpgsql set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament_id uuid;
  v_was_reserve boolean;
  v_status text;
  v_storage_path text;
  v_next_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select r.tournament_id,r.is_reserve,r.status into v_tournament_id,v_was_reserve,v_status
  from public.registrations r where r.id=p_registration_id for update;
  if v_tournament_id is null then raise exception 'Registration not found' using errcode='P0002'; end if;
  if not private.can_manage_tournament_section(v_tournament_id,'registrations') then raise exception 'Not authorized to remove registrations from this tournament' using errcode='42501'; end if;
  select e.storage_path into v_storage_path from public.registration_evidence e where e.registration_id=p_registration_id limit 1;
  if not v_was_reserve and v_status in ('pending','approved','registered') then
    select r.id into v_next_id from public.registrations r
    where r.tournament_id=v_tournament_id and r.is_reserve=true and r.status='pending' and r.id<>p_registration_id
    order by r.reserve_position nulls last,r.created_at,r.id limit 1 for update;
    if v_next_id is not null then update public.registrations set is_reserve=false,reserve_position=null where id=v_next_id; end if;
  end if;
  delete from public.registrations where id=p_registration_id;
  return v_storage_path;
end;
$function$;
