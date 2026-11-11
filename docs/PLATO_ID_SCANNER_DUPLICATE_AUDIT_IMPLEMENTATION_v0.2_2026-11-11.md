# PLATO ID Scanner — Duplicate Audit Implementation Report

**Version:** 0.2  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Status:** Implemented on feature branch; automated verification pending

## 1. Scope

Separate image reading from canonical ID processing: OCR extracts candidates; Scanner processing performs exact duplicate handling and preserves the audit; manager review remains authoritative; Telegram consumes only approved canonical output.

## 2. Changes completed

- Added `src/plato-id-scanner-duplicate-audit.ts` with deterministic exact-string deduplication.
- Preserves every later duplicate occurrence with its own `scan_id`, candidate index, source offsets, and a reference to the first occurrence.
- Produces first-seen accepted IDs, first-occurrence provenance, duplicate records, occurrence counts, and total/unique/duplicate counts.
- Added multi-image batch audit support. The caller supplies scans in chronological upload order; provenance is retained across images.
- Updated the provider-neutral OCR result adapter so its provisional unique ID list is derived from the audit while all raw extraction occurrences remain available.
- Updated the manager upload list to show an aggregated cross-image duplicate report, including the source and first-occurrence filenames when OCR audit data exists.
- Added a per-image duplicate audit disclosure to each review card.
- Added Deno tests for exact duplicates, case/punctuation/confusable preservation, invalid provenance, and duplicates spanning multiple images.
- Added extraction and duplicate-audit tests to `.github/workflows/verify.yml`.
- Updated `docs/PLATO_ID_SCANNER_OCR_WORKER_CONTRACT_v0.1.md` with the duplicate-audit payload contract.

## 3. Rules preserved

- Exact raw-string equality only.
- No case folding, trimming, punctuation cleanup, Unicode normalization, O/0 or I/l/1 substitution, or fuzzy matching.
- First occurrence wins in the provisional preview; later exact matches remain visible in the duplicate audit.
- OCR output remains provisional and is never approved or published by the adapter.
- Manager approval remains authoritative. Telegram does not run a second deduplication implementation.

## 4. Verification

- GitHub confirms the PR head contains these feature-branch commits and PR #123 remains open, Draft and unmerged.
- The verification workflow now includes the new extraction and duplicate-audit tests.
- GitHub Actions API returned zero workflow runs for the latest inspected commit; combined commit status is empty. Therefore tests and TypeScript build are **not claimed as passed**.
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
2. Connect OCR worker result persistence so `extraction_candidates` and `duplicate_audit` are stored for each immutable scan.
3. Implement the secure OCR dispatcher/worker and batch lifecycle. The cross-image audit UI can display only after those OCR results exist.
4. Verify owner/operator RLS and Storage access in an approved test procedure before any production activation.

## 7. Change record

- Added exact duplicate audit engine, multi-image aggregator, tests, and manager UI summaries.
- Updated OCR adapter, worker contract, CI test list and PR #123 description.
- Feature branch only; PR #123 remains Draft and unmerged.