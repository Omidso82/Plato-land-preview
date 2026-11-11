# PLATO ID Scanner — Duplicate Audit Implementation Report

**Version:** 0.1  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Status:** Implemented on feature branch; automated verification pending

## 1. Scope

Implement the approved separation of responsibilities: OCR extracts candidate strings; Scanner processing performs exact duplicate handling and preserves the audit; manager review remains authoritative; Telegram consumes only approved canonical output.

## 2. Changes completed

- Added `src/plato-id-scanner-duplicate-audit.ts` with deterministic exact-string deduplication.
- Preserves every later duplicate occurrence with its own `scan_id`, candidate index, source offsets, and a reference to the first occurrence.
- Produces first-seen accepted IDs, first-occurrence provenance, duplicate records, occurrence counts, and total/unique/duplicate counts.
- Added multi-image batch audit support. The caller supplies scans in deterministic upload order; provenance is retained across images.
- Updated the provider-neutral OCR result adapter so its provisional unique ID list is derived from the audit while all raw extraction occurrences remain available.
- Added a duplicate-audit disclosure to the Scanner review card when a persisted OCR result contains `duplicate_audit`.
- Added Deno tests for exact duplicates, case/punctuation/confusable preservation, invalid provenance, and duplicates spanning multiple images.
- Added the extraction and duplicate-audit tests to `.github/workflows/verify.yml`.
- Updated `docs/PLATO_ID_SCANNER_OCR_WORKER_CONTRACT_v0.1.md` with the duplicate-audit payload contract.

## 3. Rules preserved

- Exact raw-string equality only.
- No case folding, trimming, punctuation cleanup, Unicode normalization, O/0 or I/l/1 substitution, or fuzzy matching.
- First occurrence wins in the provisional preview; later exact matches remain visible in the duplicate audit.
- OCR output remains provisional and is never approved or published by the adapter.
- Manager approval remains authoritative. Telegram does not run a second deduplication implementation.

## 4. Verification

- GitHub branch writes were confirmed and the PR head advanced to the implementation commits.
- The verification workflow now includes the new extraction and duplicate-audit tests.
- No GitHub Actions run or commit status was returned for the latest head at the time of this report; therefore tests and TypeScript build are **not claimed as passed**.
- A local Deno runtime was unavailable in the working environment; local Deno tests could not be executed.

## 5. Not done / authorization boundaries

- No Scanner SQL migration was applied.
- No production Supabase tables, policies, buckets, or records were changed.
- No OCR engine, API, worker, or paid service was activated.
- No images were transferred to an external provider.
- No Telegram bot credentials or destination were configured and no message was sent.
- No merge, production deployment, or Main Website changes were made.

## 6. Remaining engineering work

1. Obtain successful CI verification of typecheck, build, and all Scanner tests.
2. Integrate the multi-image audit into the future OCR batch persistence path so the cross-image audit is stored and displayed as a batch-level manager report, not only per-image.
3. Implement the actual OCR worker/dispatcher and secure result persistence after provider/hosting and image privacy decisions are approved.
4. Verify owner/operator RLS and Storage access in an approved test procedure before any production activation.

## 7. Change record

- Added exact duplicate audit engine and tests.
- Updated OCR adapter, manager review UI, worker contract and CI test list.
- Feature branch only; PR #123 remains Draft and unmerged.
- Latest known branch commit should be read from GitHub at handover; this document does not hardcode a potentially stale head SHA.