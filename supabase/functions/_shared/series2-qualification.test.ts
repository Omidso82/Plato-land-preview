import { getGuaranteedGroupPlaces } from "./series2-qualification.ts";

const players = ["A", "B", "C", "D"];
function fixture(id: string, player1: string, player2: string, score1: number|null, score2: number|null, winner: string|null, result_status: string|null = null) {
  return { id, group: "X", player1, player2, score1, score2, winner, result_status };
}
function base(fixtures: ReturnType<typeof fixture>[]) {
  return { groups: [{ name: "X", players: players.map((plato_id) => ({ plato_id })) }], group_fixtures: fixtures };
}

Deno.test("keeps a guaranteed first place while another group match is pending", () => {
  const data = base([
    fixture("1","A","B",5,0,"A"), fixture("2","C","D",5,0,"C"),
    fixture("3","A","C",5,0,"A"), fixture("4","B","D",5,0,"B"),
    fixture("5","A","D",5,0,"A"), fixture("6","B","C",null,null,null),
  ]);
  const places = getGuaranteedGroupPlaces(data, "X");
  if (places[1] !== "A") throw new Error("A should remain the guaranteed first-place player");
});

Deno.test("does not freeze first and second place when their direct match is pending", () => {
  const data = base([
    fixture("1","A","C",5,0,"A"), fixture("2","B","D",5,0,"B"),
    fixture("3","A","D",5,0,"A"), fixture("4","B","C",5,0,"B"),
    fixture("5","A","B",null,null,null), fixture("6","C","D",null,null,null),
  ]);
  const places = getGuaranteedGroupPlaces(data, "X");
  if (places[1] || places[2]) throw new Error("A/B order must remain unresolved");
});

Deno.test("does not infer a place when the source fixture list is incomplete", () => {
  const data = base([fixture("1","A","B",5,0,"A")]);
  if (Object.keys(getGuaranteedGroupPlaces(data, "X")).length !== 0) {
    throw new Error("Incomplete fixture source must not produce qualifiers");
  }
});

Deno.test("counts double no-show as a completed fixture but awards no points", () => {
  const data = base([
    fixture("1","A","B",5,0,"A"), fixture("2","C","D",5,0,"C"),
    fixture("3","A","C",5,0,"A"), fixture("4","B","D",5,0,"B"),
    fixture("5","A","D",5,0,"A"), fixture("6","B","C",null,null,null,"double_no_show"),
  ]);
  const places = getGuaranteedGroupPlaces(data, "X");
  if (places[1] !== "A") throw new Error("A should remain first after a double no-show");
});

Deno.test("rejects malformed round-robin fixtures and inconsistent recorded winners", () => {
  const duplicatePair = base([
    fixture("1","A","B",5,0,"A"), fixture("2","A","B",5,0,"A"),
    fixture("3","A","C",5,0,"A"), fixture("4","B","D",5,0,"B"),
    fixture("5","C","D",5,0,"C"), fixture("6","B","C",null,null,null),
  ]);
  if (Object.keys(getGuaranteedGroupPlaces(duplicatePair, "X")).length !== 0) {
    throw new Error("Duplicate pairings must not produce qualifiers");
  }
  const inconsistent = base([
    fixture("1","A","B",5,0,"B"), fixture("2","C","D",5,0,"C"),
    fixture("3","A","C",5,0,"A"), fixture("4","B","D",5,0,"B"),
    fixture("5","A","D",5,0,"A"), fixture("6","B","C",null,null,null),
  ]);
  if (Object.keys(getGuaranteedGroupPlaces(inconsistent, "X")).length !== 0) {
    throw new Error("Inconsistent winner data must not produce qualifiers");
  }
});
