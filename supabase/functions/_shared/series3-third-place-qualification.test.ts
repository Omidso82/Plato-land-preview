import { resolveSeries3ThirdPlaces, type Series3GroupResultRow, type Series3PlayoffRecord } from "../../../src/series3ThirdPlaceQualification.ts";

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

const standardOutcomes = [
  [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
] as Array<[number, number]>;
// Player 0 wins 3, player 1 wins 2, player 2 wins 1, player 3 wins 0.
const tiedThirdFourthOutcomes = [
  [0, 1], [0, 2], [3, 0], [1, 2], [1, 3], [2, 3],
] as Array<[number, number]>;
// Players 0/1 have 2 wins each; players 2/3 have 1 win each.
// Their direct match is won by player 2; margins separate places 1/2
// while leaving the official third/fourth criteria exactly tied.

function allGroups(margins: number[], specialGroup?: string): Series3GroupResultRow[] {
  return groups.flatMap((group, index) => roundRobin(
    group,
    group === specialGroup ? tiedThirdFourthOutcomes : standardOutcomes,
    margins[index],
  ));
}

function playoff(
  aGroup: string,
  bGroup: string,
  status: "pending" | "completed",
  scoreA: number | null = null,
  scoreB: number | null = null,
): Series3PlayoffRecord {
  return {
    player_a_registration_id: `${aGroup}-2`,
    player_a_plato_id: `${aGroup}_player_2`,
    player_a_group: aGroup,
    player_b_registration_id: `${bGroup}-2`,
    player_b_plato_id: `${bGroup}_player_2`,
    player_b_group: bGroup,
    result_status: status,
    score_a: scoreA,
    score_b: scoreB,
  };
}

Deno.test("does not qualify third-place players before all 72 group matches are complete", () => {
  const rows = allGroups(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, 71);
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "owner_review") throw new Error("Expected owner_review for incomplete group results");
});

Deno.test("uses the direct head-to-head winner to resolve an exact third/fourth tie", () => {
  const result = resolveSeries3ThirdPlaces(
    allGroups(Array.from({ length: 12 }, (_, i) => i + 1), "A"),
    null,
  );
  if (result.status !== "ready") throw new Error("Expected a ready qualification result after head-to-head resolution");
  const groupAQualifier = result.qualifiers.find(player => player.group === "A");
  if (groupAQualifier?.registration_id !== "A-2") {
    throw new Error("The head-to-head winner from group A must be its third-place qualifier");
  }
  if (result.qualifiers.length !== 8) throw new Error("Exactly eight third-place qualifiers must be returned");
});

Deno.test("requires a playoff when exactly two third-place records tie at the eighth/ninth cutoff", () => {
  const margins = [1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11];
  const result = resolveSeries3ThirdPlaces(allGroups(margins), null);
  if (result.status !== "playoff_required" || result.players.length !== 2) {
    throw new Error("Expected a playoff for the exact two-player eighth/ninth tie");
  }
  if (result.players[0].group !== "H" || result.players[1].group !== "I") {
    throw new Error("Expected groups H and I to occupy the tied cutoff");
  }
});

Deno.test("does not finalize qualification while the cutoff playoff is pending", () => {
  const margins = [1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11];
  const result = resolveSeries3ThirdPlaces(allGroups(margins), playoff("H", "I", "pending"));
  if (result.status !== "playoff_pending") throw new Error("Expected playoff_pending until a valid result is recorded");
});

Deno.test("includes the winner of the eighth/ninth playoff among exactly eight qualifiers", () => {
  const margins = [1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11];
  const result = resolveSeries3ThirdPlaces(allGroups(margins), playoff("H", "I", "completed", 5, 3));
  if (result.status !== "ready") throw new Error("Expected ready after a completed valid playoff");
  if (result.qualifiers.length !== 8) throw new Error("Exactly eight qualifiers must be returned");
  if (!result.qualifiers.some(player => player.registration_id === "H-2")) {
    throw new Error("The playoff winner from group H must qualify");
  }
  if (result.qualifiers.some(player => player.registration_id === "I-2")) {
    throw new Error("The playoff loser from group I must not qualify");
  }
});

Deno.test("stops when three or more third-place records tie at the cutoff", () => {
  const margins = [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 9, 10];
  const result = resolveSeries3ThirdPlaces(allGroups(margins), null);
  if (result.status !== "owner_review" || !result.reason.includes("سه یا چند نفر")) {
    throw new Error("Expected owner review for a multi-way cutoff tie");
  }
});

Deno.test("stops when a tied third/fourth head-to-head result is inconclusive", () => {
  const rows = allGroups(Array.from({ length: 12 }, (_, i) => i + 1), "A");
  const directMatch = rows.find(row =>
    row.group_name === "A" &&
    ((row.player_a_registration_id === "A-2" && row.player_b_registration_id === "A-3") ||
     (row.player_a_registration_id === "A-3" && row.player_b_registration_id === "A-2"))
  );
  if (!directMatch) throw new Error("Missing direct match fixture");
  directMatch.score_a = 5;
  directMatch.score_b = 5;
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "owner_review") throw new Error("Expected owner review for inconclusive head-to-head");
});
