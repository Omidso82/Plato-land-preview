import {
  assignThirdPlaceQualifiers,
  buildProtectedRound32,
  buildOwnerApprovedSeries3Bracket,
  type Series3BracketSnapshot,
  type Series3BracketToken,
} from "../../../src/series3KnockoutBracket.ts";

const groups = "ABCDEFGHIJKL".split("");
const entrants: Series3BracketToken[] = [
  ...groups.map(group => ({ id: `1-${group}`, label: `First ${group}`, source: "first" as const, group })),
  ...groups.map(group => ({ id: `2-${group}`, label: `Second ${group}`, source: "second" as const, group })),
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `3-BEST-${index + 1}`,
    label: `Third placeholder ${index + 1}`,
    source: "third" as const,
  })),
];

function combinations<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  const visit = (start: number, current: T[]) => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i <= items.length - (size - current.length); i++) {
      current.push(items[i]);
      visit(i + 1, current);
      current.pop();
    }
  };
  visit(0, []);
  return result;
}

Deno.test("protected Round of 32 contains no same-group match and uses eight distinct placeholder opponents", () => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const draw = buildProtectedRound32(entrants);
    if (draw.round32.length !== 16) throw new Error("Expected 16 Round-of-32 matches");
    if (draw.round32.some(match => match.a.group && match.a.group === match.b.group)) {
      throw new Error("Same-group Round-of-32 pairing found");
    }
    const placeholderMatches = draw.round32.filter(match => match.a.source === "third" || match.b.source === "third");
    const opponentGroups = placeholderMatches.map(match => (match.a.source === "third" ? match.b : match.a).group);
    if (placeholderMatches.length !== 8 || new Set(opponentGroups).size !== 8) {
      throw new Error("Expected eight placeholder opponents from eight distinct groups");
    }
    const topTwoMatches = draw.round32.filter(match => match.a.source !== "third" && match.b.source !== "third");
    if (topTwoMatches.length !== 8) {
      throw new Error("Expected eight matches pairing first/second entrants against first/second entrants");
    }
  }
});

Deno.test("rejects entrant pools without exactly one first and second from every group", () => {
  const malformed = entrants.filter(token => token.id !== "2-A");
  malformed.push({ id: "2-A-duplicate", label: "Duplicate second", source: "second", group: "B" });
  let rejected = false;
  try {
    buildProtectedRound32(malformed);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected malformed group distribution to be rejected");
});

Deno.test("rejects an old bracket that pairs two third-place placeholders together", () => {
  const draw = buildProtectedRound32(entrants);
  const round32 = draw.round32.map(match => ({ ...match }));
  const thirdMatches = round32.filter(match => match.a.source === "third" || match.b.source === "third");
  const firstMatch = thirdMatches[0];
  const secondMatch = thirdMatches[1];
  const firstTopTwo = firstMatch.a.source === "third" ? firstMatch.b : firstMatch.a;
  const secondThird = secondMatch.a.source === "third" ? secondMatch.a : secondMatch.b;
  if (firstMatch.a.source === "third") firstMatch.b = secondThird;
  else firstMatch.a = secondThird;
  if (secondMatch.a.source === "third") secondMatch.a = firstTopTwo;
  else secondMatch.b = firstTopTwo;
  const malformed: Series3BracketSnapshot = {
    tokens: draw.tokens,
    round32,
    round16: [],
    quarterfinals: [],
    semifinals: [],
    final: [],
  };
  const qualifiers: Series3BracketToken[] = groups.slice(0, 8).map(group => ({
    id: "THIRD-" + group,
    label: "Third " + group,
    source: "third",
    group,
  }));
  let rejected = false;
  try {
    assignThirdPlaceQualifiers(malformed, qualifiers);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("Expected two third-place placeholders in one R32 match to be rejected");
});

Deno.test("every possible set of eight distinct third-place groups can be assigned without a same-group clash", () => {
  const draw = buildProtectedRound32(entrants);
  const base: Series3BracketSnapshot = {
    tokens: draw.tokens,
    round32: draw.round32,
    round16: [],
    quarterfinals: [],
    semifinals: [],
    final: [],
  };
  const allSets = combinations(groups, 8);
  if (allSets.length !== 495) throw new Error("Expected all 495 possible eight-group qualifier combinations");
  for (const selectedGroups of allSets) {
    const qualifiers: Series3BracketToken[] = selectedGroups.map(group => ({
      id: `THIRD-${group}`,
      label: `Third ${group}`,
      source: "third",
      group,
    }));
    const assigned = assignThirdPlaceQualifiers(base, qualifiers);
    if (assigned.round32.some(match => match.a.group && match.a.group === match.b.group)) {
      throw new Error(`Same-group clash after assignment for groups ${selectedGroups.join("")}`);
    }
    if (assigned.round32.flatMap(match => [match.a, match.b]).filter(token => token.source === "third").length !== 8) {
      throw new Error("Expected exactly eight real third-place qualifiers");
    }
  }
});

Deno.test("owner-approved Series 3 draw preserves the exact confirmed randomized path through the final", () => {
  const bracket = buildOwnerApprovedSeries3Bracket();
  const ids = (items: typeof bracket.round32) => items.map(match => [match.a.id, match.b.id]);
  const expectedR32 = [
    ["1-K","3-BEST-3"],["1-B","2-A"],["1-E","3-BEST-2"],["2-E","2-D"],
    ["3-BEST-6","1-J"],["2-G","2-L"],["3-BEST-1","1-C"],["2-H","1-F"],
    ["2-B","1-L"],["1-G","2-J"],["2-I","2-F"],["2-C","2-K"],
    ["3-BEST-5","1-I"],["3-BEST-8","1-H"],["1-A","3-BEST-7"],["1-D","3-BEST-4"],
  ];
  if (JSON.stringify(ids(bracket.round32)) !== JSON.stringify(expectedR32)) throw new Error("R32 differs from owner-approved pairings");
  const expectedR16 = [
    ["W-R32-7","W-R32-12"],["W-R32-3","W-R32-15"],["W-R32-10","W-R32-1"],["W-R32-14","W-R32-5"],
    ["W-R32-9","W-R32-16"],["W-R32-2","W-R32-13"],["W-R32-11","W-R32-4"],["W-R32-8","W-R32-6"],
  ];
  if (JSON.stringify(ids(bracket.round16)) !== JSON.stringify(expectedR16)) throw new Error("R16 differs from owner-approved path");
  if (bracket.quarterfinals.length !== 4 || bracket.semifinals.length !== 2 || bracket.final.length !== 1 || bracket.thirdPlace?.length !== 1) {
    throw new Error("Expected QF/SF/final/third-place match counts");
  }
  if (bracket.thirdPlace[0].a.id !== "L-SF-1" || bracket.thirdPlace[0].b.id !== "L-SF-2") {
    throw new Error("Third-place match must use the two semifinal losers");
  }
});
