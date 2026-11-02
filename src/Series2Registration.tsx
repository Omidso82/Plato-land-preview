import React, { useMemo, useState } from 'react';
import './Series2Registration.css';

const SUPABASE_URL = 'https://dfrppbapaaydbjeflozw.supabase.co';
const slides = Array.from({ length: 18 }, (_, i) => i + 1);

export default function Series2Registration() {
  const [slide, setSlide] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [platoId, setPlatoId] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{type:'success'|'error'; text:string}|null>(null);
  const [finished, setFinished] = useState(false);
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
      <div className="s2reg-notice">شرکت در این پیش‌بینی مخصوص اعضای گروه PLATO LAND است. برای ثبت‌نام، باید عضو و در گروه PLATO LAND فعال باشید. عضویت و فعال بودن شما توسط Owner و مدیریت گروه PLATO LAND بررسی خواهد شد.</div>
      <div className="s2reg-progress"><span>مطالعه قوانین</span><strong>{slide} از ۱۸</strong></div>
      <div className="s2reg-track"><span style={{width: ((slide/18)*100)+'%'}} /></div>
      <div className="s2reg-slide">
        <div className="s2reg-slide-number">اسلاید {String(slide).padStart(2,'0')}</div>
        <div className="s2reg-slide-placeholder"><span className="s2reg-image-icon">▧</span><strong>{slide===18?'پیام پایانی':'قانون '+slide}</strong><p>جایگاه تصویر اصلی این اسلاید</p><small>تصویر ارسالی باید با کیفیت اصلی و بدون برش در این قسمت نمایش داده شود.</small></div>
      </div>
      <div className="s2reg-nav"><button type="button" className="s2reg-secondary" disabled={slide===1} onClick={()=>setSlide(s=>Math.max(1,s-1))}>قبلی</button><button type="button" className="s2reg-primary" onClick={()=>{if(slide<18){setSlide(s=>s+1);setAccepted(false)}else document.getElementById('s2reg-form')?.scrollIntoView({behavior:'smooth'})}}>{slide===18?'ادامه به ثبت‌نام':'قانون بعدی'}</button></div>
      <form id="s2reg-form" className="s2reg-form" onSubmit={submit}>
        <h2>ثبت درخواست شرکت در مسابقات</h2>
        <label className="s2reg-check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} disabled={finished}/><span>تمام ۱۸ اسلاید قوانین را مطالعه کردم و با قوانین نهایی سری دوم موافقم.</span></label>
        <label className="s2reg-label" htmlFor="s2-plato-id">Plato ID</label>
        <input id="s2-plato-id" className="s2reg-input" dir="ltr" autoComplete="off" placeholder="Enter your Plato ID" value={platoId} onChange={e=>setPlatoId(e.target.value)} disabled={finished} maxLength={30}/>
        <p className="s2reg-hint">فقط حروف انگلیسی، اعداد و زیرخط مجاز است.</p>
        <button className="s2reg-submit" type="submit" disabled={!accepted||!validId||sending||finished}>{sending?'در حال ارسال…':finished?'درخواست ارسال شد':'ارسال درخواست ثبت‌نام'}</button>
        {message&&<div role="status" className={'s2reg-message '+message.type}>{message.text}</div>}
      </form>
    </section>
    <footer className="s2reg-footer">© PLATO LAND · Series 2</footer>
  </main>;
}
