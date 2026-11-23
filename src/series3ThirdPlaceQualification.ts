import { resolveSeries3OwnerThirdTie, type Series3OwnerThirdDecision } from './series3OwnerThirdPlaceDecision';
export type Series3GroupResultRow = {
  match_id: string;
  group_name: string;
  player_a_registration_id: string;
  player_a_plato_id: string;
  player_b_registration_id: string;
  player_b_plato_id: string;
  result_status: 'pending' | 'completed' | 'double_no_show';
  score_a: number | null;
  score_b: number | null;
};

export type Series3ThirdPlacePlayer = {
  registration_id: string;
  plato_id: string;
  group: string;
  points: number;
  diff: number;
  setsFor: number;
};

export type Series3PlayoffRecord = {
  player_a_registration_id: string;
  player_a_plato_id: string;
  player_a_group: string;
  player_b_registration_id: string;
  player_b_plato_id: string;
  player_b_group: string;
  result_status: 'pending' | 'completed';
  score_a: number | null;
  score_b: number | null;
};

export type Series3ThirdPlaceResolution =
  | { status: 'ready'; qualifiers: Series3ThirdPlacePlayer[] }
  | { status: 'playoff_required'; players: [Series3ThirdPlacePlayer, Series3ThirdPlacePlayer]; savedPlayoff: Series3PlayoffRecord | null }
  | { status: 'playoff_pending'; players: [Series3ThirdPlacePlayer, Series3ThirdPlacePlayer]; savedPlayoff: Series3PlayoffRecord }
  | { status: 'owner_review'; reason: string };

const GROUPS = 'ABCDEFGHIJKL'.split('');
const sameCriteria = (a: Series3ThirdPlacePlayer, b: Series3ThirdPlacePlayer) =>
  a.points === b.points && a.diff === b.diff && a.setsFor === b.setsFor;
const compareOfficial = (a: Series3ThirdPlacePlayer, b: Series3ThirdPlacePlayer) =>
  b.points - a.points || b.diff - a.diff || b.setsFor - a.setsFor;

