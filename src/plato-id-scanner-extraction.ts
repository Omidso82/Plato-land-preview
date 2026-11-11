/**
 * Extract Plato ID candidates from OCR text using @ as the start marker.
 *
 * A candidate starts at each @ and ends at the next @, whitespace, or line break.
 * This supports IDs on separate lines, separated by spaces, or concatenated
 * directly together (for example: @First@Second@Third).
 *
 * Raw spelling is preserved. No normalization, punctuation repair, or fuzzy
 * matching is performed; candidates remain provisional until human review.
 */
export interface AtSignCandidate {
  raw_value: string;
  start: number;
  end: number;
}

export function extractAtSignCandidates(text: string): AtSignCandidate[] {
  const candidates: AtSignCandidate[] = [];
  const pattern = /@([^@\\s]+)/gu;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const raw = match[0];
    candidates.push({ raw_value: raw, start, end: start + raw.length });
  }
  return candidates;
}

/** Exact-string de-duplication only; case and punctuation remain significant. */
export function uniqueExactAtSignCandidates(candidates: AtSignCandidate[]): AtSignCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.raw_value)) return false;
    seen.add(candidate.raw_value);
    return true;
  });
}
