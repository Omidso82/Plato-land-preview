-- READ-ONLY extraction from Production PostgreSQL catalog, 2026-11-04.
-- Review dependencies, grants, and search_path before applying to Staging.
-- This file contains function definitions only; it is not a complete bootstrap migration.

-- private.assign_registration_reserve()
CREATE OR REPLACE FUNCTION private.assign_registration_reserve()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare
  v_capacity integer;
  v_open boolean;
  v_status text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_active_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  select capacity, registration_open, status, starts_at, registration_ends_at
    into v_capacity, v_open, v_status, v_starts_at, v_ends_at
  from public.tournaments
  where id = new.tournament_id
  for update;
  if not found then raise exception 'Tournament not found'; end if;
  if v_status <> 'published' or not v_open then raise exception 'Registration is closed'; end if;
  if v_starts_at is not null and v_starts_at <= now() then raise exception 'Tournament has already started'; end if;
  if v_ends_at is not null and v_ends_at <= now() then raise exception 'Registration deadline has passed'; end if;
  if v_capacity is null then
    new.is_reserve := false;
  else
    select count(*)::integer into v_active_count
    from public.registrations
    where tournament_id = new.tournament_id
      and is_reserve = false
      and status in ('pending','registered','approved');
    new.is_reserve := v_active_count >= v_capacity;
  end if;
  return new;
end;
$function$
;

