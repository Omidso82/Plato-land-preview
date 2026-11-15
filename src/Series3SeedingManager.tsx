import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type Registration = { id: string; plato_id: string; registration_status: 'main' | 'waitlist' | 'withdrawn' };
type Stats = { request_id: string; games_played: number; games_won: number };
type Player = Registration & { games_played: number | null; games_won: number | null; updated_at?: string };

const fa = (value: number) => value.toLocaleString('fa-IR');
const pct = (played: number | null, won: number | null) =>
  played !== null && won !== null && played > 0
    ? ((won / played) * 100).toLocaleString('fa-IR', { maximumFractionDigits: 2 }) + '٪'
    : '—';

const panel: React.CSSProperties = {
  marginTop: 18, padding: 16, border: '1px solid #8c6a34', borderRadius: 14,
  background: 'linear-gradient(145deg,#211b12,#111214)', color: '#f2ead8',
};
const muted: React.CSSProperties = { color: '#c9c0b0', fontSize: 12, lineHeight: 1.8 };
const input: React.CSSProperties = {
  width: '100%', minWidth: 0, boxSizing: 'border-box', background: '#0c0d0f',
  border: '1px solid #6a5a37', borderRadius: 8, color: '#fff', padding: '9px 8px',
};
const button: React.CSSProperties = {
  background: 'linear-gradient(120deg,#a98239,#e4c77e)', border: '1px solid #e3c77d',
  borderRadius: 8, color: '#17130b', padding: '9px 12px', fontWeight: 800, cursor: 'pointer',
};

