# Reviewed, not applied

These two SQL files were present in the implementation branch but their versions are not recorded in the primary Supabase migration ledger.

Before archiving, the corresponding production objects were inspected:
- The registration RPC already contains the per-tournament advisory transaction lock and the registrations INSERT policy already supports optional evidence where the tournament setting allows it.
- The `site_settings` table and its owner/public-invite policies already exist in the primary database.

They are retained for audit/recovery context only. Do not run them against the primary database as migrations; doing so would duplicate already-present schema/policy work.