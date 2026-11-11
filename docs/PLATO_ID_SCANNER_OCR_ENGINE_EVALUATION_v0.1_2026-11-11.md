# PLATO ID Scanner — OCR Engine Evaluation & Architecture Decision

**Document version:** 0.1  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Status:** Engineering recommendation; deployment and paid-provider approval not granted

## 1. Requirement

The Scanner receives Telegram screenshots containing short Latin-script Plato IDs mixed with avatars, display names, stars, timestamps and decorative UI. Exact preservation of punctuation, underscores, case and ambiguous glyphs is more important than extracting all surrounding text. Every candidate must remain reviewable against its original image.

## 2. Candidate evaluation

### A. Tesseract 5.5.0 (local baseline)
- Already available in the local test environment.
- Basic whole-image and manually cropped tests on the supplied screenshot were not reliable.
- Light-gray text and punctuation/underscore preservation were weak.
- Decision: do not use as the production engine for this screenshot class; retain only as a baseline/fallback experiment.

### B. PaddleOCR self-hosted (recommended next prototype)
- Official PaddleOCR documentation describes local deployment and service deployment, CPU/GPU options, text boxes and recognition outputs.
- Self-hosting allows the image to be processed within PLATO LAND-controlled infrastructure rather than uploading it to a hosted OCR endpoint.
- It requires a separately operated Python/container worker and model/runtime maintenance; hosting and compute costs must be assessed before deployment.
- Recommendation: run a prototype with PP-OCRv5/PP-OCRv6 detection and recognition on a small manually labeled image set. Choose the model after exact-ID precision/recall testing, not general OCR benchmark claims.

### C. Google Cloud Vision API (comparison option only)
- Google's official Data Usage FAQ says online immediate Vision API operations process image data in memory and do not persist it to disk; content is not used to train/improve Vision features and is used only to provide the service.
- The image still leaves PLATO LAND-controlled infrastructure and is sent to Google for processing.
- Decision: do not activate unless the user explicitly approves the provider, terms, region/configuration and expected cost.

### D. Amazon Textract (not preferred for this use case)
- AWS's official Textract FAQ says input content may be used to improve/develop service and AI technologies unless an Organizations opt-out policy is applied; some content may be stored in another AWS Region in connection with service improvement unless opted out.
- This document-based service is not the obvious first choice for short social-chat ID extraction.
- Decision: do not select as the initial prototype.

## 3. Recommended architecture

1. Keep original images in the existing private Scanner Storage bucket once its separately reviewed migration is approved and deployed.
2. Keep the upload record immutable.
3. Invoke a dedicated authenticated OCR worker from a server-side path; never call OCR providers directly from the browser.
4. First prototype: self-hosted PaddleOCR worker, isolated from the main website and from Series 2 progression functions.
5. Worker response should be provider-neutral and contain:
   - upload_id
   - engine_name and engine_version
   - raw_text
   - text_regions (bounding boxes and confidence where available)
   - candidate_ids (raw exact strings; no normalization)
   - processing_status and structured error
6. Store OCR output separately from the original upload metadata. Do not overwrite the original image or any previous OCR/review result.
7. Manual review creates append-only revisions. The UI shows the source image beside candidates and allows correction.
8. Deduplicate only exact, operator-confirmed canonical IDs according to the approved project rules.
9. Add queue/retry/idempotency and per-upload processing state before enabling batch use.
10. Keep Telegram reporting downstream of operator approval; OCR itself must never send messages.

## 4. Provider boundary and data handling

- No screenshot has been sent to Google, AWS, Paddle hosted API or any other external OCR provider.
- PaddleOCR self-hosting is the recommended prototype because it avoids sending screenshots to a third-party hosted OCR endpoint, but it still requires choosing and paying for suitable hosting if deployed.
- No provider, paid plan, hosting resource, production migration, production deployment or Telegram send is authorized by this evaluation.

## 5. Proposed prototype acceptance test

Build a manually verified dataset of representative screenshots (including low-contrast text, multiple IDs per message, unusual punctuation, and varying screen scales). Evaluate:
- exact-string precision and recall at the ID-candidate level;
- false positives from names, timestamps and UI labels;
- preservation of `@`, underscores, case and ambiguous characters;
- per-image latency and resource consumption;
- confidence calibration and operator review workload.

Do not report a single OCR accuracy percentage until the labeled test set and scoring method are fixed.

## 6. Decision

**Recommended next engineering step:** implement a provider-neutral OCR worker contract and run a local/self-hosted PaddleOCR prototype in an isolated, non-production environment. Keep production integration gated on:
- the prototype results,
- an explicit hosting/cost decision,
- security review of worker authentication and image access,
- separately approved database migrations and deployment.

## 7. References

- PaddleOCR documentation: https://www.paddleocr.ai/main/en/
- PaddleOCR service deployment and model customization: https://github.com/PaddlePaddle/PaddleOCR
- Google Cloud Vision Data Usage FAQ: https://docs.cloud.google.com/vision/docs/data-usage
- AWS Textract data protection: https://docs.aws.amazon.com/textract/latest/dg/data-protection.html
- AWS Textract FAQ: https://aws.amazon.com/textract/faqs/

