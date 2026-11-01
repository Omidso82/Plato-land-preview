-- Preserve every changed/deleted About and Guide page version for owner rollback.
create table public.site_page_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug in ('about','guide')),
  version_number integer not null,
  title text not null,
  content jsonb not null,
  status text not null,
  published_title text,
  published_content jsonb,
  published_at timestamptz,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(slug,version_number)
);
create index site_page_versions_slug_created_idx on public.site_page_versions(slug,created_at desc);
alter table public.site_page_versions enable row level security;
create policy site_page_versions_owner_read on public.site_page_versions for select to authenticated using ((select private.has_role(array['owner'])));
create policy site_page_versions_owner_insert on public.site_page_versions for insert to authenticated with check ((select private.has_role(array['owner'])) and (changed_by is null or changed_by=(select auth.uid())));

create or replace function public.capture_site_page_version()
returns trigger language plpgsql security invoker set search_path=''
as $function$
declare v_version integer; v_changed boolean;
begin
  if tg_op='UPDATE' then
    v_changed:=old.title is distinct from new.title or old.content is distinct from new.content
      or old.status is distinct from new.status or old.published_title is distinct from new.published_title
      or old.published_content is distinct from new.published_content or old.published_at is distinct from new.published_at;
    if not v_changed then return new; end if;
    select coalesce(max(version_number),0)+1 into v_version from public.site_page_versions where slug=old.slug;
    insert into public.site_page_versions(slug,version_number,title,content,status,published_title,published_content,published_at,changed_by)
    values(old.slug,v_version,old.title,old.content,old.status,old.published_title,old.published_content,old.published_at,auth.uid());
    return new;
  elsif tg_op='DELETE' then
    select coalesce(max(version_number),0)+1 into v_version from public.site_page_versions where slug=old.slug;
    insert into public.site_page_versions(slug,version_number,title,content,status,published_title,published_content,published_at,changed_by)
    values(old.slug,v_version,old.title,old.content,old.status,old.published_title,old.published_content,old.published_at,auth.uid());
    return old;
  end if;
  return new;
end;
$function$;
revoke all on function public.capture_site_page_version() from public,anon,authenticated;
drop trigger if exists site_page_version_before_change on public.site_pages;
create trigger site_page_version_before_change before update or delete on public.site_pages for each row execute function public.capture_site_page_version();
