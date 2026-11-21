import { resolveSeries3ThirdPlaces, type Series3GroupResultRow } from "../../../src/series3ThirdPlaceQualification.ts";

const groups = "ABCDEFGHIJKL".split("");

function roundRobin(
  group: string,
  outcomes: Array<[number, number]>,
  margin: number,
): Series3GroupResultRow[] {
  const players = [0, 1, 2, 3].map(i => ({ id: `${group}-${i}`, plato: `${group}_player_${i}` }));
  const rows: Series3GroupResultRow[] = [];
  let match = 0;
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const winner = outcomes.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
      if (!winner) throw new Error("Missing round-robin outcome");
      const aWins = winner[0] === a;
      rows.push({
        match_id: `${group}-${++match}`,
        group_name: group,
        player_a_registration_id: players[a].id,
        player_a_plato_id: players[a].plato,
        player_b_registration_id: players[b].id,
        player_b_plato_id: players[b].plato,
        result_status: "completed",
        score_a: aWins ? 5 + margin : 0,
        score_b: aWins ? 0 : 5 + margin,
      });
    }
  }
  return rows;
}

const standard = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as Array<[number, number]>;
// Standard outcomes: player 0 wins all, player 1 wins two, player 2 wins one.
const standardOutcomes = standard;
const tiedThirdFourthOutcomes = [
  [0, 1], [0, 2], [3, 0], [1, 2], [1, 3], [2, 3],
] as Array<[number, number]>;
// Wins: player 0 = 2, player 1 = 2, player 2 = 1, player 3 = 1.
// The direct match between players 2 and 3 is won by player 2.

Deno.test("does not qualify third-place players before all 72 group matches are complete", () => {
  const rows = groups.flatMap((group, index) => roundRobin(group, standardOutcomes, index + 1)).slice(0, 71);
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "owner_review") throw new Error("Expected owner_review for incomplete group results");
});

Deno.test("uses the direct head-to-head winner to resolve an exact third/fourth tie", () => {
  const rows = groups.flatMap((group, index) => roundRobin(
    group,
    group === "A" ? tiedThirdFourthOutcomes : standardOutcomes,
    index + 1,
  ));
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "ready") throw new Error("Expected a ready qualification result after head-to-head resolution");
  const groupAQualifier = result.qualifiers.find(player => player.group === "A");
  if (groupAQualifier?.registration_id !== "A-2") {
    throw new Error("The head-to-head winner from group A must be its third-place qualifier");
  }
  if (result.qualifiers.length !== 8) throw new Error("Exactly eight third-place qualifiers must be returned");
});

Deno.test("stops when three or more group thirds tie at the eighth/ninth cutoff", () => {
  const rows = groups.flatMap(group => roundRobin(group, standardOutcomes, 1));
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "owner_review" || !result.reason.includes("سه یا چند نفر")) {
    throw new Error("Expected owner review for a multi-way cutoff tie");
  }
});
