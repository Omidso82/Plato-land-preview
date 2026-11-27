type Match = { id: string; a: string; b: string };

export type ScheduledStage = {
  label: string;
  startsAt: string;
  matches: Match[];
};

export default function ActiveTournamentSchedule({ stage }: { stage?: ScheduledStage }) {
  const format = (options: Intl.DateTimeFormatOptions) =>
    stage && new Intl.DateTimeFormat('fa-IR', { ...options, timeZone: 'Asia/Tehran' }).format(new Date(stage.startsAt));

  return <section aria-label="بازی‌های پیش‌رو" style={{ border: '1px solid #59472a', borderRadius: 11, padding: 11, background: '#101112', minWidth: 0 }}>
    <h2 style={{ margin: 0, fontSize: 16, color: '#e4c77e' }}>بازی‌های پیش‌رو</h2>
    {stage ? <>
      <p style={{ color: '#bfb39b', fontSize: 13, marginBlock: '8px 12px' }}>
        {stage.label} · {format({ weekday: 'long', day: 'numeric', month: 'long' })} · ساعت <bdi>{format({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}</bdi> به وقت تهران
      </p>
      <ul style={{ listStyle: 'none', display: 'grid', gap: 8, margin: 0, padding: 0 }}>
        {stage.matches.map(match => <li key={match.id} style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
          alignItems: 'center', textAlign: 'center', gap: 8, padding: 8,
          border: '1px solid #493c28', borderRadius: 8, fontSize: 13,
        }}>
          <bdi dir="ltr" style={{ overflowWrap: 'anywhere' }}>{match.a}</bdi>
          <span style={{ color: '#e4c77e' }}>مقابل</span>
          <bdi dir="ltr" style={{ overflowWrap: 'anywhere' }}>{match.b}</bdi>
        </li>)}
      </ul>
    </> : <p style={{ color: '#bfb39b', fontSize: 13, marginBottom: 0 }}>بازی زمان‌بندی‌شدهٔ بعدی برای نمایش وجود ندارد.</p>}
  </section>;
}
