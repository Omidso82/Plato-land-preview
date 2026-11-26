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
  ['semi', 'نیمه‌نهایی'],
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
  return <ul className="s1-matches">{matches.map((match, index) => {
    const { score_a: scoreA, score_b: scoreB } = match;
    const hasScore = match.status === 'completed' && scoreA != null && scoreB != null;
    return <li key={index} className={hasScore ? 's1-scored-match' : undefined}>
      <span className="s1-match-player">
        <bdi dir="ltr">{match.a ?? '—'}</bdi>
        {hasScore && <strong>{fa(scoreA)}</strong>}
      </span>
      {!hasScore && <strong>{statusText[match.status]}</strong>}
      <span className="s1-match-player">
        <bdi dir="ltr">{match.b ?? '—'}</bdi>
        {hasScore && <strong>{fa(scoreB)}</strong>}
      </span>
    </li>;
  })}</ul>;
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
  const featured = ([
    ['final', 'فینال'],
    ['third_place', 'رده‌بندی'],
  ] as const).map(([stage, label]) => ({ stage, label, matches: matches?.filter(match => match.stage === stage) ?? [] }))
    .filter(round => round.matches.length > 0);
  const groupNames = [...new Set(grouped.map(match => match.group).filter(Boolean))].sort();

  return <main className="s1-archive" dir="rtl">
    <TemporaryPageHeader backHref="/" backLabel="بازگشت به صفحه مسابقات" />
    <div className="s1-hero">
      <h1>آرشیو سری اول تخته‌نرد</h1>
      {!!matches?.length && <p className="s1-overview">
        <span><strong>{fa(matches.length)}</strong> بازی</span>
        <span><strong>{fa(groupNames.length)}</strong> گروه</span>
      </p>}
    </div>
    {failed && <p role="alert">دریافت آرشیو ممکن نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {!failed && matches === null && <p role="status">در حال دریافت نتایج…</p>}
    {matches?.length === 0 && <p role="status">نتایج آرشیو فعلاً در دسترس نیست.</p>}
    {!!matches?.length && <>
      <nav className="s1-jump" aria-label="بخش‌های آرشیو">
        <a href="#series1-podium">سکو و جوایز</a>
        <a href="#series1-knockout">مسیر حذفی</a>
        <a href="#series1-groups">نتایج گروهی</a>
      </nav>
      <section className="s1-section" id="series1-podium">
        <h2>سکو و جوایز</h2>
        <ol className="s1-podium">{podium.map((player) => <li key={player.id}>
          <span className="s1-rank">{player.rank}</span>
          <div className="s1-podium-player">
            <strong>{player.name}</strong>
            <bdi dir="ltr">{player.id}</bdi>
          </div>
          <span className="s1-prize"><strong>{fa(player.prize)}</strong> آیتم پلاتو</span>
        </li>)}</ol>
      </section>
      <section className="s1-section" id="series1-knockout">
        <h2>مسیر حذفی</h2>
        <div className="s1-featured">
          {featured.map(round => <section key={round.stage} className={`s1-feature s1-feature--${round.stage}`}>
            <h3>{round.label}</h3>
            <Matches matches={round.matches} />
          </section>)}
        </div>
        <div className="s1-rounds">
          {stages.map(([stage, label]) => {
            const stageMatches = matches.filter(match => match.stage === stage);
            return stageMatches.length > 0 && <details key={stage}>
              <summary>{label}</summary>
              <Matches matches={stageMatches} />
            </details>;
          })}
        </div>
      </section>
      <section className="s1-section" id="series1-groups">
        <h2>نتایج گروهی</h2>
        <div className="s1-group-grid">
          {groupNames.map(group => <details key={group}>
            <summary>گروه <bdi dir="ltr">{group}</bdi></summary>
            <Matches matches={grouped.filter(match => match.group === group)} />
          </details>)}
        </div>
      </section>
    </>}
  </main>;
}
