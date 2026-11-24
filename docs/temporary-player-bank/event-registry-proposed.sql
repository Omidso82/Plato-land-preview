begin;
create table public.plato_land_temp_events(event_key text primary key, label text not null, game_type_key text not null references public.plato_land_temp_game_types(game_key), sort_order integer not null default 100, registration_source text unique);
alter table public.plato_land_temp_events enable row level security;
revoke all on public.plato_land_temp_events from anon,authenticated;
grant select on public.plato_land_temp_events to authenticated;
create policy "Temporary events owner read" on public.plato_land_temp_events for select to authenticated using (exists(select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role in ('owner','مالک کل')));
insert into public.plato_land_temp_events values
('series1','سری اول تخته','backgammon',1,null),
('series2','سری دوم تخته','backgammon',2,'plato_land_series2_registration_requests'),
('series3','سری سوم تخته','backgammon',3,'plato_land_series3_registration_requests'),
('series4','سری چهارم تخته','backgammon',4,'plato_land_series4_registration_requests'),
('black_friday','تورنمنت حذفی Black Friday','backgammon',5,'plato_land_black_friday_registration_requests');
alter table public.plato_land_temp_player_entries drop constraint plato_land_temp_player_entries_event_key_check, add constraint temp_entries_event_fk foreign key(event_key) references public.plato_land_temp_events(event_key);
alter table public.plato_land_temp_player_matches drop constraint plato_land_temp_player_matches_event_key_check, add constraint temp_matches_event_fk foreign key(event_key) references public.plato_land_temp_events(event_key);
create or replace function public.plato_land_temp_capture_registration() returns trigger language plpgsql security definer set search_path='' as $$
declare v_event text; v_game text; v_id uuid; v_status text;
begin
select event_key,game_type_key into strict v_event,v_game from public.plato_land_temp_events where registration_source=TG_TABLE_NAME and TG_TABLE_SCHEMA='public';
v_id:=public.plato_land_temp_upsert_player(NEW.plato_id);
if v_id is null then return NEW; end if;
v_status:=coalesce(to_jsonb(NEW)->>'registration_status',to_jsonb(NEW)->>'selection_status','main');
insert into public.plato_land_temp_player_entries(player_id,event_key,registration_id,registration_status,registered_at,source_table,game_type_key)
values(v_id,v_event,NEW.id,v_status,NEW.created_at,TG_TABLE_NAME,v_game)
on conflict(event_key,player_id) do update set registration_id=coalesce(public.plato_land_temp_player_entries.registration_id,excluded.registration_id),registration_status=excluded.registration_status,registered_at=least(public.plato_land_temp_player_entries.registered_at,excluded.registered_at),updated_at=now();
return NEW;
end; $$;
revoke execute on function public.plato_land_temp_capture_registration() from public,anon,authenticated;
create trigger plato_land_temp_capture_friday_registration after insert or update on public.plato_land_black_friday_registration_requests for each row execute function public.plato_land_temp_capture_registration();
create trigger plato_land_temp_capture_series4_registration after insert or update on public.plato_land_series4_registration_requests for each row execute function public.plato_land_temp_capture_registration();
insert into public.plato_land_temp_players(plato_id,first_seen_at,last_seen_at) select plato_id,created_at,created_at from public.plato_land_black_friday_registration_requests on conflict(plato_id_normalized) do nothing;
insert into public.plato_land_temp_player_entries(player_id,event_key,registration_id,registration_status,registered_at,source_table,game_type_key)
select p.id,'black_friday',f.id,f.selection_status,f.created_at,'plato_land_black_friday_registration_requests','backgammon' from public.plato_land_black_friday_registration_requests f join public.plato_land_temp_players p on p.plato_id_normalized=f.plato_id_normalized on conflict(event_key,player_id) do nothing;
commit;