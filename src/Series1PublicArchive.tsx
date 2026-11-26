import { useEffect, useState } from 'react';
import TemporaryPageHeader from './TemporaryPageHeader';
import { supabase } from './supabase';
import './Series1PublicArchive.css';

type Match = {
  stage: string;
  group: string | null;
  a: string | null;
  b: string | null;
  score_a: number | null;
  score_b: number | null;
  status: 'completed' | 'bye' | 'cancelled' | 'double_no_show';
};

const stages = [
  ['final', 'فینال'], ['third_place', 'رده‌بندی'], ['semi', 'نیمه‌نهایی'],
  ['quarter', 'یک‌چهارم نهایی'], ['round16', 'یک‌هشتم نهایی'], ['round32', 'یک‌شانزدهم نهایی'],
] as const;

// Series 1 Offline Staging v0.38, owner-confirmed ranking and official prize rows.
const podium = [
  { rank: 'قهرمان', name: 'رامش', id: '95m', prize: 40000 },
  { rank: 'نایب‌قهرمان', name: 'هانا', id: 'HANA1272', prize: 25000 },
  { rank: 'مقام سوم', name: 'سعید', id: '_34EED', prize: 15000 },
];
const fa = (number: number) => number.toLocaleString('fa-IR');
const statusText = {
  completed: 'نتیجه ناموجود',
  bye: 'استراحت · صعود مستقیم',
  cancelled: 'لغو شد',
  double_no_show: 'عدم حضور دوطرفه',
};

function Matches({ matches }: { matches: Match[] }) {
  return <ul className="s1-matches">{matches.map((match, index) =>
    <li key={index}>
      <bdi>{match.a ?? '—'}</bdi>
      <strong>{match.status === 'completed' && match.score_a != null && match.score_b != null
        ? <bdi>{fa(match.score_a)}–{fa(match.score_b)}</bdi>
        : statusText[match.status]}</strong>
      <bdi>{match.b ?? '—'}</bdi>
    </li>
  )}</ul>;
}

export default function Series1PublicArchive() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await supabase?.rpc('plato_temp_public_series1_archive');
        if (!response || response.error || !Array.isArray(response.data)) throw new Error('Archive unavailable');
        if (active) setMatches(response.data as Match[]);
      } catch {
        if (active) setFailed(true);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const grouped = matches?.filter(match => match.stage === 'group') ?? [];
  const groupNames = [...new Set(grouped.map(match => match.group).filter(Boolean))].sort();

  return <main className="s1-archive" dir="rtl">
    <TemporaryPageHeader backHref="/" backLabel="بازگشت به صفحه مسابقات" />
    <h1>آرشیو سری اول تخته‌نرد</h1>
    {failed && <p role="alert">دریافت آرشیو ممکن نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {!failed && matches === null && <p role="status">در حال دریافت نتایج…</p>}
    {matches?.length === 0 && <p role="status">نتایج آرشیو فعلاً در دسترس نیست.</p>}
    {!!matches?.length && <>
      <h2>سکو و جوایز</h2>
      <ul className="s1-podium">{podium.map(player => <li key={player.id}>
        <span>{player.rank}</span>
        <strong>{player.name}</strong>
        <bdi>{player.id}</bdi>
        <span>{fa(player.prize)} آیتم پلاتو</span>
      </li>)}</ul>
      <h2>مسیر حذفی</h2>
      {stages.map(([stage, label]) => {
        const stageMatches = matches.filter(match => match.stage === stage);
        return stageMatches.length > 0 && <details key={stage} open={stage === 'final'}>
          <summary>{label}</summary><Matches matches={stageMatches} />
        </details>;
      })}
      <h2>نتایج گروهی</h2>
      {groupNames.map(group => <details key={group}>
        <summary>گروه <bdi>{group}</bdi></summary>
        <Matches matches={grouped.filter(match => match.group === group)} />
      </details>)}
    </>}
  </main>;
}
