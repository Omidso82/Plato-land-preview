import React, { useEffect, useState } from 'react';
import { Crown, Trophy, Sparkles } from 'lucide-react';
import { supabase } from './supabase';
import Series2Prediction from './Series2Prediction';

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
  const [activeSeed, setActiveSeed] = useState(0);
  const [activeStage, setActiveStage] = useState('groups');
  const [stageViewerOpen, setStageViewerOpen] = useState(false);
  const [progression, setProgression] = useState<any>(null);
  const [progressionLoading, setProgressionLoading] = useState(true);
  const [fixedPosterUrl, setFixedPosterUrl] = useState('');

  const seeds = [0, 1, 2, 3].map((seedIndex) =>
    rows.slice(seedIndex * 8, seedIndex * 8 + 8).map((row, playerIndex) => ({
      ...row,
      rank: seedIndex * 8 + playerIndex + 1,
    })),
  );

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

  useEffect(() => {
    let active = true;
    fetch('https://dfrppbapaaydbjeflozw.supabase.co/functions/v1/plato-land-series2-progression', {
      method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store',
    })
      .then((response) => { if (!response.ok) throw new Error('Progression request failed'); return response.json(); })
      .then((data) => { if (active) setProgression(data?.progression ?? null); })
      .catch((loadError) => console.error('Series 2 progression load failed:', loadError))
      .finally(() => { if (active) setProgressionLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPoster = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.storage.from('series2-slides').list('poster', { limit: 10 });
      if (error) {
        console.warn('Series 2 fixed poster could not be loaded:', error);
        return;
      }
      const poster = (data || []).find((item) => item.name === 'series2-prize-poster');
      if (!active) return;
      if (!poster) {
        setFixedPosterUrl('');
        return;
      }
      const publicUrl = supabase.storage.from('series2-slides').getPublicUrl('poster/series2-prize-poster').data.publicUrl;
      const version = poster.updated_at || poster.created_at || 'current';
      setFixedPosterUrl(publicUrl + '?v=' + encodeURIComponent(version));
    };
    void loadPoster();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!stageViewerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setStageViewerOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stageViewerOpen]);

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

        {fixedPosterUrl && (
          <section className="s2fixed-poster" aria-label="پوستر ثابت مسابقات سری دوم">
            <img src={fixedPosterUrl} alt="پوستر جوایز قهرمانی سری دوم PLATO LAND" />
          </section>
        )}

        <Series2Prediction/>

        <section className="s2leaderboard-panel">



          <section className="s2progress-section" aria-labelledby="s2progress-title">
            <div className="s2progress-heading">
              <span className="s2eyebrow">TOURNAMENT ROADMAP</span>
              <h2 id="s2progress-title">مسیر رقابت تا قهرمانی</h2>
              <p>از مرحله گروهی تا فینال؛ نتایج ثبت‌شده برای همه قابل مشاهده خواهد بود.</p>
            </div>
            {!loading && !error && rows.length > 0 && (
              <div className="s2primary-actions">
                <button type="button" className="s2seed-open-button" onClick={() => { setActiveStage('ranking'); setStageViewerOpen(true); }} aria-haspopup="dialog">
                  <Trophy size={15} /><span>رتبه‌بندی بازیکنان بر اساس میانگین برد</span>
                </button>
                <button type="button" className="s2seed-open-button" onClick={() => { setActiveStage('seeds'); setActiveSeed(0); setStageViewerOpen(true); }} aria-haspopup="dialog">
                  <Trophy size={15} /><span>مشاهده سیدبندی</span><span className="s2seed-button-count">۳۲ بازیکن · ۴ سید</span>
                </button>
              </div>
            )}
            <div className="s2progress-grid">
              <button type="button" className="s2progress-card" onClick={() => { setActiveStage('groups'); setStageViewerOpen(true); }}>
                <span className="s2progress-number">۰۱</span><strong>قرعه‌کشی / مشاهده گروه‌ها</strong><small>۸ گروه · ۴ بازیکن در هر گروه</small>
              </button>
              <button type="button" className="s2progress-card" onClick={() => { setActiveStage('round16'); setStageViewerOpen(true); }}>
                <span className="s2progress-number">۰۲</span><strong>مرحله یک‌هشتم نهایی</strong><small>۱۶ بازیکن · ۸ مسابقه</small>
              </button>
              <button type="button" className="s2progress-card" onClick={() => { setActiveStage('quarter'); setStageViewerOpen(true); }}>
                <span className="s2progress-number">۰۳</span><strong>مرحله یک‌چهارم نهایی</strong><small>۸ بازیکن · ۴ مسابقه</small>
              </button>
              <button type="button" className="s2progress-card" onClick={() => { setActiveStage('semi'); setStageViewerOpen(true); }}>
                <span className="s2progress-number">۰۴</span><strong>نیمه‌نهایی</strong><small>۴ بازیکن · ۲ مسابقه</small>
              </button>
              <button type="button" className="s2progress-card s2progress-card-final" onClick={() => { setActiveStage('final'); setStageViewerOpen(true); }}>
                <span className="s2progress-number">۰۵</span><strong>فینال و رده‌بندی</strong><small>تعیین قهرمان و مقام سوم</small>
              </button>
            </div>
          </section>
          {stageViewerOpen && (
            <div className="s2seed-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStageViewerOpen(false); }}>
              <section className="s2seed-dialog s2stage-dialog" role="dialog" aria-modal="true" aria-labelledby="s2stage-title">
                <header className="s2seed-dialog-header">
                  <div><span className="s2seed-eyebrow">SERIES 2 · TOURNAMENT</span><h2 id="s2stage-title">مسیر مسابقات سری دوم</h2><p>رتبه‌بندی، سیدبندی، گروه‌ها و مراحل حذفی</p></div>
                  <button type="button" className="s2seed-close" onClick={() => setStageViewerOpen(false)} aria-label="بستن پنجره">×</button>
                </header>
                <nav className="s2stage-nav" aria-label="مراحل مسابقات">
                  {[['ranking','رتبه‌بندی'],['seeds','سیدبندی'],['groups','گروه‌ها'],['round16','یک‌هشتم'],['quarter','یک‌چهارم'],['semi','نیمه‌نهایی'],['final','فینال و رده‌بندی']].map(([key,label]) => (
                    <button key={key} type="button" className={activeStage === key ? 'active' : ''} onClick={() => setActiveStage(key)}>{label}</button>
                  ))}
                </nav>
                <div className="s2stage-content">
                  {activeStage === 'ranking' ? (
                    loading ? <p className="s2leaderboard-state">در حال دریافت جدول رتبه‌بندی…</p> : error ? <p className="s2leaderboard-error" role="alert">{error}</p> : (
                      <>
                      <p className="s2leaderboard-note">
                        <span className="s2note-mark">i</span>
                        <span>این آمار بر اساس اطلاعات ثبت‌شده هنگام ثبت‌نام بازیکنان تهیه شده است. بازی‌ها و بردهای احتمالی پس از زمان ثبت‌نام در این جدول لحاظ نشده‌اند.</span>
                      </p>
                      <div className="s2table-wrap"><table className="s2standings-table">
                        <thead><tr><th className="s2col-rank">رتبه</th><th className="s2col-player">بازیکن</th><th className="s2col-games">بازی</th><th className="s2col-wins">برد</th><th className="s2col-rate">درصد برد</th></tr></thead>
                        <tbody>{rows.map((row,index)=><tr key={row.plato_id} className={index<3 ? `s2rank-row s2rank-row-${index+1}` : undefined}><td className="s2rank-number">{fa(index+1)}</td><td className="s2table-player" dir="ltr">{row.plato_id}</td><td>{row.games_played===null?'—':fa(row.games_played)}</td><td>{row.games_won===null?'—':fa(row.games_won)}</td><td className="s2table-rate">{row.win_rate===null?'—':percent(row.win_rate)}</td></tr>)}</tbody>
                      </table></div>
                      </>
                    )
                  ) : activeStage === 'seeds' ? (
                    <div className="s2seed-panel" id="s2seed-panel">
                      <div className="s2seed-tabs" role="tablist" aria-label="انتخاب سید">
                        {seeds.map((seed,index)=><button key={index} type="button" role="tab" aria-selected={activeSeed===index} className={activeSeed===index?'active':''} onClick={()=>setActiveSeed(index)}>سید {fa(index+1)}<small>{fa(seed.length)} نفر</small></button>)}
                      </div>
                      <div className="s2seed-panel-heading"><strong>سید {fa(activeSeed+1)}</strong><span>رتبه‌های {fa(activeSeed*8+1)} تا {fa(activeSeed*8+8)}</span></div>
                      <div className="s2seed-table-wrap"><table className="s2seed-table"><thead><tr><th>رتبه</th><th>شناسه بازیکن</th><th>درصد برد</th></tr></thead><tbody>
                        {seeds[activeSeed].map(player=><tr key={player.plato_id}><td>{fa(player.rank)}</td><td dir="ltr">{player.plato_id}</td><td>{player.win_rate===null?'—':percent(player.win_rate)}</td></tr>)}
                      </tbody></table></div>
                    </div>
                  ) : progressionLoading ? <p className="s2leaderboard-state">در حال دریافت اطلاعات مراحل مسابقات…</p> : !progression ? (
                    <div className="s2stage-empty"><Trophy size={28}/><strong>قرعه‌کشی هنوز ثبت نشده است</strong><p>پس از انجام و تأیید قرعه‌کشی توسط مدیریت، گروه‌ها و جدول مسابقات در همین بخش نمایش داده می‌شوند.</p></div>
                  ) : activeStage === 'groups' ? (
                    <>
                      <div className="s2groups-grid">
                        {(progression.groups || []).map((group: any) => <article className="s2group-card" key={group.name}><h3>گروه {group.name}</h3><ol>{(group.players || []).map((player: any) => <li key={player.plato_id}><span>سید {fa(player.seed)}</span><b dir="ltr">{player.plato_id}</b></li>)}</ol></article>)}
                      </div>
                      <section className="s2fixture-section">
                        <h3>برنامه بازی‌های گروهی</h3>
                        {[['saturday','شنبه · روز اول'],['sunday','یکشنبه · روز دوم'],['monday','دوشنبه · روز سوم']].map(([day,label])=><div className="s2fixture-day" key={day}><h4>{label}</h4><div className="s2bracket-list">{(progression.group_fixtures||[]).filter((m:any)=>m.day===day).map((m:any)=><article className="s2match-card" key={m.id}><span>گروه {m.group}</span><div><b dir="ltr">{m.player1}</b><i>VS</i><b dir="ltr">{m.player2}</b></div><small>در انتظار ثبت نتیجه</small></article>)}</div></div>)}
                      </section>
                    </>
                  ) : (
                    <div className="s2bracket-list">
                      {(() => { const rounds = activeStage === 'final' ? [...((progression.brackets||{}).final||[]), ...((progression.brackets||{}).third_place||[])] : ((progression.brackets||{})[activeStage]||[]); return rounds.length ? rounds.map((match:any,index:number)=><article className="s2match-card" key={match.id||index}><span>{match.id==='TP-1'?'مسابقه رده‌بندی':match.id==='F-1'?'فینال':'مسابقه '+fa(index+1)}</span><div><b dir="ltr">{match.player1||'صعودکننده'}</b><i>VS</i><b dir="ltr">{match.player2||'صعودکننده'}</b></div><small>{match.winner?'برنده: '+match.winner:'در انتظار ثبت نتیجه'}</small></article>) : <div className="s2stage-empty"><Trophy size={26}/><strong>این مرحله هنوز تکمیل نشده است</strong><p>پس از مشخص‌شدن صعودکنندگان و ثبت نتایج مرحله قبل، جدول این مرحله نمایش داده می‌شود.</p></div>; })()}
                    </div>
                  )}
                </div>
                <footer className="s2seed-dialog-footer"><span>اطلاعات مسابقات از دیتابیس اصلی خوانده می‌شود.</span><button type="button" onClick={() => setStageViewerOpen(false)}>بستن</button></footer>
              </section>
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
