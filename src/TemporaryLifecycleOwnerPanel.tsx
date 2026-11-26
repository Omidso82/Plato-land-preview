import { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Review = {
  lifecycle_status: string;
  ready_for_approval: boolean;
  reason: string;
  source_fingerprint?: string;
  matched_knockout?: number;
  expected_knockout?: number;
};

type StartReview = { started: boolean; ready: boolean; reason: string };

const startReasons: Record<string, string> = {
  registration_not_finished: 'ابتدا ثبت‌نام رسمی را انجام بده و سپس آن را ببند.',
  group_draw_missing: 'ابتدا قرعه‌کشی گروهی را ثبت کن.',
  group_schedule_missing: 'ابتدا برنامهٔ کامل بازی‌های گروهی را ذخیره کن.',
  series_not_planned: 'شروع رسمی برای وضعیت فعلی این سری در دسترس نیست.',
  ready: 'آمادهٔ ثبت شروع رسمی',
};

const reasons: Record<string, string> = {
  missing_official_bracket: 'براکت رسمی هنوز ثبت نشده است.',
  group_stage_unresolved: 'نتایج گروهی یا نسخه براکت نیاز به بررسی دارد.',
  knockout_results_incomplete: 'نتایج حذفی هنوز کامل نیست.',
  third_place_unresolved: 'نتیجه بازی رده‌بندی هنوز تأیید نشده است.',
  bracket_result_mismatch: 'نتایج با براکت رسمی تطبیق ندارند.',
  archive_hold: 'پس از بازگردانی، همین نسخه نتایج دوباره آرشیو نمی‌شود.',
  results_changed: 'نتایج تغییر کرده‌اند. نسخه تازه را بررسی کن.',
  series_not_active: 'این سری هنوز در وضعیت قابل تأیید نیست.',
  verify_final_approval: 'نتایج برای تأیید نهایی آماده‌اند.',
};

export default function TemporaryLifecycleOwnerPanel({ seriesNumber }: { seriesNumber: 3 | 4 }) {
  const [review, setReview] = useState<Review | null>(null);
  const [start, setStart] = useState<StartReview | null>(null);
  const [startError, setStartError] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let current = true;
    void (async () => {
      try {
        const response = await supabase.rpc('plato_temp_owner_archive_review', { p_series_number: seriesNumber });
        if (!current) return;
        if (response.error || !response.data) throw new Error('Review unavailable');
        setReview(response.data as Review);
      } catch {
        if (current) setError('دریافت وضعیت آرشیو ممکن نشد.');
      }
    })();
    return () => { current = false; };
  }, [generation, seriesNumber]);

  useEffect(() => {
    if (!supabase || seriesNumber !== 4) return;
    let current = true;
    const client = supabase;
    void (async () => {
      try {
        const { data, error } = await client.rpc('plato_temp_owner_series4_start', { p_confirm_start: false });
        if (error || !data) throw new Error('Start review unavailable');
        if (current) setStart(data as StartReview);
      } catch {
        if (current) setStartError(true);
      }
    })();
    return () => { current = false; };
  }, [generation, seriesNumber]);

  async function confirmStart() {
    if (!supabase || busy || !start?.ready ||
        !window.confirm('شروع رسمی مسابقات سری چهارم ثبت شود؟')) return;
    setBusy(true);
    setNotice('');
    setStartError(false);
    try {
      const { data, error } = await supabase.rpc('plato_temp_owner_series4_start', { p_confirm_start: true });
      if (error || !data) throw new Error('Start confirmation unavailable');
      refresh();
      if (data.started === true) setNotice('شروع رسمی سری چهارم ثبت شد.');
      else setError(startReasons[data.reason] ?? 'شروع رسمی ثبت نشد.');
    } catch {
      setStartError(true);
    } finally {
      setBusy(false);
    }
  }

  function refresh() {
    setReview(null);
    setStart(null);
    setStartError(false);
    setError('');
    setGeneration(value => value + 1);
  }

  async function approve(fingerprint: string) {
    if (!supabase || busy || !window.confirm('نتایج نهایی این سری تأیید و مسابقه خودکار آرشیو شود؟')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data, error: requestError } = await supabase.rpc('plato_temp_owner_approve_final_and_archive', {
        p_series_number: seriesNumber,
        p_expected_fingerprint: fingerprint,
      });
      if (requestError) throw requestError;
      refresh();
      if (data?.archived === true) setNotice('نتایج تأیید و سری آرشیو شد.');
      else setError(reasons[data?.reason] ?? 'آرشیو انجام نشد. وضعیت مسابقه را دوباره بررسی کن.');
    } catch {
      setError('تأیید نتایج انجام نشد. وضعیت آرشیو را به‌روز کن.');
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!supabase || busy || reason.trim().length < 5 ||
        !window.confirm('این سری به حالت فعال برگردد؟ ثبت‌نام باز نمی‌شود.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data, error: requestError } = await supabase.rpc('plato_temp_owner_restore_active', {
        p_series_number: seriesNumber,
        p_reason: reason.trim(),
        p_correlation_id: crypto.randomUUID(),
      });
      if (requestError || !(data?.restored || data?.already_processed)) throw new Error('Restore failed');
      setReason('');
      refresh();
      setNotice('سری به حالت فعال برگشت.');
    } catch {
      setError('بازگردانی انجام نشد. وضعیت آرشیو را به‌روز کن.');
    } finally {
      setBusy(false);
    }
  }

  const archived = review?.lifecycle_status === 'archived';
  const active = review?.lifecycle_status === 'started' || review?.lifecycle_status === 'completed';
  const fingerprint = review?.source_fingerprint;
  return <section dir="rtl" aria-label="آرشیو هوشمند" style={{ marginTop: 18, padding: 16, border: '1px solid #b18b45', borderRadius: 14 }}>
    <h3>آرشیو هوشمند</h3>
    <button type="button" onClick={refresh} disabled={busy}>به‌روزرسانی وضعیت</button>
    {seriesNumber === 4 && (review?.lifecycle_status === 'planned' || start?.started) &&
      <div style={{ marginBlock: 10 }}>
        <strong>شروع رسمی مسابقات</strong>
        {startError && <p role="alert">بررسی یا ثبت شروع رسمی انجام نشد. وضعیت را به‌روز کن.</p>}
        {!start && !startError && <p role="status">در حال بررسی آمادگی شروع…</p>}
        {start?.started && <p>شروع رسمی ثبت شده است.</p>}
        {start && !start.started && <p>{startReasons[start.reason]}</p>}
        {start?.ready && <button type="button" disabled={busy} onClick={() => void confirmStart()}>ثبت شروع رسمی سری چهارم</button>}
      </div>}
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!review && !error && <p role="status">در حال دریافت وضعیت…</p>}
    {review && <p>{archived ? 'آرشیوشده' : reasons[review.reason] ?? 'وضعیت نتایج نیاز به بررسی دارد.'}</p>}
    {!archived && review?.expected_knockout != null &&
      <p>نتایج تطبیق‌یافته {review.matched_knockout ?? 0} از {review.expected_knockout}</p>}
    {active && review?.ready_for_approval && fingerprint &&
      <button type="button" disabled={busy} onClick={() => void approve(fingerprint)}>تأیید نتایج نهایی</button>}
    {archived && <div style={{ display: 'grid', gap: 8 }}>
      <label htmlFor={`archive-restore-${seriesNumber}`}>دلیل بازگردانی</label>
      <textarea id={`archive-restore-${seriesNumber}`} value={reason} onChange={event => setReason(event.target.value)} />
      <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void restore()}>بازگردانی به حالت فعال</button>
    </div>}
  </section>;
}
