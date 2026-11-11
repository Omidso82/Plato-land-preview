import type { ScannerWorkerSuccess } from "./plato-id-scanner-contract.ts";
import { extractAtSignCandidates, uniqueExactAtSignCandidates } from "../../../src/plato-id-scanner-extraction.ts";

/**
 * Converts a provider-neutral OCR success into the provisional payload consumed
 * by the Scanner review UI. This is an adapter only; it does not persist data,
 * approve IDs, or dispatch Telegram messages.
 */
export interface ScannerProvisionalOcrResult {
  ids: string[];
  raw_text: string;
  engine: ScannerWorkerSuccess["engine"];
  provider_candidates: ScannerWorkerSuccess["candidates"];
  extraction_rule: "at_sign_v0.2";
  review_required: true;
  extraction_candidates: Array<{ raw_value: string; start: number; end: number }>;
}

export function adaptScannerWorkerSuccessToReviewPayload(
  result: ScannerWorkerSuccess,
): ScannerProvisionalOcrResult {
  const extracted = uniqueExactAtSignCandidates(extractAtSignCandidates(result.raw_text));
  return {
    ids: extracted.map(candidate => candidate.raw_value),
    raw_text: result.raw_text,
    engine: result.engine,
    provider_candidates: result.candidates,
    extraction_rule: "at_sign_v0.2",
    review_required: true,
    extraction_candidates: extracted,
  };
}
