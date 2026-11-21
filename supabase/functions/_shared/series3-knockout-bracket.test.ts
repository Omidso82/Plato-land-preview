import {
  assignThirdPlaceQualifiers,
  buildProtectedRound32,
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
  }
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
