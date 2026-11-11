# PLATO ID Scanner — Duplicate Audit Implementation Report

**Version:** 0.3  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Branch:** `feature/plato-id-scanner-v0-1`  
**Status:** Implementation committed; latest verification pending

## 1. Scope

Separate image reading from canonical ID processing: OCR extracts candidates; Scanner processing performs exact duplicate handling and preserves the audit; manager review remains authoritative; Telegram consumes only approved canonical output.

## 2. Changes completed

- Added `src/plato-id-scanner-duplicate-audit.ts` with deterministic exact-string deduplication.
- Preserves every later duplicate occurrence with its own `scan_id`, candidate index, source offsets, and a reference to the first occurrence.
- Produces first-seen accepted IDs, first-occurrence provenance, duplicate records, occurrence counts, and total/unique/duplicate counts.
- Added multi-image batch audit support. The caller supplies scans in chronological upload order; provenance is retained across images.
- Updated the provider-neutral OCR result adapter so its provisional unique ID list is derived from the audit while all raw extraction occurrences remain available.
- Updated the manager upload list to show an aggregated cross-image duplicate report, including source and first-occurrence filenames when OCR audit data exists.
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

## 4. Verification record

- GitHub Actions run `43019087850`: `npm install`, `npm run typecheck`, `npm run build`, Series 2 tests, Scanner contract tests and Scanner extraction tests passed.
- The new duplicate-audit Deno test initially failed because its test import pointed to the wrong relative module path. This was identified from the CI log and corrected in commit `7194fca3e1da1061d4109742cb27e6ce080456a7`.
- The first run stopped at that failure, so later Deno tests in that run were skipped.
- No new workflow run/status was returned for the corrected latest commit at the time of this report. The duplicate-audit tests are therefore not yet claimed as passed.
- The separate website build/artifact-preparation workflow completed successfully; its deploy job is excluded for pull-request refs, so no production deployment occurred.

## 5. Not done / authorization boundaries

- No Scanner SQL migration was applied.
- No production Supabase tables, policies, buckets, or records were changed.
- No OCR engine, API, worker, or paid service was activated.
- No images were transferred to an external provider.
- No Telegram bot credentials or destination were configured and no message was sent.
- No merge, production deployment, or Main Website changes were made.

## 6. Remaining engineering work

1. Obtain a successful run of the duplicate-audit and result-adapter tests against the corrected latest commit.
2. Connect OCR worker result persistence so `extraction_candidates` and `duplicate_audit` are stored for each immutable scan.
3. Implement the secure OCR dispatcher/worker and batch lifecycle. The cross-image audit UI can display only after OCR results exist.
4. Verify owner/operator RLS and Storage access in an approved test procedure before any production activation.

## 7. Change record

- Added exact duplicate audit engine, multi-image aggregator, tests, and manager UI summaries.
- Updated OCR adapter, worker contract, CI test list and PR #123 description.
- Corrected the Deno test's relative import after CI exposed it.
- Feature branch only; PR #123 remains Draft and unmerged.