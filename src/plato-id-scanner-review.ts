/**
 * Pure review primitives for the temporary PLATO ID Scanner.
 *
 * IDs are intentionally treated as opaque strings: no case folding, Unicode
 * normalization, O/0 or I/1 substitution, or fuzzy matching is performed.
 */
export type ScannerReviewStatus = "needs_review" | "approved";

export interface ScannerReviewRevision {
  revision: number;
  status: ScannerReviewStatus;
  ids: string[];
  createdAt: string;
  createdBy: string;
  previousRevision: number | null;
  note: string | null;
}

export interface ScannerReviewInput {
  revision: number;
  ids: readonly string[];
  createdAt: string;
  createdBy: string;
  previousRevision?: number | null;
  note?: string | null;
}

/** Remove only exact duplicates; preserve spelling, case, and first-seen order. */
export function uniqueExactScannerIds(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    // Whitespace-only OCR noise is not an ID. Do not otherwise rewrite it.
    if (!value.trim()) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

/** Create an immutable review snapshot. Caller must append it, never overwrite history. */
export function createScannerReviewRevision(
  input: ScannerReviewInput,
): ScannerReviewRevision {
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    throw new Error("Review revision must be a positive integer");
  }
  if (!input.createdBy.trim()) throw new Error("Reviewer identity is required");
  if (!Number.isFinite(Date.parse(input.createdAt))) {
    throw new Error("Review timestamp must be a valid date");
  }
  const previous = input.previousRevision ?? null;
  if (previous !== null && (!Number.isInteger(previous) || previous < 1 || previous >= input.revision)) {
    throw new Error("Previous revision must be lower than the new revision");
  }
  return Object.freeze({
    revision: input.revision,
    status: "approved" as const,
    ids: Object.freeze(uniqueExactScannerIds(input.ids)) as unknown as string[],
    createdAt: input.createdAt,
    createdBy: input.createdBy,
    previousRevision: previous,
    note: input.note?.trim() || null,
  });
}

/** Compare approved snapshots without altering either one. */
export function diffScannerReviewRevisions(
  before: readonly string[],
  after: readonly string[],
): { added: string[]; removed: string[]; unchanged: string[] } {
  const oldIds = uniqueExactScannerIds(before);
  const newIds = uniqueExactScannerIds(after);
  const oldSet = new Set(oldIds);
  const newSet = new Set(newIds);
  return {
    added: newIds.filter(id => !oldSet.has(id)),
    removed: oldIds.filter(id => !newSet.has(id)),
    unchanged: newIds.filter(id => oldSet.has(id)),
  };
}
