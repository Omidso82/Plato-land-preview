export type Series2Fixture = {
  id: string;
  group: string;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  winner: string | null;
  result_status?: string | null;
};
export type Series2Progression = {
  groups?: Array<{ name: string; players?: Array<{ plato_id: string }> }>;
  group_fixtures?: Series2Fixture[];
};
type Row = { id: string; points: number; scoreFor: number; scoreAgainst: number; difference: number };

const legalScores: Array<[number, number]> = [];
for (const winnerScore of [5, 6, 7]) {
  for (let loserScore = 0; loserScore <= 4; loserScore++) {
    legalScores.push([winnerScore, loserScore], [loserScore, winnerScore]);
  }
}

function isRecorded(f: Series2Fixture): boolean {
  if (f.result_status === "double_no_show") return false;
  if (typeof f.winner !== "string" || ![f.player1, f.player2].includes(f.winner)) return false;
  if (!Number.isInteger(f.score1) || !Number.isInteger(f.score2)) return false;
  const oneWon = (f.score1 as number) > (f.score2 as number);
  return oneWon ? f.winner === f.player1 : f.winner === f.player2;
}

function isLegalFixture(f: Series2Fixture): boolean {
  if (!isRecorded(f)) return false;
  const a = f.score1 as number, b = f.score2 as number;
  return (a >= 5 && a <= 7 && b >= 0 && b <= 4) ||
    (b >= 5 && b <= 7 && a >= 0 && a <= 4);
}

/** Resolve only exact ranks invariant across every legal completion of pending group fixtures. */
export function getGuaranteedGroupPlaces(
  progression: Series2Progression,
  groupName: string,
): Record<number, string> {
  const group = progression.groups?.find((g) => g.name === groupName);
  if (!group) return {};
  const ids = (group.players || []).map((p) => p.plato_id).filter(Boolean);
  if (ids.length !== 4 || new Set(ids).size !== 4) return {};

  const fixtures = (progression.group_fixtures || []).filter((f) => f.group === groupName);
  if (fixtures.length !== 6 || new Set(fixtures.map((f) => f.id)).size !== 6) return {};

  // A complete four-player round robin must contain each pair exactly once.
  const pairs = new Set<string>();
  for (const f of fixtures) {
    if (!ids.includes(f.player1) || !ids.includes(f.player2) || f.player1 === f.player2) return {};
    const pair = [f.player1, f.player2].sort().join("|");
    if (pairs.has(pair)) return {};
    pairs.add(pair);
  }
  if (pairs.size !== 6) return {};

  for (const f of fixtures) {
    if (f.result_status === "double_no_show") continue;
    const hasAnyResult = f.winner !== null || f.score1 !== null || f.score2 !== null;
    if (hasAnyResult && !isRecorded(f)) return {};
    if (isRecorded(f) && !isLegalFixture(f)) return {};
  }
  const pending = fixtures.filter((f) => f.result_status !== "double_no_show" && !isRecorded(f));
  if (pending.length > 3) return {};

  const possibleRanks = new Map(ids.map((id) => [id, new Set<number>()]));
  const baseRows = new Map(ids.map((id) => [id, {
    id, points: 0, scoreFor: 0, scoreAgainst: 0, difference: 0,
  } satisfies Row]));

  const apply = (rows: Map<string, Row>, fixture: Series2Fixture, score1: number, score2: number, winner: string) => {
    const one = rows.get(fixture.player1), two = rows.get(fixture.player2);
    if (!one || !two) return;
    one.scoreFor += score1; one.scoreAgainst += score2;
    two.scoreFor += score2; two.scoreAgainst += score1;
    const winning = rows.get(winner);
    if (winning) winning.points += 3;
  };

  for (const fixture of fixtures) {
    if (isLegalFixture(fixture)) {
      apply(baseRows, fixture, fixture.score1 as number, fixture.score2 as number, fixture.winner as string);
    }
  }

  const evaluate = (rows: Map<string, Row>, scenarioFixtures: Series2Fixture[]) => {
    const standings = [...rows.values()].map((r) => ({
      ...r, difference: r.scoreFor - r.scoreAgainst,
    })).sort((a, b) =>
      b.points - a.points || b.difference - a.difference || b.scoreFor - a.scoreFor
    );

    for (let i = 0; i < standings.length;) {
      let j = i + 1;
      while (j < standings.length &&
        standings[j].points === standings[i].points &&
        standings[j].difference === standings[i].difference &&
        standings[j].scoreFor === standings[i].scoreFor) j++;

      const tied = standings.slice(i, j);
      let directWinner: string | null = null;
      if (tied.length === 2) {
        const direct = scenarioFixtures.find((f) =>
          f.result_status !== "double_no_show" && isLegalFixture(f) &&
          ((f.player1 === tied[0].id && f.player2 === tied[1].id) ||
            (f.player1 === tied[1].id && f.player2 === tied[0].id))
        );
        if (direct) directWinner = direct.winner;
      }
      if (directWinner) {
        if (directWinner === tied[1].id) [standings[i], standings[i + 1]] = [standings[i + 1], standings[i]];
        possibleRanks.get(standings[i].id)?.add(i + 1);
        possibleRanks.get(standings[i + 1].id)?.add(i + 2);
      } else {
        for (let rank = i + 1; rank <= j; rank++) {
          for (const row of tied) possibleRanks.get(row.id)?.add(rank);
        }
      }
      i = j;
    }
  };

  const walk = (index: number, rows: Map<string, Row>, completed: Series2Fixture[]) => {
    if (index === pending.length) {
      evaluate(rows, [...fixtures.filter(isLegalFixture), ...completed]);
      return;
    }
    const fixture = pending[index];
    for (const [score1, score2] of legalScores) {
      const winner = score1 > score2 ? fixture.player1 : fixture.player2;
      const nextRows = new Map([...rows].map(([id, row]) => [id, { ...row }]));
      apply(nextRows, fixture, score1, score2, winner);
      walk(index + 1, nextRows, [...completed, {
        ...fixture, score1, score2, winner, result_status: null,
      }]);
    }
  };

  walk(0, new Map([...baseRows].map(([id, row]) => [id, { ...row }])), []);
  const result: Record<number, string> = {};
  for (const id of ids) {
    const ranks = possibleRanks.get(id);
    if (ranks?.size === 1) {
      const rank = [...ranks][0];
      if (!result[rank]) result[rank] = id;
      else delete result[rank];
    }
  }
  return result;
}
