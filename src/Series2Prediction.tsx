import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Crown, Loader2, Lock, Sparkles, X } from 'lucide-react';
import './Series2Prediction.css';

type PredictionPlayer = { group: string; plato_id: string; seed: number };
type PredictionResponse = {
  roster?: PredictionPlayer[];
  is_open?: boolean;
  group_stage_complete?: boolean;
  fixtures_total?: number;
  fixtures_completed?: number;
  error?: string;
};

const API = 'https://dfrppbapaaydbjeflozw.supabase.co/functions/v1/plato-land-series2-prediction';

export default function Series2Prediction() {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<{ name: string; players: PredictionPlayer[] }[]>([]);
  const [selected, setSelected] = useState('');
  const [voterId, setVoterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [fixturesCompleted, setFixturesCompleted] = useState(0);
  const [fixturesTotal, setFixturesTotal] = useState(48);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError('');
    setNotice('');
    fetch(API, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(async response => {
        const data = await response.json() as PredictionResponse;
        if (!response.ok) throw new Error(data.error || 'دریافت فهرست بازیکنان ناموفق بود.');
        if (!Array.isArray(data.roster) || data.roster.length !== 32) throw new Error('فهرست رسمی ۳۲ بازیکن دریافت نشد.');
        const nextGroups = Array.from(new Set(data.roster.map(p => p.group)))
          .sort()
          .map(name => ({ name, players: data.roster!.filter(p => p.group === name).sort((a,b) => a.seed-b.seed) }));
        if (alive) {
          setGroups(nextGroups);
          setIsOpen(!!data.is_open);
          setFixturesCompleted(data.fixtures_completed ?? 0);
          setFixturesTotal(data.fixtures_total ?? 48);
        }
      })
      .catch(err => { if (alive) setError(err?.message || 'ارتباط با سامانه رأی‌گیری برقرار نشد.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open]);

  const selectedPlayer = useMemo(
    () => groups.flatMap(group => group.players).find(player => player.plato_id === selected),
    [groups, selected]
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!selectedPlayer) { setError('ابتدا یک بازیکن را انتخاب کن.'); return; }
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(voterId.trim())) {
      setError('Plato ID باید با حروف انگلیسی، عدد، خط تیره یا زیرخط وارد شود.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ plato_id: voterId.trim(), selected_plato_id: selectedPlayer.plato_id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ثبت پیش‌بینی انجام نشد.');
      setNotice(data.message || 'پیش‌بینی با موفقیت ثبت شد.');
      setSelected('');
      setVoterId('');
    } catch (err: any) {
      setError(err?.message || 'ثبت پیش‌بینی ناموفق بود. دوباره تلاش کن.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="series2-prediction-cta">
        <div className="series2-prediction-cta-icon"><Crown size={25}/></div>
        <div className="series2-prediction-cta-copy">
          <span>ویژه سری دوم لیگ تخته‌نرد</span>
          <h2>قهرمان سری دوم را پیش‌بینی کن</h2>
          <p>از بین ۳۲ بازیکن، فقط یک نفر را به‌عنوان قهرمان انتخاب کن.</p>
        </div>
        <button type="button" className="series2-prediction-open" onClick={() => setOpen(true)}>
          ثبت پیش‌بینی <Sparkles size={17}/>
        </button>
      </section>

      {open && (
        <div className="series2-prediction-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section className="series2-prediction-modal" role="dialog" aria-modal="true" aria-labelledby="series2-prediction-title" onClick={event => event.stopPropagation()}>
            <header className="series2-prediction-header">
              <div><span>PLATO LAND · SERIES 2</span><h2 id="series2-prediction-title">پیش‌بینی قهرمان</h2></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="بستن پنجره"><X size={21}/></button>
            </header>
            <div className="series2-prediction-intro">
              <p>یکی از ۳۲ بازیکن زیر را انتخاب کن، سپس Plato ID خودت را وارد و رأی را ثبت کن.</p>
              <div className="series2-prediction-progress">{fixturesCompleted} از {fixturesTotal} مسابقه گروهی تکمیل شده</div>
            </div>
            {loading ? (
              <div className="series2-prediction-state"><Loader2 className="spin" size={25}/> در حال دریافت فهرست رسمی بازیکنان…</div>
            ) : error && groups.length === 0 ? (
              <div className="series2-prediction-error" role="alert">{error}</div>
            ) : !isOpen ? (
              <div className="series2-prediction-state"><Lock size={25}/>{fixturesCompleted === fixturesTotal && fixturesTotal > 0 ? 'مهلت پیش‌بینی با پایان مسابقات گروهی به پایان رسیده است.' : 'مهلت ثبت پیش‌بینی در حال حاضر فعال نیست.'}</div>
            ) : notice ? (
              <div className="series2-prediction-success" role="status"><CheckCircle2 size={28}/><strong>رأی تو ثبت شد</strong><p>{notice}</p><small>این رأی قابل تغییر یا ثبت مجدد نیست.</small></div>
            ) : (
              <form onSubmit={submit} className="series2-prediction-form">
                <div className="series2-prediction-roster-title"><strong>انتخاب قهرمان</strong><small>۳۲ بازیکن · ۸ گروه</small></div>
                <div className="series2-prediction-groups">
                  {groups.map(group => (
                    <details key={group.name} open>
                      <summary><span>گروه {group.name}</span><small>{group.players.length} بازیکن</small><ChevronDown size={16}/></summary>
                      <div className="series2-prediction-player-grid">
                        {group.players.map(player => (
                          <button
                            type="button"
                            key={player.plato_id}
                            className={selected === player.plato_id ? 'series2-prediction-player selected' : 'series2-prediction-player'}
                            aria-pressed={selected === player.plato_id}
                            onClick={() => setSelected(player.plato_id)}
                          >
                            <span className="series2-prediction-seed">{player.seed}</span>
                            <span className="series2-prediction-player-id">{player.plato_id}</span>
                            {selected === player.plato_id && <CheckCircle2 size={16}/>}
                          </button>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
                <label className="series2-prediction-id-label">Plato ID خودت
                  <input value={voterId} onChange={event => setVoterId(event.target.value)} dir="ltr" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={80} placeholder="Enter your Plato ID" required/>
                </label>
                {error && <div className="series2-prediction-error" role="alert">{error}</div>}
                <div className="series2-prediction-warning"><Lock size={15}/> هر بازیکن فقط یک‌بار می‌تواند رأی بدهد؛ پس از ثبت، امکان تغییر رأی وجود ندارد.</div>
                <button type="submit" className="series2-prediction-submit" disabled={saving || !selected}>
                  {saving ? <><Loader2 className="spin" size={17}/> در حال ثبت…</> : 'ثبت نهایی پیش‌بینی'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
