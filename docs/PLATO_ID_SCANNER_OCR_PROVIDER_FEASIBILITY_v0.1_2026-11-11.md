# PLATO ID Scanner — OCR Provider Feasibility Comparison

**Version:** 0.1  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner only  
**Status:** Desk research only; no provider selected or activated

## 1. Decision boundary

This report compares official public documentation only. No PLATO image, screenshot, OCR text, credentials, or personal data was sent to any provider. No account, API, billing profile, key, or service was created. The comparison does not authorize third-party image transfer or paid use.

## 2. Requirements from the approved Scanner design

- Extract visible text from Telegram screenshots, preserving raw OCR output and candidate evidence.
- Keep original images private in PLATO-controlled storage.
- Use an independent backend worker; never call OCR directly from the browser.
- Apply the existing `@` parser and exact-deduplication audit after OCR.
- Require human review before canonical approval and Telegram reporting.
- Prefer EU data processing where available; keep provider credentials server-side.
- Avoid ongoing server ownership/maintenance if a managed OCR API can satisfy privacy and cost constraints.

## 3. Official provider comparison

### Google Cloud Vision API — strongest technical fit for evaluation

- Supports `TEXT_DETECTION` for general image text and `DOCUMENT_TEXT_DETECTION` for dense text. Responses include extracted text and bounding boxes; this matches screenshot review and provenance needs.
- Official pricing page: first 1,000 units per month are free; Text Detection and Document Text Detection are listed at USD $1.50 per 1,000 units from 1,001 through 5,000,000; above 5,000,000 the listed tier is USD $0.60 per 1,000 units.
- The official data-use FAQ says submitted content is used only to provide Vision API, is not used to train/improve Cloud Vision, and is not made public or shared with third parties. For synchronous `BatchAnnotateImages` / `BatchAnnotateFiles`, image data is processed in memory and not persisted to disk. The FAQ notes temporary metadata logging.
- Google documents an EU endpoint (`eu-vision.googleapis.com`) and EU location option that stores/processes data only in the EU. The global endpoint does not guarantee regional confinement.
- Practical recommendation: if external OCR is later approved, evaluate the synchronous Vision API using the EU endpoint and the simplest `TEXT_DETECTION`/`DOCUMENT_TEXT_DETECTION` feature against a PLATO-authorized test set. This is a candidate, not an approved selection.

### Amazon Textract — technically capable, but less directly aligned

- `DetectDocumentText` extracts text and handwriting from documents; the service is designed for document extraction. It can be tested against screenshots, but the official page does not establish it as more accurate for Telegram chat screenshots.
- Official pricing page's example for US West (Oregon) lists USD $0.0015 per page for the first one million pages, i.e. USD $1.50 per 1,000 pages. This is a regional example, not a Denmark/EU quote.
- AWS Free Tier page currently states 1,000 Detect Document Text pages per month for three months for new AWS customers.
- The reviewed Textract data-protection page describes HTTPS and security responsibilities, but did not provide the same clear OCR request-image non-retention / no-training statement found in Google's Vision API FAQ. Do not infer that AWS uses submitted OCR content for training; this review simply did not establish equivalent service-specific terms.
- AWS is a viable alternative only after checking the exact EU region price, data handling and service terms for the account.

### Azure Vision OCR / Read — potentially viable, price not sufficiently resolved

- Official pricing page documents OCR and Read capabilities, a Free F0 tier of up to 5,000 free transactions per month in eligible regions, and notes that Read is intended for higher-accuracy printed and handwritten text.
- The publicly extracted pricing table did not expose numeric Standard tier prices for the selected OCR/Read rows; it renders placeholders. A reliable per-image cost cannot be stated from this page without selecting region/currency in the Azure calculator or account pricing.
- The page lists Denmark East among available regions, but this alone does not prove the selected OCR SKU is available there or that all data processing is confined to Denmark/EU.
- Keep as a secondary candidate pending region-specific price and data-protection confirmation.

## 4. Indicative cost scenarios

Google published standard Text Detection / Document Text Detection tier, assuming one OCR feature per screenshot and no other billable cloud resources:

| Images per month | Indicative OCR feature cost |
|---:|---:|
| 100 | $0 |
| 1,000 | $0 |
| 2,000 | $1.50 |
| 5,000 | $6.00 |
| 10,000 | $13.50 |

These calculations use the published first-1,000-free tier and $1.50 per 1,000 units thereafter, prorated by unit. They exclude any separate hosting, networking, storage, tax, currency conversion, or other cloud charges. Billing configuration and current regional SKU must be checked before activation.

## 5. Recommendation (not an authorization)

Google Cloud Vision is the best first candidate for a controlled proof-of-concept because the official documentation provides: (1) explicit OCR output with word-level bounding boxes, (2) an EU-only endpoint/location option, (3) a clear no-training statement, (4) synchronous image processing in memory without disk persistence, and (5) transparent low-volume pricing.

Before any live use, the owner must explicitly approve all of the following: Google as the processor, transfer of PLATO screenshots to Google, EU endpoint configuration, account/billing setup (even if expected cost is zero), and a maximum monthly spend/usage cap. A representative-image accuracy test also needs separate approval because it requires sending images to the provider.

## 6. Proposed safe implementation path after approval

1. Create/use an owner-controlled Google Cloud project; enable only Cloud Vision API.
2. Configure the EU endpoint, service account with least privilege, and server-side secret storage.
3. Implement one backend OCR adapter for synchronous `DOCUMENT_TEXT_DETECTION` or `TEXT_DETECTION`; no browser-to-provider calls.
4. Download only the specific private image to the worker using a short-lived capability; send image bytes only to the approved EU endpoint.
5. Persist raw text, provider/model metadata, confidence/geometry when returned, and source hash; then call the existing `@` extraction and duplicate-audit adapter.
6. Keep results provisional until manager review; Telegram remains downstream of approved revisions only.
7. Add quotas/budgets, request timeouts, idempotency, retry limits, redacted logs, and a kill switch.

## 7. Explicitly not done

- No provider selected in code or production.
- No API key/service account/project created or configured.
- No image sent to Google, AWS, Microsoft, or another external service.
- No billing enabled or costs incurred.
- No migration, production DB write, Storage change, deployment, merge, or Telegram send.

## 8. Official sources reviewed

- Google Cloud Vision pricing: https://cloud.google.com/vision/pricing
- Google Cloud Vision data-use FAQ: https://docs.cloud.google.com/vision/docs/data-usage
- Google Cloud Vision OCR and EU endpoint documentation: https://docs.cloud.google.com/vision/docs/ocr
- Amazon Textract pricing: https://aws.amazon.com/textract/pricing/
- Amazon Textract data protection: https://docs.aws.amazon.com/textract/latest/dg/data-protection.html
- Azure Vision pricing: https://azure.microsoft.com/en-us/pricing/details/computer-vision/

## 9. Change log

- v0.1 — First desk-research comparison of Google Cloud Vision, Amazon Textract and Azure Vision OCR. No external image transfer or activation.