import { getGuaranteedGroupPlaces } from "./series2-qualification.ts";

type BracketMatch = {
  id: string;
  player1: string;
  player2: string;
  player1_source?: string | null;
  player2_source?: string | null;
  winner?: string | null;
  score1?: number | null;
  score2?: number | null;
  [key: string]: unknown;
};
type Progression = {
  groups?: Array<{ name: string; players?: Array<{ plato_id: string }> }>;
  group_fixtures?: Array<Record<string, unknown>>;
  brackets?: Record<string, BracketMatch[]>;
  [key: string]: unknown;
};

const ROUNDS = ["round16", "quarter", "semi", "final", "third_place"] as const;

/** Projects only mathematically guaranteed group ranks into the original draw slots. */
export function syncGroupSlots(progression: Progression): Progression {
  const brackets = { ...(progression.brackets || {}) };
  const placesByGroup = new Map<string, Record<number, string>>();
  for (const group of Array.isArray(progression.groups) ? progression.groups : []) {
    placesByGroup.set(
      group.name,
      getGuaranteedGroupPlaces(progression as Parameters<typeof getGuaranteedGroupPlaces>[0], group.name),
    );
  }

  for (const round of ROUNDS) {
    brackets[round] = (brackets[round] || []).map((match) => {
      const resolve = (side: "player1" | "player2") => {
        const source = match[side + "_source"];
        if (typeof source !== "string" || !source.startsWith("group:")) return match[side];
        const [, group, placeText] = source.split(":");
        const place = Number(placeText);
        if (place !== 1 && place !== 2) return match[side];
        const resolved = placesByGroup.get(group)?.[place];
        return resolved || (place === 1 ? "نفر اول گروه " + group : "نفر دوم گروه " + group);
      };
      return { ...match, player1: resolve("player1"), player2: resolve("player2") };
    });
  }
  return { ...progression, brackets };
}

/** Projects winners and semifinal losers through the pre-drawn knockout tree. */
export function syncBracketSources(progression: Progression): Progression {
  const brackets = { ...(progression.brackets || {}) };
  const byId = new Map<string, BracketMatch>();
  for (const round of ROUNDS) {
    for (const match of brackets[round] || []) byId.set(String(match.id), match);
  }

  for (const round of ROUNDS) {
    brackets[round] = (brackets[round] || []).map((match) => {
      const resolve = (side: "player1" | "player2") => {
        const source = match[side + "_source"];
        if (typeof source !== "string") return match[side];
        const [kind, sourceId] = source.split(":");
        if (kind !== "winner" && kind !== "loser") return match[side];

        const prior = byId.get(sourceId);
        if (!prior || typeof prior.winner !== "string" ||
            (prior.winner !== prior.player1 && prior.winner !== prior.player2)) {
          return match[side];
        }
        if (kind === "winner") return prior.winner;
        return prior.winner === prior.player1 ? prior.player2 : prior.player1;
      };
      return { ...match, player1: resolve("player1"), player2: resolve("player2") };
    });
  }
  return { ...progression, brackets };
}

/** Blocks a projection if it would silently change participants in an already-scored match. */
export function hasRecordedBracketConflict(before: Progression, after: Progression): boolean {
  for (const round of ROUNDS) {
    const oldMatches = before.brackets?.[round] || [];
    const nextMatches = after.brackets?.[round] || [];
    for (const oldMatch of oldMatches) {
      if (!oldMatch.winner || !Number.isInteger(oldMatch.score1) || !Number.isInteger(oldMatch.score2)) continue;
      const nextMatch = nextMatches.find((match) => match.id === oldMatch.id);
      if (nextMatch && (
        nextMatch.player1 !== oldMatch.player1 || nextMatch.player2 !== oldMatch.player2
      )) return true;
    }
  }
  return false;
}
