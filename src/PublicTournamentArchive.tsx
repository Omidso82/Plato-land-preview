import TemporaryPageHeader from './TemporaryPageHeader';
import './PublicTournamentArchive.css';

export type ArchiveMatch = {
  stage: string;
  group: string | null;
  a: string | null;
  b: string | null;
  score_a: number | null;
  score_b: number | null;
  status: 'completed' | 'bye' | 'cancelled' | 'double_no_show' | 'pending';
};

const stages = [
  ['semi', 'نیمه‌نهایی'],
  ['quarter', 'یک‌چهارم نهایی'], ['round16', 'یک‌هشتم نهایی'], ['round32', 'یک‌شانزدهم نهایی'],
] as const;


export type ArchivePodiumEntry = { rank: string; name?: string; id: string; prize?: number };

export function podiumFromMatches(matches: ArchiveMatch[]): ArchivePodiumEntry[] {
  const winnerAndLoser = (stage: string) => {
    const match = matches.find(row => row.stage === stage && row.status === 'completed');
    if (!match || !match.a || !match.b || match.score_a == null || match.score_b == null || match.score_a === match.score_b) return [];
    return match.score_a > match.score_b ? [match.a, match.b] : [match.b, match.a];
  };
  const [winner, finalist] = winnerAndLoser('final');
  const [bronze] = winnerAndLoser('third_place');
  const podium: ArchivePodiumEntry[] = [];
  if (winner && finalist) podium.push({ rank: 'قهرمان', id: winner }, { rank: 'نایب‌قهرمان', id: finalist });
  if (bronze) podium.push({ rank: 'مقام سوم', id: bronze });
  return podium;
}

const fa = (number: number) => number.toLocaleString('fa-IR');
const statusText = {
  pending: 'نتیجه ثبت نشده',
  completed: 'نتیجه ناموجود',
  bye: 'استراحت · صعود مستقیم',
  cancelled: 'لغو شد',
  double_no_show: 'عدم حضور دوطرفه',
};

function Matches({ matches }: { matches: ArchiveMatch[] }) {
  return <ul className="tarchive-matches">{matches.map((match, index) => {
    const { score_a: scoreA, score_b: scoreB } = match;
    const hasScore = match.status === 'completed' && scoreA != null && scoreB != null;
    return <li key={index} className={hasScore ? 'tarchive-scored-match' : undefined}>
      <span className="tarchive-match-player">
        <bdi dir="auto">{match.a ?? '—'}</bdi>
        {hasScore && <strong>{fa(scoreA)}</strong>}
      </span>
      {!hasScore && <strong>{statusText[match.status]}</strong>}
      <span className="tarchive-match-player">
        <bdi dir="auto">{match.b ?? '—'}</bdi>
        {hasScore && <strong>{fa(scoreB)}</strong>}
      </span>
    </li>;
  })}</ul>;
}

type Props = {
  title: string;
  prefix: string;
  matches: ArchiveMatch[] | null;
  podium?: ArchivePodiumEntry[];
  failed?: boolean;
  showHeader?: boolean;
};

export default function PublicTournamentArchive({
  title, prefix, matches, podium = [], failed = false, showHeader = true,
}: Props) {
  const grouped = matches?.filter(match => match.stage === 'group') ?? [];
  const featured = ([
    ['final', 'فینال'],
    ['third_place', 'رده‌بندی'],
  ] as const).map(([stage, label]) => ({ stage, label, matches: matches?.filter(match => match.stage === stage) ?? [] }))
    .filter(round => round.matches.length > 0);
  const groupNames = [...new Set(grouped.map(match => match.group).filter(Boolean))].sort();

  const hasKnockout = featured.length > 0 || stages.some(([stage]) => matches?.some(match => match.stage === stage));
  const podiumTitle = podium.some(player => player.prize != null) ? "سکو و جوایز" : "سکو";
  return <div className="tarchive-archive" dir="rtl">
    {showHeader && <TemporaryPageHeader backHref="/" backLabel="بازگشت به صفحه مسابقات" />}
    <div className="tarchive-hero">
      <h1>{title}</h1>
      {!!matches?.length && <p className="tarchive-overview">
        <span><strong>{fa(matches.length)}</strong> بازی</span>
        {groupNames.length > 0 && <span><strong>{fa(groupNames.length)}</strong> گروه</span>}
      </p>}
    </div>
    {failed && <p role="alert">دریافت آرشیو ممکن نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {!failed && matches === null && <p role="status">در حال دریافت نتایج…</p>}
    {matches?.length === 0 && <p role="status">نتایج آرشیو فعلاً در دسترس نیست.</p>}
    {!!matches?.length && <>
      <nav className="tarchive-jump" aria-label="بخش‌های آرشیو">
        {podium.length > 0 && <a href={`#${prefix}-podium`}>{podiumTitle}</a>}
        {hasKnockout && <a href={`#${prefix}-knockout`}>مسیر حذفی</a>}
        {groupNames.length > 0 && <a href={`#${prefix}-groups`}>نتایج گروهی</a>}
      </nav>
      {podium.length > 0 && <section className="tarchive-section" id={`${prefix}-podium`}>
        <h2>{podiumTitle}</h2>
        <ol className="tarchive-podium">{podium.map((player) => <li key={player.id}>
          <span className="tarchive-rank">{player.rank}</span>
          <div className="tarchive-podium-player">
            {player.name && <strong>{player.name}</strong>}
            <bdi dir="ltr" className={player.name ? undefined : "tarchive-podium-id"}>{player.id}</bdi>
          </div>
          {player.prize != null && <span className="tarchive-prize"><strong>{fa(player.prize)}</strong> آیتم پلاتو</span>}
        </li>)}</ol>
      </section>}
      {hasKnockout && <section className="tarchive-section" id={`${prefix}-knockout`}>
        <h2>مسیر حذفی</h2>
        <div className="tarchive-featured">
          {featured.map(round => <section key={round.stage} className={`tarchive-feature tarchive-feature--${round.stage}`}>
            <h3>{round.label}</h3>
            <Matches matches={round.matches} />
          </section>)}
        </div>
        <div className="tarchive-rounds">
          {stages.map(([stage, label]) => {
            const stageMatches = matches.filter(match => match.stage === stage);
            return stageMatches.length > 0 && <details key={stage}>
              <summary>{label}</summary>
              <Matches matches={stageMatches} />
            </details>;
          })}
        </div>
      </section>}
      {groupNames.length > 0 && <section className="tarchive-section" id={`${prefix}-groups`}>
        <h2>نتایج گروهی</h2>
        <div className="tarchive-group-grid">
          {groupNames.map(group => <details key={group}>
            <summary>گروه <bdi dir="ltr">{group}</bdi></summary>
            <Matches matches={grouped.filter(match => match.group === group)} />
          </details>)}
        </div>
      </section>}
    </>}
  </div>;
}
