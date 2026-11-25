import { useEffect, useState } from 'react';
import { resolveSeries4Matches, series4KnockoutStages } from './series4Knockout';
import { supabase } from './supabase';

type GroupMatch = {
  match_id: string;
  group_name: string;
  player_a: string;
  player_b: string;
  result_status: 'completed' | 'double_no_show';
  score_a: number | null;
  score_b: number | null;
};
type Archive = {
  bracket: Parameters<typeof resolveSeries4Matches>[0];
  scores: Parameters<typeof resolveSeries4Matches>[1];
  groups: GroupMatch[];
};
const fa = (n: number) => n.toLocaleString('fa-IR');

function Result({ a, b, score }: { a?: string; b?: string; score: string }) {
  return <li style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, padding: '8px 0', borderBottom: '1px solid #493a22' }}>
    <bdi style={{ overflowWrap: 'anywhere' }}>{a ?? '—'}</bdi>
    <strong>{score}</strong>
    <bdi style={{ overflowWrap: 'anywhere' }}>{b ?? '—'}</bdi>
  </li>;
}

export default function Series4PublicArchive() {
  const [archive, setArchive] = useState<Archive | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let request = 0;
    async function load() {
      const seq = ++request;
      try {
        const response = await supabase?.rpc('plato_temp_public_series4_archive');
        if (!active || seq !== request) return;
        if (!response || response.error) throw new Error('Archive unavailable');
        setArchive(response.data as Archive | null);
        setFailed(false);
      } catch {
        if (active && seq === request) {
          setArchive(null);
          setFailed(true);
        }
      }
    }
    void load();
    window.addEventListener('focus', load);
    return () => {
      active = false;
      window.removeEventListener('focus', load);
    };
  }, []);

  const hydrated = archive && resolveSeries4Matches(archive.bracket, archive.scores);
  const rounds = archive && [archive.bracket.firstRound, ...archive.bracket.laterRounds, [archive.bracket.thirdPlace]];
  const groupNames = archive ? [...new Set(archive.groups.map(match => match.group_name))] : [];
  return <main dir="rtl" style={{ maxWidth: 840, margin: 'auto', padding: 18, color: '#f0d99f', background: '#171513' }}>
    <a href="/" style={{ color: 'inherit' }}>بازگشت به مسابقات</a>
    <h1>آرشیو سری چهارم تخته‌نرد</h1>
    {archive === undefined && <p role="status">در حال دریافت آرشیو…</p>}
    {archive === null && <p role="status">{failed ? 'دریافت آرشیو ممکن نشد.' : 'آرشیو این سری فعلاً در دسترس نیست.'}</p>}
    {archive && hydrated && rounds && <>
      <h2>مسیر قهرمانی</h2>
      {rounds.map(round => {
        const stage = round[0].id.split('-')[0];
        return <details key={stage} open={stage === 'R2' || stage === 'THIRD'} style={{ padding: 12, borderBottom: '1px solid #59472a' }}>
          <summary>{series4KnockoutStages[stage]}</summary>
          <ul style={{ listStyle: 'none', padding: 0 }}>{round.map(match => {
            const [a,b] = hydrated.players.get(match.id) ?? [];
            const result = hydrated.byId.get(match.id);
            return <Result key={match.id} a={a} b={b} score={result ? fa(result.score_a) + ' : ' + fa(result.score_b) : '—'} />;
          })}</ul>
        </details>;
      })}
      <h2>نتایج گروهی</h2>
      {groupNames.map(group => <details key={group} style={{ padding: 12, borderBottom: '1px solid #59472a' }}>
        <summary>گروه <bdi>{group}</bdi></summary>
        <ul style={{ listStyle: 'none', padding: 0 }}>{archive.groups.filter(match => match.group_name === group).map(match =>
          <Result key={match.match_id} a={match.player_a} b={match.player_b}
            score={match.score_a != null && match.score_b != null ? fa(match.score_a) + ' : ' + fa(match.score_b) : 'عدم حضور دوطرفه'} />
        )}</ul>
      </details>)}
    </>}
  </main>;
}