export default function Series3SeedingManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { played: string; won: string }>>({});
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setError('اتصال به دیتابیس اصلی در دسترس نیست.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [registrationResult, statsResult] = await Promise.all([
        supabase.from('plato_land_series3_registration_requests')
          .select('id,plato_id,registration_status').eq('registration_status', 'main').order('created_at', { ascending: true }),
        supabase.from('plato_land_series3_player_stats')
          .select('request_id,games_played,games_won'),
      ]);
      if (registrationResult.error) throw registrationResult.error;
      if (statsResult.error) throw statsResult.error;
      const statsById = new Map<string, Stats>(
        (statsResult.data || []).map((row: any) => [String(row.request_id), {
          request_id: String(row.request_id),
          games_played: Number(row.games_played),
          games_won: Number(row.games_won),
        }]),
      );
      const next = (registrationResult.data || []).map((row: any) => {
        const stat = statsById.get(String(row.id));
        return {
          id: String(row.id), plato_id: String(row.plato_id || ''),
          games_played: stat ? stat.games_played : null,
          games_won: stat ? stat.games_won : null,
        } as Player;
      });
      next.sort((a, b) => {
        const aValid = a.games_played !== null && a.games_won !== null && a.games_played > 0;
        const bValid = b.games_played !== null && b.games_won !== null && b.games_played > 0;
        if (aValid && !bValid) return -1;
        if (!aValid && bValid) return 1;
        if (aValid && bValid) {
          const rateDiff = (b.games_won! / b.games_played!) - (a.games_won! / a.games_played!);
          if (rateDiff !== 0) return rateDiff;
        }
        if (a.games_played !== null && b.games_played !== null && a.games_played !== b.games_played)
          return a.games_played - b.games_played;
        if (a.games_won !== null && b.games_won !== null && a.games_won !== b.games_won)
          return b.games_won - a.games_won;
        return a.plato_id.localeCompare(b.plato_id, 'en', { sensitivity: 'base' });
      });
      setPlayers(next);
      setDrafts(Object.fromEntries(next.map(player => [player.id, {
        played: player.games_played === null ? '' : String(player.games_played),
        won: player.games_won === null ? '' : String(player.games_won),
      }])));
    } catch (e) {
      console.error('Series 3 seeding stats load failed:', e);
      setError('دریافت آمار سری سوم ناموفق بود: ' + (e instanceof Error ? e.message : 'خطای ناشناخته'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const completed = players.filter(p => p.games_played !== null).length;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return players.filter(p => !term || p.plato_id.toLocaleLowerCase().includes(term));
  }, [players, search]);

  async function save(player: Player) {
    if (!supabase) { setError('اتصال به دیتابیس اصلی در دسترس نیست.'); return; }
    const draft = drafts[player.id] || { played: '', won: '' };
    if (!/^\d+$/.test(draft.played.trim()) || !/^\d+$/.test(draft.won.trim())) {
      setError('برای ' + player.plato_id + ' تعداد کل بازی و تعداد برد را با عدد صحیح وارد کن.');
      setMessage(''); return;
    }
    const played = Number(draft.played), won = Number(draft.won);
    if (!Number.isSafeInteger(played) || !Number.isSafeInteger(won) || played < 0 || won < 0 || won > played) {
      setError('اطلاعات ' + player.plato_id + ' معتبر نیست؛ برد باید بین صفر و تعداد کل بازی باشد.');
      setMessage(''); return;
    }
    setSavingId(player.id); setError(''); setMessage('');
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userResult.user) throw new Error('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.');
      const { error: saveError } = await supabase.from('plato_land_series3_player_stats').upsert({
        request_id: player.id, games_played: played, games_won: won,
        updated_at: new Date().toISOString(), updated_by: userResult.user.id,
      }, { onConflict: 'request_id' });
      if (saveError) throw saveError;
      setMessage('آمار ' + player.plato_id + ' ذخیره شد.');
      await load();
    } catch (e) {
      console.error('Series 3 player stats save failed:', e);
      setError('ذخیره آمار ' + player.plato_id + ' ناموفق بود: ' + (e instanceof Error ? e.message : 'خطای ناشناخته'));
    } finally { setSavingId(null); }
  }

  return <section dir="rtl" style={panel}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ color: '#f6e8c5', fontSize: 20, margin: '0 0 5px' }}>آمار بازیکنان و سیدبندی سری سوم</h2>
        <p style={{ ...muted, margin: 0 }}>ثبت تعداد بازی و برد؛ محاسبه و مرتب‌سازی خودکار بر اساس درصد برد</p>
      </div>
      <button type="button" style={button} onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
        {expanded ? 'جمع‌کردن بخش' : 'بازکردن بخش'}
      </button>
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 13 }}>
      {[
        ['ثبت‌نام‌کنندگان', players.length],
        ['آمار واردشده', completed],
        ['در انتظار آمار', Math.max(0, players.length - completed)],
      ].map(([label, value]) => <div key={String(label)} style={{ flex: '1 1 105px', minWidth: 0, padding: '9px 11px', border: '1px solid #66512d', borderRadius: 9, background: '#171513' }}>
        <div style={muted}>{label}</div><strong style={{ color: '#f1d99e', fontSize: 21 }}>{loading ? '—' : fa(Number(value))}</strong>
      </div>)}
    </div>
    {expanded && <>
      <div style={{ display: 'flex', gap: 8, marginTop: 13, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جست‌وجوی Plato ID…" aria-label="جست‌وجوی Plato ID" style={{ ...input, flex: '1 1 180px' }} />
        <button type="button" style={button} onClick={() => void load()} disabled={loading}>{loading ? 'در حال دریافت…' : 'تازه‌سازی'}</button>
      </div>
      <p style={{ ...muted, margin: '9px 0' }}>درصد برد = تعداد برد ÷ تعداد کل بازی × ۱۰۰. بازیکنانی که هنوز آمار معتبر ندارند، پس از بازیکنان دارای درصد برد قرار می‌گیرند.</p>
      {error && <p role="alert" style={{ color: '#f0aaaa', fontSize: 12 }}>{error}</p>}
      {message && <p role="status" style={{ color: '#b8dfa9', fontSize: 12 }}>{message}</p>}
      {loading ? <p style={muted}>در حال دریافت فهرست بازیکنان…</p> : players.length === 0 ? <p style={muted}>هنوز ثبت‌نامی برای سری سوم وجود ندارد.</p> : filtered.length === 0 ? <p style={muted}>بازیکنی با این Plato ID پیدا نشد.</p> :
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {filtered.map(player => {
            const rank = players.findIndex(p => p.id === player.id) + 1;
            const draft = drafts[player.id] || { played: '', won: '' };
            return <article key={player.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 9, alignItems: 'center', padding: 11, border: '1px solid #4e422b', borderRadius: 10, background: '#141516' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#e4c77e', fontSize: 12 }}>#{fa(rank)}</strong>
                  <strong dir="ltr" style={{ color: '#f4f0e8', fontSize: 14, overflowWrap: 'anywhere' }}>{player.plato_id}</strong>
                  <span style={{ color: '#d9bb78', fontSize: 12 }}>{pct(player.games_played, player.games_won)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 8 }}>
                  <label style={{ ...muted, minWidth: 0 }}>کل بازی
                    <input inputMode="numeric" type="number" min="0" step="1" value={draft.played} onChange={e => setDrafts(prev => ({ ...prev, [player.id]: { ...draft, played: e.target.value } }))} style={input} />
                  </label>
                  <label style={{ ...muted, minWidth: 0 }}>برد
                    <input inputMode="numeric" type="number" min="0" step="1" value={draft.won} onChange={e => setDrafts(prev => ({ ...prev, [player.id]: { ...draft, won: e.target.value } }))} style={input} />
                  </label>
                </div>
              </div>
              <button type="button" style={{ ...button, alignSelf: 'end', whiteSpace: 'nowrap' }} disabled={savingId !== null} onClick={() => void save(player)}>
                {savingId === player.id ? '…' : 'ذخیره'}
              </button>
            </article>;
          })}
        </div>}
    </>}
  </section>;
}
