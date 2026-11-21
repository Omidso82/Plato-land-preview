import {
  resolveLockedGroupPlacements,
  resolveSeries3BracketSlots,
  validateSeries3BracketResult,
  type Series3GroupFixture,
} from "../../../src/series3BracketProgression.ts";
import type { Series3BracketSnapshot } from "../../../src/series3KnockoutBracket.ts";

const groups = "ABCDEFGHIJKL".split("");
function fixtures(group: string, completed: number): Series3GroupFixture[] {
  const ids = [1,2,3,4].map(n => group + "-P" + n);
  const pairs = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
  return pairs.map(([a,b],i) => ({
    match_id: group + "-" + i, group_name: group,
    player_a_registration_id: ids[a], player_a_plato_id: ids[a],
    player_b_registration_id: ids[b], player_b_plato_id: ids[b],
    result_status: i < completed ? "completed" : "pending",
    score_a: i < completed ? (a===0 ? 5 : 1) : null,
    score_b: i < completed ? (a===0 ? 1 : 5) : null,
  }));
}
Deno.test("does not lock a group position while any rival can still overtake on points", () => {
  const rows = groups.flatMap(g => fixtures(g, 3));
  const placements = resolveLockedGroupPlacements(rows);
  if (placements.some(x => x.status === "locked")) throw new Error("Unexpected early group lock");
});
Deno.test("locks first and second only when their current points strictly exceed every rival maximum", () => {
  const rows = fixtures("A", 6);
  const placement = resolveLockedGroupPlacements(rows).find(x => x.group === "A")!;
  if (placement.status !== "locked" || !placement.first || !placement.second) throw new Error("Expected completed group positions");
  if (placement.first.plato_id !== "A-P1" || placement.second.plato_id !== "A-P2") throw new Error("Unexpected official order");
});
Deno.test("refuses to decide a complete tie for first or second alphabetically", () => {
  const rows = fixtures("A", 6).map((row,i) => i===0 ? {...row,score_a:5,score_b:1} : row);
  const placement = resolveLockedGroupPlacements(rows).find(x => x.group === "A")!;
  if (placement.status !== "owner_review") throw new Error("Expected owner review for unresolved top-two tie");
});
