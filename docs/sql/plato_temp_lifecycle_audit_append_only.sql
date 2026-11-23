-- Applied on primary Supabase as plato_temp_transitions_append_only_20261123.
-- Prevents silent modification/deletion of archived lifecycle transition history.
create or replace function plato_temp_internal.prevent_transition_mutation()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 raise exception 'lifecycle transition audit is append-only' using errcode='42501';
end $$;
drop trigger if exists lifecycle_transitions_append_only on plato_temp_internal.lifecycle_transitions;
create trigger lifecycle_transitions_append_only before update or delete
on plato_temp_internal.lifecycle_transitions for each row
execute function plato_temp_internal.prevent_transition_mutation();
revoke all on function plato_temp_internal.prevent_transition_mutation() from public,anon,authenticated;
