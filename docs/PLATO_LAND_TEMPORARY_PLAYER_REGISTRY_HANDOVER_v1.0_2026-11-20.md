# PLATO LAND – Temporary Player Registry & History
Version 1.0 | 2026-11-20

## Scope
This change belongs only to PLATO LAND – Temporary Projects. It covers Series 2 and Series 3. It does not use or modify the Main Website `profiles`, `registrations`, `matches`, or other Main Website tables.

Primary repository: `Omidso82/Plato-land-preview`
Production branch: `main`
Primary Supabase project: `dfrppbapaaydbjeflozw`

## Confirmed design
- One persistent player record per normalized Plato ID, unique within the Temporary Projects registry.
- Original Plato ID casing is preserved for display; matching uses `lower(btrim(plato_id))`.
- A player can participate in more than one series. A Series 2 identity and Series 3 identity with the same normalized ID resolve to one player record and separate event-participation rows.
- Different Plato IDs are not automatically merged into one person.
- Registration history is preserved; Series 3 main/waitlist/withdrawn status is captured.
- Match history is stored separately with event, stage, opponent IDs, scores, winner, result status, source key and source payload.
- Pending fixtures are retained as pending and are not counted as played games.
- No public access is granted to player registry or history. Authenticated owner read is allowed.
- Registration and match sources remain authoritative. The new tables are a derived history projection, not replacements.

## Database implementation
Applied migrations on the primary Supabase project:
- `20261120104404_plato_land_temporary_player_registry_and_history`
- `20261120104438_plato_land_temporary_player_match_history_sync`

New tables:
- `plato_land_temp_players`
- `plato_land_temp_player_entries`
- `plato_land_temp_player_matches`

Derived view:
- `plato_land_temp_player_event_stats`

Synchronization:
- New/updated Series 2 and Series 3 registration records are captured automatically.
- Series 2 progression updates refresh group and knockout match history.
- Series 3 group-result changes refresh the player match ledger.
- Source tournament records are not modified by this projection.

## Initial backfill and verification
Read-back from the primary database after migration:
- 71 unique player identities.
- 32 Series 2 participation entries.
- 59 Series 3 participation entries.
- 20 normalized Plato IDs appear in both series and resolve to shared player identities.
- Series 2 match ledger: 48 group fixtures (47 completed, 1 double-no-show), 8 round-of-16, 4 quarterfinals, 2 semifinals, 1 final, 1 third-place match — 64 matches total.
- Series 3 match ledger: 72 group fixtures, all pending at verification time; no wins/losses fabricated.
- Series 2 derived player-event totals: 128 player-game appearances; 63 wins and 63 losses. The one double-no-show is counted as an appearance for each player, but not as a win/loss.
- Series 3 derived totals: 144 pending player appearances, zero played games at verification time.

## Security and separation
- RLS enabled on all new registry/history tables.
- Public/anon access revoked.
- Authenticated reads are restricted by owner role policy.
- Internal SECURITY DEFINER sync functions have EXECUTE revoked from public, anon and authenticated.
- No write access is granted to end users.
- Main Website `profiles` table and all unrelated schemas were left untouched.

## Limitations / next work
- The current release establishes the database identity registry and synchronized history layer. A dedicated owner-facing player search/profile screen has not yet been added to the admin UI.
- Series 3 knockout bracket is currently a draw/token snapshot; no confirmed individual knockout results were present in the Series 3 result source during this implementation. Those results must be synchronized only when the official result source exists and records them.
- Existing legacy player statistics tables remain unchanged. The new event stats view derives totals from match records and deliberately does not silently substitute legacy aggregates for missing match-level records.
- Player display names and aliases were not backfilled because registration sources contain Plato IDs, not verified player names.

## Validation status
Database migration success was confirmed by the Supabase migration runner. Read-back queries confirmed registry counts, event participation, match counts and event statistics above. No registration rows, draws, fixtures, results or Main Website data were deleted or rewritten.

## Version history
- 1.0 — 2026-11-20: Initial persistent Plato ID registry, event participation, match history projection, source synchronization and backfill for Series 2 and Series 3.
