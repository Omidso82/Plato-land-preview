import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from './supabase';

type DraftSeries = {
  series_number: number;
  series_name: string;
  capacity: number | null;
  rules_version: string | null;
  revision: number;
};

function DraftForm({ series }: { series: DraftSeries }) {
  const [capacity, setCapacity] = useState(series.capacity?.toString() ?? '');
  const [version, setVersion] = useState(series.rules_version ?? '');
  const [revision, setRevision] = useState(series.revision);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    const count = Number(capacity);
    if (!Number.isInteger(count) || count < 1 || count > 2147483647 || !version.trim()) return;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const result = await supabase.rpc('plato_temp_owner_save_onboarding_draft', {
        p_series_number: series.series_number,
        p_capacity: count,
        p_rules_version: version.trim(),
        p_expected_revision: revision,
      });
      if (result.error || typeof result.data !== 'number') {
        setError(result.error?.code === '40001'
          ? 'پیش‌نویس در نشست دیگری تغییر کرده است. پیش از ذخیره دوباره، فهرست را به‌روز کن.'
          : 'ذخیرهٔ پیش‌نویس انجام نشد.');
        return;
      }
      setRevision(result.data);
      setNotice('پیش‌نویس ذخیره شد.');
    } catch {
      setError('ذخیرهٔ پیش‌نویس انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={save} style={{display:'grid', gap:10, border:'1px solid #8c6a34', borderRadius:12, padding:14}}>
    <h3 style={{margin:0}}>{series.series_name}</h3>
    <label style={{display:'grid', gap:5}}>ظرفیت پیشنهادی
      <input type="number" min={1} max={2147483647} step={1} required value={capacity}
        onChange={event => setCapacity(event.target.value)} disabled={busy}/>
    </label>
    <label style={{display:'grid', gap:5}}>نسخهٔ قوانین
      <input type="text" maxLength={80} required value={version}
        onChange={event => setVersion(event.target.value)} disabled={busy}/>
    </label>
    <button type="submit" disabled={busy || !capacity || !version.trim()}>ذخیرهٔ پیش‌نویس</button>
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
  </form>;
}

export default function FutureSeriesDrafts() {
  const [rows, setRows] = useState<DraftSeries[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        const result = await supabase?.rpc('plato_temp_owner_onboarding_drafts');
        if (!result || result.error || !Array.isArray(result.data)) throw new Error('Drafts unavailable');
        if (current) setRows(result.data as DraftSeries[]);
      } catch {
        if (current) setFailed(true);
      }
    })();
    return () => { current = false; };
  }, [refresh]);

  return <section dir="rtl" aria-label="پیش‌نویس سری‌های آینده" style={{display:'grid',gap:12,marginBlock:18}}>
    <h2 style={{margin:0}}>پیش‌نویس سری‌های آینده</h2>
    <button type="button" onClick={() => { setRows(null); setFailed(false); setRefresh(value => value + 1); }}>
      به‌روزرسانی فهرست
    </button>
    {failed && <p role="alert">دریافت فهرست پیش‌نویس‌ها ممکن نشد.</p>}
    {!failed && rows === null && <p role="status">در حال دریافت فهرست…</p>}
    {rows?.length === 0 && <p role="status">سری برنامه‌ریزی‌شده‌ای برای آماده‌سازی وجود ندارد.</p>}
    {rows?.map(series => <DraftForm key={series.series_number} series={series}/>)}
  </section>;
}
