-- Profile pictures are public by the approved profile UX. Keep them in a
-- separate public bucket; existing private avatars and registration evidence
-- remain in their existing private buckets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('public-profile-avatars','public-profile-avatars',true,2097152,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists public_profile_avatars_read on storage.objects;
create policy public_profile_avatars_read on storage.objects for select to anon,authenticated using (bucket_id='public-profile-avatars');
drop policy if exists public_profile_avatars_insert_own on storage.objects;
create policy public_profile_avatars_insert_own on storage.objects for insert to authenticated with check (bucket_id='public-profile-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists public_profile_avatars_update_own on storage.objects;
create policy public_profile_avatars_update_own on storage.objects for update to authenticated using (bucket_id='public-profile-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='public-profile-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists public_profile_avatars_delete_own on storage.objects;
create policy public_profile_avatars_delete_own on storage.objects for delete to authenticated using (bucket_id='public-profile-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

alter table public.profiles add column public_avatar_path text;
revoke all privileges on table public.profiles from anon;
grant select (id,display_name,plato_id,public_avatar_path) on public.profiles to anon;

create or replace view public.recent_tournament_champions
with (security_invoker=true,security_barrier=true)
as
with candidates as (
  select t.id as tournament_id,t.title as tournament_title,t.game_type,t.series_name,
    coalesce(t.prize_details->>'text',t.prize_details->>'display','') as prize_text,
    t.completed_at,p.display_name,p.plato_id,p.public_avatar_path,
    count(*) over (partition by t.id) as champion_rows
  from public.tournaments t
  join public.tournament_results r on r.tournament_id=t.id and r.placement=1
  join public.profiles p on p.id=r.player_id
  where t.status='completed' and t.completed_at is not null
)
select tournament_id,tournament_title,game_type,series_name,prize_text,completed_at,display_name,plato_id,public_avatar_path
from candidates where champion_rows=1 order by completed_at desc limit 3;
