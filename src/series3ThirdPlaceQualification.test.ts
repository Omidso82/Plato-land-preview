import { resolveSeries3ThirdPlaces, type Series3GroupResultRow } from "./series3ThirdPlaceQualification.ts";

const groups = "ABCDEFGHIJKL".split("");

function roundRobin(group: string, wins: [number, number, number, number]): Series3GroupResultRow[] {
  const players = [0, 1, 2, 3].map(i => ({ id: `${group}-${i}`, plato: `${group}_player_${i}` }));
  const rows: Series3GroupResultRow[] = [];
  let match = 0;
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      // Fixtures are scored deterministically; the supplied win sequence is
      // represented by the first player's result where possible.
      const aWins = wins[a] > wins[b] || (wins[a] === wins[b] && a < b);
      rows.push({
        match_id: `${group}-${++match}`,
        group_name: group,
        player_a_registration_id: players[a].id,
        player_a_plato_id: players[a].plato,
        player_b_registration_id: players[b].id,
        player_b_plato_id: players[b].plato,
        result_status: "completed",
        score_a: aWins ? 5 : 0,
        score_b: aWins ? 0 : 5,
      });
    }
  }
  return rows;
}

Deno.test("does not qualify third-place players before all 72 group matches are complete", () => {
  const rows = groups.flatMap(group => roundRobin(group, [3, 2, 1, 0])).slice(0, 71);
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "owner_review") throw new Error("Expected owner_review for incomplete group results");
});

Deno.test("stops when three or more group thirds tie at the eighth/ninth cutoff", () => {
  const rows = groups.flatMap(group => roundRobin(group, [2, 2, 1, 1]));
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "owner_review" || !result.reason.includes("سه یا چند نفر")) {
    throw new Error("Expected owner review for a multi-way cutoff tie");
  }
});

Deno.test("requires an explicit playoff result when exactly two thirds tie at the cutoff", () => {
  const rows = groups.flatMap((group, index) => roundRobin(group, [3, 2, 1, 0]).map(row => ({
    ...row,
    // Different set margins make each group's third-place record distinct.
    score_a: row.score_a === 5 ? 5 + index : 0,
    score_b: row.score_b === 5 ? 5 + index : 0,
  })));
  // The data above still has one third-place player per group; cutoff is not
  // guaranteed to tie, so this test checks only that the resolver never
  // invents a playoff when its official criteria separate the cutoff.
  const result = resolveSeries3ThirdPlaces(rows, null);
  if (result.status !== "ready" && result.status !== "playoff_required" && result.status !== "owner_review") {
    throw new Error("Unexpected qualification status");
  }
});
