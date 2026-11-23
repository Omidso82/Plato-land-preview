# PLATO LAND – Series 3 Prediction / Live Bracket Synchronization

**Version:** 1.0  
**Date:** 2026-11-23  
**Project:** PLATO LAND – Temporary Projects  
**Event:** Series 3 Backgammon League  
**Status:** Implemented on review branch; merge and production release pending.

## 1. Owner-approved scope

The owner approved synchronizing match choices in the existing Series 3 prediction campaign manager with the official live knockout bracket for **all knockout stages**, not only Round of 32:

- Round of 32 (یک‌شانزدهم نهایی)
- Round of 16 (یک‌هشتم نهایی)
- Quarterfinals (یک‌چهارم نهایی)
- Semifinals (نیمه‌نهایی)
- Third-place match (رده‌بندی), when present in the official bracket
- Final (فینال)

The work is confined to the existing owner management panel and the Series 3 prediction campaign workflow.

## 2. Root cause

`src/PredictionCampaignManager.tsx` previously loaded knockout match labels directly from the static `bracket_snapshot` token labels. It did not call the established live bracket resolver. As a result, confirmed group qualifiers and later knockout winners/losers could remain represented by unresolved placeholder labels in the prediction match selector.

## 3. Implementation

The review-branch change reuses the existing official progression logic from `src/series3BracketProgression.ts`:

- `resolveLockedGroupPlacements` derives mathematically locked first- and second-place group positions from official Series 3 group results. Unresolved ties/positions remain placeholders; no alphabetical fallback is introduced.
- `resolveSeries3BracketSlots` resolves the bracket recursively using the official saved bracket, assigned third-place qualifiers, and completed knockout results.
- The prediction manager reads the official draw from `plato_land_series3_knockout_draws`, group results from `plato_land_series3_group_match_results`, and knockout results from `plato_land_series3_knockout_match_results`.
- All bracket stages, including the derived third-place match `TP-1` when absent from the stored snapshot, use resolved Plato IDs where determinable and retain the official placeholder label where not yet determinable.
- The prediction scoring report now also reads official knockout match results, so knockout predictions can be evaluated once completed, without changing the scoring rules.
- Refreshing the game list also refreshes the label/options of already-selected match keys without changing the selected match identities.

## 4. Preserved data and rules

- The official bracket snapshot, match IDs, draw order, and pairings are read-only inputs. No redraw or bracket replacement is performed.
- No group results, knockout results, player registrations, prediction entries, or campaign records are written by the loader.
- Existing selected match identities are preserved by stable stage/match keys.
- Campaign creation/edit/save behavior, prediction scoring rules, and public submission behavior are otherwise unchanged. Existing saved campaigns are not automatically rewritten; refreshed labels/options apply in the manager and only persist if the owner explicitly saves the campaign.
- No database schema, RLS, RPC, Edge Function, Telegram, or PLATO LAND – Main Website changes are included.

## 5. Primary database read-only audit (2026-11-23)

Project: `dfrppbapaaydbjeflozw` (primary Supabase project).

Observed:
- Official bracket snapshot exists in `plato_land_series3_knockout_draws` and includes all bracket stages.
- Public bracket projection mirrors the same saved snapshot.
- Group result rows: 72 total; 54 completed, 2 double-no-show, 16 pending.
- Knockout result rows in `plato_land_series3_knockout_match_results`: 0 at audit time.
- No database writes were made during this audit.

These counts are a dated observation, not a permanent assumption; the implementation fetches current rows whenever the owner refreshes the prediction game list.

## 6. Files changed

- `src/PredictionCampaignManager.tsx` — live participant resolution for all knockout match choices.
- This handover document.

No database migration or Edge Function deployment is part of this change.

## 7. Verification and release gate

- Build and TypeScript checks passed for the previous PR head; final checks must be rerun for the additional scoring and third-place adjustments.
- Manual verification in the existing iPhone-used owner panel: pending after production deployment.
- No merge or production deployment has been performed from this review branch.
- The owner must separately approve merge/release after reviewing the PR checks.

## 8. Version history

- **v1.0 — 2026-11-23:** Records owner approval for all knockout stages and implementation of live bracket resolution in the existing Series 3 prediction campaign manager.
