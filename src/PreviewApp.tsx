import React, { useState } from 'react';
import './preview.css';

const navItems = [
  { label: 'صفحه اصلی', href: '/' },
  { label: 'مسابقات', href: '/competitions' },
  { label: 'اخبار و اطلاعیه‌ها', href: '/news' },
  { label: 'راهنما', href: '/guide' },
];

function PreviewBanner() {
  return <div className="pl-preview-banner">محیط آزمایشی PLATO LAND — اطلاعات نمایشی است؛ ورود، ثبت‌نام و عملیات واقعی غیرفعال‌اند.</div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'pl-brand pl-brand-compact' : 'pl-brand pl-brand-home'}>
      <a href="/" aria-label="PLATO LAND — صفحه اصلی">
        <img src="/plato-land-logo.jpg" alt="لوگوی PLATO LAND" />
      </a>
      <p>بازی، رقابت، قهرمانی</p>
    </div>
  );
}

function Header({ home = false }: { home?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className={home ? 'pl-site-header pl-site-header-home' : 'pl-site-header pl-site-header-inner'}>
      {!home && <Brand compact />}
      <div className="pl-nav-shell">
        <button
          type="button"
          className="pl-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="pl-primary-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="pl-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>
          <span>منو</span>
        </button>
        <nav id="pl-primary-navigation" className={menuOpen ? 'pl-primary-nav is-open' : 'pl-primary-nav'} aria-label="منوی اصلی">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
          ))}
          <a className="pl-auth-link" href="/login-register" onClick={() => setMenuOpen(false)}>ورود / ثبت‌نام</a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="pl-preview-footer">
      <strong>PLATO LAND</strong>
      <p>بازی، رقابت، قهرمانی</p>
      <nav aria-label="پیوندهای پایین صفحه">
        <a href="/">صفحه اصلی</a>
        <a href="/competitions">مسابقات</a>
        <a href="/news">اخبار و اطلاعیه‌ها</a>
        <a href="/guide">راهنما</a>
        <a href="/about">درباره ما</a>
      </nav>
      <small>پیش‌نمایش مستقل — بدون اتصال به دیتابیس عملیاتی</small>
    </footer>
  );
}

function HomePage() {
  return (
    <>
      <Header home />
      <main>
        <section className="pl-home-hero">
          <Brand />
          <div className="pl-home-copy">
            <h1>بازی، رقابت، <em>قهرمانی</em></h1>
            <p>جایی برای رقابت منصفانه، تجربه بازی و ثبت لحظه‌های قهرمانی.</p>
            <a className="pl-primary-button" href="/competitions">مشاهده مسابقات</a>
            <small>این نسخه صرفاً پیش‌نمایش طراحی است و هیچ عملیاتی روی حساب یا اطلاعات واقعی انجام نمی‌دهد.</small>
          </div>
        </section>
        <section className="pl-preview-stats" aria-label="آمار">
          <div><strong>—</strong><span>مسابقات فعال</span></div>
          <div><strong>—</strong><span>بازیکنان</span></div>
          <div><strong>—</strong><span>قهرمانان</span></div>
        </section>
        <section className="pl-content-section">
          <div className="pl-section-heading"><span>رقابت‌ها</span><h2>مسابقات فعال</h2><p>اطلاعات واقعی مسابقات در این پیش‌نمایش بارگذاری نمی‌شود.</p></div>
          <div className="pl-preview-cards">
            <article className="pl-preview-card"><span className="pl-preview-chip">نمونه نمایشی</span><h3>مسابقات تخته‌نرد</h3><p>این کارت فقط برای نمایش ساختار صفحه است و داده واقعی محسوب نمی‌شود.</p></article>
            <article className="pl-preview-card"><span className="pl-preview-chip">در حال طراحی</span><h3>رقابت‌های آینده</h3><p>جزئیات مسابقات پس از تکمیل بخش عمومی نمایش داده خواهد شد.</p></article>
          </div>
        </section>
        <section className="pl-content-section">
          <div className="pl-section-heading"><span>دنیای بازی</span><h2>بازی‌ها</h2><p>معرفی بازی‌ها بخشی از محتوای صفحه اصلی است، نه گزینه‌ای مستقل در منوی بالا.</p></div>
          <article className="pl-preview-card"><h3>تخته‌نرد</h3><p>فضای معرفی رقابت‌ها و رویدادهای مرتبط با بازی.</p></article>
        </section>
        <section className="pl-content-section">
          <div className="pl-section-heading"><span>افتخارآفرینان</span><h2>قهرمانان اخیر</h2></div>
          <article className="pl-preview-card"><p>اطلاعات قهرمانان در این پیش‌نمایش بارگذاری نشده است.</p></article>
        </section>
        <section className="pl-content-section pl-section-disabled">
          <div className="pl-section-heading"><span>تالار افتخار</span><h2>Hall of Fame</h2><p>این بخش در حال حاضر غیرفعال است.</p></div>
        </section>
        <section className="pl-content-section">
          <div className="pl-section-heading"><span>تازه‌ها</span><h2>اخبار و اطلاعیه‌ها</h2><p>برای مشاهده صفحه مستقل اخبار از منوی اصلی استفاده کنید.</p></div>
          <a className="pl-text-link" href="/news">رفتن به اخبار و اطلاعیه‌ها ←</a>
        </section>
      </main>
      <Footer />
    </>
  );
}

