export type Series3BracketToken = {
  id: string;
  label: string;
  source: "first" | "second" | "third" | "winner";
  group?: string;
};
export type Series3BracketMatch = { id: string; a: Series3BracketToken; b: Series3BracketToken };
export type Series3BracketSnapshot = {
  tokens: Series3BracketToken[];
  round32: Series3BracketMatch[];
  round16: Series3BracketMatch[];
  quarterfinals: Series3BracketMatch[];
  semifinals: Series3BracketMatch[];
  final: Series3BracketMatch[];
};

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildProtectedRound32(tokens: Series3BracketToken[]): {
  tokens: Series3BracketToken[];
  round32: Series3BracketMatch[];
} {
  const topTwo = shuffled(tokens.filter(token => token.source === "first" || token.source === "second"));
  const thirds = shuffled(tokens.filter(token => token.source === "third"));
  if (topTwo.length !== 24 || thirds.length !== 8) {
    throw new Error("Round of 32 requires exactly 24 first/second entrants and eight third-place placeholders.");
  }
  const opponents: Series3BracketToken[] = [];
  const pairings: Array<[Series3BracketToken, Series3BracketToken]> = [];
  const pairRemaining = (pool: Series3BracketToken[]): boolean => {
    if (pool.length === 0) return true;
    const first = pool[0];
    for (const candidate of shuffled(pool.slice(1).filter(player => player.group !== first.group))) {
      const rest = pool.slice(1).filter(player => player.id !== candidate.id);
      pairings.push([first, candidate]);
      if (pairRemaining(rest)) return true;
      pairings.pop();
    }
    return false;
  };
  const assignThirds = (index: number, available: Series3BracketToken[]): boolean => {
    if (index === thirds.length) return available.length === 16 && pairRemaining(available);
    // One placeholder opponent from each of eight distinct groups guarantees
    // that any valid set of eight distinct third-place groups can be matched.
    const usedOpponentGroups = new Set(opponents.map(player => player.group));
    const candidates = shuffled(available.filter(player => player.group && !usedOpponentGroups.has(player.group)));
    for (const candidate of candidates) {
      opponents.push(candidate);
      if (assignThirds(index + 1, available.filter(player => player.id !== candidate.id))) return true;
      opponents.pop();
    }
    return false;
  };
  if (!assignThirds(0, topTwo)) {
    throw new Error("No valid Round-of-32 draw without same-group clashes could be constructed.");
  }
  const matches: Array<Omit<Series3BracketMatch, "id">> = [
    ...pairings.map(([a, b]) => ({ a, b })),
    ...thirds.map((third, index) => ({ a: third, b: opponents[index] })),
  ];
  const round32 = shuffled(matches).map((match, index) => ({ ...match, id: "R32-" + (index + 1) }));
  const all = round32.flatMap(match => [match.a, match.b]);
  if (all.length !== 32 || new Set(all.map(token => token.id)).size !== 32) {
    throw new Error("Round-of-32 entrants are not unique.");
  }
  for (const match of round32) {
    if (match.a.group && match.b.group && match.a.group === match.b.group) {
      throw new Error("A same-group Round-of-32 pairing was generated.");
    }
    if ((match.a.source === "third") === (match.b.source === "third")) {
      throw new Error("Every third-place placeholder must face exactly one first/second-place entrant.");
    }
  }
  const placeholderOpponentGroups = round32
    .filter(match => match.a.source === "third" || match.b.source === "third")
    .map(match => (match.a.source === "third" ? match.b : match.a).group);
  if (new Set(placeholderOpponentGroups).size !== 8) {
    throw new Error("Third-place placeholder opponents must come from eight distinct groups.");
  }
  return { tokens: shuffled(all), round32 };
}

export function assignThirdPlaceQualifiers(
  bracket: Series3BracketSnapshot,
  qualifiers: Series3BracketToken[],
): Series3BracketSnapshot {
  const placeholders = bracket.round32.flatMap(match => [
    { token: match.a, opponent: match.b },
    { token: match.b, opponent: match.a },
  ]).filter(slot => slot.token.source === "third");

  if (placeholders.length !== 8 || qualifiers.length !== 8) {
    throw new Error("Exactly eight placeholders and eight third-place qualifiers are required.");
  }
  if (qualifiers.some(q => q.source !== "third" || !q.group || !q.id || !q.label)) {
    throw new Error("Every third-place qualifier must have a unique identity and group.");
  }
  if (new Set(qualifiers.map(q => q.id)).size !== 8 || new Set(qualifiers.map(q => q.group)).size !== 8) {
    throw new Error("Third-place qualifier IDs and groups must each be unique.");
  }
  if (qualifiers.some(q => placeholders.some(p => p.token.id === q.id))) {
    throw new Error("A real qualifier ID collides with a placeholder ID.");
  }

  const ordered = [...qualifiers].sort((a, b) =>
    placeholders.filter(p => p.opponent.group !== a.group).length -
    placeholders.filter(p => p.opponent.group !== b.group).length ||
    String(a.group).localeCompare(String(b.group), "en")
  );
  const assignment = new Map<string, Series3BracketToken>();
  const usedSlots = new Set<string>();
  const search = (index: number): boolean => {
    if (index === ordered.length) return true;
    const qualifier = ordered[index];
    const candidates = placeholders
      .filter(slot => !usedSlots.has(slot.token.id) && slot.opponent.group !== qualifier.group)
      .sort((a, b) => a.token.id.localeCompare(b.token.id, "en"));
    for (const slot of candidates) {
      usedSlots.add(slot.token.id);
      assignment.set(slot.token.id, qualifier);
      if (search(index + 1)) return true;
      assignment.delete(slot.token.id);
      usedSlots.delete(slot.token.id);
    }
    return false;
  };
  if (!search(0)) {
    throw new Error("No complete third-place assignment can avoid same-group Round-of-32 clashes.");
  }

  const replace = (token: Series3BracketToken): Series3BracketToken =>
    token.source === "third" ? assignment.get(token.id)! : token;
  const round32 = bracket.round32.map(match => ({ ...match, a: replace(match.a), b: replace(match.b) }));
  const tokens = bracket.tokens.map(replace);
  const all = round32.flatMap(match => [match.a, match.b]);
  if (
    all.length !== 32 ||
    new Set(all.map(token => token.id)).size !== 32 ||
    round32.some(match => match.a.group && match.a.group === match.b.group) ||
    all.filter(token => token.source === "third" && token.group).length !== 8
  ) {
    throw new Error("Final third-place assignment validation failed.");
  }
  return { ...bracket, tokens, round32 };
}
