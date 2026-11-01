create or replace function public.review_tournament_registration(
  p_registration_id uuid,
  p_approved boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament_id uuid;
  v_was_reserve boolean;
  v_rows integer;
  v_next_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if p_approved is null then
    raise exception 'Review decision is required' using errcode='22023';
  end if;

  select r.tournament_id, r.is_reserve
    into v_tournament_id, v_was_reserve
  from public.registrations r
  where r.id = p_registration_id and r.status = 'pending'
  for update;

  if v_tournament_id is null then
    raise exception 'Pending registration not found' using errcode='P0002';
  end if;

  if not private.can_manage_tournament(v_tournament_id) then
    raise exception 'Not authorized to review this tournament' using errcode='42501';
  end if;

  -- Evidence is optional when the tournament does not require a profile screenshot.
  -- If evidence exists, mark it reviewed; otherwise continue reviewing the registration.
  update public.registration_evidence
  set reviewer_id = v_user_id,
      reviewed_at = now(),
      extraction_status = 'reviewed'
  where registration_id = p_registration_id;

  update public.registrations
  set status = case when p_approved then 'approved' else 'rejected' end
  where id = p_registration_id and status = 'pending';
  get diagnostics v_rows = row_count;

  if v_rows <> 1 then
    raise exception 'Pending registration changed during review';
  end if;

  if not p_approved and not v_was_reserve then
    select r.id into v_next_id
    from public.registrations r
    where r.tournament_id = v_tournament_id
      and r.is_reserve = true
      and r.status = 'pending'
    order by r.reserve_position nulls last, r.created_at, r.id
    limit 1
    for update;

    if v_next_id is not null then
      update public.registrations
      set is_reserve = false, reserve_position = null
      where id = v_next_id;
    end if;
  end if;
end;
$function$;

revoke all on function public.review_tournament_registration(uuid, boolean) from public;
grant execute on function public.review_tournament_registration(uuid, boolean) to authenticated, service_role;
