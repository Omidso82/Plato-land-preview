# PLATO ID Scanner — Sample Image QA Case

**Document version:** 0.1  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Golden-candidate fixture; OCR execution pending

## 1. Purpose

Record the user-supplied Telegram screenshot as a visual QA case for the future backend OCR pipeline. The screenshot itself is intentionally not committed to the repository because it contains profile imagery and user identifiers. Keep the original image in the authorized project conversation/test storage.

## 2. Extraction scope

Extract only Plato ID-like tokens from message content. Ignore display names, profile pictures, star ratings, playing-card icons, moon/time indicators, timestamps, and Telegram composer controls.

A single message may contain multiple IDs. Preserve each OCR candidate exactly as read, including leading/trailing `@`, underscores, capitalization, and ambiguous characters. Do not silently normalize or autocorrect `O/0`, `I/l/1`, or punctuation.

## 3. Visual candidate list

The following are visual transcription candidates from the supplied screenshot, not yet OCR-engine-verified ground truth:

1. `@R53`
2. `@y__Ida`
3. `@leilii82@`
4. `Mdl65@`
5. `Emad_1984_@`
6. `Mariyam_79`
7. `@eli_9196`
8. `@Samai_79@`
9. `@M63B`
10. `@nvd6`
11. `y__Ida@`
12. `SimorghQ313@`

## 4. Required review behavior

- Preserve the raw OCR text and the candidate boundaries.
- Mark low-confidence tokens for operator review; do not auto-correct them.
- Keep the source image associated with its immutable upload record.
- Permit manual correction only as a new review revision; preserve the original OCR result and prior revisions.
- Deduplicate only after the operator-confirmed canonical ID is available, and only by exact equality under the approved project rules.
- Do not treat visually similar strings such as `@y__Ida` and `y__Ida@` as duplicates automatically.

## 5. Acceptance criteria for OCR implementation

- Detect multiple IDs within one message block.
- Do not include display names or decorative UI text as IDs.
- Preserve punctuation and case in the raw candidate.
- Expose confidence/uncertainty for manual review where supported by the OCR engine.
- Return the original text span or bounding region for each candidate where technically available.
- Never submit the image to an external OCR provider until the provider, data handling, and any cost have been explicitly approved.
- No database migration, production deployment, Telegram send, or paid service activation is authorized by this QA fixture.

## 6. Current limitation

The current Scanner branch contains upload and manual-review foundations, but the OCR backend/runtime is not implemented or active. Therefore this case is documented as a future regression/acceptance fixture; no OCR accuracy result is claimed.
