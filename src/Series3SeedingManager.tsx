import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import Series3FixturesSchedule from './Series3FixturesSchedule';
import Series3GroupResultsManager from './Series3GroupResultsManager';
import { resolveSeries3ThirdPlaces, type Series3PlayoffRecord, type Series3ThirdPlacePlayer } from './series3ThirdPlaceQualification';

type Registration = { id: string; plato_id: string; registration_status: 'main' | 'waitlist' | 'withdrawn' };
type Stats = { request_id: string; games_played: number; games_won: number };
type Player = Registration & { games_played: number | null; games_won: number | null; updated_at?: string };
type DrawGroup = { name: string; players: Player[] };
type BracketToken = { id: string; label: string; source: 'first' | 'second' | 'third' | 'winner'; group?: string };
type BracketMatch = { id: string; a: BracketToken; b: BracketToken };
type SavedBracket = { bracket_snapshot: { tokens: BracketToken[]; round32: BracketMatch[]; round16: BracketMatch[]; quarterfinals: BracketMatch[]; semifinals: BracketMatch[]; final: BracketMatch[] }; created_at: string };

type GroupResultRow = {
  match_id:string; group_name:string; player_a_registration_id:string; player_a_plato_id:string;
  player_b_registration_id:string; player_b_plato_id:string; result_status:'pending'|'completed'|'double_no_show';
  score_a:number|null; score_b:number|null;
};
type GroupStanding = { registration_id:string; plato_id:string; played:number; wins:number; points:number; setsFor:number; setsAgainst:number; diff:number };

type SavedDraw = {
  ranking_snapshot: Player[];
  pots_snapshot: Player[][];
  groups_snapshot: DrawGroup[];
  stats_fingerprint: string;
  created_at: string;
};

const fa = (value: number) => value.toLocaleString('fa-IR');
const pct = (played: number | null, won: number | null) =>
  played !== null && won !== null && played > 0
    ? ((won / played) * 100).toLocaleString('fa-IR', { maximumFractionDigits: 2 }) + '٪'
    : '—';

const panel: React.CSSProperties = {
  marginTop: 18, padding: 16, border: '1px solid #8c6a34', borderRadius: 14,
  background: 'linear-gradient(145deg,#211b12,#111214)', color: '#f2ead8',
};
const muted: React.CSSProperties = { color: '#c9c0b0', fontSize: 12, lineHeight: 1.8 };
const input: React.CSSProperties = {
  width: '100%', minWidth: 0, boxSizing: 'border-box', background: '#0c0d0f',
  border: '1px solid #6a5a37', borderRadius: 8, color: '#fff', padding: '9px 8px',
};
const button: React.CSSProperties = {
  background: 'linear-gradient(120deg,#a98239,#e4c77e)', border: '1px solid #e3c77d',
  borderRadius: 8, color: '#17130b', padding: '9px 12px', fontWeight: 800, cursor: 'pointer',
};
const card: React.CSSProperties = {
  border: '1px solid #5a482a', borderRadius: 11, background: '#151515', padding: 12,
};
const sectionTitle: React.CSSProperties = { color: '#f3dfad', fontSize: 16, margin: 0 };
const secondaryButton: React.CSSProperties = {
  ...button, background: '#211b12', color: '#e4c77e', border: '1px solid #806638',
};

function rankPlayers(items: Player[]): Player[] {
  return [...items].sort((a, b) => {
    const aValid = a.games_played !== null && a.games_won !== null && a.games_played > 0;
    const bValid = b.games_played !== null && b.games_won !== null && b.games_played > 0;
    if (aValid && !bValid) return -1;
    if (!aValid && bValid) return 1;
    if (aValid && bValid) {
      const rateDiff = (b.games_won! / b.games_played!) - (a.games_won! / a.games_played!);
      if (rateDiff !== 0) return rateDiff;
    }
    if (a.games_played !== null && b.games_played !== null && a.games_played !== b.games_played)
      return a.games_played - b.games_played;
    if (a.games_won !== null && b.games_won !== null && a.games_won !== b.games_won)
      return b.games_won - a.games_won;
    return a.plato_id.localeCompare(b.plato_id, 'en', { sensitivity: 'base' });
  });
}

