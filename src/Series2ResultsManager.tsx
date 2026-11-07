import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase';

type HistoryEntry = {
  action: 'recorded' | 'corrected';
  previous_score1: number | null;
  previous_score2: number | null;
  previous_winner: string | null;
  score1: number;
  score2: number;
  winner: string;
  recorded_at: string;
};
type Fixture = {
  id: string; day: string; group: string; player1: string; player2: string;
  score1: number | null; score2: number | null; winner: string | null;
  result_history?: HistoryEntry[];
};
type Progression = { groups?: Array<{ name: string }>; group_fixtures?: Fixture[]; [key: string]: unknown };

const DAY_LABELS: Record<string, string> = {
  saturday: 'شنبه · روز اول', sunday: 'یکشنبه · روز دوم', monday: 'دوشنبه · روز سوم',
};
const fa = (value: number | string) => String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
const dateText = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fa-IR');
};

export default function Series2ResultsManager() {
  const [progression, setProgression] = useState<Progression | null>(null);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDay, setSelectedDay] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [score1Input, setScore1Input] = useState('');
  const [score2Input, setScore2Input] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProgression = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        SUPABASE_URL + '/functions/v1/plato-land-series2-progression',
        { method: 'GET', headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' }, cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok || !data?.progression) throw new Error(data?.error || 'دریافت برنامه مسابقات ناموفق بود.');
      const next = data.progression as Progression;
      setProgression(next);
      setUpdatedAt(data.updated_at || '');
      const names = (next.groups || []).map(group => group.name);
      setSelectedGroup(current => current && names.includes(current) ? current : (names[0] || ''));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'دریافت اطلاعات مسابقات ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProgression(); }, [loadProgression]);

  const groupNames = useMemo(() => (progression?.groups || []).map(group => group.name), [progression]);
  const fixtures = useMemo(() => (progression?.group_fixtures || [])
    .filter(match => match.group === selectedGroup)
    .filter(match => selectedDay === 'all' || match.day === selectedDay)
    .sort((a, b) => a.id.localeCompare(b.id)), [progression, selectedGroup, selectedDay]);

  function startEditing(match: Fixture) {
    setEditingId(match.id);
    setScore1Input(match.score1 === null ? '' : String(match.score1));
    setScore2Input(match.score2 === null ? '' : String(match.score2));
    setMessage('');
  }
  function cancelEditing() {
    setEditingId(null); setScore1Input(''); setScore2Input('');
  }

  async function saveResult(match: Fixture) {
    if (!supabase) { setError('اتصال به دیتابیس اصلی برقرار نیست.'); return; }
    if (!/^\d+$/.test(score1Input.trim()) || !/^\d+$/.test(score2Input.trim())) {
      setError('هر دو امتیاز را به‌صورت عدد صحیح وارد کن.'); return;
    }
    const score1 = Number(score1Input);
    const score2 = Number(score2Input);
    const valid = (score1 >= 5 && score1 <= 7 && score2 >= 0 && score2 <= 4) || (score2 >= 5 && score2 <= 7 && score1 >= 0 && score1 <= 4);
    if (!valid) {
      setError('نتیجه معتبر نیست؛ امتیاز برنده باید بین ۵ تا ۷ و امتیاز بازنده بین ۰ تا ۴ باشد.'); return;
    }
    if (!updatedAt) { setError('زمان آخرین نسخه برنامه مشخص نیست. ابتدا فهرست را تازه‌سازی کن.'); return; }

    setSavingId(match.id); setError(''); setMessage('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('نشست مالک معتبر نیست. دوباره وارد پنل شو.');

      const response = await fetch(SUPABASE_URL + '/functions/v1/plato-land-series2-progression', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          apikey: SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          action: 'save_group_result', match_id: match.id, score1, score2, expected_updated_at: updatedAt,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        await loadProgression();
        throw new Error('اطلاعات مسابقات هم‌زمان تغییر کرده است. فهرست تازه شد؛ نتیجه را دوباره بررسی و ثبت کن.');
      }
      if (!response.ok || !data?.saved) throw new Error(data?.error || 'ذخیره نتیجه ناموفق بود.');

      setProgression(data.progression as Progression);
      setUpdatedAt(data.updated_at || '');
      setEditingId(null); setScore1Input(''); setScore2Input('');
      setMessage(data.unchanged ? 'این نتیجه از قبل ثبت شده بود و تغییری ایجاد نشد.' : 'نتیجه با موفقیت در دیتابیس اصلی ذخیره شد.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'ذخیره نتیجه ناموفق بود.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section dir="rtl" style={section}>
      <div style={header}>
        <div>
          <h2 style={title}>ثبت نتایج بازی‌ها</h2>
          <p style={muted}>بازی‌های هر گروه را ببین، امتیاز را وارد کن و نتیجه را در دیتابیس اصلی ذخیره کن.</p>
        </div>
        <button type="button" style={secondaryButton} onClick={() => void loadProgression()} disabled={loading || savingId !== null}>
          {loading ? 'در حال دریافت…' : 'تازه‌سازی'}
        </button>
      </div>
      <div style={note}>
        قانون امتیازدهی: بازی پنج‌امتیازی است؛ برنده باید دقیقاً ۵ و امتیاز بازنده بین ۰ تا ۴ باشد.
        نتیجه ثبت‌شده در صفحه عمومی مسابقات نیز نمایش داده می‌شود.
      </div>

      {loading ? <p style={stateText}>در حال دریافت گروه‌ها و برنامه بازی‌ها…</p> :
       error && !progression ? <div style={errorBox} role="alert">{error}</div> :
       !progression || groupNames.length === 0 ? <p style={stateText}>هنوز گروه یا برنامه بازی‌ای در دیتابیس ثبت نشده است.</p> : (
        <>
          <div style={filters}>
            <label style={filterLabel}>گروه
              <select style={select} value={selectedGroup} onChange={event => { setSelectedGroup(event.target.value); cancelEditing(); }}>
                {groupNames.map(name => <option key={name} value={name}>گروه {name}</option>)}
              </select>
            </label>
            <label style={filterLabel}>روز مسابقه
              <select style={select} value={selectedDay} onChange={event => { setSelectedDay(event.target.value); cancelEditing(); }}>
                <option value="all">همه روزها</option>
                <option value="saturday">شنبه · روز اول</option>
                <option value="sunday">یکشنبه · روز دوم</option>
                <option value="monday">دوشنبه · روز سوم</option>
              </select>
            </label>
          </div>
          <div style={summary}><strong>گروه {selectedGroup}</strong><span>{fa(fixtures.length)} مسابقه در این فهرست</span></div>
          {fixtures.length === 0 ? <p style={stateText}>برای این فیلتر مسابقه‌ای پیدا نشد.</p> : (
            <div style={matchList}>
              {fixtures.map(match => {
                const recorded = match.winner !== null && Number.isInteger(match.score1) && Number.isInteger(match.score2);
                const history = Array.isArray(match.result_history) ? match.result_history : [];
                const editing = editingId === match.id;
                return (
                  <article key={match.id} style={matchCard}>
                    <div style={matchMeta}>
                      <span style={matchId}>{match.id}</span>
                      <span style={matchDay}>{DAY_LABELS[match.day] || match.day}</span>
                      <span style={recorded ? savedStatus : pendingStatus}>{recorded ? 'نتیجه ثبت شده' : 'در انتظار نتیجه'}</span>
                    </div>
                    <div style={players}>
                      <div style={player}><b dir="ltr" style={playerId}>{match.player1}</b><span style={playerLabel}>بازیکن اول</span></div>
                      <span style={versus}>VS</span>
                      <div style={player}><b dir="ltr" style={playerId}>{match.player2}</b><span style={playerLabel}>بازیکن دوم</span></div>
                    </div>
                    {recorded && !editing && (
                      <div style={savedScore}>
                        <strong dir="ltr">{fa(match.score1 as number)} – {fa(match.score2 as number)}</strong>
                        <span>برنده: <b dir="ltr">{match.winner}</b></span>
                      </div>
                    )}
                    {editing ? (
                      <div style={editor}>
                        <label style={scoreLabel}>امتیاز {match.player1}
                          <input style={scoreInput} type="number" inputMode="numeric" min="0" max="7" step="1" value={score1Input} onChange={event => setScore1Input(event.target.value)} />
                        </label>
                        <label style={scoreLabel}>امتیاز {match.player2}
                          <input style={scoreInput} type="number" inputMode="numeric" min="0" max="7" step="1" value={score2Input} onChange={event => setScore2Input(event.target.value)} />
                        </label>
                        <div style={actions}>
                          <button type="button" style={primaryButton} disabled={savingId !== null} onClick={() => void saveResult(match)}>
                            {savingId === match.id ? 'در حال ذخیره…' : recorded ? 'ثبت اصلاح نتیجه' : 'ذخیره نتیجه'}
                          </button>
                          <button type="button" style={secondaryButton} disabled={savingId !== null} onClick={cancelEditing}>انصراف</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" style={recorded ? secondaryButton : primaryButton} disabled={savingId !== null} onClick={() => startEditing(match)}>
                        {recorded ? 'اصلاح نتیجه' : 'ورود نتیجه'}
                      </button>
                    )}
                    {history.length > 0 && (
                      <details style={historyDetails}>
                        <summary>تاریخچه ثبت و اصلاح ({fa(history.length)})</summary>
                        <ol style={historyList}>
                          {history.map((entry, index) => (
                            <li key={entry.recorded_at + '-' + index}>
                              <span>{entry.action === 'corrected' ? 'اصلاح نتیجه' : 'ثبت اولیه'}</span>
                              <b dir="ltr">{fa(entry.score1)} – {fa(entry.score2)}</b>
                              <small>{dateText(entry.recorded_at)}</small>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
      {error && progression && <div style={errorBox} role="alert">{error}</div>}
      {message && <div style={successBox} role="status">{message}</div>}
      <small style={footerNote}>آخرین نسخه داده: {updatedAt ? dateText(updatedAt) : 'نامشخص'} · فقط مالک کل امکان ثبت و اصلاح نتیجه را دارد.</small>
    </section>
  );
}

const section: React.CSSProperties = { marginTop: 20, padding: 16, border: '1px solid #b18b45', borderRadius: 14, background: 'linear-gradient(145deg,#211b12,#111214)' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' };
const title: React.CSSProperties = { color: '#f6e8c5', fontSize: 19, margin: '0 0 6px' };
const muted: React.CSSProperties = { color: '#c9c4b8', fontSize: 13, lineHeight: 1.9, margin: 0 };
const note: React.CSSProperties = { marginTop: 12, padding: 10, border: '1px solid #8f754455', borderRadius: 9, background: '#c6a45b0d', color: '#d7c9aa', fontSize: 11, lineHeight: 1.9 };
const filters: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginTop: 14 };
const filterLabel: React.CSSProperties = { display: 'block', color: '#c9c4b8', fontSize: 12 };
const select: React.CSSProperties = { display: 'block', width: '100%', marginTop: 6, padding: 10, background: '#101113', border: '1px solid #6a5a37', borderRadius: 8, color: '#fff', font: 'inherit' };
const summary: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', margin: '14px 0 9px', color: '#f0d99f', fontSize: 12 };
const matchList: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 };
const matchCard: React.CSSProperties = { minWidth: 0, padding: 12, border: '1px solid #8f754466', borderRadius: 10, background: '#101113' };
const matchMeta: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', marginBottom: 11 };
const matchId: React.CSSProperties = { color: '#d9b65d', fontSize: 10, fontWeight: 800, direction: 'ltr' };
const matchDay: React.CSSProperties = { color: '#a99e89', fontSize: 10 };
const savedStatus: React.CSSProperties = { color: '#a9d7a5', fontSize: 10 };
const pendingStatus: React.CSSProperties = { color: '#c9b88f', fontSize: 10 };
const players: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 };
const player: React.CSSProperties = { display: 'grid', gap: 4, minWidth: 0, flex: 1 };
const playerId: React.CSSProperties = { color: '#f4efe5', fontSize: 12, overflowWrap: 'anywhere', textAlign: 'center' };
const playerLabel: React.CSSProperties = { color: '#8f8778', fontSize: 9, textAlign: 'center' };
const versus: React.CSSProperties = { color: '#b8954f', font: '10px Georgia,serif' };
const savedScore: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, margin: '12px 0', padding: '9px 10px', borderRadius: 8, background: '#d7b66d12', color: '#e8d7b2', fontSize: 11 };
const editor: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 12 };
const scoreLabel: React.CSSProperties = { color: '#c9c4b8', fontSize: 10, overflowWrap: 'anywhere' };
const scoreInput: React.CSSProperties = { display: 'block', width: '100%', marginTop: 6, padding: 10, background: '#090a0c', border: '1px solid #6a5a37', borderRadius: 8, color: '#fff', fontSize: 16, textAlign: 'center' };
const actions: React.CSSProperties = { gridColumn: '1/-1', display: 'flex', gap: 8, flexWrap: 'wrap' };
const primaryButton: React.CSSProperties = { flex: 1, background: 'linear-gradient(120deg,#a98239,#e4c77e)', border: '1px solid #e3c77d', borderRadius: 8, color: '#17130b', padding: '10px 12px', fontWeight: 750, fontSize: 11, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { background: '#252525', border: '1px solid #665a42', color: '#ddd', borderRadius: 8, padding: '9px 12px', fontSize: 11, cursor: 'pointer' };
const historyDetails: React.CSSProperties = { marginTop: 10, borderTop: '1px solid #ffffff12', paddingTop: 8, color: '#cdb77f', fontSize: 10 };
const historyList: React.CSSProperties = { margin: '7px 0 0', paddingRight: 18, color: '#c9c4b8' };
const errorBox: React.CSSProperties = { marginTop: 12, padding: 10, borderRadius: 8, background: '#301819', color: '#ffc8c8', fontSize: 11, lineHeight: 1.8 };
const successBox: React.CSSProperties = { marginTop: 12, padding: 10, borderRadius: 8, background: '#1c2b1c', color: '#b9e0b5', fontSize: 11, lineHeight: 1.8 };
const stateText: React.CSSProperties = { margin: '14px 0', padding: 12, borderRadius: 9, background: '#171819', color: '#d9d0bd', textAlign: 'center', fontSize: 11, lineHeight: 1.8 };
const footerNote: React.CSSProperties = { display: 'block', marginTop: 12, color: '#958b78', fontSize: 9, lineHeight: 1.8 };
