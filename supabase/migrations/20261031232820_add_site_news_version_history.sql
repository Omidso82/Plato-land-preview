-- Preserve prior news content/publication states for owner rollback, including deleted items.
create table public.site_news_versions (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null,
  version_number integer not null,
  title text not null,
  summary text not null default '',
  body text not null default '',
  image_url text,
  status text not null,
  featured boolean not null default false,
  featured_starts_at timestamptz,
  featured_ends_at timestamptz,
  published_at timestamptz,
  publish_at timestamptz,
  expires_at timestamptz,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(news_id,version_number)
);
create index site_news_versions_news_created_idx on public.site_news_versions(news_id,created_at desc);
alter table public.site_news_versions enable row level security;
create policy site_news_versions_owner_read on public.site_news_versions for select to authenticated using ((select private.has_role(array['owner'])));
create policy site_news_versions_owner_insert on public.site_news_versions for insert to authenticated with check ((select private.has_role(array['owner'])) and (changed_by is null or changed_by=(select auth.uid())));

create or replace function public.capture_site_news_version()
returns trigger language plpgsql security invoker set search_path=''
as $function$
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
$function$;
revoke all on function public.capture_site_news_version() from public,anon,authenticated;
drop trigger if exists site_news_version_before_change on public.site_news;
create trigger site_news_version_before_change before update or delete on public.site_news for each row execute function public.capture_site_news_version();
