-- Allow authenticated users to insert only their own permitted audit events; RLS controls scope.
grant insert on table public.audit_logs to authenticated;
