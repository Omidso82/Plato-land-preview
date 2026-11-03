import React from 'react';
import './preview.css';

const tournaments = [
  { title: 'مسابقات تخته‌نرد', status: 'نمونه نمایشی', detail: 'اطلاعات این کارت ساختگی است و از دیتابیس خوانده نمی‌شود.' },
  { title: 'رقابت‌های آینده', status: 'در حال طراحی', detail: 'جزئیات مسابقات پس از اتصال امن به داده‌های عمومی نمایش داده خواهد شد.' },
];

export default function PreviewApp() {
  return (
    <div className="pl-preview" dir="rtl">
      <div className="pl-preview-banner">محیط آزمایشی PLATO LAND — داده‌ها نمایشی هستند؛ ثبت‌نام و ورود غیرفعال است.</div>
      <header className="pl-preview-header">
        <a className="pl-preview-brand" href="#home" aria-label="PLATO LAND">
          <span className="pl-preview-crown">♛</span>
          <span><strong>PLATO LAND</strong><small>بازی، رقابت، قهرمانی</small></span>
        </a>
        <nav aria-label="ناوبری اصلی">
          <a href="#home">خانه</a><a href="#competitions">مسابقات</a><a href="#news">اخبار و اطلاعیه‌ها</a><a href="#guide">راهنما</a><a href="#about">درباره ما</a>
        </nav>
      </header>

      <main id="home">
        <section className="pl-preview-hero">
          <div className="pl-preview-copy">
            <span className="pl-preview-kicker">دنیای رقابت‌های PLATO LAND</span>
            <h1>بازی، رقابت، <em>قهرمانی</em></h1>
            <p>جایی برای رقابت منصفانه، تجربه بازی و ثبت لحظه‌های قهرمانی.</p>
            <a className="pl-preview-button" href="#competitions">مشاهده مسابقات</a>
            <small className="pl-preview-note">این نسخه صرفاً پیش‌نمایش طراحی است؛ هیچ عملیاتی روی حساب یا اطلاعات واقعی انجام نمی‌دهد.</small>
          </div>
          <div className="pl-preview-emblem" aria-hidden="true"><span>♛</span><strong>PLATO LAND</strong><small>PLAY • COMPETE • WIN</small></div>
        </section>

        <section className="pl-preview-stats" aria-label="آمار نمایشی">
          <div><strong>—</strong><span>مسابقات فعال</span></div><div><strong>—</strong><span>بازیکنان</span></div><div><strong>—</strong><span>قهرمانان</span></div>
        </section>

        <section className="pl-preview-section" id="competitions">
          <div className="pl-preview-section-heading"><span>رقابت‌ها</span><h2>مسابقات فعال</h2><p>کارت‌های زیر فقط برای نمایش چیدمان هستند و داده واقعی محسوب نمی‌شوند.</p></div>
          <div className="pl-preview-cards">{tournaments.map((item) => <article className="pl-preview-card" key={item.title}><span className="pl-preview-chip">{item.status}</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
        </section>

        <section className="pl-preview-section" id="games">
          <div className="pl-preview-section-heading"><span>دنیای بازی</span><h2>بازی‌ها</h2><p>فضای معرفی بازی‌ها در نسخه نهایی تکمیل خواهد شد.</p></div>
          <div className="pl-preview-card"><h3>تخته‌نرد</h3><p>معرفی رقابت‌ها و رویدادهای مرتبط با بازی.</p></div>
        </section>

        <section className="pl-preview-section" id="champions">
          <div className="pl-preview-section-heading"><span>افتخارآفرینان</span><h2>قهرمانان اخیر</h2></div>
          <div className="pl-preview-card"><p>اطلاعات قهرمانان در این پیش‌نمایش بارگذاری نشده است.</p></div>
        </section>

        <section className="pl-preview-section pl-preview-disabled">
          <div className="pl-preview-section-heading"><span>تالار افتخار</span><h2>Hall of Fame</h2><p>این بخش در حال حاضر غیرفعال است.</p></div>
        </section>

        <section className="pl-preview-section" id="news">
          <div className="pl-preview-section-heading"><span>تازه‌ها</span><h2>اخبار و اطلاعیه‌ها</h2><p>در پیش‌نمایش، خبر واقعی یا اطلاعیه عملیاتی نمایش داده نمی‌شود.</p></div>
        </section>

        <section className="pl-preview-section" id="guide">
          <div className="pl-preview-section-heading"><span>راهنمای استفاده</span><h2>راهنما</h2><p>راهنمای کامل پس از تکمیل آزمون تجربه کاربری منتشر خواهد شد.</p></div>
        </section>
      </main>

      <footer className="pl-preview-footer" id="about">
        <strong>PLATO LAND</strong><p>بازی، رقابت، قهرمانی</p>
        <div><a href="#home">خانه</a><a href="#competitions">مسابقات</a><a href="#news">اخبار و اطلاعیه‌ها</a><a href="#guide">راهنما</a><a href="#about">درباره ما</a></div>
        <small>پیش‌نمایش مستقل — بدون اتصال به دیتابیس عملیاتی</small>
      </footer>
    </div>
  );
}
