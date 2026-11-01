create index if not exists tournament_manager_section_permissions_user_id_idx
  on public.tournament_manager_section_permissions(user_id);
create index if not exists tournament_manager_section_permissions_granted_by_idx
  on public.tournament_manager_section_permissions(granted_by)
  where granted_by is not null;
