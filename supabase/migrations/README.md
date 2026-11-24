# Production migration ledger

Last reconciled: 2026-11-15.

- Primary Supabase project: `dfrppbapaaydbjeflozw`.
- The primary database has **105 applied migrations**.
- The repository contains **62 SQL files** in `supabase/migrations/`; the new Series 3 migration matches the primary database migration ledger. The repository does not contain SQL source for 43 applied historical migrations; do not replay or bootstrap from this folder.
- **20 earlier applied baseline migrations** are not present as SQL files in this repository. Recover or reconstruct their source before treating this directory as a complete bootstrap history.
- Do not run `supabase db push` or replay historical migrations against the primary database until the missing baseline history is reconciled.
- Two historical SQL files not present in the primary ledger are archived under `supabase/migrations_reviewed_not_applied/`. Their target effects were already present in the primary database; do not execute them.

## Latest additive migration

- `20261101203114_create_plato_land_semifinal_prediction_votes.sql` creates a separate table for the two Series 1 semifinal predictions.
- The earlier champion-prediction table and all existing rows remain unchanged.
- The new table has RLS enabled, denies direct anon/authenticated table access, and grants backend service-role access only.

## Latest additive migration\n\n- `20261115143405_series3_owner_registration_controls_and_waitlist.sql` adds owner-controlled Series 3 registration open/close, a 32-player main roster, ordered waitlist, soft withdrawal, and owner-approved waitlist promotion. Applied to the primary project `dfrppbapaaydbjeflozw` on 2026-11-15. Existing 27 registrations were preserved and initialized as `main`.\n\n## Series 4 registration — 2026-11-23

- Applied migration `20261123135242_series4_registration_isolated_closed` to primary project `dfrppbapaaydbjeflozw` with explicit owner approval.
- Added two Series 4 registration tables with row-level security and Series 4 registration functions. The initial capacity is 32, both registration and public access are off, and the roster is empty.
- Live checks confirmed the migration ledger entry, RLS enabled on both tables, and anonymous access denied for registration records and owner settings. No panel deployment was included.

## Safe procedure for future schema changes

1. Inspect the primary database migration ledger first.
2. Create a new migration with the Supabase CLI; do not invent a version prefix.
3. Review the SQL before applying it.
4. Apply only the new migration once to the primary project.
5. Commit the exact generated versioned SQL file and update this ledger.
6. Never replay an applied migration or create a second database for testing.

## Series 4 group draw — 2026-11-23

The Series 4 owner card includes a local ranking and group draw section. Four pots feed eight groups at capacity 32 or twelve groups at capacity 48, with one main-roster player from each pot in every group. Fifty generated draws and incomplete-roster rejection passed locally. Migration `20261123140318_series4_player_stats_and_group_draw` was applied to the primary project after owner approval. Live verification found two empty tables with RLS, five owner policies, and anonymous reads disabled. Registration and public display were both still closed. The panel was not deployed.

## Series 4 group results — 2026-11-23

The owner card can initialize an immutable three-round schedule using dates entered by the owner and the saved Series 4 draw. The draft adds independent match-result and correction-history tables plus an owner-only schedule initialization function. Group standings use points, set difference, sets won, and direct head-to-head for a two-player tie. Unresolved ties remain shared. Isolated PostgreSQL tests passed for 48 and 72 scheduled matches, duplicate initialization rejection, five-point score validation, and history versioning. Migration `20261123143308_series4_group_results_and_history` was applied to the primary project after owner approval. Live verification found two empty RLS-enabled tables, three policies, no anonymous read or initialization privileges, and closed registration and public visibility. The card was not deployed.

## Series 4 knockout management — 2026-11-23

Completed group results feed the 16- or 32-player knockout preview. Qualification stops at unresolved advancement ties. The preview includes first-round group protection, the path to the final and third-place match. Two hundred randomized bracket checks and qualification tie checks passed. The local card supports locking the draw, five-point results, automatic advancement, final and third-place participants, and revision history through the draft migration. The draft was tested in isolated PostgreSQL for both bracket sizes, invalid paths, stale revisions, blocked anonymous writes, and winner changes that would invalidate a scored downstream match. Changes to group results after the saved draw block new knockout scores. Vite build and TypeScript passed. Migration `20261123144839_series4_knockout_bracket_scores_history` was applied to the primary project after owner approval. Live verification found three empty RLS-enabled tables, three policies, and no anonymous read or execute privileges. Registration and public visibility remained closed. Media, Telegram and panel deployment remain pending.

## Series 4 media and Telegram preview — local preparation, 2026-11-23

The owner card has separate controls for the Series 4 poster, 17 slides, teaser and rules video, using immutable object keys under the Series 4 R2 prefix. The metadata migration `20261123145533_series4_private_media_metadata` was applied to the primary project after owner approval. Live checks confirmed an empty RLS-enabled table with no anonymous reads. Commit `edefd19f8567ae6d8f0e25dd32a3e8e4ceb8126b` added only the owner media endpoint to the existing media production branch. The deployed route passed the allowed-origin preflight. Tests with an R2 stub and isolated PostgreSQL verified owner-only access, rejection of Series 3 keys, upload and HEAD verification, and private caching. Telegram preview reads Series 4 group fixtures and results by date, plus the saved knockout bracket and scored matches. It supports copying the text. The direct Telegram destination and delivery remain pending. The main panel has not been deployed and registration and public visibility remain closed.

## Series 4 owner card release — 2026-11-23

The owner card was released on platoland.org in commit `a0cceccd9765f768a9b7499b8258fd42f3913d80`. GitHub verification run `45200752337` and Pages deployment run `45200752197` succeeded. The live manager loaded the new bundle containing the Series 4 card. Supabase returned capacity 32, zero registrations, closed registration and disabled public visibility. No real result, draw or media upload was made with an owner account during production verification. Direct Telegram delivery is pending; preview and copying are available.

## Series 4 media and Telegram update — 2026-11-23

Compared sections inside the Series 3 and Series 4 owner cards. The local Series 4 card now separates images/teaser from rules video and provides explicit upload/replace, preview, archive/restore, home-media preference and rules preference controls. Archived R2 files are retained. Telegram adds group filtering, manual confirmation, the existing test-group and main-channel destination labels, duplicate-attempt protection and a separate delivery history. Migration `20261123160448_series4_panel_media_telegram` was applied to the primary project after owner approval. The Series 4 Telegram Edge Function v1 is active with JWT verification. No Telegram messages were sent. Prediction scoring reports and public rules-video view analytics are not part of this update. The public Series 4 page stays disabled.

## Series 4 owner-card parity release — 2026-11-24

Owner approved publication of the media slot status buttons, official group schedule, Telegram ranking/seeding/draw previews, and prediction response and scoring report inside the temporary Series 4 panel. No database migration, public activation, or Telegram send is included. The prediction report requires Series 4 campaigns and entries to show live scoring data.
