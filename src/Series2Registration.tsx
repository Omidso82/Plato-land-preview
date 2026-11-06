import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

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
      <section className="s2leaderboard-panel" aria-labelledby="s2leaderboard-title">
        <h1 id="s2leaderboard-title">جدول رتبه‌بندی بازیکنان سری دوم</h1>
        <p className="s2leaderboard-note">
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
                  <th scope="col" className="s2leaderboard-id">Plato ID</th>
                  <th scope="col">تعداد بازی</th>
                  <th scope="col">تعداد برد</th>
                  <th scope="col">درصد برد</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.plato_id}>
                    <td className="s2leaderboard-rank">{fa(index + 1)}</td>
                    <td className="s2leaderboard-id" dir="ltr">{row.plato_id}</td>
                    <td>{row.games_played === null ? '—' : fa(row.games_played)}</td>
                    <td>{row.games_won === null ? '—' : fa(row.games_won)}</td>
                    <td className="s2leaderboard-rate">{row.win_rate === null ? '—' : percent(row.win_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
