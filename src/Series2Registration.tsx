import React, { useEffect, useState } from 'react';
import { Crown, Trophy, Sparkles } from 'lucide-react';

type LeaderboardRow = {
  plato_id: string;
  games_played: number | null;
  games_won: number | null;
  win_rate: number | null;
};

const fa = (value: number) => value.toLocaleString('fa-IR');
const percent = (value: number) =>
  value.toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '٪';

export default function Series2Registration() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Public, read-only endpoint. A plain GET avoids SDK invoke/auth-header issues
        // on the static GitHub Pages site.
        const response = await fetch(
          'https://dfrppbapaaydbjeflozw.supabase.co/functions/v1/plato-land-series2-public-leaderboard',
          { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store' },
        );
        if (!response.ok) throw new Error(`Leaderboard request failed (${response.status})`);
        const data = await response.json();
        if (!Array.isArray(data?.players)) throw new Error('Invalid leaderboard response');
        if (active) setRows(data.players as LeaderboardRow[]);
      } catch (loadError) {
        console.error('Series 2 leaderboard load failed:', loadError);
        if (active) {
          setError('دریافت جدول رتبه‌بندی انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.');
          setRows([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="s2leaderboard" dir="rtl">
      <div className="s2leaderboard-shell">
        <header className="s2brand-header">
          <div className="s2brand-emblem" aria-hidden="true"><Crown size={30} strokeWidth={1.6} /></div>
          <div className="s2brand-name">PLATO <span>LAND</span></div>
          <div className="s2brand-tagline">بازی، رقابت، قهرمانی</div>
          <div className="s2brand-rule"><i /><span>✦</span><i /></div>
          <div className="s2series-label"><Sparkles size={13} /> لیگ تخته‌نرد · سری دوم</div>
        </header>

        <section className="s2leaderboard-panel" aria-labelledby="s2leaderboard-title">
          <div className="s2leaderboard-heading">
            <div className="s2heading-icon"><Trophy size={20} /></div>
            <div className="s2heading-copy">
              <span className="s2eyebrow">PLAYER STANDINGS</span>
              <h1 id="s2leaderboard-title">جدول رتبه‌بندی بازیکنان</h1>
              <p className="s2heading-subtitle">مرتب‌شده بر اساس درصد برد</p>
            </div>
            <div className="s2player-count"><strong>{fa(rows.length || 32)}</strong><span>بازیکن</span></div>
          </div>

          <p className="s2leaderboard-note">
            <span className="s2note-mark">i</span>
            <span>این آمار بر اساس اطلاعات ثبت‌شده هنگام ثبت‌نام بازیکنان تهیه شده است. بازی‌ها و بردهای احتمالی پس از زمان ثبت‌نام در این جدول لحاظ نشده‌اند.</span>
          </p>

          {loading ? (
            <p className="s2leaderboard-state" role="status">در حال دریافت جدول رتبه‌بندی…</p>
          ) : error ? (
            <p className="s2leaderboard-error" role="alert">{error}</p>
          ) : rows.length === 0 ? (
            <p className="s2leaderboard-state">اطلاعاتی برای نمایش وجود ندارد.</p>
          ) : (
            <div className="s2table-wrap">
              <table className="s2standings-table">
                <thead>
                  <tr>
                    <th className="s2col-rank">رتبه</th>
                    <th className="s2col-player">بازیکن</th>
                    <th className="s2col-games">بازی</th>
                    <th className="s2col-wins">برد</th>
                    <th className="s2col-rate">درصد برد</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.plato_id} className={index < 3 ? `s2rank-row s2rank-row-${index + 1}` : undefined}>
                      <td className="s2rank-number">{fa(index + 1)}</td>
                      <td className="s2table-player" dir="ltr">{row.plato_id}</td>
                      <td>{row.games_played === null ? '—' : fa(row.games_played)}</td>
                      <td>{row.games_won === null ? '—' : fa(row.games_won)}</td>
                      <td className="s2table-rate">{row.win_rate === null ? '—' : percent(row.win_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className="s2leaderboard-footer">
            <span><Crown size={12} /> PLATO LAND</span>
            <span>بازی، رقابت، قهرمانی</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
