import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime } from './iranDate';
import { BookOpen, Crown, FileText, Medal, Pencil, Plus, Save, ShieldCheck, Trash2, Trophy, Users } from 'lucide-react';

type PageSection = { heading: string; body: string };
type PageContent = { intro: string; sections: PageSection[] };
type PageSlug = 'about' | 'guide';

const defaults: Record<PageSlug, { title: string; content: PageContent }> = {
  about: {
    title: 'PLATO LAND؛ بازی، رقابت، قهرمانی',
    content: {
      intro: 'فضایی برای برگزاری مسابقات منظم بازی‌های Plato، با قوانین روشن و رقابتی دوستانه.',
      sections: [
        { heading: 'هدف ما', body: 'ایجاد بستری منظم برای رقابت در بازی‌های مختلف Plato؛ جایی که بازیکنان بتوانند در مسابقاتی برنامه‌ریزی‌شده شرکت کنند و تجربه‌ای جذاب و منصفانه داشته باشند.' },
        { heading: 'مأموریت و ارزش‌ها', body: 'نظم، عدالت، شفافیت و مسئولیت‌پذیری پایهٔ فعالیت PLATO LAND هستند. قوانین مسابقات پیش از رقابت اعلام می‌شوند و نتایج پس از ثبت و تأیید، در دسترس قرار می‌گیرند.' },
        { heading: 'مدیریت و برگزاری', body: 'مسابقات توسط مالک سایت و مدیران اختصاصی هر رقابت اداره می‌شوند. فرایند ثبت‌نام، بررسی درخواست‌ها و ثبت نتایج مطابق قوانین همان مسابقه انجام می‌شود.' },
        { heading: 'قهرمانی', body: 'پس از پایان مسابقه و تأیید نتایج، قهرمان آن رقابت معرفی می‌شود و سوابق مسابقات برای مراجعهٔ بازیکنان حفظ خواهد شد.' }
      ]
    }
  },
  guide: {
    title: 'راهنمای استفاده از PLATO LAND',
    content: {
      intro: 'برای شرکت در مسابقات، مراحل زیر را دنبال کن.',
      sections: [
        { heading: 'ساخت حساب و ورود', body: 'از بخش ورود یا ثبت‌نام، حساب کاربری بساز و با ایمیل و رمز عبور وارد شو.' },
        { heading: 'پیدا کردن مسابقه', body: 'به صفحهٔ مسابقات برو و مسابقهٔ موردنظر، بازی، ظرفیت و وضعیت ثبت‌نام را بررسی کن.' },
        { heading: 'خواندن قوانین', body: 'پیش از ارسال درخواست، قوانین کامل همان مسابقه و شرایط شرکت را با دقت بخوان.' },
        { heading: 'ارسال درخواست ثبت‌نام', body: 'نام نمایشی و Plato ID را وارد کن، پذیرش قوانین را تأیید کن و اگر برگزارکننده درخواست کرده باشد تصویر کامل پروفایل Plato را بارگذاری کن.' },
        { heading: 'پیگیری وضعیت درخواست', body: 'پس از ورود، از بخش حساب بازیکن وضعیت ثبت‌نام‌ها و سوابق مسابقاتت را پیگیری کن.' },
        { heading: 'مشاهدهٔ نتایج', body: 'نتایج و سوابق مسابقات پس از ثبت و انتشار رسمی در صفحهٔ مربوط به مسابقه نمایش داده می‌شوند.' }
      ]
    }
  }
};

const sectionIcons = [Crown, Trophy, Users, Medal, BookOpen, ShieldCheck];

