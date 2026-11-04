import React, { useEffect, useState } from 'react';
import './preview.css';
import { supabase } from './supabase';

const navItems = [
  { label: 'خانه', href: '/' },
  { label: 'مسابقات', href: '/competitions' },
  { label: 'اخبار و اطلاعیه‌ها', href: '/news' },
  { label: 'راهنما', href: '/guide' },
];

function PreviewBanner() {
  const [connection, setConnection] = useState<'checking' | 'connected' | 'failed'>('checking');

  useEffect(() => {
    let active = true;
    const verifyStaging = async () => {
      if (!supabase) {
        if (active) setConnection('failed');
        return;
      }
      const { data, error } = await supabase.rpc('preview_connection_check');
      if (!active) return;
      setConnection(!error && data?.status === 'ok' && data?.environment === 'staging' ? 'connected' : 'failed');
    };
    void verifyStaging();
    return () => { active = false; };
  }, []);

  const message = connection === 'connected'
    ? 'اتصال مرورگر به دیتابیس آزمایشی Staging برقرار است.'
    : connection === 'failed'
      ? 'اتصال مرورگر به دیتابیس آزمایشی تأیید نشد؛ وضعیت فنی در حال بررسی است.'
      : 'در حال بررسی اتصال مرورگر به دیتابیس آزمایشی…';

  return (
    <div className="pl-preview-banner" role="status" aria-live="polite">
      محیط آزمایشی PLATO LAND — {message} ورود حساب‌های آزمایشی فعال است؛ ثبت‌نام و عملیات مسابقات تا پایان QA غیرفعال‌اند.
    </div>
  );
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
  return (
    <header className={home ? 'pl-site-header pl-site-header-home' : 'pl-site-header pl-site-header-inner'}>
      {!home && <Brand compact />}
      <div className="pl-nav-shell">
        <nav id="pl-primary-navigation" className="pl-primary-nav" aria-label="منوی اصلی">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
          <a className="pl-auth-link" href="/login-register">ورود / ثبت‌نام</a>
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
            <small>این نسخه آزمایشی فقط به دیتابیس Staging متصل است و به دیتابیس اصلی دسترسی ندارد.</small>
          </div>
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; plato_id: string | null } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const loadAccount = async (user: { id: string; email?: string } | null) => {
      if (!active) return;
      setSessionUser(user);
      setProfile(null);
      setRole(null);
      if (!user) return;
      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase.from('profiles').select('display_name, plato_id').eq('id', user.id).maybeSingle(),
        supabase.rpc('current_user_role'),
      ]);
      if (!active) return;
      setProfile(profileData ?? null);
      setRole(roleData ?? 'player');
    };
    void supabase.auth.getSession().then(({ data }) => loadAccount(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAccount(session?.user ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setMessage('ورود انجام نشد. ایمیل و رمز عبور را بررسی کن و دوباره تلاش کن.');
      return;
    }
    setPassword('');
    setMessage('ورود موفق بود؛ اطلاعات حساب از Staging بارگذاری شد.');
  };

  const handleLogout = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    setMessage(error ? 'خروج انجام نشد؛ دوباره تلاش کن.' : 'از حساب خارج شدی.');
  };

  return <InnerPage title="ورود / ثبت‌نام" eyebrow="حساب کاربری" description="ورود آزمایشی به حساب‌های موجود در دیتابیس Staging فعال است. ثبت‌نام جدید تا تکمیل تنظیمات امنیتی و QA غیرفعال می‌ماند.">
    <section className="pl-auth-panel">
      <div className="pl-auth-tabs" role="tablist" aria-label="انتخاب فرم">
        <button type="button" role="tab" aria-selected={activeTab === 'login'} className={activeTab === 'login' ? 'active' : ''} onClick={() => { setActiveTab('login'); setMessage(''); }}>ورود</button>
        <button type="button" role="tab" aria-selected={activeTab === 'register'} className={activeTab === 'register' ? 'active' : ''} onClick={() => { setActiveTab('register'); setMessage(''); }}>ثبت‌نام</button>
      </div>
      {sessionUser ? (
        <div className="pl-auth-placeholder" role="status">
          <h2>ورود موفق</h2>
          <p>ایمیل: {sessionUser.email}</p>
          <p>نام نمایشی: {profile?.display_name ?? 'هنوز ثبت نشده'}</p>
          <p>Plato ID: {profile?.plato_id ?? 'هنوز ثبت نشده'}</p>
          <p>نقش در Staging: {role ?? 'در حال بررسی'}</p>
          <button className="pl-primary-button" type="button" onClick={handleLogout} disabled={busy}>{busy ? 'لطفاً صبر کن…' : 'خروج از حساب'}</button>
        </div>
      ) : activeTab === 'login' ? (
        <form className="pl-auth-form" onSubmit={handleLogin}>
          <h2>ورود به حساب آزمایشی</h2>
          <label htmlFor="pl-login-email">آدرس ایمیل</label>
          <input id="pl-login-email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="pl-login-password">رمز عبور</label>
          <input id="pl-login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button className="pl-primary-button" type="submit" disabled={busy || !supabase}>{busy ? 'در حال ورود…' : 'ورود'}</button>
          {message && <p className="pl-auth-message" role="status">{message}</p>}
          <p className="pl-auth-note">این فرم فقط به پروژه Staging متصل است؛ اطلاعات ورود به دیتابیس اصلی ارسال نمی‌شود.</p>
        </form>
      ) : (
        <div className="pl-auth-placeholder" role="tabpanel">
          <h2>ثبت‌نام غیرفعال</h2>
          <p>فعلاً فقط ورود به حساب‌های آزمایشی موجود فعال است. ثبت‌نام جدید پس از تکمیل تنظیمات Auth و بررسی سیاست‌های امنیتی فعال خواهد شد.</p>
        </div>
      )}
      {!sessionUser && <span className="pl-preview-chip">محیط آزمایشی Staging</span>}
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
