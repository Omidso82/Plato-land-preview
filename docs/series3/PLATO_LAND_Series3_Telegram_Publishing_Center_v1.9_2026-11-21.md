# PLATO LAND – Series 3 Telegram Ranking Image Layout

**Version:** 1.12.0  
**Date:** 2026-11-21  
**Project:** PLATO LAND – Temporary Projects  
**Status:** RTL column order and campaign-specific ranking subtitle implemented; campaign-title update pending review and release.

## 1. Scope

This change corrects only the ranking-image preview generated inside the existing Series 3 Telegram management workflow in the existing temporary management panel.

- Existing management route: `/series2-slides-manager/`
- Existing panel component: `Series2SlidesManager`
- Existing Series 3 tools remain mounted within that panel.
- Ranking image generator: `src/Series3TelegramManager.tsx`

No separate admin page, standalone preview page, or parallel management panel is created.

## 2. Owner-reported issues

The owner identified two visual defects in the ranking image preview:
1. Statistics cards overlapped or obscured long Plato IDs.
2. Numeric statistics were too small to read comfortably on an iPhone and in Telegram.

Several earlier branch-only preview iterations did not update the owner's existing temporary admin panel. The owner explicitly requires all work and manual verification to happen in the existing temporary panel.

## 3. Ranking row redesign (v1.10.0)

The owner supplied a live-panel screenshot showing that the prior arrangement still did not communicate a clean separation between rank, statistics, and Plato ID. The row is now redesigned as three distinct visual zones:

- Rank: a compact, outlined gold badge at the far left.
- Statistics: three equal-width cards with consistent spacing and centered values/labels.
- Plato ID: a wider, contrasting gold-outlined panel at the far right.
- A vertical divider and generous gutter separate the statistics area from the Plato ID panel.
- The ID is right-aligned, clipped only within its own panel, and reduced in font size only when needed to fit.
- Existing row height, ranking order, exact Plato IDs, statistics values, labels, title, footer, data source, and delivery flow remain unchanged.

This redesign replaces the previous x=790–1000 ID lane and closely spaced statistic centers. It is intended to make the three zones visually unmistakable on mobile screenshots and Telegram.

## 3.1 Right-to-left column order (v1.11.0)

After review of the generated mobile image, the owner specified the Persian right-to-left reading order. Each row now places the columns, from right to left, as follows:

1. Rank number (01–12) at the far right.
2. Plato ID immediately to the left of rank.
3. Incorrect predictions.
4. Correct predictions.
5. Remaining predictions at the far left.

The row keeps the same overall dimensions and visual style. Rank and ID remain separate, and the statistics remain individual cards. Only column positions/order are changed; source values, participant order, IDs, and calculation logic are preserved.

## 3.2 Campaign-specific ranking subtitle (v1.12.0)

The owner identified that the ranking image for the second-day match-prediction campaign still displayed the stale fixed subtitle for the first round. The subtitle is now sourced from the selected campaign's title returned with the ranking data, rather than a hard-coded first-round phrase.

- The displayed campaign title follows the selected campaign (for example, the second-day prediction campaign).
- The Series 3 league descriptor remains appended.
- Long campaign titles are measured and the subtitle font is reduced only as needed to fit the available width.
- Ranking order, participant IDs, statistics, scoring logic, campaign data, and Telegram delivery behavior are unchanged.

## 4. Data, security, and delivery boundaries

- No Supabase database schema or data writes.
- No Supabase Edge Function change.
- No authentication, authorization, Telegram destination, or delivery behavior change.
- No Telegram message was sent as part of this implementation.
- No PLATO LAND – Main Website feature or page is intentionally changed; the affected UI is the existing temporary management route only.

## 5. GitHub implementation

- Repository: `Omidso82/Plato-land-preview`
- Branch: `fix/series3-telegram-ranking-image-readability`
- PR: [#292](https://github.com/Omidso82/Plato-land-preview/pull/292)
- Latest implementation/documentation head before merge: `9b01149a990002b46b8749d013e1042dd44e348c`
- Implementation commit: `7196ba4dbab2f86a5747693dfd85ad170e573c1e`
- Changed application file: `src/Series3TelegramManager.tsx`
- This document records the successive layout adjustments and the final 54px statistic typography.

## 6. Verification and release gate

For the latest PR head:
- Build and typecheck: SUCCESS.
- Verify: SUCCESS.
- Cloudflare Pages branch build for `plato-land-preview`: SUCCESS.
- Cloudflare Pages branch build for `plato-land-media-pages`: SUCCESS.
- Cloudflare Pages branch build for `plato-land-media-endpoint`: SUCCESS.
- A separate Workers Builds check for `plato-land-media-endpoint` reported FAILURE; this is not the Pages deployment and is not evidence that the ranking image change failed. Its cause is not established by this handover.

Branch Preview deployment does not prove that the existing temporary admin panel has been updated. The required manual acceptance location remains the existing owner-used panel at `https://platoland.org/series2-slides-manager/`.

The owner has not yet accepted the final rendered image. No Telegram send is authorized by this handover.

## 7. Version history

- v1.9.0–v1.9.3: Earlier layout attempts recorded during owner feedback; these did not fully resolve overlap.
- v1.9.4 (2026-11-21): Rebuilt row layout with wider statistics cards, 54px values, and a separate right-side Plato ID region. Corrected the deployment target to the existing temporary management panel as the only owner verification surface.