-- private.can_manage_tournament(p_tournament_id uuid)
CREATE OR REPLACE FUNCTION private.can_manage_tournament(p_tournament_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select auth.uid() is not null and (
    private.has_role(array['owner']::text[])
    or exists (
      select 1
      from public.tournament_manager_access a
      where a.tournament_id = p_tournament_id
        and a.user_id = auth.uid()
    )
  );
$function$
;

-- private.can_manage_tournament_section(p_tournament_id uuid, p_permission_key text)
CREATE OR REPLACE FUNCTION private.can_manage_tournament_section(p_tournament_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select auth.uid() is not null
    and p_permission_key = any(array['registrations','groups','schedule','results']::text[])
    and (
      private.has_role(array['owner']::text[])
      or exists (
        select 1 from public.tournament_manager_access a
        where a.tournament_id=p_tournament_id and a.user_id=auth.uid()
          and (
            a.permissions_configured=false
            or exists (
              select 1 from public.tournament_manager_section_permissions p
              where p.tournament_id=a.tournament_id
                and p.user_id=a.user_id
                and p.permission_key=p_permission_key
            )
          )
      )
    );
$function$
;

-- private.has_role(required_roles text[])
CREATE OR REPLACE FUNCTION private.has_role(required_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.user_roles r
    where r.user_id = (select auth.uid())
      and r.role = any(required_roles)
  );
$function$
;

-- private.is_banned(p_plato_id text, p_tournament_id uuid)
CREATE OR REPLACE FUNCTION private.is_banned(p_plato_id text, p_tournament_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.player_bans b
    where lower(b.plato_id) = lower(trim(p_plato_id))
      and b.active = true
      and b.starts_at <= now()
      and (b.ends_at is null or b.ends_at > now())
      and (b.tournament_id is null or b.tournament_id = p_tournament_id)
  );
$function$
;

-- private.is_tournament_public(p_tournament_id uuid)
CREATE OR REPLACE FUNCTION private.is_tournament_public(p_tournament_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.tournaments t
    where t.id = p_tournament_id
      and regexp_replace(
        translate(lower(btrim(coalesce(t.series_name, ''))), 'يىك‌', 'ییک '),
        '\s+', ' ', 'g'
      ) not in ('سری اول', 'series 1', 'series one')
  );
$function$
;

-- public.admin_list_site_users()
CREATE OR REPLACE FUNCTION public.admin_list_site_users()
 RETURNS TABLE(user_id uuid, email text, display_name text, plato_id text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not private.has_role(array['owner']::text[]) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select u.id, u.email::text, p.display_name, p.plato_id, u.created_at, u.last_sign_in_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$function$
;

-- public.capture_audit_event()
CREATE OR REPLACE FUNCTION public.capture_audit_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_new jsonb;
  v_old jsonb;
  v_row jsonb;
  v_entity_id text;
  v_tournament_id text;
  v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_row := v_new;
  elsif tg_op = 'UPDATE' then
    v_new := to_jsonb(new);
    v_old := to_jsonb(old);
    v_row := v_new;
  else
    v_old := to_jsonb(old);
    v_row := v_old;
  end if;

  v_entity_id := coalesce(v_row->>'id', v_row->>'slug');
  if v_entity_id is null and v_row ? 'player_id' then
    v_entity_id := coalesce(v_row->>'tournament_id','') || ':' || coalesce(v_row->>'player_id','');
  end if;
  v_tournament_id := coalesce(v_new->>'tournament_id', v_old->>'tournament_id');
  if tg_table_name = 'tournaments' then
    v_tournament_id := coalesce(v_new->>'id', v_old->>'id');
  end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details, created_at)
  values (
    v_actor,
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    jsonb_strip_nulls(jsonb_build_object(
      'tournament_id', v_tournament_id,
      'status_before', v_old->>'status',
      'status_after', v_new->>'status'
    )),
    now()
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$
;

-- public.capture_site_news_version()
CREATE OR REPLACE FUNCTION public.capture_site_news_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_version integer; v_changed boolean;
begin
 if tg_op='UPDATE' then
  v_changed:=old.title is distinct from new.title or old.summary is distinct from new.summary or old.body is distinct from new.body
   or old.image_url is distinct from new.image_url or old.status is distinct from new.status or old.featured is distinct from new.featured
   or old.featured_starts_at is distinct from new.featured_starts_at or old.featured_ends_at is distinct from new.featured_ends_at
   or old.published_at is distinct from new.published_at or old.publish_at is distinct from new.publish_at or old.expires_at is distinct from new.expires_at;
  if not v_changed then return new; end if;
  select coalesce(max(version_number),0)+1 into v_version from public.site_news_versions where news_id=old.id;
  insert into public.site_news_versions(news_id,version_number,title,summary,body,image_url,status,featured,featured_starts_at,featured_ends_at,published_at,publish_at,expires_at,changed_by)
  values(old.id,v_version,old.title,old.summary,old.body,old.image_url,old.status,old.featured,old.featured_starts_at,old.featured_ends_at,old.published_at,old.publish_at,old.expires_at,auth.uid());
  return new;
 elsif tg_op='DELETE' then
  select coalesce(max(version_number),0)+1 into v_version from public.site_news_versions where news_id=old.id;
  insert into public.site_news_versions(news_id,version_number,title,summary,body,image_url,status,featured,featured_starts_at,featured_ends_at,published_at,publish_at,expires_at,changed_by)
  values(old.id,v_version,old.title,old.summary,old.body,old.image_url,old.status,old.featured,old.featured_starts_at,old.featured_ends_at,old.published_at,old.publish_at,old.expires_at,auth.uid());
  return old;
 end if;
 return new;
end;
$function$
;

-- public.capture_site_page_version()
CREATE OR REPLACE FUNCTION public.capture_site_page_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_slug text; v_version integer; v_changed boolean;
begin
  if tg_op='UPDATE' then
    v_changed := old.title is distinct from new.title
      or old.content is distinct from new.content
      or old.status is distinct from new.status
      or old.published_title is distinct from new.published_title
      or old.published_content is distinct from new.published_content
      or old.published_at is distinct from new.published_at;
    if not v_changed then return new; end if;
    v_slug:=old.slug;
    select coalesce(max(version_number),0)+1 into v_version from public.site_page_versions where slug=v_slug;
    insert into public.site_page_versions(slug,version_number,title,content,status,published_title,published_content,published_at,changed_by)
    values(old.slug,v_version,old.title,old.content,old.status,old.published_title,old.published_content,old.published_at,auth.uid());
    return new;
  elsif tg_op='DELETE' then
    v_slug:=old.slug;
    select coalesce(max(version_number),0)+1 into v_version from public.site_page_versions where slug=v_slug;
    insert into public.site_page_versions(slug,version_number,title,content,status,published_title,published_content,published_at,changed_by)
    values(old.slug,v_version,old.title,old.content,old.status,old.published_title,old.published_content,old.published_at,auth.uid());
    return old;
  end if;
  return new;
end;
$function$
;

-- public.current_user_role()
CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
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
$function$
;

-- public.notify_registration_change()
CREATE OR REPLACE FUNCTION public.notify_registration_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_type text;
  v_title text;
  v_body text;
  v_player uuid;
  v_tournament uuid;
begin
  v_player := new.player_id;
  v_tournament := new.tournament_id;

  if tg_op='INSERT' then
    if coalesce(new.is_reserve,false) then
      v_type := 'reserve_added';
      v_title := 'در فهرست رزرو قرار گرفتی';
      v_body := 'درخواست ثبت‌نامت در فهرست رزرو این مسابقه ثبت شد.';
    elsif new.status='pending' then
      v_type := 'registration_pending';
      v_title := 'درخواست ثبت‌نام دریافت شد';
      v_body := 'درخواست ثبت‌نامت با موفقیت دریافت و برای بررسی ارسال شد.';
    end if;
  elsif tg_op='UPDATE' then
    if old.status is distinct from new.status then
      if new.status='approved' or new.status='registered' then
        v_type := 'registration_approved';
        v_title := 'ثبت‌نامت تأیید شد';
        v_body := 'درخواست ثبت‌نامت در این مسابقه تأیید شده است.';
      elsif new.status='rejected' then
        v_type := 'registration_rejected';
        v_title := 'درخواست ثبت‌نام رد شد';
        v_body := 'درخواست ثبت‌نامت در این مسابقه تأیید نشد. برای جزئیات به حساب کاربری مراجعه کن.';
      elsif new.status='withdrawn' then
        v_type := 'registration_withdrawn';
        v_title := 'ثبت‌نام لغو شد';
        v_body := 'ثبت‌نام این مسابقه لغو شد.';
      end if;
    elsif coalesce(old.is_reserve,false) and not coalesce(new.is_reserve,false) then
      v_type := 'reserve_promoted';
      v_title := 'از فهرست رزرو به شرکت‌کننده منتقل شدی';
      v_body := 'ظرفیت مسابقه برایت آزاد شده و ثبت‌نامت از رزرو خارج شد.';
    end if;
  end if;

  if v_type is not null and v_player is not null then
    insert into public.user_notifications(user_id,tournament_id,notification_type,title,body)
    values(v_player,v_tournament,v_type,v_title,v_body);
  end if;
  return new;
end;
$function$
;

-- public.protect_player_display_name()
CREATE OR REPLACE FUNCTION public.protect_player_display_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if old.id=(select auth.uid())
     and not (select private.has_role(array['owner']))
     and new.display_name is distinct from old.display_name then
    raise exception 'Display name changes require the site owner.' using errcode='42501';
  end if;
  return new;
end;
$function$
;

-- public.remove_tournament_registration(p_registration_id uuid)
CREATE OR REPLACE FUNCTION public.remove_tournament_registration(p_registration_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament_id uuid;
  v_was_reserve boolean;
  v_status text;
  v_storage_path text;
  v_next_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select r.tournament_id, r.is_reserve, r.status
    into v_tournament_id, v_was_reserve, v_status
  from public.registrations r
  where r.id = p_registration_id
  for update;

  if v_tournament_id is null then
    raise exception 'Registration not found' using errcode = 'P0002';
  end if;

  if not private.can_manage_tournament_section(v_tournament_id,'registrations') then
    raise exception 'Not authorized to remove registrations from this tournament' using errcode = '42501';
  end if;

  select e.storage_path into v_storage_path
  from public.registration_evidence e
  where e.registration_id = p_registration_id
  limit 1;

  if not v_was_reserve and v_status in ('pending', 'approved', 'registered') then
    select r.id into v_next_id
    from public.registrations r
    where r.tournament_id = v_tournament_id
      and r.is_reserve = true
      and r.status = 'pending'
      and r.id <> p_registration_id
    order by r.reserve_position nulls last, r.created_at, r.id
    limit 1
    for update;

    if v_next_id is not null then
      update public.registrations
      set is_reserve = false, reserve_position = null
      where id = v_next_id;
    end if;
  end if;

  delete from public.registrations where id = p_registration_id;
  return v_storage_path;
end;
$function$
;

-- public.review_tournament_registration(p_registration_id uuid, p_approved boolean)
CREATE OR REPLACE FUNCTION public.review_tournament_registration(p_registration_id uuid, p_approved boolean)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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

  if not private.can_manage_tournament_section(v_tournament_id,'registrations') then
    raise exception 'Not authorized to review this tournament' using errcode='42501';
  end if;

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
$function$
;

-- public.save_tournament_manager_access(p_tournament_id uuid, p_assignments jsonb)
CREATE OR REPLACE FUNCTION public.save_tournament_manager_access(p_tournament_id uuid, p_assignments jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_assignment jsonb;
  v_user_id_to_assign uuid;
  v_permissions jsonb;
begin
  if v_user_id is null or not private.has_role(array['owner']::text[]) then
    raise exception 'Only the site owner can manage tournament managers' using errcode='42501';
  end if;
  if p_tournament_id is null then
    raise exception 'Tournament is required' using errcode='22023';
  end if;
  if jsonb_typeof(coalesce(p_assignments,'null'::jsonb)) <> 'array' then
    raise exception 'Assignments must be a JSON array' using errcode='22023';
  end if;
  if jsonb_array_length(p_assignments) > 2 then
    raise exception 'At most two managers may be assigned to one tournament' using errcode='22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) a
    where jsonb_typeof(a->'permissions') is distinct from 'array'
       or exists (
         select 1
         from jsonb_array_elements_text(coalesce(a->'permissions','[]'::jsonb)) p(value)
         where p.value <> all(array['registrations','groups','schedule','results']::text[])
       )
  ) then
    raise exception 'One or more section permissions are invalid' using errcode='22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_assignments) a
    group by a->>'user_id'
    having count(*) > 1
  ) then
    raise exception 'Duplicate manager assignment' using errcode='23505';
  end if;

  delete from public.tournament_manager_section_permissions
  where tournament_id=p_tournament_id;

  delete from public.tournament_manager_access a
  where a.tournament_id=p_tournament_id
    and not exists (
      select 1 from jsonb_array_elements(p_assignments) j
      where (j->>'user_id')::uuid=a.user_id
    );

  for v_assignment in select value from jsonb_array_elements(p_assignments) loop
    v_user_id_to_assign := (v_assignment->>'user_id')::uuid;
    v_permissions := coalesce(v_assignment->'permissions','[]'::jsonb);

    insert into public.tournament_manager_access(tournament_id,user_id,granted_by,permissions_configured)
    values(p_tournament_id,v_user_id_to_assign,v_user_id,true)
    on conflict (tournament_id,user_id)
    do update set granted_by=excluded.granted_by, permissions_configured=true;

    insert into public.tournament_manager_section_permissions(tournament_id,user_id,permission_key,granted_by)
    select p_tournament_id,v_user_id_to_assign,p.value,v_user_id
    from jsonb_array_elements_text(v_permissions) p(value);
  end loop;
end;
$function$
;

-- public.submit_tournament_registration(p_tournament_id uuid, p_evidence_path text, p_extracted_data jsonb)
CREATE OR REPLACE FUNCTION public.submit_tournament_registration(p_tournament_id uuid, p_evidence_path text, p_extracted_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_registration_id uuid;
  v_accepted_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_evidence_path is null
     or p_evidence_path !~ ('^' || v_user_id::text || '/' || p_tournament_id::text || '/[^/]+$') then
    raise exception 'Invalid evidence path';
  end if;

  if jsonb_typeof(p_extracted_data) <> 'object' then
    raise exception 'Registration evidence must be a JSON object';
  end if;

  insert into public.registrations (
    tournament_id, player_id, status, rules_accepted_at, evidence_path, registration_type
  ) values (
    p_tournament_id, v_user_id, 'pending', v_accepted_at, p_evidence_path, 'individual'
  )
  returning id into v_registration_id;

  insert into public.registration_evidence (
    registration_id, submitted_by, storage_path, rules_accepted_at, extracted_data, extraction_status
  ) values (
    v_registration_id, v_user_id, p_evidence_path, v_accepted_at, p_extracted_data, 'pending_review'
  );

  return v_registration_id;
end;
$function$
;

-- public.submit_tournament_registration(p_tournament_id uuid, p_evidence_path text, p_extracted_data jsonb, p_display_name text, p_plato_id text, p_rules_text text, p_registration_type text, p_team_name text, p_members jsonb)
CREATE OR REPLACE FUNCTION public.submit_tournament_registration(p_tournament_id uuid, p_evidence_path text, p_extracted_data jsonb, p_display_name text, p_plato_id text, p_rules_text text, p_registration_type text DEFAULT 'individual'::text, p_team_name text DEFAULT NULL::text, p_members jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament public.tournaments%rowtype;
  v_registration_id uuid;
  v_accepted_at timestamptz := now();
  v_is_reserve boolean := false;
  v_reserve_position bigint;
  v_slots_used bigint;
  v_member jsonb;
  v_seen text[] := array[]::text[];
  v_capacity_unit text;
  v_reserve_enabled boolean;
  v_expected_team_size integer;
  v_require_screenshot boolean;
begin
  if v_user_id is null then
    raise exception 'برای ثبت‌نام ابتدا وارد حساب کاربری شو.' using errcode='42501';
  end if;

  if length(btrim(coalesce(p_display_name,''))) not between 1 and 80 then
    raise exception 'نام بازیکن را کامل وارد کن.' using errcode='22023';
  end if;
  if length(btrim(coalesce(p_plato_id,''))) not between 1 and 80
     or btrim(p_plato_id) !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'Plato ID فقط باید با حروف انگلیسی، عدد، خط تیره یا زیرخط وارد شود.' using errcode='22023';
  end if;
  if p_registration_type not in ('individual','team') then
    raise exception 'نوع ثبت‌نام معتبر نیست.' using errcode='22023';
  end if;
  if jsonb_typeof(p_extracted_data) <> 'object'
     or jsonb_typeof(coalesce(p_members,'[]'::jsonb)) <> 'array' then
    raise exception 'اطلاعات ثبت‌نام معتبر نیست.' using errcode='22023';
  end if;

  -- Serialize registrations per tournament without requiring UPDATE privileges on the tournament row.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_tournament_id::text, 0));

  select * into v_tournament
  from public.tournaments
  where id=p_tournament_id;

  if not found or v_tournament.status <> 'published' or not v_tournament.registration_open
     or (v_tournament.registration_starts_at is not null and v_tournament.registration_starts_at > now())
     or (v_tournament.registration_ends_at is not null and v_tournament.registration_ends_at <= now()) then
    raise exception 'ثبت‌نام این مسابقه در حال حاضر باز نیست.' using errcode='22023';
  end if;

  if coalesce(v_tournament.rules,'') = '' or p_rules_text is distinct from v_tournament.rules then
    raise exception 'برای ثبت‌نام باید آخرین نسخهٔ قوانین مسابقه را بپذیری.' using errcode='22023';
  end if;

  v_require_screenshot := coalesce((v_tournament.platform_settings->>'require_profile_screenshot')::boolean, true);
  if v_require_screenshot and p_evidence_path is null then
    raise exception 'بارگذاری تصویر کامل پروفایل Plato برای این مسابقه الزامی است.' using errcode='22023';
  end if;
  if p_evidence_path is not null then
    if p_evidence_path !~ ('^' || v_user_id::text || '/' || p_tournament_id::text || '/[^/]+$') then
      raise exception 'مسیر تصویر ارسالی معتبر نیست.' using errcode='22023';
    end if;
    if not exists (
      select 1 from storage.objects o
      where o.bucket_id='registration-evidence' and o.name=p_evidence_path
    ) then
      raise exception 'فایل تصویر در فضای خصوصی پیدا نشد.' using errcode='22023';
    end if;
  end if;

  if exists (
    select 1 from public.registrations
    where tournament_id=p_tournament_id and player_id=v_user_id
  ) then
    raise exception 'این حساب قبلاً در این مسابقه ثبت‌نام کرده است.' using errcode='23505';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id=v_user_id and lower(btrim(p.plato_id))=lower(btrim(p_plato_id))
  ) then
    raise exception 'Plato ID واردشده باید با Plato ID پروفایل حساب کاربری یکسان باشد.' using errcode='22023';
  end if;

  v_capacity_unit := coalesce(
    v_tournament.platform_settings->>'capacity_unit',
    case when coalesce(v_tournament.platform_settings->>'participation','individual')='team' then 'teams' else 'players' end
  );
  v_reserve_enabled := coalesce((v_tournament.platform_settings->>'reserve_enabled')::boolean,false);
  v_expected_team_size := nullif(v_tournament.platform_settings->>'teamSize','')::integer;

  if p_registration_type='team' then
    if coalesce(v_tournament.platform_settings->>'participation','individual') not in ('team','both') then
      raise exception 'این مسابقه ثبت‌نام تیمی نمی‌پذیرد.' using errcode='22023';
    end if;
    if length(btrim(coalesce(p_team_name,''))) not between 1 and 100 then
      raise exception 'نام تیم الزامی است.' using errcode='22023';
    end if;
    if v_capacity_unit <> 'teams' then
      raise exception 'واحد ظرفیت مسابقهٔ تیمی باید تیم باشد.' using errcode='22023';
    end if;
    if jsonb_array_length(coalesce(p_members,'[]'::jsonb)) < 2
       or (v_expected_team_size is not null and jsonb_array_length(p_members) <> v_expected_team_size) then
      raise exception 'تعداد اعضای تیم با تنظیمات مسابقه مطابقت ندارد.' using errcode='22023';
    end if;
  else
    if coalesce(v_tournament.platform_settings->>'participation','individual')='team' then
      raise exception 'این مسابقه فقط ثبت‌نام تیمی می‌پذیرد.' using errcode='22023';
    end if;
    if v_capacity_unit <> 'players' then
      raise exception 'واحد ظرفیت مسابقهٔ انفرادی باید بازیکن باشد.' using errcode='22023';
    end if;
    if jsonb_array_length(coalesce(p_members,'[]'::jsonb)) > 0 then
      raise exception 'ثبت‌نام انفرادی نباید اعضای تیم داشته باشد.' using errcode='22023';
    end if;
  end if;

  if p_registration_type='team' then
    if not exists (
      select 1 from jsonb_array_elements(p_members) m
      where lower(btrim(m->>'platoId'))=lower(btrim(p_plato_id))
        and btrim(m->>'displayName')=btrim(p_display_name)
    ) then
      raise exception 'فهرست تیم باید شامل سرگروه ثبت‌کننده باشد.' using errcode='22023';
    end if;

    for v_member in select value from jsonb_array_elements(p_members) loop
      if length(btrim(coalesce(v_member->>'displayName',''))) not between 1 and 80 then
        raise exception 'نام تمام اعضای تیم الزامی است.' using errcode='22023';
      end if;
      if length(btrim(coalesce(v_member->>'platoId',''))) not between 1 and 80
         or btrim(v_member->>'platoId') !~ '^[A-Za-z0-9_-]+$' then
        raise exception 'Plato ID تمام اعضای تیم باید فقط با حروف انگلیسی، عدد، خط تیره یا زیرخط وارد شود.' using errcode='22023';
      end if;
      if lower(btrim(v_member->>'platoId')) = any(v_seen) then
        raise exception 'در فهرست اعضای تیم Plato ID تکراری وجود دارد.' using errcode='23505';
      end if;
      v_seen := array_append(v_seen,lower(btrim(v_member->>'platoId')));
    end loop;
  else
    v_seen := array[lower(btrim(p_plato_id))];
  end if;

  if exists (
    select 1 from public.player_bans b
    where b.normalized_plato_id = any(v_seen)
      and b.active is true
      and (b.starts_at is null or b.starts_at <= now())
      and (b.ends_at is null or b.ends_at >= now())
      and (b.tournament_id is null or b.tournament_id=p_tournament_id)
  ) then
    raise exception 'یک یا چند عضو تیم در این مسابقه محروم هستند.' using errcode='42501';
  end if;

  -- Any Plato ID already used in this tournament is permanently blocked from a second entry,
  -- whether it was previously the captain/individual player or a teammate.
  if exists (
    select 1
    from public.registration_members rm
    where rm.tournament_id=p_tournament_id
      and lower(btrim(rm.plato_id))=any(v_seen)
  ) or exists (
    select 1
    from public.registrations r
    where r.tournament_id=p_tournament_id
      and lower(btrim(coalesce(r.plato_id,'')))=any(v_seen)
  ) then
    raise exception 'یک یا چند Plato ID قبلاً در این مسابقه ثبت‌نام کرده‌اند؛ ثبت‌نام دوباره مجاز نیست.' using errcode='23505';
  end if;

  select coalesce(sum(r.slot_count),0) into v_slots_used
  from public.registrations r
  where r.tournament_id=p_tournament_id
    and r.status in ('pending','approved','registered')
    and not r.is_reserve;

  if v_tournament.capacity is not null and v_slots_used >= v_tournament.capacity then
    if not v_reserve_enabled then
      raise exception 'ظرفیت مسابقه تکمیل شده است.' using errcode='22023';
    end if;
    if v_tournament.starts_at is not null and now() >= (
      v_tournament.starts_at::date - make_interval(days => greatest(
        0, coalesce(nullif(v_tournament.platform_settings->>'reserve_close_days_before','')::integer, 1)
      ))
    ) then
      raise exception 'مهلت ثبت‌نام در صف ذخیره به پایان رسیده است.' using errcode='22023';
    end if;
    v_is_reserve := true;
    select coalesce(max(reserve_position),0)+1 into v_reserve_position
    from public.registrations
    where tournament_id=p_tournament_id and is_reserve and status='pending';
  end if;

  insert into public.registrations(
    tournament_id,player_id,status,rules_accepted_at,evidence_path,registration_type,
    is_reserve,display_name,plato_id,team_name,reserve_position,slot_count
  ) values (
    p_tournament_id,v_user_id,'pending',v_accepted_at,p_evidence_path,p_registration_type,
    v_is_reserve,btrim(p_display_name),btrim(p_plato_id),
    case when p_registration_type='team' then btrim(p_team_name) else null end,
    v_reserve_position,1
  ) returning id into v_registration_id;

  if p_registration_type='team' then
    insert into public.registration_members(registration_id,tournament_id,display_name,plato_id,is_captain)
    select v_registration_id,p_tournament_id,btrim(m->>'displayName'),btrim(m->>'platoId'),
      lower(btrim(m->>'platoId'))=lower(btrim(p_plato_id))
    from jsonb_array_elements(p_members) m;
  else
    insert into public.registration_members(registration_id,tournament_id,display_name,plato_id,is_captain)
    values(v_registration_id,p_tournament_id,btrim(p_display_name),btrim(p_plato_id),true);
  end if;

  if p_evidence_path is not null then
    insert into public.registration_evidence(
      registration_id,submitted_by,storage_path,rules_accepted_at,extracted_data,extraction_status
    ) values(
      v_registration_id,v_user_id,p_evidence_path,v_accepted_at,p_extracted_data,'pending_review'
    );
  end if;

  return v_registration_id;
end;
$function$
;

-- public.withdraw_tournament_registration(p_registration_id uuid)
CREATE OR REPLACE FUNCTION public.withdraw_tournament_registration(p_registration_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament_id uuid;
  v_was_reserve boolean;
  v_next_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select r.tournament_id,r.is_reserve into v_tournament_id,v_was_reserve
  from public.registrations r
  where r.id=p_registration_id and r.player_id=v_user_id and r.status in ('pending','approved','registered')
  for update;
  if v_tournament_id is null then raise exception 'Active registration not found' using errcode='P0002'; end if;
  update public.registrations set status='withdrawn' where id=p_registration_id;
  if not v_was_reserve then
    select r.id into v_next_id from public.registrations r
    where r.tournament_id=v_tournament_id and r.is_reserve=true and r.status='pending'
    order by r.reserve_position nulls last,r.created_at,r.id
    limit 1 for update;
    if v_next_id is not null then
      update public.registrations set is_reserve=false,reserve_position=null where id=v_next_id;
    end if;
  end if;
end;
$function$
;
