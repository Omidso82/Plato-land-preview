import type { Series3BracketMatch, Series3BracketSnapshot, Series3BracketToken } from "./series3KnockoutBracket";

export type Series3GroupFixture = {
  match_id: string;
  group_name: string;
  player_a_registration_id: string;
  player_a_plato_id: string;
  player_b_registration_id: string;
  player_b_plato_id: string;
  result_status: "pending" | "completed" | "double_no_show";
  score_a: number | null;
  score_b: number | null;
};

export type Series3GroupPlacement = {
  group: string;
  first: { registration_id: string; plato_id: string } | null;
  second: { registration_id: string; plato_id: string } | null;
  status: "locked" | "pending" | "owner_review";
  reason?: string;
};

export type Series3KnockoutResult = {
  match_id: string;
  player_a_plato_id: string;
  player_b_plato_id: string;
  score_a: number | null;
  score_b: number | null;
  result_status: "pending" | "completed";
};

const GROUPS = "ABCDEFGHIJKL".split("");

type Standing = {
  registration_id: string;
  plato_id: string;
  points: number;
  diff: number;
  setsFor: number;
  pending: number;
};

function sameOfficialRank(a: Standing, b: Standing) {
  return a.points === b.points && a.diff === b.diff && a.setsFor === b.setsFor;
}

function compareOfficial(a: Standing, b: Standing) {
  return b.points - a.points || b.diff - a.diff || b.setsFor - a.setsFor;
}

/**
 * Conservatively locks only positions that cannot change under any outcome of
 * the remaining group fixtures. A points tie is deliberately left unresolved
 * until all six matches are complete, so no alphabetical fallback is used.
 */
export function resolveLockedGroupPlacements(rows: Series3GroupFixture[]): Series3GroupPlacement[] {
  return GROUPS.map(group => {
    const matches = rows.filter(row => row.group_name === group);
    if (matches.length !== 6) {
      return { group, first: null, second: null, status: "owner_review", reason: "Group must have exactly six scheduled fixtures." };
    }
    const map = new Map<string, Standing>();
    const ensure = (registration_id: string, plato_id: string) => {
      const current = map.get(registration_id);
      if (current && current.plato_id !== plato_id) throw new Error("Registration ID maps to multiple Plato IDs in group " + group);
      if (!current) map.set(registration_id, { registration_id, plato_id, points: 0, diff: 0, setsFor: 0, pending: 0 });
      return map.get(registration_id)!;
    };
    for (const row of matches) {
      const a = ensure(row.player_a_registration_id, row.player_a_plato_id);
      const b = ensure(row.player_b_registration_id, row.player_b_plato_id);
      if (row.result_status === "pending") {
        a.pending++;
        b.pending++;
      } else if (row.result_status === "completed") {
        if (row.score_a === null || row.score_b === null || !Number.isInteger(row.score_a) || !Number.isInteger(row.score_b) || row.score_a < 0 || row.score_b < 0 || row.score_a === row.score_b) {
          return { group, first: null, second: null, status: "owner_review", reason: "A completed fixture has an invalid score." };
        }
        a.setsFor += row.score_a;
        b.setsFor += row.score_b;
        a.diff += row.score_a - row.score_b;
        b.diff += row.score_b - row.score_a;
        if (row.score_a > row.score_b) a.points += 3;
        else b.points += 3;
      }
      // A double no-show is closed and awards no points, matching the group manager.
    }
    if (map.size !== 4) {
      return { group, first: null, second: null, status: "owner_review", reason: "Group must contain exactly four distinct registered players." };
    }
    const players = [...map.values()];
    const pendingFor = (p: Standing) => p.pending * 3;
    const sorted = [...players].sort(compareOfficial);
    if (matches.every(row => row.result_status !== "pending")) {
      if (sameOfficialRank(sorted[0], sorted[1]) || sameOfficialRank(sorted[1], sorted[2])) {
        return { group, first: null, second: null, status: "owner_review", reason: "A tie affecting first or second place needs an explicit owner decision." };
      }
      return {
        group,
        first: { registration_id: sorted[0].registration_id, plato_id: sorted[0].plato_id },
        second: { registration_id: sorted[1].registration_id, plato_id: sorted[1].plato_id },
        status: "locked",
      };
    }
    const firstCandidates = players.filter(p => players.every(other => other.registration_id === p.registration_id || p.points > other.points + pendingFor(other)));
    if (firstCandidates.length === 1) {
      const first = firstCandidates[0];
      const remaining = players.filter(p => p.registration_id !== first.registration_id);
      const secondCandidates = remaining.filter(p => remaining.every(other => other.registration_id === p.registration_id || p.points > other.points + pendingFor(other)));
      if (secondCandidates.length === 1) {
        return {
          group,
          first: { registration_id: first.registration_id, plato_id: first.plato_id },
          second: { registration_id: secondCandidates[0].registration_id, plato_id: secondCandidates[0].plato_id },
          status: "locked",
        };
      }
      return { group, first: { registration_id: first.registration_id, plato_id: first.plato_id }, second: null, status: "pending" };
    }
    return { group, first: null, second: null, status: "pending" };
  });
}

