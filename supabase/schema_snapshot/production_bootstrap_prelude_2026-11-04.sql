-- Staging bootstrap prelude, derived from live Production schema inventory (2026-11-04).
-- Apply to the approved Staging project only.
-- Supabase-managed schemas (auth, storage, extensions) are not recreated here.

CREATE SCHEMA IF NOT EXISTS private;
