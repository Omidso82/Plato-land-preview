-- Private owner notes and operational tasks. No public or tournament-manager access.
create table public.owner_private_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null default '',
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index owner_private_notes_owner_updated_idx on public.owner_private_notes(created_by, updated_at desc);
alter table public.owner_private_notes enable row level security;
create policy owner_private_notes_owner_read on public.owner_private_notes for select to authenticated using ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));
create policy owner_private_notes_owner_insert on public.owner_private_notes for insert to authenticated with check ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));
create policy owner_private_notes_owner_update on public.owner_private_notes for update to authenticated using ((select private.has_role(array['owner'])) and created_by=(select auth.uid())) with check ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));
create policy owner_private_notes_owner_delete on public.owner_private_notes for delete to authenticated using ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));

create table public.owner_admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '',
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  created_by uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index owner_admin_tasks_owner_due_idx on public.owner_admin_tasks(created_by, due_at asc) where status <> 'done';
alter table public.owner_admin_tasks enable row level security;
create policy owner_admin_tasks_owner_read on public.owner_admin_tasks for select to authenticated using ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));
create policy owner_admin_tasks_owner_insert on public.owner_admin_tasks for insert to authenticated with check ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));
create policy owner_admin_tasks_owner_update on public.owner_admin_tasks for update to authenticated using ((select private.has_role(array['owner'])) and created_by=(select auth.uid())) with check ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));
create policy owner_admin_tasks_owner_delete on public.owner_admin_tasks for delete to authenticated using ((select private.has_role(array['owner'])) and created_by=(select auth.uid()));