export type ResolvedSlot = { token: Series3BracketToken; resolved: boolean; pendingReason?: string };

export function resolveSeries3BracketSlots(
  bracket: Series3BracketSnapshot,
  placements: Series3GroupPlacement[],
  thirdQualifiers: Series3BracketToken[],
  results: Series3KnockoutResult[],
): Record<string, { a: ResolvedSlot; b: ResolvedSlot }> {
  const allMatches = [
    ...bracket.round32,
    ...bracket.round16,
    ...bracket.quarterfinals,
    ...bracket.semifinals,
    ...bracket.final,
  ];
  const byMatch = new Map(allMatches.map(match => [match.id, match]));
  const resultById = new Map(results.map(result => [result.match_id, result]));
  const placementByGroup = new Map(placements.map(placement => [placement.group, placement]));
  const thirdById = new Map(thirdQualifiers.map(token => [token.id, token]));
  const cache = new Map<string, ResolvedSlot>();
  const resolving = new Set<string>();

  const resolveToken = (token: Series3BracketToken): ResolvedSlot => {
    const cached = cache.get(token.id);
    if (cached) return cached;
    if (token.source === "first" || token.source === "second") {
      const placement = placementByGroup.get(token.group || "");
      const player = token.source === "first" ? placement?.first : placement?.second;
      const resolved = Boolean(player);
      const slot = resolved
        ? { token: { ...token, id: player!.registration_id, label: player!.plato_id }, resolved: true }
        : { token, resolved: false, pendingReason: placement?.reason || "Group position is not mathematically locked yet." };
      cache.set(token.id, slot);
      return slot;
    }
    if (token.source === "third") {
      const player = thirdById.get(token.id);
      const slot = player ? { token: player, resolved: true } : { token, resolved: false, pendingReason: "Eight third-place qualifiers are not finalized yet." };
      cache.set(token.id, slot);
      return slot;
    }
    const matchId = token.id.replace(/^[WL]-/, "");
    if (resolving.has(token.id)) return { token, resolved: false, pendingReason: "Circular bracket reference." };
    const previousMatch = byMatch.get(matchId);
    const result = resultById.get(matchId);
    if (!previousMatch || !result || result.result_status !== "completed" || result.score_a === null || result.score_b === null || result.score_a === result.score_b) {
      return { token, resolved: false, pendingReason: "Previous match has no valid completed result." };
    }
    resolving.add(token.id);
    const previousA = resolveToken(previousMatch.a);
    const previousB = resolveToken(previousMatch.b);
    resolving.delete(token.id);
    if (!previousA.resolved || !previousB.resolved) {
      return { token, resolved: false, pendingReason: "Previous match participants are not resolved." };
    }
    const winnerA = result.score_a > result.score_b;
    const winningToken = winnerA ? previousA.token : previousB.token;
    const losingToken = winnerA ? previousB.token : previousA.token;
    const expectedA = previousA.token.label;
    const expectedB = previousB.token.label;
    const resultMatches = (result.player_a_plato_id === expectedA && result.player_b_plato_id === expectedB) ||
      (result.player_a_plato_id === expectedB && result.player_b_plato_id === expectedA);
    if (!resultMatches) return { token, resolved: false, pendingReason: "Saved result participants do not match the official bracket." };
    const selected = token.source === "winner" ? winningToken : losingToken;
    const slot = { token: { ...selected, id: token.id, source: token.source }, resolved: true };
    cache.set(token.id, slot);
    return slot;
  };

  const resolved: Record<string, { a: ResolvedSlot; b: ResolvedSlot }> = {};
  for (const match of allMatches) {
    resolved[match.id] = { a: resolveToken(match.a), b: resolveToken(match.b) };
  }
  return resolved;
}

export function validateSeries3BracketResult(
  match: Series3BracketMatch,
  resolved: { a: ResolvedSlot; b: ResolvedSlot },
  playerA: string,
  playerB: string,
): string | null {
  if (!resolved.a.resolved || !resolved.b.resolved) return "هر دو جایگاه این مسابقه هنوز قطعی نشده‌اند.";
  const expected = [resolved.a.token.label.toLowerCase(), resolved.b.token.label.toLowerCase()].sort();
  const supplied = [playerA.trim().toLowerCase(), playerB.trim().toLowerCase()].sort();
  if (expected[0] !== supplied[0] || expected[1] !== supplied[1]) return "Plato ID بازیکنان با جایگاه رسمی براکت مطابقت ندارد.";
  return null;
}
