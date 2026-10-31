create index if not exists registration_members_tournament_plato_id_normalized_idx
  on public.registration_members (tournament_id, lower(btrim(plato_id)));

create or replace function public.submit_tournament_registration(
  p_tournament_id uuid,
  p_evidence_path text,
  p_extracted_data jsonb,
  p_display_name text,
  p_plato_id text,
  p_rules_text text,
  p_registration_type text default 'individual',
  p_team_name text default null,
  p_members jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
set search_path to ''
as $function$
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
  if v_user_id is null then raise exception 'برای ثبت‌نام ابتدا وارد حساب کاربری شو.' using errcode='42501'; end if;
  if length(btrim(coalesce(p_display_name,''))) not between 1 and 80 then raise exception 'نام بازیکن را کامل وارد کن.' using errcode='22023'; end if;
  if length(btrim(coalesce(p_plato_id,''))) not between 1 and 80 or btrim(p_plato_id) !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'Plato ID فقط باید با حروف انگلیسی، عدد، خط تیره یا زیرخط وارد شود.' using errcode='22023';
  end if;
  if p_registration_type not in ('individual','team') then raise exception 'نوع ثبت‌نام معتبر نیست.' using errcode='22023'; end if;
  if jsonb_typeof(p_extracted_data) <> 'object' or jsonb_typeof(coalesce(p_members,'[]'::jsonb)) <> 'array' then
    raise exception 'اطلاعات ثبت‌نام معتبر نیست.' using errcode='22023';
  end if;

  select * into v_tournament from public.tournaments where id=p_tournament_id for update;
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
    if not exists(select 1 from storage.objects o where o.bucket_id='registration-evidence' and o.name=p_evidence_path) then
      raise exception 'فایل تصویر در فضای خصوصی پیدا نشد.' using errcode='22023';
    end if;
  end if;

  if exists(select 1 from public.registrations where tournament_id=p_tournament_id and player_id=v_user_id) then
    raise exception 'این حساب قبلاً در این مسابقه ثبت‌نام کرده است.' using errcode='23505';
  end if;
  if not exists(select 1 from public.profiles p where p.id=v_user_id and lower(btrim(p.plato_id))=lower(btrim(p_plato_id))) then
    raise exception 'Plato ID واردشده باید با Plato ID پروفایل حساب کاربری یکسان باشد.' using errcode='22023';
  end if;

  v_capacity_unit := coalesce(v_tournament.platform_settings->>'capacity_unit',
    case when coalesce(v_tournament.platform_settings->>'participation','individual')='team' then 'teams' else 'players' end);
  v_reserve_enabled := coalesce((v_tournament.platform_settings->>'reserve_enabled')::boolean,false);
  v_expected_team_size := nullif(v_tournament.platform_settings->>'teamSize','')::integer;

  if p_registration_type='team' then
    if coalesce(v_tournament.platform_settings->>'participation','individual') not in ('team','both') then raise exception 'این مسابقه ثبت‌نام تیمی نمی‌پذیرد.' using errcode='22023'; end if;
    if length(btrim(coalesce(p_team_name,''))) not between 1 and 100 then raise exception 'نام تیم الزامی است.' using errcode='22023'; end if;
    if v_capacity_unit <> 'teams' then raise exception 'واحد ظرفیت مسابقهٔ تیمی باید تیم باشد.' using errcode='22023'; end if;
    if jsonb_array_length(coalesce(p_members,'[]'::jsonb)) < 2
       or (v_expected_team_size is not null and jsonb_array_length(p_members) <> v_expected_team_size) then
      raise exception 'تعداد اعضای تیم با تنظیمات مسابقه مطابقت ندارد.' using errcode='22023';
    end if;
  else
    if coalesce(v_tournament.platform_settings->>'participation','individual')='team' then raise exception 'این مسابقه فقط ثبت‌نام تیمی می‌پذیرد.' using errcode='22023'; end if;
    if v_capacity_unit <> 'players' then raise exception 'واحد ظرفیت مسابقهٔ انفرادی باید بازیکن باشد.' using errcode='22023'; end if;
    if jsonb_array_length(coalesce(p_members,'[]'::jsonb)) > 0 then raise exception 'ثبت‌نام انفرادی نباید اعضای تیم داشته باشد.' using errcode='22023'; end if;
  end if;

  if p_registration_type='team' then
    if not exists(select 1 from jsonb_array_elements(p_members) m
      where lower(btrim(m->>'platoId'))=lower(btrim(p_plato_id)) and btrim(m->>'displayName')=btrim(p_display_name)) then
      raise exception 'فهرست تیم باید شامل سرگروه ثبت‌کننده باشد.' using errcode='22023';
    end if;
    for v_member in select value from jsonb_array_elements(p_members) loop
      if length(btrim(coalesce(v_member->>'displayName',''))) not between 1 and 80 then raise exception 'نام تمام اعضای تیم الزامی است.' using errcode='22023'; end if;
      if length(btrim(coalesce(v_member->>'platoId',''))) not between 1 and 80 or btrim(v_member->>'platoId') !~ '^[A-Za-z0-9_-]+$' then
        raise exception 'Plato ID تمام اعضای تیم باید فقط با حروف انگلیسی، عدد، خط تیره یا زیرخط وارد شود.' using errcode='22023';
      end if;
      if lower(btrim(v_member->>'platoId')) = any(v_seen) then raise exception 'در فهرست اعضای تیم Plato ID تکراری وجود دارد.' using errcode='23505'; end if;
      v_seen := array_append(v_seen,lower(btrim(v_member->>'platoId')));
    end loop;
  else
    v_seen := array[lower(btrim(p_plato_id))];
  end if;

  if exists(select 1 from public.player_bans b where b.normalized_plato_id=any(v_seen) and b.active is true
    and (b.starts_at is null or b.starts_at<=now()) and (b.ends_at is null or b.ends_at>=now())
    and (b.tournament_id is null or b.tournament_id=p_tournament_id)) then
    raise exception 'یک یا چند عضو تیم در این مسابقه محروم هستند.' using errcode='42501';
  end if;

  if exists(select 1 from public.registration_members rm where rm.tournament_id=p_tournament_id and lower(btrim(rm.plato_id))=any(v_seen))
    or exists(select 1 from public.registrations r where r.tournament_id=p_tournament_id and lower(btrim(coalesce(r.plato_id,'')))=any(v_seen)) then
    raise exception 'یک یا چند Plato ID قبلاً در این مسابقه ثبت‌نام کرده‌اند؛ ثبت‌نام دوباره مجاز نیست.' using errcode='23505';
  end if;

  select coalesce(sum(r.slot_count),0) into v_slots_used from public.registrations r
  where r.tournament_id=p_tournament_id and r.status in ('pending','approved','registered') and not r.is_reserve;
  if v_tournament.capacity is not null and v_slots_used >= v_tournament.capacity then
    if not v_reserve_enabled then raise exception 'ظرفیت مسابقه تکمیل شده است.' using errcode='22023'; end if;
    if v_tournament.starts_at is not null and now() >= (v_tournament.starts_at::date - make_interval(days => greatest(
      0, coalesce(nullif(v_tournament.platform_settings->>'reserve_close_days_before','')::integer, 1)))) then
      raise exception 'مهلت ثبت‌نام در صف ذخیره به پایان رسیده است.' using errcode='22023';
    end if;
    v_is_reserve := true;
    select coalesce(max(reserve_position),0)+1 into v_reserve_position from public.registrations
    where tournament_id=p_tournament_id and is_reserve and status='pending';
  end if;

  insert into public.registrations(tournament_id,player_id,status,rules_accepted_at,evidence_path,registration_type,
    is_reserve,display_name,plato_id,team_name,reserve_position,slot_count)
  values(p_tournament_id,v_user_id,'pending',v_accepted_at,p_evidence_path,p_registration_type,v_is_reserve,
    btrim(p_display_name),btrim(p_plato_id),case when p_registration_type='team' then btrim(p_team_name) else null end,
    v_reserve_position,1) returning id into v_registration_id;

  if p_registration_type='team' then
    insert into public.registration_members(registration_id,tournament_id,display_name,plato_id,is_captain)
    select v_registration_id,p_tournament_id,btrim(m->>'displayName'),btrim(m->>'platoId'),
      lower(btrim(m->>'platoId'))=lower(btrim(p_plato_id)) from jsonb_array_elements(p_members) m;
  else
    insert into public.registration_members(registration_id,tournament_id,display_name,plato_id,is_captain)
    values(v_registration_id,p_tournament_id,btrim(p_display_name),btrim(p_plato_id),true);
  end if;

  if p_evidence_path is not null then
    insert into public.registration_evidence(registration_id,submitted_by,storage_path,rules_accepted_at,extracted_data,extraction_status)
    values(v_registration_id,v_user_id,p_evidence_path,v_accepted_at,p_extracted_data,'pending_review');
  end if;
  return v_registration_id;
end;
$function$;

revoke execute on function public.submit_tournament_registration(uuid,text,jsonb,text,text,text,text,text,jsonb) from public, anon;
grant execute on function public.submit_tournament_registration(uuid,text,jsonb,text,text,text,text,text,jsonb) to authenticated;
