-- Enforce the approved rule that Series 1 remains private until the owner releases it.
-- This migration changes policies only; no tournament, registration, result or profile rows are modified.
create or replace function private.is_tournament_public(p_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.tournaments t
    where t.id = p_tournament_id
      and regexp_replace(
        translate(lower(btrim(coalesce(t.series_name, ''))), 'يىك‌', 'ییک '),
        '\s+', ' ', 'g'
      ) not in ('سری اول', 'series 1', 'series one')
  );
$function$;

revoke all on function private.is_tournament_public(uuid) from public, anon, authenticated;
grant execute on function private.is_tournament_public(uuid) to anon, authenticated;

drop policy if exists tournaments_public_visible_lifecycle_select on public.tournaments;
create policy tournaments_public_visible_lifecycle_select
on public.tournaments for select to anon
using (
  status = any (array['published','ongoing','completed','cancelled']::text[])
  and private.is_tournament_public(id)
);

drop policy if exists tournaments_select on public.tournaments;
create policy tournaments_select
on public.tournaments for select to authenticated
using (
  (
    status = any (array['published','ongoing','completed','cancelled']::text[])
    and private.is_tournament_public(id)
  )
  or private.can_manage_tournament(id)
);

drop policy if exists registrations_public_approved_read on public.registrations;
create policy registrations_public_approved_read
on public.registrations for select to anon
using (
  status = any (array['approved','registered']::text[])
  and coalesce(is_reserve, false) = false
  and private.is_tournament_public(tournament_id)
);

drop policy if exists registration_members_public_approved_read on public.registration_members;
create policy registration_members_public_approved_read
on public.registration_members for select to anon
using (
  exists (
    select 1 from public.registrations r
    where r.id = registration_members.registration_id
      and r.tournament_id = registration_members.tournament_id
      and r.status = any (array['approved','registered']::text[])
      and coalesce(r.is_reserve, false) = false
      and private.is_tournament_public(r.tournament_id)
  )
);

drop policy if exists results_public_completed_read on public.tournament_results;
create policy results_public_completed_read
on public.tournament_results for select to anon
using (
  exists (
    select 1 from public.tournaments t
    where t.id = tournament_results.tournament_id
      and t.status = 'completed'
      and t.completed_at is not null
      and private.is_tournament_public(t.id)
  )
);

drop policy if exists results_authenticated_completed_read on public.tournament_results;
create policy results_authenticated_completed_read
on public.tournament_results for select to authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = tournament_results.tournament_id
      and t.status = 'completed'
      and t.completed_at is not null
      and private.is_tournament_public(t.id)
  )
);

drop policy if exists results_select on public.tournament_results;
create policy results_select
on public.tournament_results for select to authenticated
using (
  (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_results.tournament_id
        and t.status = any (array['published','ongoing','completed','cancelled']::text[])
        and private.is_tournament_public(t.id)
    )
  )
  or private.can_manage_tournament(tournament_id)
);

drop policy if exists matches_select on public.matches;
create policy matches_select
on public.matches for select to authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = matches.tournament_id
      and t.status = any (array['published','ongoing','completed','cancelled']::text[])
      and private.is_tournament_public(t.id)
  )
  or private.can_manage_tournament(tournament_id)
);

drop policy if exists matches_insert on public.matches;
create policy matches_insert
on public.matches for insert to authenticated
with check (private.can_manage_tournament(tournament_id));

drop policy if exists matches_update on public.matches;
create policy matches_update
on public.matches for update to authenticated
using (private.can_manage_tournament(tournament_id))
with check (private.can_manage_tournament(tournament_id));

drop policy if exists results_insert on public.tournament_results;
create policy results_insert
on public.tournament_results for insert to authenticated
with check (private.can_manage_tournament(tournament_id));

drop policy if exists results_update on public.tournament_results;
create policy results_update
on public.tournament_results for update to authenticated
using (private.can_manage_tournament(tournament_id))
with check (private.can_manage_tournament(tournament_id));

drop policy if exists profiles_public_completed_results_read on public.profiles;
create policy profiles_public_completed_results_read
on public.profiles for select to anon
using (
  exists (
    select 1
    from public.tournament_results r
    join public.tournaments t on t.id = r.tournament_id
    where r.player_id = profiles.id
      and t.status = 'completed'
      and t.completed_at is not null
      and private.is_tournament_public(t.id)
  )
);

drop policy if exists profiles_authenticated_completed_results_read on public.profiles;
create policy profiles_authenticated_completed_results_read
on public.profiles for select to authenticated
using (
  exists (
    select 1
    from public.tournament_results r
    join public.tournaments t on t.id = r.tournament_id
    where r.player_id = profiles.id
      and t.status = 'completed'
      and t.completed_at is not null
      and private.is_tournament_public(t.id)
  )
);

create or replace view public.recent_tournament_champions
with (security_invoker = true, security_barrier = true)
as
with candidates as (
  select
    t.id as tournament_id,
    t.title as tournament_title,
    t.game_type,
    t.series_name,
    coalesce(t.prize_details ->> 'text', t.prize_details ->> 'display', '') as prize_text,
    t.completed_at,
    p.display_name,
    p.plato_id,
    p.public_avatar_path,
    count(*) over (partition by t.id) as champion_rows
  from public.tournaments t
  join public.tournament_results r on r.tournament_id = t.id and r.placement = 1
  join public.profiles p on p.id = r.player_id
  where t.status = 'completed'
    and t.completed_at is not null
    and private.is_tournament_public(t.id)
)
select
  tournament_id,
  tournament_title,
  game_type,
  series_name,
  prize_text,
  completed_at,
  display_name,
  plato_id,
  public_avatar_path
from candidates
where champion_rows = 1
order by completed_at desc
limit 3;
