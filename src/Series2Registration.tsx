import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import './Series2Registration.css';

export default function Series2Registration() {
  const [slide, setSlide] = useState(1);
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
        const canonical = /^(\\d{2})$/i.exec(file.name);
        const legacy = /^(\\d{2})\\.(jpe?g|png|webp)$/i.exec(file.name);
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
  return <main className="s2reg" dir="rtl">
    <header className="s2reg-head"><div className="s2reg-crown">♛</div><div className="s2reg-brand">PLATO <b>LAND</b></div><div className="s2reg-tag">بازی، رقابت، قهرمانی</div></header>
    <section className="s2reg-panel">
      <div className="s2reg-kicker">PLATO LAND · BACKGAMMON</div>
      <h1>ظرفیت ثبت‌نام تکمیل شد</h1>
      <p className="s2reg-intro">ظرفیت ثبت‌نام سری دوم لیگ تخته‌نرد تکمیل شده و مهلت ثبت‌نام به پایان رسیده است. در حال حاضر امکان ثبت درخواست جدید وجود ندارد.</p>
      <div className="s2reg-progress"><span>مرور قوانین مسابقات</span><strong>{slide} از ۱۸</strong></div>
      <div className="s2reg-track"><span style={{width: ((slide/18)*100)+'%'}} /></div>
      <div className="s2reg-slide">
        <div className="s2reg-slide-number">اسلاید {String(slide).padStart(2,'0')}</div>
        {slideImages[slide] ? <img className="s2reg-slide-image" src={slideImages[slide]} alt={'اسلاید '+slide} /> : <div className="s2reg-slide-placeholder"><strong>{slide===18?'پیام پایانی':'قانون '+slide}</strong><p>تصویر این اسلاید هنوز بارگذاری نشده است.</p></div>}
      </div>
      <div className="s2reg-nav"><button type="button" className="s2reg-secondary" disabled={slide===1} onClick={()=>setSlide(s=>Math.max(1,s-1))}>قبلی</button>{slide<18&&<button type="button" className="s2reg-primary" onClick={()=>setSlide(s=>Math.min(18,s+1))}>قانون بعدی</button>}</div>
      {slide===18&&<section id="s2reg-form" className="s2reg-form" aria-label="ثبت‌نام بسته است">
        <h2>ثبت‌نام بسته است</h2>
        <div className="s2reg-closed-notice" role="status">ظرفیت ثبت‌نام تکمیل شده است؛ امکان ارسال درخواست جدید وجود ندارد.</div>
        <label className="s2reg-label" htmlFor="s2-plato-id">Plato ID</label>
        <input id="s2-plato-id" className="s2reg-input" dir="ltr" autoComplete="off" placeholder="ثبت‌نام به پایان رسیده است" value="" disabled readOnly />
        <button className="s2reg-submit" type="button" disabled>ثبت‌نام به پایان رسیده است</button>
      </section>}
    </section>
    <footer className="s2reg-footer">© PLATO LAND · Series 2</footer>
  </main>;
}
