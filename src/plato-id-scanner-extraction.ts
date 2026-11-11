/**
 * Extract Plato ID candidates from OCR text using @ as the start marker.
 *
 * A candidate starts at each @ and ends at the next @, whitespace, or line break.
 * Supports separate lines, spaces, and directly concatenated IDs.
 * Raw spelling is preserved; no normalization or fuzzy matching is performed.
 */
export interface AtSignCandidate {
  raw_value: string;
  start: number;
  end: number;
}

export function extractAtSignCandidates(text: string): AtSignCandidate[] {
  const candidates: AtSignCandidate[] = [];
  const pattern = /@([^@\s]+)/gu;
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
