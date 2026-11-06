import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Crown, Trophy, Medal, Sparkles } from 'lucide-react';

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
      if (!supabase) {
        if (active) {
          setError('ارتباط با پایگاه داده برقرار نشد. لطفاً کمی بعد دوباره تلاش کنید.');
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError('');
      const { data, error: requestError } = await supabase.functions.invoke('plato-land-series2-public-leaderboard');
      if (!active) return;
      if (requestError || !Array.isArray(data?.players)) {
        setError('دریافت جدول رتبه‌بندی انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.');
        setRows([]);
      } else {
        setRows(data.players as LeaderboardRow[]);
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="s2leaderboard" dir="rtl">
      <div className="s2leaderboard-shell">
        <header className="s2brand-header">
          <div className="s2brand-emblem" aria-hidden="true">
            <Crown size={31} strokeWidth={1.65} />
          </div>
          <div className="s2brand-name">PLATO <span>LAND</span></div>
          <div className="s2brand-tagline">بازی، رقابت، قهرمانی</div>
          <div className="s2brand-rule"><i /><span>✦</span><i /></div>
          <div className="s2series-label"><Sparkles size={14} /> لیگ تخته‌نرد · سری دوم</div>
        </header>

        <section className="s2leaderboard-panel" aria-labelledby="s2leaderboard-title">
          <div className="s2leaderboard-heading">
            <div className="s2heading-icon"><Trophy size={21} /></div>
            <div>
              <span className="s2eyebrow">PLAYER STANDINGS</span>
              <h1 id="s2leaderboard-title">جدول رتبه‌بندی بازیکنان</h1>
              <p className="s2heading-subtitle">رده‌بندی بر پایه میانگین درصد برد</p>
            </div>
            <div className="s2player-count"><strong>{fa(rows.length || 32)}</strong><span>بازیکن</span></div>
          </div>

          <p className="s2leaderboard-note">
            <span className="s2note-mark">i</span>
            این آمار بر اساس اطلاعات ثبت‌شده هنگام ثبت‌نام بازیکنان تهیه شده است. بازی‌ها و بردهای احتمالی پس از زمان ثبت‌نام در این جدول لحاظ نشده‌اند.
          </p>

          {loading ? (
            <p className="s2leaderboard-state" role="status">در حال دریافت جدول رتبه‌بندی…</p>
          ) : error ? (
            <p className="s2leaderboard-error" role="alert">{error}</p>
          ) : rows.length === 0 ? (
            <p className="s2leaderboard-state">اطلاعاتی برای نمایش وجود ندارد.</p>
          ) : (
            <div className="s2leaderboard-table-wrap">
              <table className="s2leaderboard-table">
                <thead>
                  <tr>
                    <th scope="col">رتبه</th>
                    <th scope="col" className="s2leaderboard-id">بازیکن / Plato ID</th>
                    <th scope="col">تعداد بازی</th>
                    <th scope="col">تعداد برد</th>
                    <th scope="col">درصد برد</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.plato_id} className={index < 3 ? `s2top-rank s2top-rank-${index + 1}` : undefined}>
                      <td className="s2leaderboard-rank">
                        <span className="s2rank-medal">
                          {index === 0 ? <Crown size={16} /> : index === 1 ? <Medal size={16} /> : index === 2 ? <Medal size={16} /> : fa(index + 1)}
                        </span>
                      </td>
                      <td className="s2leaderboard-id">
                        <span dir="ltr">{row.plato_id}</span>
                        <small className="s2mobile-stats">
                          {row.games_played === null ? '—' : fa(row.games_played)} بازی
                          <b>·</b>
                          {row.games_won === null ? '—' : fa(row.games_won)} برد
                        </small>
                      </td>
                      <td className="s2desktop-stat">{row.games_played === null ? '—' : fa(row.games_played)}</td>
                      <td className="s2desktop-stat">{row.games_won === null ? '—' : fa(row.games_won)}</td>
                      <td className="s2leaderboard-rate">{row.win_rate === null ? '—' : percent(row.win_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <footer className="s2leaderboard-footer">
            <span><Crown size={13} /> PLATO LAND</span>
            <span>بازی، رقابت، قهرمانی</span>
          </footer>
        </section>
        <div className="s2page-bottom-glow" aria-hidden="true" />
      </div>
    </main>
  );
}
