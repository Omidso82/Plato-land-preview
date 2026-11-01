-- Owner-managed public game catalog and mixed-competition category.
-- Public visitors can read enabled games only; owner has full CRUD access.

create table public.site_games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  image_url text,
  enabled boolean not null default true,
  is_mixed boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index site_games_public_order_idx on public.site_games(sort_order, name) where enabled = true;

alter table public.site_games enable row level security;

create policy site_games_public_read
  on public.site_games
  for select
  to anon
  using (enabled = true);

create policy site_games_authenticated_read
  on public.site_games
  for select
  to authenticated
  using (enabled = true or (select private.has_role(array['owner'])));

create policy site_games_owner_insert
  on public.site_games
  for insert
  to authenticated
  with check (
    (select private.has_role(array['owner']))
    and (created_by is null or created_by = (select auth.uid()))
  );

create policy site_games_owner_update
  on public.site_games
  for update
  to authenticated
  using ((select private.has_role(array['owner'])))
  with check ((select private.has_role(array['owner'])));

create policy site_games_owner_delete
  on public.site_games
  for delete
  to authenticated
  using ((select private.has_role(array['owner'])));

revoke all privileges on table public.site_games from anon;
grant select (id, slug, name, description, image_url, enabled, is_mixed, sort_order, created_at, updated_at)
  on public.site_games to anon;
