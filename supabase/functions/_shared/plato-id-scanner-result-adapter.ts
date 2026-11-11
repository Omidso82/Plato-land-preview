import type { ScannerWorkerSuccess } from "./plato-id-scanner-contract.ts";
import { extractAtSignCandidates } from "../../../src/plato-id-scanner-extraction.ts";
import { auditExactScannerDuplicates } from "../../../src/plato-id-scanner-duplicate-audit.ts";

/**
 * Converts provider-neutral OCR into provisional review data.
 * Every occurrence is retained in the duplicate audit; only the first exact
 * occurrence enters the provisional unique-ID list. Nothing is approved here.
 */
export interface ScannerProvisionalOcrResult {
  ids: string[];
  raw_text: string;
  engine: ScannerWorkerSuccess["engine"];
  provider_candidates: ScannerWorkerSuccess["candidates"];
  extraction_rule: "at_sign_v0.2";
  review_required: true;
  extraction_candidates: Array<{ raw_value: string; start: number; end: number }>;
  duplicate_audit: ReturnType<typeof auditExactScannerDuplicates>;
}

export function adaptScannerWorkerSuccessToReviewPayload(
  result: ScannerWorkerSuccess,
): ScannerProvisionalOcrResult {
  const extracted = extractAtSignCandidates(result.raw_text);
  const duplicateAudit = auditExactScannerDuplicates(extracted.map((candidate, candidateIndex) => ({
    raw_value: candidate.raw_value,
    scan_id: result.scan_id,
    candidate_index: candidateIndex,
    start: candidate.start,
    end: candidate.end,
  })));
  return {
    ids: duplicateAudit.accepted_ids,
    raw_text: result.raw_text,
    engine: result.engine,
    provider_candidates: result.candidates,
    extraction_rule: "at_sign_v0.2",
    review_required: true,
    extraction_candidates: extracted,
    duplicate_audit: duplicateAudit,
  };
}
