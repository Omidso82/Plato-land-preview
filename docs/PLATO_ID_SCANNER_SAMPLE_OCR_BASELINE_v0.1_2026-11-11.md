# PLATO ID Scanner — Sample OCR Baseline Test Report

**Document version:** 0.1  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Fixture:** User-supplied Telegram screenshot, IMG_1362.jpeg  
**Test type:** Local, offline OCR feasibility check  
**Production impact:** None

## 1. Test objective

Establish a baseline for extracting Plato IDs from the supplied Telegram screenshot before selecting or activating an OCR backend provider.

## 2. Test environment

- Tesseract OCR 5.5.0
- OpenCV available for image cropping and preprocessing
- Test executed locally against the supplied image
- No external OCR endpoint or network upload used
- No production database, Storage bucket, or Telegram integration accessed

## 3. Input characteristics observed

- Tall Telegram screenshot with multiple message blocks.
- Mixed visual content: display names, profile avatars, star ratings, icons, timestamps and message text.
- ID text uses both high-contrast green/black styling and low-contrast light-gray styling.
- Multiple IDs can appear in one message.
- Some candidate strings contain leading or trailing `@` and underscores.
- The OCR task must isolate message bodies rather than transcribe the entire screenshot as one text region.

## 4. Baseline result

A whole-image Tesseract pass using page segmentation modes 3, 4, 6, 11 and 12 did not reliably recover the IDs.

A second pass using manually cropped message regions, 3x upscaling, grayscale conversion and Otsu thresholding improved recognition in some regions, but remained inconsistent:
- The first high-contrast message region returned recognizable fragments including `@R53`, but punctuation/underscores were not stable.
- Several light-gray message regions returned empty or severely corrupted text.
- The multi-ID message region recovered fragments including `@M63B`, but did not reliably recover every candidate.
- Whole-image OCR included decorative/interface artifacts and missed most IDs.

**Conclusion:** Tesseract 5.5.0 with basic preprocessing is not an acceptable production solution for this screenshot class. No accuracy percentage is claimed because a verified ground-truth annotation set and repeatable bounding-box evaluation have not yet been established.

## 5. Engineering implications

1. Segment message-body regions before OCR; whole-screen OCR is insufficient.
2. Preserve a raw OCR string and confidence/geometry metadata for every candidate.
3. Apply contrast enhancement and adaptive preprocessing per region, not as an irreversible change to the stored original.
4. Consider a stronger multilingual/scene-text OCR engine or a separately hosted OCR worker; compare it against a labeled image set before choosing.
5. Do not normalize `@`, underscores, case, or lookalike characters automatically.
6. Route uncertain or malformed candidates to manual review.
7. Keep provider selection behind a backend adapter so changing OCR engines does not require changing the upload/review UI.

## 6. Next implementation gate

Before implementing a production OCR adapter, compare at least two candidate engines on a small, manually verified set of representative screenshots. The comparison must include:
- exact-string recall and precision for IDs,
- handling of multiple IDs in one message,
- preservation of punctuation and underscores,
- latency and operating cost,
- image retention/training terms and data processing location,
- whether images leave PLATO LAND-controlled infrastructure.

No external provider, paid service, production migration, production deployment, or Telegram send is approved by this test.

## 7. Status

- Sample fixture documented: complete.
- Offline baseline run: complete.
- Baseline result recorded: complete.
- Production OCR runtime: not implemented or activated.
- Provider comparison and verified labeled test set: pending.
