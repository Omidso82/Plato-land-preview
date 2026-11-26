import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from './supabase';

type Settings = {
  capacity: number;
  rules_version: string;
  draft_revision: number;
  rules_text: string | null;
  preview_revision: number;
  needs_review: boolean;
};

function PlayerPreview({ settings }: { settings: Settings }) {
  const [accepted, setAccepted] = useState(false);
  const [platoId, setPlatoId] = useState('');
  const validId = /^[A-Za-z0-9_]{2,30}$/.test(platoId.trim());

  return <section aria-label="پیش‌نمایش فرم بازیکن" style={{ display: 'grid', gap: 12, padding: 16, borderRadius: 14, border: '1px solid #8c6a34', background: '#171819' }}>
    <header>
      <h4 style={{ margin: '0 0 6px', color: '#f4deb0' }}>ثبت‌نام سری پنجم لیگ تخته‌نرد</h4>
      <div>ظرفیت اصلی {settings.capacity.toLocaleString('fa-IR')} نفر</div>
    </header>
    <div>
      <strong>قوانین سری پنجم · <bdi>{settings.rules_version}</bdi></strong>
      <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.9 }}>{settings.rules_text}</p>
    </div>
    <label>
      <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />
      {' '}قوانین این سری را خواندم و می‌پذیرم.
    </label>
    {accepted && <label style={{ display: 'grid', gap: 6 }}>
      Plato ID
      <input dir="ltr" value={platoId} maxLength={30} autoCapitalize="none" autoComplete="off"
        spellCheck={false} onChange={event => setPlatoId(event.target.value)} />
      <small>۲ تا ۳۰ حرف انگلیسی، عدد یا زیرخط.</small>
    </label>}
    <p role="status" style={{ margin: 0 }}>
      {accepted && validId ? 'فیلدها کامل‌اند. ثبت‌نام بسته است.' : 'ثبت‌نام بسته است.'}
    </p>
  </section>;
}

function PreviewEditor({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [rules, setRules] = useState(initial.rules_text ?? '');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rulesText = rules.trim();
    if (!supabase || busy || stale || !rulesText) return;
    setBusy(true);
    setFeedback('');
    setError('');
    try {
      const result = await supabase.rpc('plato_temp_owner_save_series5_registration_preview', {
        p_rules_text: rulesText,
        p_draft_revision: settings.draft_revision,
        p_preview_revision: settings.preview_revision,
      });
      if (result.error?.code === '40001' || result.error?.code === '55000') {
        setStale(true);
        setError('تنظیمات سری پنجم تغییر کرده است. فهرست را به‌روز کن.');
        return;
      }
      if (result.error || typeof result.data !== 'number') throw new Error('Preview save failed');
      setSettings({ ...settings, rules_text: rulesText, preview_revision: result.data, needs_review: false });
      setRules(rulesText);
      setFeedback('پیش‌نمایش خصوصی ذخیره شد.');
    } catch {
      setError('ذخیرهٔ پیش‌نمایش انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <form onSubmit={save} style={{ display: 'grid', gap: 10 }}>
      {settings.needs_review && <p role="status">پیش‌نویس سری پنجم تغییر کرده است. متن مطابق نسخهٔ فعلی را برای بازبینی دوباره ذخیره کن.</p>}
      <label style={{ display: 'grid', gap: 6 }}>متن قوانین سری پنجم · <bdi>{settings.rules_version}</bdi>
        <textarea rows={6} style={{ width: '100%', boxSizing: 'border-box' }} required maxLength={20000}
          value={rules} disabled={busy || stale} onChange={event => {
            setRules(event.target.value);
            setFeedback('');
          }} />
      </label>
      <button type="submit" disabled={busy || stale || !rules.trim()}>ذخیرهٔ پیش‌نمایش خصوصی</button>
      {feedback && <p role="status">{feedback}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
    {settings.rules_text && !stale && <PlayerPreview key={settings.preview_revision} settings={settings} />}
  </>;
}

export default function Series5RegistrationPreview({ draftRevision }: { draftRevision: number }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(draftRevision > 0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!draftRevision) return;
    let active = true;
    void (async () => {
      try {
        const result = await supabase?.rpc('plato_temp_owner_series5_registration_preview');
        if (!result || result.error) throw new Error('Preview unavailable');
        if (active) setSettings(result.data as Settings | null);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [draftRevision]);

  return <section aria-label="آماده‌سازی ثبت‌نام سری پنجم" style={{ display: 'grid', gap: 12, marginTop: 14 }}>
    <h4 style={{ margin: 0 }}>پیش‌نمایش خصوصی ثبت‌نام</h4>
    {draftRevision === 0 && <p>ابتدا ظرفیت و نسخهٔ قوانین سری پنجم را ذخیره کن.</p>}
    {loading && <p role="status">در حال دریافت تنظیمات فرم…</p>}
    {failed && <p role="alert">دریافت تنظیمات فرم ممکن نشد. فهرست را به‌روز کن.</p>}
    {!loading && !failed && draftRevision > 0 && (!settings || settings.draft_revision !== draftRevision)
      && <p role="status">تنظیمات سری پنجم تغییر کرده است. فهرست را به‌روز کن.</p>}
    {settings?.draft_revision === draftRevision && <PreviewEditor initial={settings} />}
  </section>;
}
