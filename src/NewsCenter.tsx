import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime } from './iranDate';
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
  created_at: string;
  updated_at: string;
};

const emptyForm = { title: '', summary: '', body: '', image_url: '', status: 'draft' as 'draft' | 'published', featured: false };

export default function NewsCenter({ owner = false, featuredOnly = false }: { owner?: boolean; featuredOnly?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!supabase) { setError('اتصال به پایگاه داده برقرار نیست.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      let query = supabase.from('site_news').select('id,title,summary,body,image_url,status,featured,featured_starts_at,featured_ends_at,published_at,created_at,updated_at');
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
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('site-news-publication')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_news' }, () => void load())
      .subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [load]);

  const now = Date.now();
  const featured = useMemo(() => items.filter(item =>
    item.status === 'published' && item.featured &&
    (!item.featured_starts_at || new Date(item.featured_starts_at).getTime() <= now) &&
    (!item.featured_ends_at || new Date(item.featured_ends_at).getTime() > now)
  ), [items, now]);
  const archive = useMemo(() => items.filter(item => item.status === 'published'), [items]);
  if (featuredOnly && !loading && (error || featured.length === 0)) return null;

  function startEdit(item: NewsItem) {
    setEditingId(item.id);
    setForm({ title: item.title, summary: item.summary || '', body: item.body || '', image_url: item.image_url || '', status: item.status, featured: item.featured });
    setError('');
  }

  function resetForm() { setEditingId(''); setForm(emptyForm); setError(''); }

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
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        body: form.body.trim(),
        image_url: form.image_url.trim() || null,
        status: form.status,
        featured: form.featured,
        published_at: form.status === 'published' ? (current?.published_at || new Date().toISOString()) : null,
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
        <label className="check-row"><input type="checkbox" checked={form.featured} onChange={e => setForm(v => ({ ...v, featured: e.target.checked }))}/><span>نمایش به‌عنوان خبر ویژه</span></label>
        {error && <p className="auth-inline-error" role="alert">{error}</p>}
        <button className="gold-button full-button" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : <><Save size={16}/> {editingId ? 'ذخیره تغییرات' : 'ذخیره خبر'}</>}</button>
        {editingId && <button className="outline-button full-button" type="button" onClick={resetForm} disabled={busy}>لغو ویرایش</button>}
      </form>
    </section>}
    {!featuredOnly && <div className="news-list-heading"><div><span className="section-kicker">تازه‌های PLATO LAND</span><h2>اخبار و اطلاعیه‌ها</h2></div><button type="button" className="outline-button" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/> بروزرسانی</button></div>}
    {loading ? <p className="panel empty-state">در حال دریافت خبرها…</p> : error ? <p className="auth-inline-error" role="alert">{error}</p> : <>
      {featured.length > 0 && <section className="news-featured-section"><div className="section-heading"><div><span className="section-kicker">منتخب</span><h2>خبرهای ویژه</h2></div></div><div className="news-featured-grid">{featured.map(item => <article className="panel news-card news-featured-card" key={item.id}>{item.image_url && <img src={item.image_url} alt="" loading="lazy"/>}<div className="news-card-copy"><small>{item.published_at ? formatIranDateTime(item.published_at) : ''}</small><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}{item.body && <details><summary>ادامه خبر</summary><p className="news-body">{item.body}</p></details>}</div></article>)}</div></section>}
      {!featuredOnly && <section className="news-archive-section"><div className="section-heading"><div><span className="section-kicker">آرشیو</span><h2>همه خبرها</h2></div></div>{archive.length ? <div className="news-archive-list">{archive.map(item => <article className="panel news-card news-archive-card" key={item.id}>{item.image_url && <img src={item.image_url} alt="" loading="lazy"/>}<div className="news-card-copy"><small>{item.published_at ? formatIranDateTime(item.published_at) : ''}</small><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}{item.body && <details><summary>متن کامل</summary><p className="news-body">{item.body}</p></details>}</div>{owner && <div className="news-admin-actions"><button type="button" className="outline-button" onClick={() => startEdit(item)} disabled={busy}><Pencil size={14}/> ویرایش</button><button type="button" className="reject-button" onClick={() => void remove(item)} disabled={busy}><Trash2 size={14}/> حذف</button></div>}</article>)}</div> : <div className="panel empty-state"><FileText size={28}/><strong>هنوز خبر منتشرشده‌ای وجود ندارد</strong><span>به‌محض انتشار خبر رسمی، اینجا در دسترس خواهد بود.</span></div>}</section>}
    </>}
    {!featuredOnly && owner && items.filter(item => item.status === 'draft').length > 0 && <section className="news-drafts-section"><div className="section-heading"><div><span className="section-kicker">خصوصی</span><h2>پیش‌نویس‌ها</h2></div></div>{items.filter(item => item.status === 'draft').map(item => <article className="panel news-draft-row" key={item.id}><div><strong>{item.title}</strong><small>پیش‌نویس · {formatIranDateTime(item.updated_at)}</small></div><button type="button" className="outline-button" onClick={() => startEdit(item)} disabled={busy}><Pencil size={14}/> ویرایش</button><button type="button" className="reject-button" onClick={() => void remove(item)} disabled={busy}><Trash2 size={14}/> حذف</button></article>)}</section>}
  </section>;
}
