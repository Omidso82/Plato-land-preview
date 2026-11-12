import type { ScannerWorkerSuccess } from "./plato-id-scanner-contract.ts";

/**
 * Self-contained provisional result adapter for the deployed Edge Function.
 * It deliberately mirrors the source extraction and exact-deduplication rules
 * without importing application files outside supabase/functions.
 */
export interface ScannerProvisionalOcrResult {
  ids: string[];
  raw_text: string;
  engine: ScannerWorkerSuccess["engine"];
  provider_candidates: ScannerWorkerSuccess["candidates"];
  extraction_rule: "at_sign_v0.2";
  review_required: true;
  extraction_candidates: Array<{ raw_value: string; start: number; end: number }>;
  duplicate_audit: {
    accepted_ids: string[];
    first_occurrences: Array<{ raw_value: string; scan_id: string; candidate_index: number; start: number; end: number }>;
    duplicates: Array<{
      raw_value: string; scan_id: string; candidate_index: number; start: number; end: number;
      duplicate_of_scan_id: string; duplicate_of_candidate_index: number; duplicate_number: number;
    }>;
    occurrence_counts: Array<{ id: string; count: number }>;
    total_occurrences: number;
    unique_count: number;
    duplicate_count: number;
  };
}

function extractAtSignCandidates(text: string) {
  const candidates: Array<{ raw_value: string; start: number; end: number }> = [];
  const pattern = /@([^@\s]+)/gu;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const raw = match[0];
    candidates.push({ raw_value: raw, start, end: start + raw.length });
  }
  return candidates;
}

export function adaptScannerWorkerSuccessToReviewPayload(
  result: ScannerWorkerSuccess,
): ScannerProvisionalOcrResult {
  const extracted = extractAtSignCandidates(result.raw_text);
  const firstById = new Map<string, { raw_value: string; scan_id: string; candidate_index: number; start: number; end: number }>();
  const counts = new Map<string, number>();
  const acceptedIds: string[] = [];
  const firstOccurrences: ScannerProvisionalOcrResult["duplicate_audit"]["first_occurrences"] = [];
  const duplicates: ScannerProvisionalOcrResult["duplicate_audit"]["duplicates"] = [];

  extracted.forEach((candidate, candidateIndex) => {
    const occurrence = {
      raw_value: candidate.raw_value,
      scan_id: result.scan_id,
      candidate_index: candidateIndex,
      start: candidate.start,
      end: candidate.end,
    };
    const previous = firstById.get(occurrence.raw_value);
    const count = (counts.get(occurrence.raw_value) ?? 0) + 1;
    counts.set(occurrence.raw_value, count);
    if (!previous) {
      firstById.set(occurrence.raw_value, occurrence);
      acceptedIds.push(occurrence.raw_value);
      firstOccurrences.push(occurrence);
    } else {
      duplicates.push({
        ...occurrence,
        duplicate_of_scan_id: previous.scan_id,
        duplicate_of_candidate_index: previous.candidate_index,
        duplicate_number: count - 1,
      });
    }
  });

  const duplicateAudit: ScannerProvisionalOcrResult["duplicate_audit"] = {
    accepted_ids: acceptedIds,
    first_occurrences: firstOccurrences,
    duplicates,
    occurrence_counts: [...counts.entries()].map(([id, count]) => ({ id, count })),
    total_occurrences: extracted.length,
    unique_count: acceptedIds.length,
    duplicate_count: duplicates.length,
  };

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
