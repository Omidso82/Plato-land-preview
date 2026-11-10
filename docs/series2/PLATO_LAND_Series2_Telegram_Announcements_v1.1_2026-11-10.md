# PLATO LAND – Series 2 Telegram Announcements
Version: v1.1
Date: 2026-11-10
Scope: PLATO LAND – Temporary Projects / Series 2 only
Supersedes: v1.0 (implementation behavior only; approved destination and safety rules remain unchanged)

## Approved scope
- Owner-only manual publication of today's schedule and the Round of 16 bracket to the Telegram test group only.
- Existing result notifications remain unchanged.
- Automatic progression update after an owner saves a knockout result; the update is limited to the affected match and its directly linked next-stage fixture, not a dump of every round.
- Never send to the official group or channel.

## Message presentation
- Shared PLATO LAND header, concise subtitle, visual separators, whitespace between match blocks, consistent result/status labels, and code formatting for Plato IDs.
- Daily schedule is sorted by fixture ID and displayed as separate match blocks.
- Round of 16 publication contains only the eight validated Round of 16 matches, in fixture-ID order.
- Automatic progression updates show the advancing player (winner or loser according to the downstream source) and the directly linked next-stage match. Final/third-place completion messages are limited to that completed match.
- The progression update uses an event key based on round, match ID, and saved timestamp to avoid repeat delivery for the same saved result.

## Data and safety design
- No schema or migration changes in v1.1.
- No changes to canonical progression, group results, bracket results, registrations, or predictions.
- Owner authorization remains unchanged.
- Telegram destination remains TELEGRAM_TEST_CHAT_ID only.
- Existing result-notification function remains unchanged.
- No Telegram message is sent by creating the branch, opening the PR, or running static checks.

## Schedule date limitation
Daily schedule publication still requires an exact scheduled_date or date field matching Copenhagen's current date. If no matching fixtures exist, it returns HTTP 409 and sends nothing. No weekday-to-date inference is permitted.

## Validation required
1. Review PR diff and CI/build checks.
2. Inspect the rendered Telegram message using an explicitly authorized test send after merge/deploy approval.
3. Verify that saving a knockout result sends only its relevant next-stage progression update and does not dump the entire bracket.
4. Verify the existing result notification remains unchanged.
5. Verify only the test group receives messages.

## Execution boundary
This version is prepared on an isolated Git branch and proposed for review only. It is not merged, deployed, or tested by sending Telegram messages. Supabase schema and data are untouched.
