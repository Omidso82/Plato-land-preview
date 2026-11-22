# PLATO LAND – Series 3 Public Predictions Copy Handover

**Version:** 1.0  
**Date:** 2026-11-22  
**Status:** Prepared on a review branch; merge and production deployment pending owner approval.

## Scope

This change is limited to the existing public predictions page at `/predictions/` in the PLATO LAND – Temporary Projects project.

## Requested presentation changes

1. Replace the awkward pre-start status text with the concise message: `پیش‌بینی هنوز شروع نشده است.`
2. Remove the redundant `(به وقت تهران)` suffix from the displayed campaign start and closing times.

## Preserved behavior

- Campaign start and closing timestamps remain unchanged.
- Tehran timezone formatting and Jalali date/time conversion remain unchanged; only the redundant visible suffix is removed.
- Campaign availability checks, submission behavior, questions, prizes, and Supabase reads/writes are unchanged.
- No database, schema, Edge Function, authentication, storage, or Telegram behavior is changed.

## Verification and release

- Source change is prepared on branch `fix/public-predictions-status-and-time-copy`.
- Pull request checks and manual iPhone Safari verification are pending.
- No merge or production deployment has been performed.
- No database writes or Telegram messages were made by this change.

## Change history

- **v1.0 – 2026-11-22:** Simplified the pre-start status message and removed the redundant Tehran-time suffix from public campaign schedule labels.