function InnerPage({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children?: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pl-inner-main">
        <div className="pl-breadcrumb"><a href="/">صفحه اصلی</a><span>/</span><span>{title}</span></div>
        <section className="pl-inner-intro">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>
        {children}
      </main>
      <Footer />
    </>
  );
}

function CompetitionsPage() {
  return <InnerPage title="مسابقات" eyebrow="رقابت‌های PLATO LAND" description="در این صفحه، فهرست مسابقات و وضعیت آن‌ها نمایش داده می‌شود. در این نسخه پیش‌نمایش، اطلاعات عملیاتی بارگذاری نشده است.">
    <section className="pl-preview-cards">
      <article className="pl-preview-card"><span className="pl-preview-chip">پیش‌نمایش</span><h2>مسابقات فعال</h2><p>در حال حاضر داده واقعی مسابقات به این محیط متصل نیست.</p></article>
      <article className="pl-preview-card"><span className="pl-preview-chip">پیش‌نمایش</span><h2>مسابقات آینده</h2><p>پس از تکمیل طراحی و اتصال مجاز داده‌ها نمایش داده خواهد شد.</p></article>
    </section>
  </InnerPage>;
}

function NewsPage() {
  return <InnerPage title="اخبار و اطلاعیه‌ها" eyebrow="تازه‌های PLATO LAND" description="خبرها و اطلاعیه‌های رسمی پلتفرم در این بخش گردآوری می‌شوند.">
    <article className="pl-preview-card pl-empty-state"><h2>هنوز خبری برای نمایش وجود ندارد</h2><p>این یک وضعیت خالی در محیط Preview است؛ هیچ خبر ساختگی یا اطلاعیه عملیاتی نمایش داده نمی‌شود.</p></article>
  </InnerPage>;
}

function GuidePage() {
  return <InnerPage title="راهنما" eyebrow="راهنمای استفاده" description="راهنمای آشنایی با مسابقات، مراحل شرکت و بخش‌های مختلف PLATO LAND.">
    <div className="pl-guide-list">
      <article className="pl-preview-card"><h2>آشنایی با مسابقات</h2><p>اطلاعات هر رقابت، شرایط شرکت و مراحل آن در صفحه اختصاصی همان مسابقه ارائه می‌شود.</p></article>
      <article className="pl-preview-card"><h2>ثبت‌نام و حساب کاربری</h2><p>فرایند واقعی ورود و ثبت‌نام در این محیط آزمایشی فعال نیست.</p></article>
      <article className="pl-preview-card"><h2>قوانین و پشتیبانی</h2><p>قوانین هر مسابقه در صفحه مربوط به همان رقابت منتشر خواهد شد.</p></article>
    </div>
  </InnerPage>;
}

function AboutPage() {
  return <InnerPage title="درباره ما" eyebrow="درباره PLATO LAND" description="PLATO LAND بستری برای بازی، رقابت منصفانه و ثبت لحظه‌های قهرمانی است.">
    <article className="pl-preview-card"><h2>بازی، رقابت، قهرمانی</h2><p>این صفحه مستقل است و مطابق تصمیم طراحی، پیوند آن فقط در پایین صفحات قرار دارد و در منوی بالای سایت نمایش داده نمی‌شود.</p></article>
  </InnerPage>;
}

function LoginRegisterPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  return <InnerPage title="ورود / ثبت‌نام" eyebrow="حساب کاربری" description="دو فرایند ورود و ثبت‌نام مستقل هستند؛ در این محیط Preview هیچ حساب واقعی ساخته یا بررسی نمی‌شود.">
    <section className="pl-auth-panel">
      <div className="pl-auth-tabs" role="tablist" aria-label="انتخاب فرم">
        <button type="button" role="tab" aria-selected={activeTab === 'login'} className={activeTab === 'login' ? 'active' : ''} onClick={() => setActiveTab('login')}>ورود</button>
        <button type="button" role="tab" aria-selected={activeTab === 'register'} className={activeTab === 'register' ? 'active' : ''} onClick={() => setActiveTab('register')}>ثبت‌نام</button>
      </div>
      {activeTab === 'login' ? (
        <div className="pl-auth-placeholder" role="tabpanel"><h2>فرم ورود</h2><p>فرم ورود در نسخه عملیاتی به‌صورت مستقل ارائه می‌شود. برای جلوگیری از ارسال اطلاعات واقعی، این فرم در Preview غیرفعال است.</p></div>
      ) : (
        <div className="pl-auth-placeholder" role="tabpanel"><h2>فرم ثبت‌نام</h2><p>فرم ثبت‌نام مستقل از ورود است و فیلدهای مخصوص خود را خواهد داشت. ثبت‌نام در Preview غیرفعال است.</p></div>
      )}
      <span className="pl-preview-chip">غیرفعال در محیط آزمایشی</span>
    </section>
  </InnerPage>;
}

export default function PreviewApp() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  let page: React.ReactNode;
  switch (path) {
    case '/': page = <HomePage />; break;
    case '/competitions': page = <CompetitionsPage />; break;
    case '/news': page = <NewsPage />; break;
    case '/guide': page = <GuidePage />; break;
    case '/about': page = <AboutPage />; break;
    case '/login-register': page = <LoginRegisterPage />; break;
    default: page = <InnerPage title="صفحه پیدا نشد" eyebrow="۴۰۴" description="صفحه موردنظر پیدا نشد."><a className="pl-primary-button" href="/">بازگشت به صفحه اصلی</a></InnerPage>;
  }
  return <div className="pl-preview" dir="rtl"><PreviewBanner />{page}</div>;
}
