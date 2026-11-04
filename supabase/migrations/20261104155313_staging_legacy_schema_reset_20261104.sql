-- Authorized Staging-only reset of legacy application schema.
-- Preserve Supabase-managed schemas, Auth users, Storage objects, and project configuration.
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.create_player_profile() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.protect_profile_privileged_fields() CASCADE;
DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;
DROP SCHEMA IF EXISTS private CASCADE;
