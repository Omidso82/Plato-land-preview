# PLATO ID Scanner — Sample OCR Baseline Test Report

**Document version:** 0.2  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Fixture:** User-supplied Telegram screenshot, IMG_1362.jpeg  
**Test type:** Local, offline OCR feasibility check  
**Production impact:** None

## 1. Purpose

Assess whether the locally available Tesseract OCR baseline can extract IDs from this screenshot class, without sending the image to an external service.

## 2. Environment actually used

- Tesseract OCR 5.5.0
- Python pytesseract and OpenCV
- Available Tesseract language data includes English and many other languages; the target identifiers are Latin alphanumeric strings.
- Image processed locally from the conversation upload.
- No external OCR endpoint, network upload, production database, Storage bucket, or Telegram integration was used.

## 3. Test procedure

- Inspected the original 1320 × 2228 screenshot.
- Selected text-only crops for individual message bodies and the green ID capsule.
- Converted crops to grayscale, applied CLAHE contrast enhancement, inverted the image, enlarged 3× with cubic interpolation, and ran Tesseract with page segmentation mode 7 and a Latin ID character whitelist.
- Also checked a few larger regions with grayscale/Otsu preprocessing.

## 4. Observed output

The text-only crop tests returned partial/inaccurate results, for example:
- The first gray message line was read approximately as `Pedar@leilli8`, losing the final characters/punctuation.
- The Emad line was read approximately as `Emad_1984@ a`, not preserving the exact visible form.
- The multi-ID message recovered a fragment around `@eli_9196` and `@Samai_79@`, but omitted other IDs and introduced uncertainty.
- Other gray text rows were mostly unreadable or badly corrupted.
- The green capsule yielded fragments resembling `@R53` and the adjacent ID, but not a dependable exact transcript.

These are raw machine outputs, not accepted IDs or verified ground truth.

## 5. Conclusion

Tesseract 5.5.0 with the tested basic crop/contrast pipeline is not sufficiently reliable for production extraction from this screenshot class. It misses characters, punctuation, and whole IDs, particularly in low-contrast gray text.

No accuracy percentage is claimed. A defensible precision/recall score requires a manually verified ground-truth annotation with exact token boundaries for a representative screenshot set.

## 6. Engineering implications

1. Segment message-body regions before OCR; whole-screen OCR is insufficient.
2. Preserve raw OCR text, confidence and geometry metadata where available.
3. Apply preprocessing to derived crops only; never alter the immutable original upload.
4. Compare stronger OCR engines against the same manually labeled screenshot set before selecting one.
5. Do not normalize `@`, underscores, case, or lookalike characters automatically.
6. Route uncertain or malformed candidates to manual review.
7. Keep the OCR provider behind a backend adapter so the upload/review UI is provider-neutral.

## 7. Next gate

Compare at least two viable OCR engines on representative, manually labeled screenshots. Include:
- exact-string precision and recall,
- multiple IDs in one message,
- punctuation/underscore preservation,
- latency and operating cost,
- data processing location, retention and training terms,
- whether images leave PLATO LAND-controlled infrastructure.

No external provider, paid service, production migration, production deployment, or Telegram send is approved by this test.

## 8. Status

- Sample fixture documented: complete.
- Local Tesseract baseline run: complete.
- Baseline findings recorded: complete.
- Alternative-engine comparison: pending.
- Production OCR runtime: not implemented or activated.
