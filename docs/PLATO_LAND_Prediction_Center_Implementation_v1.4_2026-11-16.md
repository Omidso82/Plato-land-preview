# PLATO LAND – Temporary Projects
## Prediction Center – Jalali / Tehran Schedule and Series 3 Champion Roster
**Version:** 1.4.1  
**Date:** 2026-11-16  
**Status:** Follow-up fixes committed to feature branch; CI and preview verification pending

### Scope
This change extends the reusable Prediction Center inside the existing Temporary Projects management panel. It does not create a separate preview site or modify the Main Website project.

### Approved behavior
- Campaign start/end entry and display use the Jalali calendar.
- All campaign schedule calculations use Iran time zone `Asia/Tehran`; persisted timestamps are ISO instants.
- A published campaign with `is_open=true` and a future `opens_at` is visible on `/predictions` before opening, but the response form stays unavailable until the Tehran start time.
- The public page refreshes its schedule state every second, so an already-open page changes automatically at start and end boundaries without a manual reload.
- The Edge Function independently enforces campaign start/end boundaries; client-side timing is not the security control.
- Campaign start/end ordering is validated before save.
- Jalali parsing normalizes Persian and Arabic-Indic digits, checks input ranges, and rejects impossible calendar dates rather than accepting an approximate date.

### Series 3 champion candidate source
The owner campaign manager loads candidates from `public.plato_land_series3_registration_requests` with `registration_status='main'`, ordered by registration time. The owner can select the eligible Plato IDs. The selected IDs are saved into the campaign's champion question options, creating a campaign-specific snapshot; later registration status changes do not silently rewrite that campaign's candidate list.

The source table currently contains only `plato_id` and registration metadata, not player display names. Therefore the current selector and public option list show Plato IDs, not player names. No names are inferred or fabricated.

Read-only primary database count at implementation time:
- main: 32
- waitlist: 4
- withdrawn: 1

Waitlist and withdrawn registrations are excluded from the candidate roster.

### Files changed
- `src/predictionDateTime.ts` – Jalali/Tehran parsing and formatting helpers; stricter digit, range, and real-calendar-date validation.
- `src/PredictionCampaignManager.tsx` – Jalali date/time entry, time-order validation, active Series 3 roster selector, candidate snapshot, Tehran timestamp display.
- `src/PublicPredictions.tsx` – public schedule display in Jalali/Tehran time, pre-start visible / non-submittable state, and automatic schedule-boundary refresh.
- This document – follow-up implementation and QA status.

### Database and protected data
- No database migration or database write was performed for this feature or follow-up fixes.
- No campaign or prediction entry was created.
- Series 3 registration data was read only.
- No changes to legacy Series 2 prediction tables or features.
- No change to the separate Main Website project.
- No new Supabase project or paid service.

### QA / release
- Feature branch: `feature/prediction-jalali-tehran-roster`
- Base: `main` at `024505fd13642720c4505bd8f0dc0b61debe7357`
- Follow-up fixes: committed; build/typecheck and test runs pending.
- Cloudflare branch preview must be checked after the new commit is built.
- Owner iPhone QA remains pending.
- Production merge and deployment have not been authorized or performed.

### Version history
- v1.3 (2026-11-16): original Prediction Center implementation, RLS and zero-row verification.
- v1.4 (2026-11-16): Jalali/Tehran scheduling, pre-start visibility, and owner-controlled Series 3 active-player candidate snapshot.
- v1.4.1 (2026-11-16): automatic public schedule-boundary refresh and stricter Jalali input/calendar validation.
