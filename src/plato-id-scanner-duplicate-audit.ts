/**
 * Auditable exact-deduplication for PLATO ID Scanner.
 * Keeps every occurrence and its source; only exact raw strings are duplicates.
 * No case folding, trimming, punctuation cleanup, Unicode normalization or fuzzy matching.
 */
export interface ScannerCandidateOccurrence {
  raw_value: string;
  scan_id: string;
  candidate_index: number;
  start?: number;
  end?: number;
  flags?: string[];
  confidence?: number | null;
}

export interface ScannerDuplicateOccurrence extends ScannerCandidateOccurrence {
  duplicate_of_scan_id: string;
  duplicate_of_candidate_index: number;
  duplicate_number: number;
}

export interface ScannerDuplicateAudit {
  accepted_ids: string[];
  first_occurrences: ScannerCandidateOccurrence[];
  duplicates: ScannerDuplicateOccurrence[];
  occurrence_counts: Array<{ id: string; count: number }>;
  total_occurrences: number;
  unique_count: number;
  duplicate_count: number;
}

export function auditExactScannerDuplicates(
  occurrences: readonly ScannerCandidateOccurrence[],
): ScannerDuplicateAudit {
  const firstById = new Map<string, ScannerCandidateOccurrence>();
  const counts = new Map<string, number>();
  const acceptedIds: string[] = [];
  const firstOccurrences: ScannerCandidateOccurrence[] = [];
  const duplicates: ScannerDuplicateOccurrence[] = [];

  for (const occurrence of occurrences) {
    if (typeof occurrence.raw_value !== "string" || occurrence.raw_value.length === 0) continue;
    if (!occurrence.scan_id || !Number.isInteger(occurrence.candidate_index) || occurrence.candidate_index < 0) {
      throw new Error("Each Scanner occurrence requires a scan ID and non-negative candidate index");
    }
    const previous = firstById.get(occurrence.raw_value);
    const count = (counts.get(occurrence.raw_value) ?? 0) + 1;
    counts.set(occurrence.raw_value, count);
    if (!previous) {
      firstById.set(occurrence.raw_value, occurrence);
      acceptedIds.push(occurrence.raw_value);
      firstOccurrences.push({ ...occurrence, flags: occurrence.flags ? [...occurrence.flags] : undefined });
      continue;
    }
    duplicates.push({
      ...occurrence,
      flags: occurrence.flags ? [...occurrence.flags] : undefined,
      duplicate_of_scan_id: previous.scan_id,
      duplicate_of_candidate_index: previous.candidate_index,
      duplicate_number: count - 1,
    });
  }

  return {
    accepted_ids: acceptedIds,
    first_occurrences: firstOccurrences,
    duplicates,
    occurrence_counts: [...counts.entries()].map(([id, count]) => ({ id, count })),
    total_occurrences: occurrences.length,
    unique_count: acceptedIds.length,
    duplicate_count: duplicates.length,
  };
}
