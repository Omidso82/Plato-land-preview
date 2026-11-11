/**
 * Strict message-text candidate extraction for PLATO ID Scanner.
 *
 * Only whitespace-delimited tokens whose first character is "@" are candidates.
 * The raw token is preserved exactly; this helper does not validate, normalize,
 * trim punctuation, or merge lookalike IDs. OCR text is not trusted as canonical
 * until a human reviewer approves it.
 */
export interface AtSignCandidate {
  raw_value: string;
  start: number;
  end: number;
}

export function extractAtSignCandidates(text: string): AtSignCandidate[] {
  const candidates: AtSignCandidate[] = [];
  const pattern = /(^|\\s)(@[^\\s]+)/gu;
  for (const match of text.matchAll(pattern)) {
    const raw = match[2];
    const start = (match.index ?? 0) + match[1].length;
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
