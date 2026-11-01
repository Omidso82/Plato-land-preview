-- Persistent player notifications for registration decisions and reserve changes.
create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete set null,
  notification_type text not null check (notification_type in ('registration_pending','registration_approved','registration_rejected','reserve_added','reserve_promoted','registration_withdrawn')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index user_notifications_unread_idx on public.user_notifications(user_id,created_at desc) where read_at is null;
create index user_notifications_user_created_idx on public.user_notifications(user_id,created_at desc);
alter table public.user_notifications enable row level security;
create policy user_notifications_select_own on public.user_notifications for select to authenticated using (user_id=(select auth.uid()));
create policy user_notifications_update_own on public.user_notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy user_notifications_insert_self_or_manager on public.user_notifications for insert to authenticated with check (
  user_id=(select auth.uid())
  or (
    tournament_id is not null and private.can_manage_tournament(tournament_id)
    and exists (select 1 from public.registrations r where r.player_id=user_notifications.user_id and r.tournament_id=user_notifications.tournament_id)
  )
);
create or replace function public.notify_registration_change()
returns trigger language plpgsql security invoker set search_path=''
as $function$
declare v_type text; v_title text; v_body text; v_player uuid; v_tournament uuid;
begin
  v_player:=new.player_id; v_tournament:=new.tournament_id;
  if tg_op='INSERT' then
    if coalesce(new.is_reserve,false) then
      v_type:='reserve_added';v_title:='در فهرست رزرو قرار گرفتی';v_body:='درخواست ثبت‌نامت در فهرست رزرو این مسابقه ثبت شد.';
    elsif new.status='pending' then
      v_type:='registration_pending';v_title:='درخواست ثبت‌نام دریافت شد';v_body:='درخواست ثبت‌نامت با موفقیت دریافت و برای بررسی ارسال شد.';
    end if;
  elsif tg_op='UPDATE' then
    if old.status is distinct from new.status then
      if new.status in ('approved','registered') then
        v_type:='registration_approved';v_title:='ثبت‌نامت تأیید شد';v_body:='درخواست ثبت‌نامت در این مسابقه تأیید شده است.';
      elsif new.status='rejected' then
        v_type:='registration_rejected';v_title:='درخواست ثبت‌نام رد شد';v_body:='درخواست ثبت‌نامت در این مسابقه تأیید نشد. برای جزئیات به حساب کاربری مراجعه کن.';
      elsif new.status='withdrawn' then
        v_type:='registration_withdrawn';v_title:='ثبت‌نام لغو شد';v_body:='ثبت‌نام این مسابقه لغو شد.';
      end if;
    elsif coalesce(old.is_reserve,false) and not coalesce(new.is_reserve,false) then
      v_type:='reserve_promoted';v_title:='از فهرست رزرو به شرکت‌کننده منتقل شدی';v_body:='ظرفیت مسابقه برایت آزاد شده و ثبت‌نامت از رزرو خارج شد.';
    end if;
  end if;
  if v_type is not null and v_player is not null then
    insert into public.user_notifications(user_id,tournament_id,notification_type,title,body) values(v_player,v_tournament,v_type,v_title,v_body);
  end if;
  return new;
end;
$function$;
revoke all on function public.notify_registration_change() from public,anon,authenticated;
drop trigger if exists notify_registration_change on public.registrations;
create trigger notify_registration_change after insert or update of status,is_reserve on public.registrations for each row execute function public.notify_registration_change();
