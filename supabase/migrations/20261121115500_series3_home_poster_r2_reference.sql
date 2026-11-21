-- Store the Series 3 homepage poster's canonical R2 key separately from the teaser key.
-- Existing legacy Supabase poster remains readable until the owner uploads and verifies its R2 replacement.
alter table public.plato_land_series3_home_media_settings
  add column if not exists poster_storage_path text null;

comment on column public.plato_land_series3_home_media_settings.poster_storage_path is
  'Canonical Cloudflare R2 object key for the Series 3 homepage poster; binary remains in R2.';