async function fingerprint(players: Player[]): Promise<string> {
  const source = JSON.stringify(players.map(p => ({
    id: p.id, plato_id: p.plato_id, registration_status: p.registration_status,
    games_played: p.games_played, games_won: p.games_won,
  })));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = Math.floor((random[0] / 0x100000000) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}


function calculateBestThirdQualifiers(rows: GroupResultRow[]): BracketToken[] {
  const groups = 'ABCDEFGHIJKL'.split('');
  if (rows.length !== 72 || rows.some(row => row.result_status === 'pending'))
    throw new Error('تا زمانی که نتیجه هر ۷۲ بازی گروهی نهایی نشده باشد، تعیین نفرات سوم مجاز نیست.');
  const thirdPlaces: Array<{group:string; standing:GroupStanding}> = [];
  for (const group of groups) {
    const groupRows = rows.filter(row => row.group_name === group);
    if (groupRows.length !== 6) throw new Error('تعداد بازی‌های گروه '+group+' کامل نیست.');
    const map = new Map<string,GroupStanding>();
    const ensure = (id:string, platoId:string) => {
      if (!map.has(id)) map.set(id,{registration_id:id,plato_id:platoId,played:0,wins:0,points:0,setsFor:0,setsAgainst:0,diff:0});
      return map.get(id)!;
    };
    for (const row of groupRows) {
      const a=ensure(row.player_a_registration_id,row.player_a_plato_id);
      const b=ensure(row.player_b_registration_id,row.player_b_plato_id);
      a.played++; b.played++;
      if (row.result_status === 'completed' && row.score_a !== null && row.score_b !== null) {
        a.setsFor+=row.score_a; a.setsAgainst+=row.score_b;
        b.setsFor+=row.score_b; b.setsAgainst+=row.score_a;
        if(row.score_a>row.score_b){a.wins++;a.points+=3;} else {b.wins++;b.points+=3;}
      }
    }
    if(map.size!==4) throw new Error('فهرست بازیکنان گروه '+group+' کامل یا یکتا نیست.');
    const ranked=[...map.values()].map(p=>({...p,diff:p.setsFor-p.setsAgainst}))
      .sort((a,b)=>b.points-a.points||b.diff-a.diff||b.setsFor-a.setsFor||a.plato_id.localeCompare(b.plato_id,'en'));
    const sameOfficialRank=(a:GroupStanding,b:GroupStanding)=>a.points===b.points&&a.diff===b.diff&&a.setsFor===b.setsFor;
    if(sameOfficialRank(ranked[1],ranked[2])||sameOfficialRank(ranked[2],ranked[3]))
      throw new Error('رتبه سوم گروه '+group+' با معیارهای رسمی قابل تفکیک نیست؛ تساوی باید طبق تصمیم رسمی مدیریت تعیین تکلیف شود.');
    thirdPlaces.push({group,standing:ranked[2]});
  }
  thirdPlaces.sort((a,b)=>b.standing.points-a.standing.points||b.standing.diff-a.standing.diff||b.standing.setsFor-a.standing.setsFor||a.group.localeCompare(b.group,'en'));
  const tiedCutoff=thirdPlaces[6]&&thirdPlaces[7]&&
    thirdPlaces[6].standing.points===thirdPlaces[7].standing.points&&
    thirdPlaces[6].standing.diff===thirdPlaces[7].standing.diff&&
    thirdPlaces[6].standing.setsFor===thirdPlaces[7].standing.setsFor;
  if(tiedCutoff) throw new Error('رتبه هشتم نفرات سوم با معیارهای رسمی مساوی است؛ بدون تصمیم تکمیلی، انتخاب هشت نفر ممکن نیست.');
  return thirdPlaces.slice(0,8).map(({group,standing})=>({
    id:'THIRD-'+standing.registration_id,label:standing.plato_id,source:'third',group
  }));
}

function buildProtectedRound32(tokens: BracketToken[]): { tokens: BracketToken[]; round32: BracketMatch[] } {
  const topTwo = shuffled(tokens.filter(token => token.source === 'first' || token.source === 'second'));
  const thirds = shuffled(tokens.filter(token => token.source === 'third'));
  if (topTwo.length !== 24 || thirds.length !== 8) throw new Error('ساختار ورودی براکت باید دقیقاً ۲۴ نفر اول/دوم و ۸ جای‌نگهدار نفر سوم باشد.');
  const opponents: BracketToken[] = [];
  const pairings: Array<[BracketToken, BracketToken]> = [];
  const pairRemaining = (pool: BracketToken[]): boolean => {
    if (pool.length === 0) return true;
    const first = pool[0];
    for (const candidate of shuffled(pool.slice(1).filter(player => player.group !== first.group))) {
      const rest = pool.slice(1).filter(player => player.id !== candidate.id);
      pairings.push([first, candidate]);
      if (pairRemaining(rest)) return true;
      pairings.pop();
    }
    return false;
  };
  const assignThirds = (index: number, available: BracketToken[]): boolean => {
    if (index === thirds.length) return available.length === 16 && pairRemaining(available);
    const candidates = shuffled(available.filter(player => player.group));
    for (const candidate of candidates) {
      opponents.push(candidate);
      if (assignThirds(index + 1, available.filter(player => player.id !== candidate.id))) return true;
      opponents.pop();
    }
    return false;
  };
  if (!assignThirds(0, topTwo)) throw new Error('ترکیب معتبر قرعه بدون برخورد هم‌گروهی پیدا نشد؛ قرعه ذخیره نشد.');
  const matches: Array<Omit<BracketMatch, 'id'>> = [
    ...pairings.map(([a,b]) => ({ a, b })),
    ...thirds.map((third, index) => ({ a: third, b: opponents[index] })),
  ];
  const ordered: BracketMatch[] = shuffled(matches).map((match, index) => ({ ...match, id: 'R32-' + (index + 1) }));
  const all = ordered.flatMap(match => [match.a, match.b]);
  if (all.length !== 32 || new Set(all.map(token => token.id)).size !== 32) throw new Error('اعتبارسنجی یکتایی ورودی‌های براکت ناموفق بود.');
  for (const match of ordered) {
    if (match.a.group && match.b.group && match.a.group === match.b.group)
      throw new Error('خطای کنترل نهایی: دو بازیکن از یک گروه در یک مسابقه دور ۳۲ قرار گرفته‌اند.');
    if ((match.a.source === 'third') === (match.b.source === 'third'))
      throw new Error('هر جایگاه نفر سوم باید دقیقاً مقابل یک نفر اول یا دوم قرار بگیرد.');
  }
  return { tokens: shuffled(all), round32: ordered };
}

/**
 * Maps the final eight third-place qualifiers onto the pre-drawn placeholder
 * slots. A qualifier can only occupy a slot whose R32 opponent is from another
 * group. No bracket positions or downstream winner references are changed.
 */
function assignThirdPlaceQualifiers(
  bracket: SavedBracket['bracket_snapshot'],
  qualifiers: BracketToken[],
): SavedBracket['bracket_snapshot'] {
  const placeholders = bracket.round32.flatMap(match => [
    { matchId: match.id, side: 'a' as const, token: match.a, opponent: match.b },
    { matchId: match.id, side: 'b' as const, token: match.b, opponent: match.a },
  ]).filter(slot => slot.token.source === 'third');

  if (placeholders.length !== 8 || qualifiers.length !== 8)
    throw new Error('برای جایگزینی باید دقیقاً هشت جایگاه و هشت صعودکننده سوم وجود داشته باشد.');
  if (qualifiers.some(q => q.source !== 'third' || !q.group || !q.id || !q.label))
    throw new Error('اطلاعات هر هشت صعودکننده سوم باید شامل شناسه، نام نمایشی و گروه معتبر باشد.');
  if (new Set(qualifiers.map(q => q.id)).size !== 8 || new Set(qualifiers.map(q => q.group)).size !== 8)
    throw new Error('شناسه بازیکنان و گروه صعودکنندگان سوم باید یکتا باشد.');
  if (qualifiers.some(q => placeholders.some(p => p.token.id === q.id)))
    throw new Error('شناسه بازیکن واقعی با شناسه جایگاه موقت تداخل دارد.');

  // Minimum-remaining-values ordering makes the matching deterministic and
  // quickly exposes an impossible assignment instead of forcing a bad pairing.
  const ordered = [...qualifiers].sort((a, b) =>
    placeholders.filter(p => p.opponent.group !== a.group).length -
    placeholders.filter(p => p.opponent.group !== b.group).length ||
    String(a.group).localeCompare(String(b.group), 'en')
  );
  const assignment = new Map<string, BracketToken>();
  const usedSlots = new Set<string>();
  const search = (index: number): boolean => {
    if (index === ordered.length) return true;
    const qualifier = ordered[index];
    const candidates = placeholders
      .filter(slot => !usedSlots.has(slot.token.id) && slot.opponent.group !== qualifier.group)
      .sort((a, b) => a.token.id.localeCompare(b.token.id, 'en'));
    for (const slot of candidates) {
      usedSlots.add(slot.token.id);
      assignment.set(slot.token.id, qualifier);
      if (search(index + 1)) return true;
      assignment.delete(slot.token.id);
      usedSlots.delete(slot.token.id);
    }
    return false;
  };
  if (!search(0))
    throw new Error('برای این ترکیب نفرات سوم، تطبیق کامل بدون هم‌گروهی در دور اول ممکن نیست؛ هیچ تغییری اعمال نشد.');

  const replace = (token: BracketToken): BracketToken =>
    token.source === 'third' ? assignment.get(token.id)! : token;
  const round32 = bracket.round32.map(match => ({
    ...match, a: replace(match.a), b: replace(match.b),
  }));
  const tokens = bracket.tokens.map(replace);
  const all = round32.flatMap(match => [match.a, match.b]);
  if (all.length !== 32 || new Set(all.map(token => token.id)).size !== 32 ||
      round32.some(match => match.a.group && match.a.group === match.b.group) ||
      all.filter(token => token.source === 'third' && token.group).length !== 8) {
    throw new Error('کنترل نهایی جایگزینی نفرات سوم ناموفق بود؛ براکت ذخیره نشد.');
  }
  return { ...bracket, tokens, round32 };
}

export default function Series3SeedingManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { played: string; won: string }>>({});
  const [search, setSearch] = useState('');
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [rankingExpanded, setRankingExpanded] = useState(true);
  const [potsExpanded, setPotsExpanded] = useState(false);
  const [drawExpanded, setDrawExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drawLoading, setDrawLoading] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);
  const [savedDraw, setSavedDraw] = useState<SavedDraw | null>(null);
  const [savedBracket, setSavedBracket] = useState<SavedBracket | null>(null);
  const [bracketExpanded, setBracketExpanded] = useState(true);
  const [bracketConfirm, setBracketConfirm] = useState(false);
  const [bracketReplaceConfirm, setBracketReplaceConfirm] = useState(false);
  const [thirdsLoading, setThirdsLoading] = useState(false);
  const [playoffCandidates, setPlayoffCandidates] = useState<[Series3ThirdPlacePlayer, Series3ThirdPlacePlayer] | null>(null);
  const [playoffScoreA, setPlayoffScoreA] = useState('');
  const [playoffScoreB, setPlayoffScoreB] = useState('');
  const [playoffSaving, setPlayoffSaving] = useState(false);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setError('اتصال به دیتابیس اصلی در دسترس نیست.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [registrationResult, statsResult, drawResult] = await Promise.all([
        supabase.from('plato_land_series3_registration_requests')
          .select('id,plato_id,registration_status').in('registration_status', ['main', 'waitlist']).order('created_at', { ascending: true }),
        supabase.from('plato_land_series3_player_stats').select('request_id,games_played,games_won'),
        supabase.from('plato_land_series3_seeding_draws')
          .select('ranking_snapshot,pots_snapshot,groups_snapshot,stats_fingerprint,created_at')
          .eq('event_key', 'series3').maybeSingle(),
      ]);
      if (registrationResult.error) throw registrationResult.error;
      if (statsResult.error) throw statsResult.error;
      if (drawResult.error) throw drawResult.error;
      const bracketResult = (await supabase.from('plato_land_series3_knockout_draws').select('bracket_snapshot,created_at').eq('event_key','series3').maybeSingle());
      if (bracketResult.error) throw bracketResult.error;

      const statsById = new Map<string, Stats>(
        (statsResult.data || []).map((row: any) => [String(row.request_id), {
          request_id: String(row.request_id),
          games_played: Number(row.games_played),
          games_won: Number(row.games_won),
        }]),
      );
      const next = (registrationResult.data || []).map((row: any) => {
        const stat = statsById.get(String(row.id));
        return {
          id: String(row.id), plato_id: String(row.plato_id || ''), registration_status: row.registration_status,
          games_played: stat ? stat.games_played : null,
          games_won: stat ? stat.games_won : null,
        } as Player;
      });
      const ranked = rankPlayers(next);

      const saved = drawResult.data as SavedDraw | null;
      const currentFingerprint = await fingerprint(ranked);
      setPlayers(ranked);
      setSavedDraw(saved);
      setSavedBracket(bracketResult.data as SavedBracket | null);
      setIsStale(Boolean(saved && saved.stats_fingerprint !== currentFingerprint));
      setDrafts(Object.fromEntries(ranked.map(player => [player.id, {
        played: player.games_played === null ? '' : String(player.games_played),
        won: player.games_won === null ? '' : String(player.games_won),
      }])));
    } catch (e) {
      console.error('Series 3 seeding manager load failed:', e);
      setError('دریافت اطلاعات سری سوم ناموفق بود: ' + (e instanceof Error ? e.message : 'خطای ناشناخته'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const completed = players.filter(p => p.games_played !== null && p.games_won !== null).length;
  const mainCount = players.filter(p => p.registration_status === 'main').length;
  const waitlistCount = players.filter(p => p.registration_status === 'waitlist').length;
  const validPlayers = players.length === 48 && players.every(p =>
    p.games_played !== null && p.games_won !== null && p.games_played > 0 &&
    p.games_won >= 0 && p.games_won <= p.games_played
  );
  const currentPots = useMemo(() => [0, 1, 2, 3].map(i => players.slice(i * 12, (i + 1) * 12)), [players]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return players.filter(p => !term || p.plato_id.toLocaleLowerCase().includes(term));
  }, [players, search]);

  async function save(player: Player) {
    if (!supabase) { setError('اتصال به دیتابیس اصلی در دسترس نیست.'); return; }
    const draft = drafts[player.id] || { played: '', won: '' };
    if (!/^\d+$/.test(draft.played.trim()) || !/^\d+$/.test(draft.won.trim())) {
      setError('برای ' + player.plato_id + ' تعداد کل بازی و تعداد برد را با عدد صحیح وارد کن.');
      setMessage(''); return;
    }
    const played = Number(draft.played), won = Number(draft.won);
    if (!Number.isSafeInteger(played) || !Number.isSafeInteger(won) || played < 0 || won < 0 || won > played) {
      setError('اطلاعات ' + player.plato_id + ' معتبر نیست؛ برد باید بین صفر و تعداد کل بازی باشد.');
      setMessage(''); return;
    }
    setSavingId(player.id); setError(''); setMessage('');
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userResult.user) throw new Error('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.');
      const { error: saveError } = await supabase.from('plato_land_series3_player_stats').upsert({
        request_id: player.id, games_played: played, games_won: won,
        updated_at: new Date().toISOString(), updated_by: userResult.user.id,
      }, { onConflict: 'request_id' });
      if (saveError) throw saveError;
      setMessage('آمار ' + player.plato_id + ' ذخیره شد.');
      await load();
    } catch (e) {
      console.error('Series 3 player stats save failed:', e);
      setError('ذخیره آمار ' + player.plato_id + ' ناموفق بود: ' + (e instanceof Error ? e.message : 'خطای ناشناخته'));
    } finally { setSavingId(null); }
  }

  async function runDraw() {
    if (!supabase || !validPlayers || savedDraw || drawLoading) return;
    setDrawLoading(true); setError(''); setMessage('');
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userResult.user) throw new Error('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.');
      const [registrationResult, statsResult] = await Promise.all([
        supabase.from('plato_land_series3_registration_requests')
          .select('id,plato_id,registration_status').in('registration_status', ['main', 'waitlist']).order('created_at', { ascending: true }),
        supabase.from('plato_land_series3_player_stats').select('request_id,games_played,games_won'),
      ]);
      if (registrationResult.error) throw registrationResult.error;
      if (statsResult.error) throw statsResult.error;
      const freshStats = new Map<string, Stats>((statsResult.data || []).map((row: any) => [String(row.request_id), {
        request_id: String(row.request_id), games_played: Number(row.games_played), games_won: Number(row.games_won),
      }]));
      const freshPlayers = rankPlayers((registrationResult.data || []).map((row: any) => {
        const stat = freshStats.get(String(row.id));
        return {
          id: String(row.id), plato_id: String(row.plato_id || ''), registration_status: row.registration_status,
          games_played: stat ? stat.games_played : null, games_won: stat ? stat.games_won : null,
        } as Player;
      }));
      const currentFingerprint = await fingerprint(players);
      const freshFingerprint = await fingerprint(freshPlayers);
      if (freshFingerprint !== currentFingerprint) {
        await load();
        throw new Error('آمار یا فهرست بازیکنان پس از بارگذاری تغییر کرده است؛ اطلاعات تازه شد. دوباره بررسی کن و سپس قرعه‌کشی را اجرا کن.');
      }
      if (freshPlayers.length !== 48 || freshPlayers.some(p =>
        p.games_played === null || p.games_won === null || p.games_played <= 0 ||
        p.games_won < 0 || p.games_won > p.games_played
      )) throw new Error('اطلاعات فعلی هر ۴۸ بازیکن معتبر نیست؛ قرعه‌کشی متوقف شد.');

      const pots = [0, 1, 2, 3].map(i => freshPlayers.slice(i * 12, (i + 1) * 12));
      const shuffledPots = pots.map(pot => shuffled(pot));
      const groups: DrawGroup[] = Array.from({ length: 12 }, (_, index) => ({
        name: String.fromCharCode(65 + index),
        players: shuffledPots.map(pot => pot[index]),
      }));
      const { data, error: insertError } = await supabase.from('plato_land_series3_seeding_draws').insert({
        event_key: 'series3',
        ranking_snapshot: freshPlayers,
        pots_snapshot: pots,
        groups_snapshot: groups,
        stats_fingerprint: currentFingerprint,
        created_by: userResult.user.id,
      }).select('ranking_snapshot,pots_snapshot,groups_snapshot,stats_fingerprint,created_at').single();
      if (insertError) {
        if (insertError.code === '23505') {
          await load();
          throw new Error('قرعه‌کشی قبلاً توسط شما یا مدیر دیگری ثبت شده است؛ نتیجه ذخیره‌شده بارگذاری شد.');
        }
        throw insertError;
      }
      setSavedDraw(data as SavedDraw);
      setIsStale(false);
      setConfirmDraw(false);
      setMessage('قرعه‌کشی با موفقیت در دیتابیس اصلی ذخیره و قفل شد.');
    } catch (e) {
      console.error('Series 3 draw save failed:', e);
      setError(e instanceof Error ? e.message : 'ذخیره قرعه‌کشی ناموفق بود.');
    } finally { setDrawLoading(false); }
  }


  async function runBracketDraw(replaceExisting = false) {
    if (!supabase || !savedDraw || (savedBracket && !replaceExisting) || bracketLoading) return;
    setBracketLoading(true); setError(''); setMessage('');
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userResult.user) throw new Error('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.');
      const groupNames = savedDraw.groups_snapshot.map(g => g.name);
      if (groupNames.length !== 12) throw new Error('قرعه گروه‌ها باید ابتدا ثبت شده باشد.');
      const tokens: BracketToken[] = [
        ...groupNames.map(group => ({ id: '1-' + group, label: 'اول گروه ' + group, source: 'first' as const, group })),
        ...groupNames.map(group => ({ id: '2-' + group, label: 'دوم گروه ' + group, source: 'second' as const, group })),
        ...Array.from({length:8},(_,i)=>({id:'3-BEST-'+(i+1),label:'سوم برتر شماره '+fa(i+1),source:'third' as const}))
      ];
      const protectedDraw = buildProtectedRound32(tokens);
      const shuffledTokens = protectedDraw.tokens;
      const round32: BracketMatch[] = protectedDraw.round32;
      const makeNextRound=(prefix:string,previous:BracketMatch[]):BracketMatch[]=>Array.from({length:previous.length/2},(_,i)=>({
        id:prefix+'-'+(i+1),
        a:{id:'W-'+previous[i*2].id,label:'برنده '+previous[i*2].id,source:'winner' as const},
        b:{id:'W-'+previous[i*2+1].id,label:'برنده '+previous[i*2+1].id,source:'winner' as const}
      }));
      const round16=makeNextRound('R16',round32);
      const quarterfinals=makeNextRound('QF',round16);
      const semifinals=makeNextRound('SF',quarterfinals);
      const final=makeNextRound('F',semifinals);
      const bracket_snapshot = {tokens:shuffledTokens,round32,round16,quarterfinals,semifinals,final};
      const drawSource = JSON.stringify({entrants:shuffledTokens,bracket:bracket_snapshot});
      const drawDigest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(drawSource));
      const draw_fingerprint = Array.from(new Uint8Array(drawDigest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
      const {data,error:replaceError}=await supabase.rpc('replace_series3_knockout_draw',{
        p_entrants_snapshot: shuffledTokens,
        p_bracket_snapshot: bracket_snapshot,
        p_draw_fingerprint: draw_fingerprint,
        p_archive_reason: 'Replaced invalid Series 3 draw: prevent same-group Round of 32 clashes'
      });
      if(replaceError) throw replaceError;
      if (!data?.success || !data?.bracket_snapshot || !data?.created_at)
        throw new Error('پاسخ ذخیره‌سازی کامل نبود؛ وضعیت رکورد باید جداگانه بررسی شود.');
      setSavedBracket({ bracket_snapshot: data.bracket_snapshot, created_at: data.created_at } as SavedBracket);
      setBracketConfirm(false);
      setBracketReplaceConfirm(false);
      setMessage('قرعه کامل مسیر حذفی تا فینال در دیتابیس اصلی ذخیره و قفل شد.');
    } catch(e) {
      console.error('Series 3 knockout draw failed:',e);
      setError('قرعه مرحله حذفی ذخیره نشد: '+(e instanceof Error?e.message:'خطای ناشناخته'));
    } finally {setBracketLoading(false);}
  }


  async function runThirdPlaceAssignment() {
    if (!supabase || !savedBracket || thirdsLoading) return;
    setThirdsLoading(true); setError(''); setMessage('');
    try {
      const [{data:groupRows,error:readError},{data:playoffData,error:playoffReadError}] = await Promise.all([
        supabase.from('plato_land_series3_group_match_results').select('match_id,group_name,player_a_registration_id,player_a_plato_id,player_b_registration_id,player_b_plato_id,result_status,score_a,score_b'),
        supabase.from('plato_land_series3_third_place_playoff').select('player_a_registration_id,player_a_plato_id,player_a_group,player_b_registration_id,player_b_plato_id,player_b_group,result_status,score_a,score_b').eq('event_key','series3').maybeSingle(),
      ]);
      if(readError) throw readError;
      if(playoffReadError) throw playoffReadError;
      const resolution = resolveSeries3ThirdPlaces((groupRows || []) as any[], (playoffData || null) as Series3PlayoffRecord | null);
      if (resolution.status === 'owner_review') throw new Error(resolution.reason);
      if (resolution.status === 'playoff_required' || resolution.status === 'playoff_pending') {
        setPlayoffCandidates(resolution.players);
        setPlayoffScoreA(resolution.savedPlayoff?.score_a == null ? '' : String(resolution.savedPlayoff.score_a));
        setPlayoffScoreB(resolution.savedPlayoff?.score_b == null ? '' : String(resolution.savedPlayoff.score_b));
        setMessage('تساوی دقیق در مرز هشتم و نهم وجود دارد؛ نتیجه مسابقه پلی‌آف را ثبت کن.');
        return;
      }
      const qualifiers=resolution.qualifiers.map(p=>({id:'THIRD-'+p.registration_id,label:p.plato_id,source:'third' as const,group:p.group}));
      const nextSnapshot=assignThirdPlaceQualifiers(savedBracket.bracket_snapshot,qualifiers);
      const drawSource=JSON.stringify({entrants:nextSnapshot.tokens,bracket:nextSnapshot});
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(drawSource));
      const drawFingerprint=Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,'0')).join('');
      const {data:saveData,error:saveError}=await supabase.rpc('replace_series3_knockout_draw',{
        p_entrants_snapshot:nextSnapshot.tokens,p_bracket_snapshot:nextSnapshot,p_draw_fingerprint:drawFingerprint,
        p_archive_reason:'Resolved eight official Series 3 third-place qualifiers into fixed bracket placeholders'
      });
      if(saveError) throw saveError;
      if(!saveData?.success||!saveData?.bracket_snapshot||!saveData?.created_at) throw new Error('پاسخ ذخیره‌سازی کامل نبود؛ وضعیت براکت باید جداگانه بررسی شود.');
      setSavedBracket({bracket_snapshot:saveData.bracket_snapshot,created_at:saveData.created_at} as SavedBracket);
      setPlayoffCandidates(null);
      setMessage('هشت نفر سوم طبق معیارهای رسمی در جایگاه‌های ثابت ثبت شدند.');
    } catch(e) {
      console.error('Series 3 third-place assignment failed:',e);
      setError('تعیین نفرات سوم انجام نشد: '+(e instanceof Error?e.message:'خطای ناشناخته'));
    } finally {setThirdsLoading(false);}
  }

  async function saveThirdPlacePlayoff() {
    if (!supabase || !playoffCandidates || playoffSaving) return;
    if (!/^\\d+$/.test(playoffScoreA.trim()) || !/^\\d+$/.test(playoffScoreB.trim())) { setError('نتیجه هر دو بازیکن را با عدد صحیح وارد کن.'); return; }
    const scoreA=Number(playoffScoreA), scoreB=Number(playoffScoreB);
    if (!Number.isSafeInteger(scoreA)||!Number.isSafeInteger(scoreB)||scoreA<0||scoreB<0||scoreA===scoreB) { setError('نتیجه پلی‌آف باید دو عدد صحیح نامساوی و غیرمنفی باشد.'); return; }
    const [a,b]=playoffCandidates;
    setPlayoffSaving(true); setError(''); setMessage('');
    try {
      const {data,error:saveError}=await supabase.rpc('save_series3_third_place_playoff',{
        p_player_a_registration_id:a.registration_id,p_player_a_plato_id:a.plato_id,p_player_a_group:a.group,
        p_player_b_registration_id:b.registration_id,p_player_b_plato_id:b.plato_id,p_player_b_group:b.group,
        p_result_status:'completed',p_score_a:scoreA,p_score_b:scoreB,
      });
      if(saveError) throw saveError;
      if(!data?.success) throw new Error('پاسخ ذخیره نتیجه پلی‌آف معتبر نیست.');
      setMessage('نتیجه پلی‌آف در دیتابیس ثبت شد؛ دوباره محاسبه نفرات سوم را اجرا کن.');
    } catch(e) { setError('ذخیره نتیجه پلی‌آف انجام نشد: '+(e instanceof Error?e.message:'خطای ناشناخته')); }
    finally {setPlayoffSaving(false);}
  }

  const displayedRanking = savedDraw?.ranking_snapshot || players;
  const displayedPots = savedDraw?.pots_snapshot || currentPots;
  const displayedGroups = savedDraw?.groups_snapshot || [];

  return <details dir="rtl" style={{...panel,padding:0}}>
    <summary style={{cursor:'pointer',padding:16,color:'#f6e8c5',fontSize:20,fontWeight:800}}>مدیریت رتبه‌بندی و قرعه‌کشی سری سوم</summary>
    <div style={{padding:'0 16px 16px'}}>
    <Series3FixturesSchedule />
    <Series3GroupResultsManager />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ ...muted, margin: 0 }}>۴۸ بازیکن اصلی و رزرو · رتبه‌بندی درصد برد · چهار سید · دوازده گروه</p>
      </div>
      <button type="button" style={button} onClick={() => void load()} disabled={loading}>
        {loading ? 'در حال دریافت…' : 'تازه‌سازی اطلاعات'}
      </button>
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 13 }}>
      {[
        ['بازیکنان اصلی', mainCount],
        ['بازیکنان رزرو', waitlistCount],
        ['آمار معتبر', completed],
        ['در انتظار آمار', Math.max(0, players.length - completed)],
      ].map(([label, value]) => <div key={String(label)} style={{ flex: '1 1 105px', minWidth: 0, padding: '9px 11px', border: '1px solid #66512d', borderRadius: 9, background: '#171513' }}>
        <div style={muted}>{label}</div><strong style={{ color: '#f1d99e', fontSize: 21 }}>{loading ? '—' : fa(Number(value))}</strong>
      </div>)}
    </div>
    {error && <p role="alert" style={{ color: '#f0aaaa', fontSize: 12 }}>{error}</p>}
    {message && <p role="status" style={{ color: '#b8dfa9', fontSize: 12 }}>{message}</p>}
    {savedDraw && <div style={{ ...card, marginTop: 12, borderColor: isStale ? '#b77743' : '#628052' }}>
      <strong style={{ color: isStale ? '#efb27b' : '#b8dfa9' }}>
        {isStale ? 'توجه: آمار فعلی با آمار زمان قرعه‌کشی متفاوت است.' : 'قرعه‌کشی ثبت‌شده و قفل‌شده است.'}
      </strong>
      <p style={{ ...muted, margin: '5px 0 0' }}>
        زمان ثبت: {new Date(savedDraw.created_at).toLocaleString('fa-IR')} · نتیجه ذخیره‌شده تغییر نمی‌کند.
        {isStale ? ' سیدها و گروه‌ها همان نسخه زمان قرعه‌کشی هستند؛ تغییر خودکار انجام نشده است.' : ''}
      </p>
    </div>}

    <div style={{ ...card, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={sectionTitle}>۱. رتبه‌بندی ۴۸ بازیکن</h3>
        <button type="button" style={secondaryButton} onClick={() => setRankingExpanded(v => !v)}>{rankingExpanded ? 'بستن' : 'نمایش'}</button>
      </div>
      {rankingExpanded && <>
        <p style={muted}>درصد برد، سپس تعداد بازی کمتر، تعداد برد بیشتر و در نهایت Plato ID الفبایی.</p>
        <div style={{ display: 'grid', gap: 7 }}>
          {displayedRanking.map((player, index) => <div key={player.id} style={{
            display: 'grid', gridTemplateColumns: '34px minmax(0,1fr) auto', gap: 8, alignItems: 'center',
            padding: '9px 10px', border: '1px solid #403725', borderRadius: 8, background: '#101112',
          }}>
            <strong style={{ color: '#e4c77e' }}>#{fa(index + 1)}</strong>
            <div style={{ minWidth: 0 }}>
              <strong dir="ltr" style={{ color: '#f5f0e6', fontSize: 13, overflowWrap: 'anywhere' }}>{player.plato_id}</strong>
              <div style={muted}>{player.registration_status === 'main' ? 'اصلی' : 'رزرو'} · {fa(player.games_played || 0)} بازی · {fa(player.games_won || 0)} برد</div>
            </div>
            <strong style={{ color: '#e4c77e', whiteSpace: 'nowrap' }}>{pct(player.games_played, player.games_won)}</strong>
          </div>)}
        </div>
      </>}
    </div>

    <div style={{ ...card, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={sectionTitle}>۲. تقسیم‌بندی سیدها</h3>
        <button type="button" style={secondaryButton} onClick={() => setPotsExpanded(v => !v)}>{potsExpanded ? 'بستن' : 'نمایش'}</button>
      </div>
      {potsExpanded && <>
        <p style={muted}>تقسیم دقیق بر اساس رتبه؛ هر سید شامل ۱۲ بازیکن است. سید ۱ رتبه‌های ۱ تا ۱۲ و به همین ترتیب تا سید ۴.</p>
        <div style={{ display: 'grid', gap: 9 }}>
          {displayedPots.map((pot, index) => <details key={index} style={{ border: '1px solid #59472a', borderRadius: 9, padding: 10, background: '#101112' }}>
            <summary style={{cursor:'pointer',color:'#e4c77e',fontWeight:800}}>سید {fa(index + 1)} · {fa(index * 12 + 1)} تا {fa(index * 12 + 12)} · {fa(pot.length)} بازیکن</summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 6, marginTop: 8 }}>
              {pot.map((player, i) => <div key={player.id} style={{ padding: '6px 7px', borderRadius: 6, background: '#1c1b18', minWidth: 0 }}>
                <span style={{ color: '#c6a45e', fontSize: 11 }}>{fa(index * 12 + i + 1)}. </span>
                <strong dir="ltr" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{player.plato_id}</strong>
              </div>)}
            </div>
          </details>)}
        </div>
      </>}
    </div>

    <div style={{ ...card, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={sectionTitle}>۳. قرعه‌کشی ۱۲ گروه</h3>
        <button type="button" style={secondaryButton} onClick={() => setDrawExpanded(v => !v)}>{drawExpanded ? 'بستن' : 'نمایش'}</button>
      </div>
      {drawExpanded && <>
        {!savedDraw ? <>
          <p style={muted}>برای هر گروه، دقیقاً یک بازیکن از هر سید به‌صورت تصادفی انتخاب می‌شود. پس از ذخیره، نتیجه برای همه ورودهای بعدی ثابت می‌ماند.</p>
          {!validPlayers && <p style={{ color: '#efb27b', fontSize: 12 }}>قرعه‌کشی تا زمانی که دقیقاً ۴۸ بازیکن با آمار معتبر وجود نداشته باشد فعال نمی‌شود.</p>}
          {!confirmDraw ? <button type="button" style={button} disabled={!validPlayers || loading} onClick={() => setConfirmDraw(true)}>آماده‌سازی و تأیید قرعه‌کشی</button> :
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={button} disabled={drawLoading} onClick={() => void runDraw()}>{drawLoading ? 'در حال قرعه‌کشی و ذخیره…' : 'تأیید نهایی و اجرای قرعه‌کشی'}</button>
              <button type="button" style={secondaryButton} disabled={drawLoading} onClick={() => setConfirmDraw(false)}>انصراف</button>
            </div>}
        </> : <>
          <p style={{ ...muted, marginBottom: 10 }}>نتیجه قرعه‌کشی از نسخه ذخیره‌شده دیتابیس خوانده شده است؛ باز و بسته‌کردن این بخش یا Refresh آن را تغییر نمی‌دهد.</p>
          <div style={{ display: 'grid', gap: 9 }}>
            {displayedGroups.map(group => <details key={group.name} style={{ border: '1px solid #806638', borderRadius: 9, padding: 10, background: '#101112' }}>
              <summary style={{cursor:'pointer',color:'#e4c77e',fontSize:15,fontWeight:800}}>گروه {group.name} · {fa(group.players.length)} بازیکن</summary>
              <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                {group.players.map((player, index) => <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '7px 8px', borderRadius: 6, background: '#1b1a17' }}>
                  <strong dir="ltr" style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{player.plato_id}</strong>
                  <span style={{ color: '#c6a45e', fontSize: 11, whiteSpace: 'nowrap' }}>سید {fa(index + 1)}</span>
                </div>)}
              </div>
            </details>)}
          </div>
        </>}
      </>}
    </div>


    <div style={{ ...card, marginTop: 10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <h3 style={sectionTitle}>۴. قرعه‌کشی تصادفی مرحله حذفی تا فینال (۳۲ نفر)</h3>
        <button type="button" style={secondaryButton} onClick={()=>setBracketExpanded(v=>!v)}>{bracketExpanded?'بستن':'نمایش'}</button>
      </div>
      {bracketExpanded && <>
        <p style={muted}>۲۴ جایگاه نفرات اول و دوم گروه‌ها + ۸ جایگاه نفرات سوم برتر. قرعه اکنون انجام می‌شود تا مسیر هر جایگاه از یک‌شانزدهم تا فینال از قبل مشخص باشد. نام واقعی ۸ نفر سوم پس از پایان گروه‌ها در همین جایگاه‌های ثابت قرار می‌گیرد.</p>
        {!savedDraw && <p style={{color:'#efb27b',fontSize:12}}>ابتدا قرعه‌کشی ۱۲ گروه باید ذخیره شده باشد.</p>}
        {!savedBracket ? <>
          {!bracketConfirm ? <button type="button" style={button} disabled={!savedDraw||bracketLoading} onClick={()=>setBracketConfirm(true)}>آماده‌سازی قرعه‌کشی ۳۲ نفره</button> :
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button type="button" style={button} disabled={bracketLoading} onClick={()=>void runBracketDraw()}>{bracketLoading?'در حال قرعه‌کشی و ذخیره…':'تأیید و اجرای قرعه‌کشی حذفی'}</button>
              <button type="button" style={secondaryButton} disabled={bracketLoading} onClick={()=>setBracketConfirm(false)}>انصراف</button>
            </div>}
        </> : <>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
            {!bracketReplaceConfirm ? <button type="button" style={secondaryButton} onClick={()=>setBracketReplaceConfirm(true)}>اصلاح قرعه ذخیره‌شده (حفظ نسخه قبلی در تاریخچه)</button> :
              <>
                <button type="button" style={button} disabled={bracketLoading} onClick={()=>void runBracketDraw(true)}>{bracketLoading?'در حال اصلاح…':'تأیید اصلاح و جایگزینی براکت'}</button>
                <button type="button" style={secondaryButton} disabled={bracketLoading} onClick={()=>setBracketReplaceConfirm(false)}>انصراف</button>
              </>}
          </div>
          <p style={{...muted,color:'#b8dfa9'}}>قرعه ثبت شده و ثابت است · {new Date(savedBracket.created_at).toLocaleString('fa-IR')}</p>
          {([
            ['یک‌شانزدهم نهایی · ۱۶ بازی',savedBracket.bracket_snapshot.round32],
            ['یک‌هشتم نهایی · ۸ بازی',savedBracket.bracket_snapshot.round16],
            ['یک‌چهارم نهایی · ۴ بازی',savedBracket.bracket_snapshot.quarterfinals],
            ['نیمه‌نهایی · ۲ بازی',savedBracket.bracket_snapshot.semifinals],
            ['فینال',savedBracket.bracket_snapshot.final]
          ] as [string,BracketMatch[]][]).map(([title,matches])=><details key={title} style={{marginTop:12,border:'1px solid #59472a',borderRadius:9,padding:10,background:'#101112'}}>
            <summary style={{cursor:'pointer',color:'#e4c77e',fontWeight:800}}>{title} · {fa(matches.length)} مسابقه</summary>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:8,marginTop:7}}>
              {matches.map((m,i)=><div key={m.id} style={{...card,padding:9}}>
                <strong style={{color:'#e4c77e'}}>{title==='فینال'?'مسابقه نهایی':'بازی '+fa(i+1)}</strong>
                <div style={{...muted,marginTop:5}}>{m.a.label}</div>
                <div style={{...muted,borderTop:'1px solid #51452d',paddingTop:5,marginTop:5}}>{m.b.label}</div>
              </div>)}
            </div>
          </details>)}

          {savedBracket.bracket_snapshot.tokens.some(t=>t.source==='third'&&!t.group) ? (
            <div style={{...card,marginTop:12,borderColor:'#806638'}}>
              <strong style={{color:'#e4c77e'}}>جایگزینی جایگاه‌های موقت نفرات سوم</strong>
              <p style={muted}>معیارها: امتیاز، تفاضل ست و ست برده‌شده. تساوی سوم/چهارم هر گروه با رودررو و تساوی دو نفر در مرز هشتم/نهم با پلی‌آف تعیین می‌شود؛ تساوی چندنفره برای بررسی مالک متوقف خواهد شد.</p>
              <button type="button" style={button} disabled={thirdsLoading} onClick={()=>void runThirdPlaceAssignment()}>{thirdsLoading?'در حال محاسبه…':'محاسبه و ثبت هشت نفر سوم رسمی'}</button>
              {playoffCandidates && <div style={{...card,marginTop:10,borderColor:'#b18a45'}}>
                <strong style={{color:'#f0d79e'}}>مسابقه پلی‌آف برای تعیین نفر هشتم</strong>
                <p style={muted}>{playoffCandidates[0].plato_id} (گروه {playoffCandidates[0].group}) در برابر {playoffCandidates[1].plato_id} (گروه {playoffCandidates[1].group})</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
                  <label style={muted}>امتیاز {playoffCandidates[0].plato_id}<input inputMode="numeric" value={playoffScoreA} onChange={e=>setPlayoffScoreA(e.target.value)} style={input}/></label>
                  <label style={muted}>امتیاز {playoffCandidates[1].plato_id}<input inputMode="numeric" value={playoffScoreB} onChange={e=>setPlayoffScoreB(e.target.value)} style={input}/></label>
                </div>
                <button type="button" style={{...button,marginTop:9}} disabled={playoffSaving} onClick={()=>void saveThirdPlacePlayoff()}>{playoffSaving?'در حال ذخیره…':'ثبت نتیجه پلی‌آف'}</button>
              </div>}
            </div>
          ) : <p style={{...muted,color:'#b8dfa9'}}>هشت جایگاه نفرات سوم با بازیکنان واقعی و گروه‌هایشان تکمیل شده‌اند.</p>}
          <p style={{...muted,marginTop:12}}>مسیر هر برنده از بازی‌های دور اول تا فینال از پیش به‌صورت ثابت مشخص شده است؛ فقط نام بازیکنان واقعیِ نفرات سوم پس از پایان گروه‌ها جایگزین ۸ جایگاه مربوط می‌شود.</p>
        </>}
      </>}
    </div>

    <div style={{ ...card, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={sectionTitle}>ثبت و اصلاح آمار بازیکنان</h3>
        <button type="button" style={secondaryButton} onClick={() => setStatsExpanded(v => !v)}>{statsExpanded ? 'بستن' : 'نمایش'}</button>
      </div>
      {statsExpanded && <>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جست‌وجوی Plato ID…" aria-label="جست‌وجوی Plato ID" style={{ ...input, flex: '1 1 180px' }} />
        </div>
        <p style={{ ...muted, margin: '9px 0' }}>فهرست شامل بازیکنان اصلی و رزرو است؛ انصرافی‌ها نمایش داده نمی‌شوند. پس از هر اصلاح آمار، اگر قرعه قبلاً انجام شده باشد، وضعیت مغایرت اعلام می‌شود و نتیجه گروه‌ها خودکار تغییر نمی‌کند.</p>
        {loading ? <p style={muted}>در حال دریافت فهرست بازیکنان…</p> : filtered.length === 0 ? <p style={muted}>بازیکنی با این Plato ID پیدا نشد.</p> :
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {filtered.map(player => {
              const draft = drafts[player.id] || { played: '', won: '' };
              return <details key={player.id} style={{padding:11,border:'1px solid #4e422b',borderRadius:10,background:'#141516'}}>
                <summary style={{cursor:'pointer',display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
                  <strong dir="ltr" style={{color:'#f4f0e8',fontSize:14,overflowWrap:'anywhere'}}>{player.plato_id}</strong>
                  <span style={{color:'#d9bb78',fontSize:12}}>{pct(player.games_played,player.games_won)}</span>
                </summary>
                <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:9,alignItems:'center',marginTop:9}}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong dir="ltr" style={{ color: '#f4f0e8', fontSize: 14, overflowWrap: 'anywhere' }}>{player.plato_id}</strong>
                    <span style={{ color: player.registration_status === 'main' ? '#b8dfa9' : '#e4c77e', fontSize: 11, border: '1px solid currentColor', borderRadius: 6, padding: '2px 6px' }}>{player.registration_status === 'main' ? 'اصلی' : 'رزرو'}</span>
                    <span style={{ color: '#d9bb78', fontSize: 12 }}>{pct(player.games_played, player.games_won)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 8 }}>
                    <label style={{ ...muted, minWidth: 0 }}>کل بازی
                      <input inputMode="numeric" type="number" min="0" step="1" value={draft.played} onChange={e => setDrafts(prev => ({ ...prev, [player.id]: { ...draft, played: e.target.value } }))} style={input} />
                    </label>
                    <label style={{ ...muted, minWidth: 0 }}>برد
                      <input inputMode="numeric" type="number" min="0" step="1" value={draft.won} onChange={e => setDrafts(prev => ({ ...prev, [player.id]: { ...draft, won: e.target.value } }))} style={input} />
                    </label>
                  </div>
                </div>
                <button type="button" style={{ ...button, alignSelf: 'end', whiteSpace: 'nowrap' }} disabled={savingId !== null} onClick={() => void save(player)}>
                  {savingId === player.id ? '…' : 'ذخیره'}
                </button>
                </div>
              </details>;
            })}
          </div>}
      </>}
    </div>
    </div>
  </details>;
}
