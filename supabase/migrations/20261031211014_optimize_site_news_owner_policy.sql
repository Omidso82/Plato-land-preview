-- Add the created_by foreign-key index and evaluate owner/uid helpers once
-- per statement in the news insert policy.

create index if not exists site_news_created_by_idx on public.site_news(created_by);

drop policy if exists site_news_owner_insert on public.site_news;
create policy site_news_owner_insert
  on public.site_news
  for insert
  to authenticated
  with check (
    (select private.has_role(array['owner']))
    and (created_by is null or created_by = (select auth.uid()))
  );
