# PLATO ID Scanner — Google Vision Adapter Implementation Note

**Version:** 0.1  
**Date:** 2026-11-11  
**Scope:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Status:** Pure adapter and fixture tests added; no provider call made

## Goal

Advance the agreed OCR path without repeating local OCR experiments or touching production infrastructure. The Scanner receives screenshots only through operator upload in its temporary management panel. This change prepares a narrow Google Cloud Vision response adapter while preserving the provider-neutral worker contract.

## Implemented

- Added `plato-id-scanner-google-vision-adapter.ts`, a pure mapper from synchronous Vision response structure to the existing `ScannerWorkerSuccess` envelope.
- Preserves `fullTextAnnotation.text` verbatim; uses `textAnnotations[0].description` only as fallback.
- Maps word text, confidence and bounding-box geometry without character substitutions or ID normalization.
- Emits stable safe error codes for provider-level errors and empty responses; does not propagate provider error details.
- Added four fixture tests: full text/word evidence, fallback text, provider error redaction, and empty response rejection.
- Added the new test file to the PR verification workflow.

## Deliberate limits

This is not an API client, dispatcher, queue, worker, or OCR activation. It contains no credentials, network calls, endpoint configuration, image transfer, storage access, or database writes. A passing fixture test proves only the adapter's deterministic mapping contract, not OCR accuracy on a real screenshot.

## Verification boundary

The existing worker contract validator is used by the adapter test to check the mapped success envelope. GitHub Actions must complete on the resulting branch head before this stage is marked CI-verified.

## Unchanged safeguards

- Operator uploads remain the only image ingress path.
- Original images remain private and immutable.
- Manager review remains mandatory.
- No provider image transfer, GCP project/API/key/billing setup, production migration, Storage change, deployment, merge, or Telegram send was performed.

## Next dependency

After CI passes, the next implementation step is a backend-only provider invocation/worker and authenticated result persistence. It remains blocked on owner-controlled Google Cloud credentials/project setup and confirmation of the exact approved sample image for external processing.