import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime, formatIranJalaliDateInput, formatIranClockInput, iranJalaliDateTimeToIso } from './iranDate';
import { FileText, Newspaper, Pencil, RefreshCw, Save, Trash2 } from 'lucide-react';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  body: string;
  image_url: string | null;
  status: 'draft' | 'published';
  featured: boolean;
  featured_starts_at: string | null;
  featured_ends_at: string | null;
  published_at: string | null;
  publish_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

function isPubliclyVisible(item: NewsItem, now: number) {
  if (item.status !== 'published') return false;
  const publishAt = item.publish_at ? new Date(item.publish_at).getTime() : 0;
  const expiresAt = item.expires_at ? new Date(item.expires_at).getTime() : Number.POSITIVE_INFINITY;
  return publishAt <= now && expiresAt > now;
}

const emptyForm = { title: '', summary: '', body: '', image_url: '', status: 'draft' as 'draft' | 'published', featured: false, featured_start_date: '', featured_start_time: '', featured_end_date: '', featured_end_time: '', publish_date: '', publish_time: '', expiry_date: '', expiry_time: '' };

export default function NewsCenter({ owner = false, featuredOnly = false }: { owner?: boolean; featuredOnly?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [now, setNow] = useState(() => Date.now());
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveYear, setArchiveYear] = useState('all');
  const [versions, setVersions] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!supabase) { setError('اتصال به پایگاه داده برقرار نیست.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      let query = supabase.from('site_news').select('id,title,summary,body,image_url,status,featured,featured_starts_at,featured_ends_at,published_at,publish_at,expires_at,created_at,updated_at');
      if (!owner) query = query.eq('status', 'published');
      const { data, error: loadError } = await query.order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      if (loadError) throw loadError;
      setItems((data || []) as NewsItem[]);
    } catch (e: any) {
      setError(e?.message || 'بارگذاری اخبار ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('site-news-publication')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_news' }, () => void load())
      .subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [load]);

  const featured = useMemo(() => items.filter(item =>
    isPubliclyVisible(item, now) && item.featured &&
    (!item.featured_starts_at || new Date(item.featured_starts_at).getTime() <= now) &&
    (!item.featured_ends_at || new Date(item.featured_ends_at).getTime() > now)
  ), [items, now]);
  const archiveYears = useMemo(() => [...new Set(items.filter(item => item.status === 'published' && item.published_at).map(item => formatIranJalaliDateInput(item.published_at!).slice(0,4)))].filter(Boolean).sort((a,b)=>b.localeCompare(a)), [items]);
  const archive = useMemo(() => items.filter(item => isPubliclyVisible(item, now) && (archiveYear === 'all' || (item.published_at && formatIranJalaliDateInput(item.published_at).startsWith(archiveYear))) && (!archiveSearch.trim() || [item.title,item.summary,item.body].join(' ').toLocaleLowerCase('fa').includes(archiveSearch.trim().toLocaleLowerCase('fa')))), [items, archiveSearch, archiveYear, now]);
  if (featuredOnly && (loading || error || featured.length === 0)) return null;

  async function loadVersions(newsId:string) {
    if (!owner || !supabase) { setVersions([]); return; }
    const { data, error: versionError } = await supabase.from('site_news_versions').select('id,version_number,title,summary,body,image_url,status,featured,featured_starts_at,featured_ends_at,published_at,publish_at,expires_at,created_at').eq('news_id',newsId).order('version_number',{ascending:false}).limit(20);
    if (versionError) { setError(versionError.message); setVersions([]); return; }
    setVersions(data || []);
  }

  async function restoreVersion(version:any) {
    if (!owner || !supabase || !editingId || !window.confirm('نسخهٔ '+version.version_number+' جایگزین خبر فعلی شود؟ نسخهٔ فعلی نیز در تاریخچه حفظ می‌شود.')) return;
    setBusy(true); setError('');
    try {
      const { error: restoreError } = await supabase.from('site_news').update({
        title:version.title,summary:version.summary,body:version.body,image_url:version.image_url,status:version.status,
        featured:version.featured,featured_starts_at:version.featured_starts_at,featured_ends_at:version.featured_ends_at,
        published_at:version.published_at,publish_at:version.publish_at,expires_at:version.expires_at,updated_at:new Date().toISOString()
      }).eq('id',editingId);
      if (restoreError) throw restoreError;
      resetForm();
      await load();
    } catch(e:any) { setError(e?.message || 'بازیابی نسخه ناموفق بود.'); }
    finally { setBusy(false); }
  }

  function startEdit(item: NewsItem) {
    setEditingId(item.id);
    void loadVersions(item.id);
    setForm({ title: item.title, summary: item.summary || '', body: item.body || '', image_url: item.image_url || '', status: item.status, featured: item.featured, featured_start_date: item.featured_starts_at ? formatIranJalaliDateInput(item.featured_starts_at) : '', featured_start_time: item.featured_starts_at ? formatIranClockInput(item.featured_starts_at) : '', featured_end_date: item.featured_ends_at ? formatIranJalaliDateInput(item.featured_ends_at) : '', featured_end_time: item.featured_ends_at ? formatIranClockInput(item.featured_ends_at) : '', publish_date: item.publish_at ? formatIranJalaliDateInput(item.publish_at) : '', publish_time: item.publish_at ? formatIranClockInput(item.publish_at) : '', expiry_date: item.expires_at ? formatIranJalaliDateInput(item.expires_at) : '', expiry_time: item.expires_at ? formatIranClockInput(item.expires_at) : '' });
    setError('');
  }

  function resetForm() { setEditingId(''); setForm(emptyForm); setVersions([]); setError(''); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!owner || !supabase) return;
    if (!form.title.trim()) { setError('عنوان خبر الزامی است.'); return; }
    setBusy(true); setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('نشست مالک معتبر نیست.');
      const current = items.find(item => item.id === editingId);
      const hasPublish = !!(form.publish_date.trim() || form.publish_time.trim());
      const hasExpiry = !!(form.expiry_date.trim() || form.expiry_time.trim());
      if (hasPublish && (!form.publish_date.trim() || !form.publish_time.trim())) throw new Error("برای زمان انتشار، تاریخ شمسی و ساعت ایران را هر دو وارد کن.");
      if (hasExpiry && (!form.expiry_date.trim() || !form.expiry_time.trim())) throw new Error("برای زمان انقضا، تاریخ شمسی و ساعت ایران را هر دو وارد کن.");
      const publishAt = hasPublish ? iranJalaliDateTimeToIso(form.publish_date, form.publish_time) : (form.status === "published" ? new Date().toISOString() : null);
      const expiresAt = hasExpiry ? iranJalaliDateTimeToIso(form.expiry_date, form.expiry_time) : null;
      if (hasPublish && !publishAt) throw new Error("تاریخ یا ساعت انتشار معتبر نیست.");
      if (hasExpiry && !expiresAt) throw new Error("تاریخ یا ساعت انقضا معتبر نیست.");
      if (publishAt && expiresAt && new Date(expiresAt).getTime() <= new Date(publishAt).getTime()) throw new Error("زمان انقضا باید بعد از زمان انتشار باشد.");
      const hasStart = !!(form.featured_start_date.trim() || form.featured_start_time.trim());
      const hasEnd = !!(form.featured_end_date.trim() || form.featured_end_time.trim());
      if (hasStart && (!form.featured_start_date.trim() || !form.featured_start_time.trim())) throw new Error('برای شروع خبر ویژه، تاریخ شمسی و ساعت ایران را هر دو وارد کن.');
      if (hasEnd && (!form.featured_end_date.trim() || !form.featured_end_time.trim())) throw new Error('برای پایان خبر ویژه، تاریخ شمسی و ساعت ایران را هر دو وارد کن.');
      const featuredStart = hasStart ? iranJalaliDateTimeToIso(form.featured_start_date, form.featured_start_time) : null;
      const featuredEnd = hasEnd ? iranJalaliDateTimeToIso(form.featured_end_date, form.featured_end_time) : null;
      if (hasStart && !featuredStart) throw new Error('تاریخ یا ساعت شروع خبر ویژه معتبر نیست.');
      if (hasEnd && !featuredEnd) throw new Error('تاریخ یا ساعت پایان خبر ویژه معتبر نیست.');
      if (featuredStart && featuredEnd && new Date(featuredEnd).getTime() <= new Date(featuredStart).getTime()) throw new Error('پایان نمایش ویژه باید بعد از زمان شروع باشد.');
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        body: form.body.trim(),
        image_url: form.image_url.trim() || null,
        status: form.status,
        featured: form.featured,
        featured_starts_at: featuredStart,
        featured_ends_at: featuredEnd,
        published_at: form.status === 'published' ? (current?.published_at || publishAt || new Date().toISOString()) : null,
        publish_at: form.status === 'published' ? publishAt : null,
        expires_at: expiresAt,
        created_by: user.id,
        updated_at: new Date().toISOString()
      };
      const result = editingId
        ? await supabase.from('site_news').update(payload).eq('id', editingId).select('id').single()
        : await supabase.from('site_news').insert(payload).select('id').single();
      if (result.error) throw result.error;
      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message || 'ذخیره خبر ناموفق بود.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: NewsItem) {
    if (!owner || !supabase || !window.confirm('خبر «' + item.title + '» حذف شود؟')) return;
    setBusy(true); setError('');
    try {
      const { error: deleteError } = await supabase.from('site_news').delete().eq('id', item.id);
      if (deleteError) throw deleteError;
      if (editingId === item.id) resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message || 'حذف خبر ناموفق بود.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="news-center">
    {owner && <section className="panel news-admin-panel">
      <div className="admin-toolbar"><div><span className="section-kicker">مدیریت محتوای سایت</span><h2>{editingId ? 'ویرایش خبر' : 'افزودن خبر یا اطلاعیه'}</h2><p>پیش‌نویس‌ها فقط برای مالک قابل مشاهده‌اند؛ خبر منتشرشده در صفحه عمومی نمایش داده می‌شود.</p></div><Newspaper size={24}/></div>
      <form className="form-panel news-editor" onSubmit={save}>
        <label>عنوان خبر<input required maxLength={160} value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} /></label>
        <label>خلاصه خبر<input maxLength={400} value={form.summary} onChange={e => setForm(v => ({ ...v, summary: e.target.value }))} placeholder="خلاصه کوتاه برای کارت خبر" /></label>
        <label>متن کامل خبر<textarea rows={6} value={form.body} onChange={e => setForm(v => ({ ...v, body: e.target.value }))} placeholder="متن کامل خبر یا اطلاعیه" /></label>
        <label>لینک تصویر (اختیاری)<input type="url" value={form.image_url} onChange={e => setForm(v => ({ ...v, image_url: e.target.value }))} placeholder="https://…" /></label>
        <label>وضعیت انتشار<select value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value as 'draft' | 'published' }))}><option value="draft">پیش‌نویس</option><option value="published">انتشار عمومی</option></select></label>
        {form.status === "published" && <div className="news-feature-window"><strong>زمان‌بندی انتشار و انقضا</strong><p className="form-footnote">اگر زمان انتشار را خالی بگذاری، خبر بلافاصله منتشر می‌شود. تاریخ‌ها شمسی و ساعت‌ها بر اساس تهران هستند. زمان انقضا اختیاری است.</p><div className="form-grid"><label>تاریخ انتشار<input type="text" dir="ltr" inputMode="numeric" placeholder="۱۴۰۵/۰۸/۱۵" value={form.publish_date} onChange={e => setForm(v => ({ ...v, publish_date: e.target.value }))}/></label><label>ساعت انتشار<input type="time" dir="ltr" value={form.publish_time} onChange={e => setForm(v => ({ ...v, publish_time: e.target.value }))}/></label></div><div className="form-grid"><label>تاریخ انقضا (اختیاری)<input type="text" dir="ltr" inputMode="numeric" placeholder="۱۴۰۵/۰۸/۳۰" value={form.expiry_date} onChange={e => setForm(v => ({ ...v, expiry_date: e.target.value }))}/></label><label>ساعت انقضا<input type="time" dir="ltr" value={form.expiry_time} onChange={e => setForm(v => ({ ...v, expiry_time: e.target.value }))}/></label></div></div>}
        <label className="check-row"><input type="checkbox" checked={form.featured} onChange={e => setForm(v => ({ ...v, featured: e.target.checked }))}/><span>نمایش به‌عنوان خبر ویژه</span></label>
        {form.featured && <div className="news-feature-window"><p className="form-footnote">زمان‌ها بر اساس ساعت ایران هستند؛ تاریخ را شمسی وارد کن. خالی گذاشتن شروع یا پایان به معنی بدون محدودیت است.</p><div className="form-grid"><label>تاریخ شروع نمایش ویژه<input type="text" dir="ltr" inputMode="numeric" placeholder="۱۴۰۵/۰۸/۱۰" value={form.featured_start_date} onChange={e => setForm(v => ({ ...v, featured_start_date: e.target.value }))}/></label><label>ساعت شروع (ایران)<input type="time" dir="ltr" value={form.featured_start_time} onChange={e => setForm(v => ({ ...v, featured_start_time: e.target.value }))}/></label></div><div className="form-grid"><label>تاریخ پایان نمایش ویژه<input type="text" dir="ltr" inputMode="numeric" placeholder="۱۴۰۵/۰۸/۱۵" value={form.featured_end_date} onChange={e => setForm(v => ({ ...v, featured_end_date: e.target.value }))}/></label><label>ساعت پایان (ایران)<input type="time" dir="ltr" value={form.featured_end_time} onChange={e => setForm(v => ({ ...v, featured_end_time: e.target.value }))}/></label></div></div>}
        {error && <p className="auth-inline-error" role="alert">{error}</p>}
        <button className="gold-button full-button" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : <><Save size={16}/> {editingId ? 'ذخیره تغییرات' : 'ذخیره خبر'}</>}</button>
        {editingId && <button className="outline-button full-button" type="button" onClick={resetForm} disabled={busy}>لغو ویرایش</button>}
      </form>
      {editingId && versions.length > 0 && <section className="news-version-history"><div className="section-heading"><div><span className="section-kicker">تاریخچه خبر</span><h3>نسخه‌های قبلی</h3></div></div>{versions.map(version=><article className="site-page-version" key={version.id}><div><strong>نسخه {version.version_number.toLocaleString('fa-IR')} · {version.title}</strong><small>{formatIranDateTime(version.created_at)} · {version.status==='draft'?'پیش‌نویس':'منتشرشده'}</small></div><button type="button" className="outline-button" onClick={()=>void restoreVersion(version)} disabled={busy}>بازیابی نسخه</button></article>)}</section>}
    </section>}
    {!featuredOnly && <div className="news-list-heading"><div><span className="section-kicker">تازه‌های PLATO LAND</span><h2>اخبار و اطلاعیه‌ها</h2></div><button type="button" className="outline-button" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/> بروزرسانی</button></div>}
    {loading ? <p className="panel empty-state">در حال دریافت خبرها…</p> : error ? <p className="auth-inline-error" role="alert">{error}</p> : <>
      {featured.length > 0 && <section className="news-featured-section"><div className="section-heading"><div><span className="section-kicker">منتخب</span><h2>خبرهای ویژه</h2></div></div><div className="news-featured-grid">{featured.map(item => <article className="panel news-card news-featured-card" key={item.id}>{item.image_url && <img src={item.image_url} alt="" loading="lazy"/>}<div className="news-card-copy"><small>{item.published_at ? formatIranDateTime(item.published_at) : ''}</small><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}{item.body && <details><summary>ادامه خبر</summary><p className="news-body">{item.body}</p></details>}</div></article>)}</div></section>}
      {!featuredOnly && <section className="news-archive-section"><div className="section-heading"><div><span className="section-kicker">آرشیو</span><h2>همه خبرها</h2></div></div><div className="news-archive-filters"><label>جست‌وجوی خبر<input type="search" value={archiveSearch} onChange={e=>setArchiveSearch(e.target.value)} placeholder="عنوان یا متن خبر"/></label><label>سال شمسی<select value={archiveYear} onChange={e=>setArchiveYear(e.target.value)}><option value="all">همه سال‌ها</option>{archiveYears.map(year=><option key={year} value={year}>{year}</option>)}</select></label></div>{archive.length ? <div className="news-archive-list">{archive.map(item => <article className="panel news-card news-archive-card" key={item.id}>{item.image_url && <img src={item.image_url} alt="" loading="lazy"/>}<div className="news-card-copy"><small>{item.published_at ? formatIranDateTime(item.published_at) : ''}</small><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}{item.body && <details><summary>متن کامل</summary><p className="news-body">{item.body}</p></details>}</div>{owner && <div className="news-admin-actions"><button type="button" className="outline-button" onClick={() => startEdit(item)} disabled={busy}><Pencil size={14}/> ویرایش</button><button type="button" className="reject-button" onClick={() => void remove(item)} disabled={busy}><Trash2 size={14}/> حذف</button></div>}</article>)}</div> : <div className="panel empty-state"><FileText size={28}/><strong>خبری برای نمایش پیدا نشد</strong><span>عبارت جست‌وجو یا فیلتر سال را تغییر بده.</span></div>}</section>}
    </>}
    {!featuredOnly && owner && items.filter(item => item.status === 'draft').length > 0 && <section className="news-drafts-section"><div className="section-heading"><div><span className="section-kicker">خصوصی</span><h2>پیش‌نویس‌ها</h2></div></div>{items.filter(item => item.status === 'draft').map(item => <article className="panel news-draft-row" key={item.id}><div><strong>{item.title}</strong><small>پیش‌نویس · {formatIranDateTime(item.updated_at)}</small></div><button type="button" className="outline-button" onClick={() => startEdit(item)} disabled={busy}><Pencil size={14}/> ویرایش</button><button type="button" className="reject-button" onClick={() => void remove(item)} disabled={busy}><Trash2 size={14}/> حذف</button></article>)}</section>}
  </section>;
}
