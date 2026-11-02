import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import './Series2Registration.css';

const SUPABASE_URL = 'https://dfrppbapaaydbjeflozw.supabase.co';
export default function Series2Registration() {
  const [slide, setSlide] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [platoId, setPlatoId] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{type:'success'|'error'; text:string}|null>(null);
  const [finished, setFinished] = useState(false);
  const [slideImages, setSlideImages] = useState<Record<number,string>>({});
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase.storage.from('series2-slides').list('slides', { limit: 30, sortBy: { column: 'name', order: 'asc' } });
      if (!active || !data) return;
      const next: Record<number,string> = {};
      // Canonical keys (01 ... 18) always win; legacy extension-based files are fallback only.
      for (const file of data) {
        const canonical = /^(\d{2})$/i.exec(file.name);
        const legacy = /^(\d{2})\.(jpe?g|png|webp)$/i.exec(file.name);
        if (!canonical && !legacy) continue;
        const number = Number((canonical || legacy)![1]);
        if (canonical || !next[number]) {
          next[number] = supabase.storage.from('series2-slides').getPublicUrl('slides/' + file.name).data.publicUrl;
        }
      }
      setSlideImages(next);
    };
    void load();
    return () => { active = false; };
  }, []);
  const validId = useMemo(() => /^[A-Za-z0-9_]{2,30}$/.test(platoId.trim()), [platoId]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!accepted || !validId || sending) return;
    setSending(true);
    try {
      const response = await fetch(SUPABASE_URL + '/functions/v1/plato-land-series2-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platoId: platoId.trim(), rulesAccepted: true })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 409 ? 'این Plato ID قبلاً درخواست ثبت‌نام ارسال کرده است.' : (result.error || result.message || 'ارسال درخواست انجام نشد. دوباره تلاش کنید.'));
      setFinished(true);
      setMessage({type:'success', text:'درخواست ثبت‌نام شما با موفقیت ارسال شد و برای بررسی در اختیار مدیریت قرار گرفت. نتیجه بررسی توسط مدیریت در گروه PLATO LAND اعلام خواهد شد.'});
    } catch (err) {
      setMessage({type:'error', text: err instanceof Error ? err.message : 'خطا در ارتباط با سرور.'});
    } finally { setSending(false); }
  };
  return <main className="s2reg" dir="rtl">
    <header className="s2reg-head"><div className="s2reg-crown">♛</div><div className="s2reg-brand">PLATO <b>LAND</b></div><div className="s2reg-tag">بازی، رقابت، قهرمانی</div></header>
    <section className="s2reg-panel">
      <div className="s2reg-kicker">PLATO LAND · BACKGAMMON</div>
      <h1>ثبت‌نام سری دوم لیگ تخته‌نرد</h1>
      <p className="s2reg-intro">برای ثبت درخواست، ابتدا قوانین مسابقات را تا پایان مطالعه کنید و سپس Plato ID خود را وارد کنید.</p>
      <div className="s2reg-progress"><span>مطالعه قوانین</span><strong>{slide} از ۱۸</strong></div>
      <div className="s2reg-track"><span style={{width: ((slide/18)*100)+'%'}} /></div>
      <div className="s2reg-slide">
        <div className="s2reg-slide-number">اسلاید {String(slide).padStart(2,'0')}</div>
        {slideImages[slide] ? <img className="s2reg-slide-image" src={slideImages[slide]} alt={'اسلاید '+slide} /> : <div className="s2reg-slide-placeholder"><strong>{slide===18?'پیام پایانی':'قانون '+slide}</strong><p>تصویر این اسلاید هنوز بارگذاری نشده است.</p></div>}
      </div>
      <div className="s2reg-nav"><button type="button" className="s2reg-secondary" disabled={slide===1} onClick={()=>setSlide(s=>Math.max(1,s-1))}>قبلی</button>{slide<18&&<button type="button" className="s2reg-primary" onClick={()=>{setSlide(s=>Math.min(18,s+1));setAccepted(false)}}>قانون بعدی</button>}</div>
      {slide===18&&<form id="s2reg-form" className="s2reg-form" onSubmit={submit}>
        <h2>ثبت درخواست شرکت در مسابقات</h2>
        <label className="s2reg-check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} disabled={finished||slide!==18}/><span>تمام ۱۸ اسلاید قوانین را مطالعه کردم و با قوانین نهایی سری دوم موافقم.</span></label>
        <label className="s2reg-label" htmlFor="s2-plato-id">Plato ID</label>
        <input id="s2-plato-id" className="s2reg-input" dir="ltr" autoComplete="off" placeholder="Enter your Plato ID" value={platoId} onChange={e=>setPlatoId(e.target.value)} disabled={finished} maxLength={30}/>
        <p className="s2reg-hint">فقط حروف انگلیسی، اعداد و زیرخط مجاز است.</p>
        <button className="s2reg-submit" type="submit" disabled={!accepted||!validId||sending||finished}>{sending?'در حال ارسال…':finished?'درخواست ارسال شد':'ارسال درخواست ثبت‌نام'}</button>
        {message&&<div role="status" className={'s2reg-message '+message.type}>{message.text}</div>}
      </form>}
    </section>
    <footer className="s2reg-footer">© PLATO LAND · Series 2</footer>
  </main>;
}