export function resolveSeries3ThirdPlaces(
  rows: Series3GroupResultRow[],
  playoff: Series3PlayoffRecord | null,
  serverVerifiedOwnerDecisions: readonly Series3OwnerThirdDecision[] = [],
): Series3ThirdPlaceResolution {
  if (rows.length !== 72 || rows.some(row =>
    (row.result_status !== 'completed' && row.result_status !== 'double_no_show') ||
    (row.result_status === 'double_no_show'
      ? row.score_a !== null || row.score_b !== null
      : row.score_a === null || row.score_b === null ||
        !Number.isInteger(row.score_a) || !Number.isInteger(row.score_b) ||
        row.score_a < 0 || row.score_b < 0 || row.score_a === row.score_b)
  ))
    return { status: 'owner_review', reason: 'برای تعیین نفرات سوم، تمام ۷۲ بازی باید با نتیجه معتبر یا عدم حضور دوطرفه بدون امتیاز بسته شده باشند.' };

  const thirdPlaces: Series3ThirdPlacePlayer[] = [];
  const unresolvedNonAdvancingTies: Array<[Series3ThirdPlacePlayer,Series3ThirdPlacePlayer]> = [];
  for (const group of GROUPS) {
    const groupRows = rows.filter(row => row.group_name === group);
    if (groupRows.length !== 6) return { status: 'owner_review', reason: 'تعداد بازی‌های گروه ' + group + ' کامل نیست.' };

    const standings = new Map<string, { registration_id: string; plato_id: string; played: number; wins: number; points: number; setsFor: number; setsAgainst: number }>();
    const ensure = (id: string, platoId: string) => {
      const old = standings.get(id);
      if (old && old.plato_id !== platoId) throw new Error('یک شناسه ثبت‌نام با بیش از یک Plato ID در گروه ' + group + ' دیده شد.');
      if (!old) standings.set(id, { registration_id: id, plato_id: platoId, played: 0, wins: 0, points: 0, setsFor: 0, setsAgainst: 0 });
      return standings.get(id)!;
    };
    for (const row of groupRows) {
      const a = ensure(row.player_a_registration_id, row.player_a_plato_id);
      const b = ensure(row.player_b_registration_id, row.player_b_plato_id);
      a.played++; b.played++;
      // Double no-show closes the fixture without awarding wins, points or sets.
      if (row.result_status === 'double_no_show') continue;
      a.setsFor += row.score_a!; a.setsAgainst += row.score_b!;
      b.setsFor += row.score_b!; b.setsAgainst += row.score_a!;
      if (row.score_a! > row.score_b!) { a.wins++; a.points += 3; }
      else { b.wins++; b.points += 3; }
    }
    if (standings.size !== 4 || [...standings.values()].some(p => p.played !== 3))
      return { status: 'owner_review', reason: 'فهرست بازیکنان یا تعداد بازی‌های گروه ' + group + ' معتبر نیست.' };

    const ranked = [...standings.values()].map(p => ({
      registration_id: p.registration_id, plato_id: p.plato_id, group,
      points: p.points, diff: p.setsFor - p.setsAgainst, setsFor: p.setsFor,
    })).sort(compareOfficial);

    // Only a direct, completed head-to-head between exactly the players tied for 3rd/4th resolves this group tie.
    let thirdPlace = ranked[2];
    if (sameCriteria(ranked[1], ranked[2]) || sameCriteria(ranked[2], ranked[3])) {
      if (sameCriteria(ranked[1], ranked[2]) && sameCriteria(ranked[2], ranked[3]))
        return { status: 'owner_review', reason: 'در گروه ' + group + ' تساوی چندنفره در محدوده رتبه سوم وجود دارد؛ تصمیم مالک لازم است.' };
      if (!sameCriteria(ranked[2], ranked[3]))
        return { status: 'owner_review', reason: 'تساوی رتبه دوم و سوم در گروه ' + group + ' با قانون رودرروی سوم/چهارم قابل حل نیست.' };
      const third = ranked[2], fourth = ranked[3];
      const h2h = groupRows.filter(row =>
        (row.player_a_registration_id === third.registration_id && row.player_b_registration_id === fourth.registration_id) ||
        (row.player_a_registration_id === fourth.registration_id && row.player_b_registration_id === third.registration_id)
      );
      if (h2h.length !== 1)
        return { status: 'owner_review', reason: 'مسابقه رودرروی نفرات سوم و چهارم گروه ' + group + ' یکتا نیست.' };
      const h = h2h[0];
      if (h.result_status === 'double_no_show') {
        // Only a server-verified decision may resolve this exact 3rd/4th tie.
        const selected = resolveSeries3OwnerThirdTie(group, third, fourth, h.result_status, serverVerifiedOwnerDecisions);
        if (!selected) {
          // Preserve the unresolved official group placement. Both candidates have identical
          // ranking criteria, so eligibility can still be decided if neither reaches top eight.
          unresolvedNonAdvancingTies.push([third, fourth]);
        } else {
          // The decision helper returns identity and score, not the group field.
          // Retain the fully typed candidate from the verified current standings.
          const chosen = [third, fourth].find(candidate => candidate.registration_id === selected.registration_id);
          if (!chosen) return { status: 'owner_review', reason: 'شناسه تصمیم رسمی با بازیکنان فعلی گروه ' + group + ' مطابقت ندارد.' };
          thirdPlace = chosen;
        }
      } else {
        if (h.result_status !== 'completed' || h.score_a === h.score_b)
          return { status: 'owner_review', reason: 'نتیجه رودرروی نفرات سوم و چهارم گروه ' + group + ' برای تعیین رتبه معتبر نیست.' };
        const winnerId = h.score_a! > h.score_b! ? h.player_a_registration_id : h.player_b_registration_id;
        thirdPlace = winnerId === third.registration_id ? third : fourth;
      }
    }
    thirdPlaces.push(thirdPlace);
  }

  thirdPlaces.sort(compareOfficial);
  // An unresolved group third/fourth tie is irrelevant only when the group's
  // best possible third-place score is strictly below the eighth-place score.
  // Otherwise the official owner decision is mandatory before any assignment.
  if (unresolvedNonAdvancingTies.some(([a,b]) =>
    !sameCriteria(a,b) || compareOfficial(a,thirdPlaces[7]) <= 0))
    return { status:'owner_review',reason:'تساوی حل‌نشده در رتبه سوم می‌تواند بر هشت سهمیه تأثیر بگذارد؛ تصمیم رسمی مالک لازم است.' };
  const eighth = thirdPlaces[7], ninth = thirdPlaces[8];
  if (sameCriteria(eighth, ninth)) {
    const tied = thirdPlaces.filter(player => sameCriteria(player, eighth));
    if (tied.length !== 2)
      return { status: 'owner_review', reason: 'سه یا چند نفر در مرز هشتم/نهم نفرات سوم مساوی هستند؛ تصمیم مالک لازم است.' };
    const [a, b] = tied as [Series3ThirdPlacePlayer, Series3ThirdPlacePlayer];
    const matchesSaved = Boolean(playoff &&
      ((playoff.player_a_registration_id === a.registration_id && playoff.player_b_registration_id === b.registration_id) ||
       (playoff.player_a_registration_id === b.registration_id && playoff.player_b_registration_id === a.registration_id)) &&
      playoff.player_a_group === (playoff.player_a_registration_id === a.registration_id ? a.group : b.group) &&
      playoff.player_b_group === (playoff.player_b_registration_id === b.registration_id ? b.group : a.group) &&
      playoff.player_a_plato_id === (playoff.player_a_registration_id === a.registration_id ? a.plato_id : b.plato_id) &&
      playoff.player_b_plato_id === (playoff.player_b_registration_id === b.registration_id ? b.plato_id : a.plato_id));
    if (!matchesSaved) return { status: 'playoff_required', players: [a, b], savedPlayoff: null };
    if (playoff!.result_status !== 'completed' || playoff!.score_a === null || playoff!.score_b === null || playoff!.score_a === playoff!.score_b)
      return { status: 'playoff_pending', players: [a, b], savedPlayoff: playoff! };
    const winnerId = playoff!.score_a! > playoff!.score_b! ? playoff!.player_a_registration_id : playoff!.player_b_registration_id;
    const winner = tied.find(player => player.registration_id === winnerId);
    if (!winner) return { status: 'owner_review', reason: 'برنده پلی‌آف با دو بازیکن واجد شرایط تطبیق ندارد.' };
    const qualifiers = thirdPlaces.filter(player => player.registration_id !== a.registration_id && player.registration_id !== b.registration_id).slice(0, 7);
    qualifiers.push(winner);
    qualifiers.sort(compareOfficial);
    return { status: 'ready', qualifiers };
  }

  return { status: 'ready', qualifiers: thirdPlaces.slice(0, 8) };
}
