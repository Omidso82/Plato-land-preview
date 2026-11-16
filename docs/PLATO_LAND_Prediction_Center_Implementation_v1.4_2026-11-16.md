# PLATO LAND – Temporary Projects
## Prediction Center – Simple Owner Management
**Version:** 1.5.1  
**Date:** 2026-11-16  
**Status:** Merged and deployed to the existing site; owner iPhone acceptance review pending.

### Scope and fixed operating rule
The Prediction Center is managed only inside the existing Temporary Projects admin panel. No separate admin panel or alternate user testing workflow is introduced. The owner checks and operates the feature from that existing panel.

### Owner workflow
The management form is simplified for a non-technical owner:
1. Prediction title.
2. Description shown to participants.
3. Prediction type: Series 3 champion, match prediction, or custom prediction.
4. Candidate selection for Series 3 champion, or simple question and answer options for other prediction types.
5. Optional prize description.
6. Jalali start and end date/time using Asia/Tehran.
7. Publication status and a simple open/closed participation checkbox.

Technical fields (internal slug, event key, JSON question schema, prize JSON, scoring JSON, winner JSON, and public display JSON) are generated or retained internally and are not exposed as form fields. Every input has a Persian explanation above it. Custom/match predictions support multiple questions; select options are entered one per line. Text and numeric answer types are also available.

The campaign list presents plain Persian status and action buttons for edit, participant report, open, close, and archive. Archiving preserves campaign and response data.

### Scheduling
- Start/end entry uses Jalali text input, not the native iOS Gregorian date picker.
- Accepted input example: ۱۴۰۵/۰۸/۳۰ ۱۸:۰۰.
- All schedule parsing, display, and enforcement use Asia/Tehran.
- Invalid/impossible Jalali dates and invalid time ranges are rejected.
- A published scheduled campaign can be visible before opening; responses remain disabled until the start and stop at the end.
- The public page refreshes schedule state while open; server-side Edge Function enforcement remains authoritative.

### Series 3 champion candidates
Candidates are loaded from public.plato_land_series3_registration_requests with registration_status='main'. Only Plato IDs are shown because the registration table has no player-name field. Selected candidates are saved as a campaign-specific snapshot. Waitlist and withdrawn registrations are excluded.

Read-only primary DB count at implementation time: 32 main, 4 waitlist, 1 withdrawn.

### Data protection and project boundaries
- No campaign or prediction entry is created by this UI refactor.
- No DB migration is required for this UI refactor.
- Series 3 registrations are read only.
- Legacy Series 2 prediction tables and entries remain untouched.
- Main Website features outside the existing Temporary Projects admin module remain out of scope.
- No new database/project or paid service is introduced.

### Files
- src/PredictionCampaignManager.tsx: simplified Persian owner workflow and hidden technical JSON fields.
- src/predictionDateTime.ts: Jalali/Tehran parsing and formatting.
- src/PublicPredictions.tsx: public campaign schedule display and automatic start/end boundary refresh.
- This document: version 1.5.0.

### Release status
- Working branch: feature/prediction-jalali-tehran-roster
- PR #192 merged into main as 3aeb17b45c9108e2048b00dbd193c950f4c4f3a4.
- Main build/typecheck and Deno checks passed.
- Main deployment workflow 43888287056 completed successfully.
- The deployed feature is part of the existing site and the existing Temporary Projects admin panel; no separate admin panel was created.
- Do not ask the owner to use a separate preview URL; acceptance review must happen in the existing Temporary Projects admin panel after the approved deployment path is completed.
- No claim of successful deployment until the exact commit is built, merged under the user's explicit project scope, and the existing panel is verified.

### Version history
- v1.3: initial Prediction Center.
- v1.4: Jalali/Tehran scheduling and Series 3 champion candidate snapshot.
- v1.4.1: automatic public schedule-boundary refresh and stricter Jalali input validation.
- v1.5.0: simplified owner form; technical JSON fields hidden and replaced with clear Persian inputs and instructions.
- v1.5.1: recorded successful merge, main CI, and deployment; owner review in the existing panel remains pending.
