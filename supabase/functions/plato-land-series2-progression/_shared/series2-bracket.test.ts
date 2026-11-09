import {
  hasRecordedBracketConflict,
  prepareBracketForResult,
  syncBracketSources,
  syncGroupSlots,
} from "./series2-bracket.ts";

Deno.test("resolves only guaranteed group ranks into the existing round-of-16 draw", () => {
  const progression = {
    groups: [{ name: "X", players: ["A", "B", "C", "D"].map((plato_id) => ({ plato_id })) }],
    group_fixtures: [
      { id: "1", group: "X", player1: "A", player2: "B", score1: 5, score2: 0, winner: "A" },
      { id: "2", group: "X", player1: "C", player2: "D", score1: 5, score2: 0, winner: "C" },
      { id: "3", group: "X", player1: "A", player2: "C", score1: 5, score2: 0, winner: "A" },
      { id: "4", group: "X", player1: "B", player2: "D", score1: 5, score2: 0, winner: "B" },
      { id: "5", group: "X", player1: "A", player2: "D", score1: 5, score2: 0, winner: "A" },
      { id: "6", group: "X", player1: "B", player2: "C", score1: null, score2: null, winner: null },
    ],
    brackets: {
      round16: [{
        id: "R16-1", player1: "نفر اول گروه X", player2: "نفر دوم گروه Y",
        player1_source: "group:X:1", player2_source: "group:Y:2", winner: null,
      }],
    },
  };
  const projected = syncGroupSlots(progression);
  const match = projected.brackets?.round16?.[0];
  if (match?.player1 !== "A") throw new Error("Guaranteed group winner should be projected");
  if (match?.player2 !== "نفر دوم گروه Y") throw new Error("Unresolved group slot must remain a placeholder");
});

Deno.test("prepares stored placeholder slots before a knockout result is recorded, then advances winners to the final and losers to third place", () => {
  const stored = {
    brackets: {
      round16: [
        { id: "R16-1", player1: "A", player2: "B", winner: "A", score1: 5, score2: 2 },
        { id: "R16-2", player1: "C", player2: "D", winner: "D", score1: 1, score2: 5 },
        { id: "R16-3", player1: "E", player2: "F", winner: "E", score1: 5, score2: 0 },
        { id: "R16-4", player1: "G", player2: "H", winner: "H", score1: 2, score2: 5 },
      ],
      quarter: [
        { id: "QF-1", player1: "برنده R16-1", player2: "برنده R16-2", player1_source: "winner:R16-1", player2_source: "winner:R16-2", winner: null },
        { id: "QF-2", player1: "برنده R16-3", player2: "برنده R16-4", player1_source: "winner:R16-3", player2_source: "winner:R16-4", winner: null },
      ],
      semi: [
        { id: "SF-1", player1: "برنده QF-1", player2: "برنده QF-2", player1_source: "winner:QF-1", player2_source: "winner:QF-2", winner: null },
        { id: "SF-2", player1: "برنده QF-3", player2: "برنده QF-4", player1_source: "winner:QF-3", player2_source: "winner:QF-4", winner: null },
      ],
      final: [
        { id: "F-1", player1: "برنده SF-1", player2: "برنده SF-2", player1_source: "winner:SF-1", player2_source: "winner:SF-2", winner: null },
      ],
      third_place: [
        { id: "TP-1", player1: "بازنده SF-1", player2: "بازنده SF-2", player1_source: "loser:SF-1", player2_source: "loser:SF-2", winner: null },
      ],
    },
  };

  const readyForQuarter = prepareBracketForResult(stored);
  if (readyForQuarter.blocked) throw new Error("Valid stored bracket should be prepared");
  let progression = readyForQuarter.progression;
  if (progression.brackets?.quarter?.[0].player1 !== "A" || progression.brackets?.quarter?.[0].player2 !== "D") {
    throw new Error("Round-of-16 winners must resolve stored quarterfinal placeholders before result entry");
  }

  progression = {
    ...progression,
    brackets: {
      ...progression.brackets,
      quarter: progression.brackets!.quarter!.map((match) =>
        match.id === "QF-1" ? { ...match, winner: "D", score1: 3, score2: 5 }
          : { ...match, winner: "E", score1: 5, score2: 4 }
      ),
    },
  };
  progression = syncBracketSources(progression);
  if (progression.brackets?.semi?.[0].player1 !== "D" || progression.brackets?.semi?.[0].player2 !== "E") {
    throw new Error("Quarterfinal winners must populate the semifinal");
  }

  progression = {
    ...progression,
    brackets: {
      ...progression.brackets,
      semi: progression.brackets!.semi!.map((match) =>
        match.id === "SF-1" ? { ...match, winner: "D", score1: 5, score2: 2 } : match
      ),
    },
  };
  progression = syncBracketSources(progression);
  if (progression.brackets?.final?.[0].player1 !== "D") {
    throw new Error("Semifinal winner must populate the final");
  }
  if (progression.brackets?.third_place?.[0].player1 !== "E") {
    throw new Error("Semifinal loser must populate the third-place match");
  }
  if (progression.brackets?.final?.[0].player2 !== "برنده SF-2" ||
      progression.brackets?.third_place?.[0].player2 !== "بازنده SF-2") {
    throw new Error("Unplayed semifinal must remain unresolved");
  }
});

Deno.test("does not propagate a winner that is not one of the recorded match participants", () => {
  const projected = syncBracketSources({
    brackets: {
      round16: [{ id: "R16-1", player1: "A", player2: "B", winner: "X", score1: 5, score2: 0 }],
      quarter: [{
        id: "QF-1", player1: "برنده R16-1", player2: "Y",
        player1_source: "winner:R16-1", winner: null,
      }],
    },
  });
  if (projected.brackets?.quarter?.[0].player1 !== "برنده R16-1") {
    throw new Error("Invalid winner must not advance into the next round");
  }
});

Deno.test("blocks a projection that changes participants in a scored knockout match", () => {
  const before = {
    brackets: {
      round16: [{ id: "R16-1", player1: "A", player2: "B", winner: "A", score1: 5, score2: 1 }],
    },
  };
  const after = {
    brackets: {
      round16: [{ id: "R16-1", player1: "C", player2: "B", winner: "A", score1: 5, score2: 1 }],
    },
  };
  if (!hasRecordedBracketConflict(before, after)) {
    throw new Error("Changing a scored match's participants must be blocked");
  }
});