export default function SitePages({ slug, owner = false }: { slug: PageSlug; owner?: boolean }) {
  const fallback = defaults[slug];
  const [title, setTitle] = useState(fallback.title);
  const [intro, setIntro] = useState(fallback.content.intro);
  const [sections, setSections] = useState<PageSection[]>(fallback.content.sections);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); setError('اتصال به پایگاه داده برقرار نیست.'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: loadError } = await supabase.from('site_pages').select('slug,title,content,status,updated_at').eq('slug', slug).maybeSingle();
      if (loadError) throw loadError;
      if (data) {
        const content = data.content as Partial<PageContent>;
        setTitle(data.title || fallback.title);
        setIntro(typeof content?.intro === 'string' ? content.intro : fallback.content.intro);
        setSections(Array.isArray(content?.sections) ? content.sections.filter((item: any) => item && typeof item.heading === 'string' && typeof item.body === 'string') : fallback.content.sections);
        setStatus(data.status === 'draft' ? 'draft' : 'published');
        setUpdatedAt(data.updated_at || '');
      } else {
        setTitle(fallback.title);
        setIntro(fallback.content.intro);
        setSections(fallback.content.sections);
        setStatus('published');
        setUpdatedAt('');
      }
    } catch (e: any) {
      setError(e?.message || 'بارگذاری محتوای صفحه ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }, [slug, fallback]);

  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!owner || !supabase) return;
    if (!title.trim() || !intro.trim() || sections.some(section => !section.heading.trim() || !section.body.trim())) {
      setError('عنوان، مقدمه و عنوان و متن تمام بخش‌ها الزامی است.');
      return;
    }
    setBusy(true); setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('نشست مالک معتبر نیست.');
      const { error: saveError } = await supabase.from('site_pages').upsert({
        slug, title: title.trim(), content: { intro: intro.trim(), sections: sections.map(section => ({ heading: section.heading.trim(), body: section.body.trim() })) },
        status, updated_by: user.id, updated_at: new Date().toISOString()
      }, { onConflict: 'slug' });
      if (saveError) throw saveError;
      setEditing(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'ذخیره محتوای صفحه ناموفق بود.');
    } finally {
      setBusy(false);
    }
  }

  function cancelEdit() { setEditing(false); void load(); }

  const pageTitle = slug === 'about' ? 'دربارهٔ PLATO LAND' : 'راهنمای PLATO LAND';
  if (loading) return <div className="page inner-page"><p className="panel empty-state">در حال دریافت محتوای صفحه…</p></div>;
  if (!owner && status === 'draft') return <div className="page inner-page"><p className="panel empty-state">این صفحه در حال به‌روزرسانی است.</p></div>;

  return <div className="page inner-page site-page-editor">
    <div className="site-page-heading"><div><span className="section-kicker">{pageTitle}</span><h1>{title}</h1><p>{intro}</p>{updatedAt && <small>آخرین ویرایش: {formatIranDateTime(updatedAt)}</small>}</div>{owner && <button type="button" className="outline-button" onClick={() => setEditing(value => !value)}><Pencil size={15}/>{editing ? 'بستن ویرایش' : 'ویرایش محتوا'}</button>}</div>
    {error && <p className="auth-inline-error" role="alert">{error}</p>}
    {owner && editing && <section className="panel site-page-admin"><div className="admin-toolbar"><div><span className="section-kicker">ویرایش صفحه</span><h2>{slug === 'about' ? 'محتوای درباره ما' : 'مراحل راهنما'}</h2><p>تغییرات در دیتابیس اصلی ذخیره می‌شوند؛ پیش‌نویس فقط برای مالک قابل مشاهده است.</p></div><FileText size={22}/></div><form className="form-panel" onSubmit={save}>
      <label>عنوان صفحه<input maxLength={160} required value={title} onChange={e => setTitle(e.target.value)}/></label>
      <label>مقدمه<textarea rows={3} required value={intro} onChange={e => setIntro(e.target.value)}/></label>
      {sections.map((section, index) => <section className="site-page-section-editor" key={index}><div className="section-heading"><strong>بخش {index + 1}</strong><button type="button" className="reject-button" onClick={() => setSections(old => old.filter((_, i) => i !== index))} disabled={sections.length <= 1}><Trash2 size={14}/> حذف بخش</button></div><label>عنوان بخش<input required value={section.heading} onChange={e => setSections(old => old.map((item, i) => i === index ? { ...item, heading: e.target.value } : item))}/></label><label>متن بخش<textarea required rows={3} value={section.body} onChange={e => setSections(old => old.map((item, i) => i === index ? { ...item, body: e.target.value } : item))}/></label></section>)}
      <button type="button" className="outline-button full-button" onClick={() => setSections(old => [...old, { heading: '', body: '' }])}><Plus size={15}/> افزودن بخش</button>
      <label>وضعیت صفحه<select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')}><option value="published">منتشرشده</option><option value="draft">پیش‌نویس خصوصی</option></select></label>
      <button type="submit" className="gold-button full-button" disabled={busy}>{busy ? 'در حال ذخیره…' : <><Save size={16}/> ذخیره صفحه</>}</button>
      <button type="button" className="outline-button full-button" onClick={cancelEdit} disabled={busy}>لغو تغییرات</button>
    </form></section>}
    {slug === 'guide' ? <div className="guide-steps">{sections.map((section, index) => <section className="panel guide-step" key={index}><span>{(index + 1).toLocaleString('fa-IR')}</span><div><h2>{section.heading}</h2><p>{section.body}</p></div></section>)}</div> : <div className="public-info-grid">{sections.map((section, index) => { const Icon = sectionIcons[index % sectionIcons.length]; return <section className="panel public-info-card" key={index}><Icon/><h2>{section.heading}</h2><p>{section.body}</p></section>; })}</div>}
  </div>;
}
