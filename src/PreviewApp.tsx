import React, { useEffect, useState } from 'react';
import './preview.css';
import { supabase } from './supabase';

type SessionUser = { id: string; email?: string; email_confirmed_at?: string };
type PlayerProfile = { display_name: string | null; plato_id: string | null; avatar_url?: string | null; public_avatar_path?: string | null };
type AccountContext = { user: SessionUser | null; profile: PlayerProfile | null; role: string | null; loading: boolean; refresh: () => Promise<void> };

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
      if (!supabase) { if (active) setConnection('failed'); return; }
      const { data, error } = await supabase.rpc('preview_connection_check');
      if (active) setConnection(!error && data?.status === 'ok' && data?.environment === 'staging' ? 'connected' : 'failed');
    };
    void verifyStaging();
    return () => { active = false; };
  }, []);
  const message = connection === 'connected' ? 'اتصال مرورگر به دیتابیس آزمایشی Staging برقرار است.' : connection === 'failed' ? 'اتصال مرورگر به دیتابیس آزمایشی تأیید نشد؛ وضعیت فنی در حال بررسی است.' : 'در حال بررسی اتصال مرورگر به دیتابیس آزمایشی…';
  return <div className="pl-preview-banner" role="status" aria-live="polite">محیط آزمایشی PLATO LAND — {message} ثبت‌نام و عملیات مسابقات تا پایان QA غیرفعال‌اند.</div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'pl-brand pl-brand-compact' : 'pl-brand pl-brand-home'}>
    <a href="/" aria-label="PLATO LAND — صفحه اصلی"><img src="/plato-land-logo.jpg" alt="لوگوی PLATO LAND" /></a>
    <p>بازی، رقابت، قهرمانی</p>
  </div>;
}

function Header({ home = false, account }: { home?: boolean; account: AccountContext }) {
  return <header className={home ? 'pl-site-header pl-site-header-home' : 'pl-site-header pl-site-header-inner'}>
    {!home && <Brand compact />}
    <div className="pl-nav-shell">
      <nav id="pl-primary-navigation" className="pl-primary-nav" aria-label="منوی اصلی">
        {navItems.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}
        {account.user ? <details className="pl-account-menu">
          <summary>حساب من</summary>
          <div className="pl-account-menu-popover">
            <a href="/account">نمای کلی حساب</a>
            <a href="/account/profile">پروفایل من</a>
            <a href="/account/competitions">مسابقات من</a>
            <a href="/account/history">تاریخچه حساب</a>
            <button type="button" onClick={() => { void supabase?.auth.signOut().then(() => { window.location.href = '/'; }); }}>خروج از حساب</button>
          </div>
        </details> : <a className="pl-auth-link" href="/login-register">ورود / ثبت‌نام</a>}
      </nav>
    </div>
  </header>;
}

function Footer() {
  return <footer className="pl-preview-footer">
    <strong>PLATO LAND</strong><p>بازی، رقابت، قهرمانی</p>
    <nav aria-label="پیوندهای پایین صفحه"><a href="/">صفحه اصلی</a><a href="/competitions">مسابقات</a><a href="/news">اخبار و اطلاعیه‌ها</a><a href="/guide">راهنما</a><a href="/about">درباره ما</a></nav>
    <small>پیش‌نمایش مستقل — متصل به دیتابیس Staging</small>
  </footer>;
}

function HomePage({ account }: { account: AccountContext }) {
  return <><Header home account={account}/><main><section className="pl-home-hero"><Brand/><div className="pl-home-copy"><h1>بازی، رقابت، <em>قهرمانی</em></h1><p>جایی برای رقابت منصفانه، تجربه بازی و ثبت لحظه‌های قهرمانی.</p><small>این نسخه آزمایشی فقط به دیتابیس Staging متصل است و به دیتابیس اصلی دسترسی ندارد.</small></div></section></main><Footer/></>;
}

function InnerPage({ title, eyebrow, description, children, account }: { title: string; eyebrow: string; description: string; children?: React.ReactNode; account: AccountContext }) {
  return <><Header account={account}/><main className="pl-inner-main"><div className="pl-breadcrumb"><a href="/">صفحه اصلی</a><span>/</span><span>{title}</span></div><section className="pl-inner-intro"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></section>{children}</main><Footer/></>;
}

type PreviewTournament = { id: string; title: string; game_type: string; series_name: string | null; description: string | null; status: string; registration_open: boolean; capacity: number | null; starts_at: string | null };
function CompetitionsPage({ account }: { account: AccountContext }) {
  const [items,setItems]=useState<PreviewTournament[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{let active=true; const load=async()=>{if(!supabase){setError('اتصال به دیتابیس برقرار نیست.');setLoading(false);return;}const {data,error:e}=await supabase.from('tournaments').select('id,title,game_type,series_name,description,status,registration_open,capacity,starts_at').order('created_at',{ascending:false});if(!active)return;if(e){setError('بارگذاری مسابقات از Staging انجام نشد؛ سطح دسترسی یا اتصال دیتابیس را بررسی می‌کنیم.');setItems([]);}else setItems((data??[]) as PreviewTournament[]);setLoading(false);};void load();return()=>{active=false;};},[]);
  const statusLabel=(s:string)=>({draft:'پیش‌نویس',published:'در حال ثبت‌نام',ongoing:'در حال برگزاری',scheduled:'آینده',completed:'پایان‌یافته',cancelled:'لغوشده',archived:'بایگانی‌شده'}[s]??s);
  const dateLabel=(v:string|null)=>{if(!v)return'اعلام نشده';const d=new Date(v);return Number.isNaN(d.getTime())?'اعلام نشده':new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(d);};
  const groups=[{title:'مسابقات آزمایشی و پیش‌نویس',rows:items.filter(x=>x.status==='draft')},{title:'مسابقات فعال',rows:items.filter(x=>['published','ongoing'].includes(x.status))},{title:'مسابقات آینده',rows:items.filter(x=>x.status==='scheduled')},{title:'مسابقات پایان‌یافته',rows:items.filter(x=>['completed','cancelled','archived'].includes(x.status))}];
  return <InnerPage account={account} title="مسابقات" eyebrow="رقابت‌های PLATO LAND" description="فهرست مسابقات از دیتابیس آزمایشی Staging بارگذاری می‌شود.">{loading?<article className="pl-preview-card"><h2>در حال بارگذاری مسابقات…</h2></article>:error?<article className="pl-preview-card" role="alert"><h2>بارگذاری ناموفق بود</h2><p>{error}</p></article>:<div className="pl-preview-cards">{groups.map(g=><section key={g.title}><h2>{g.title}</h2>{g.rows.length?<div className="pl-preview-cards">{g.rows.map(t=><article className="pl-preview-card" key={t.id}><span className="pl-preview-chip">{statusLabel(t.status)}</span><h2>{t.title}</h2><p>{t.description||'توضیحات ثبت نشده است.'}</p><p>بازی: {t.game_type}{t.series_name?' · '+t.series_name:''}</p><p>ظرفیت: {t.capacity??'اعلام نشده'}</p><p>شروع: {dateLabel(t.starts_at)}</p></article>)}</div>:<article className="pl-preview-card"><p>مسابقه‌ای برای نمایش وجود ندارد.</p></article>}</section>)}</div>}</InnerPage>;
}

function AccountHome({account}:{account:AccountContext}) {
  return <InnerPage account={account} title="حساب کاربری من" eyebrow="فضای شخصی بازیکن" description="از این بخش می‌توانی اطلاعات پروفایل، مسابقات و سوابق حساب خودت را مدیریت و مشاهده کنی.">
    <div className="pl-account-summary">
      <div className="pl-account-summary-main">{account.profile?.avatar_url?<img src={account.profile.avatar_url} alt="عکس پروفایل"/>:<div className="pl-account-avatar-placeholder">PL</div>}<div><h2>{account.profile?.display_name||'بازیکن'}</h2><p>Plato ID: {account.profile?.plato_id||'ثبت نشده'}</p><small>{account.user?.email}</small></div></div>
      <span className="pl-preview-chip">{account.user?.email_confirmed_at?'ایمیل تأیید شده':'ایمیل هنوز تأیید نشده'}</span>
    </div>
    <div className="pl-account-link-grid">
      <a className="pl-preview-card" href="/account/profile"><h2>پروفایل من</h2><p>ویرایش نام نمایشی، Plato ID و عکس پروفایل</p><strong>ورود به پروفایل ←</strong></a>
      <a className="pl-preview-card" href="/account/competitions"><h2>مسابقات من</h2><p>مشاهده ثبت‌نام‌ها، وضعیت و اطلاعات رقابت‌ها</p><strong>مشاهده مسابقات ←</strong></a>
      <a className="pl-preview-card" href="/account/history"><h2>تاریخچه حساب</h2><p>مشاهده شناسه‌های قبلی و تغییرات Plato ID</p><strong>مشاهده سوابق ←</strong></a>
      <a className="pl-preview-card" href="/account/settings"><h2>تنظیمات حساب</h2><p>وضعیت حساب و تنظیمات پایه</p><strong>مشاهده تنظیمات ←</strong></a>
    </div>
  </InnerPage>;
}

function ProfilePage({account}:{account:AccountContext}) {
  const [name,setName]=useState(account.profile?.display_name??''); const [platoId,setPlatoId]=useState(account.profile?.plato_id??'');
  const [avatar,setAvatar]=useState<File|null>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [history,setHistory]=useState<{id:string;previous_plato_id:string;changed_at:string}[]>([]);
  useEffect(()=>{setName(account.profile?.display_name??'');setPlatoId(account.profile?.plato_id??'');},[account.profile?.display_name,account.profile?.plato_id]);
  useEffect(()=>{let active=true;if(!supabase||!account.user)return;void supabase.from('profile_plato_id_history').select('id,previous_plato_id,changed_at').eq('player_id',account.user.id).order('changed_at',{ascending:false}).then(({data})=>{if(active)setHistory(data??[]);});return()=>{active=false;};},[account.user?.id,account.profile?.plato_id]);
  const save=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase||!account.user||busy)return;const cleanId=platoId.trim();if(!/^[A-Za-z0-9_-]{1,80}$/.test(cleanId)){setMessage('Plato ID فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.');return;}setBusy(true);setMessage('');
    const {data:existing,error:lookupError}=await supabase.from('profiles').select('id').ilike('plato_id',cleanId).neq('id',account.user.id).limit(1);
    if(lookupError){setBusy(false);setMessage('بررسی یکتایی شناسه انجام نشد؛ دوباره تلاش کن.');return;}if(existing?.length){setBusy(false);setMessage('این Plato ID قبلاً استفاده شده است؛ شناسه دیگری انتخاب کن.');return;}
    let avatarUrl=account.profile?.avatar_url??null;let avatarPath=account.profile?.public_avatar_path??null;
    if(avatar){if(!avatar.type.startsWith('image/')||avatar.size>5*1024*1024){setBusy(false);setMessage('عکس باید از نوع تصویر و حداکثر ۵ مگابایت باشد.');return;}const path=account.user.id+'/'+Date.now()+'-'+avatar.name.replace(/[^a-zA-Z0-9._-]/g,'_');const {error:uploadError}=await supabase.storage.from('public-profile-avatars').upload(path,avatar,{upsert:false,contentType:avatar.type});if(uploadError){setBusy(false);setMessage('بارگذاری عکس انجام نشد؛ تنظیمات Storage را بررسی می‌کنیم.');return;}avatarPath=path;avatarUrl=supabase.storage.from('public-profile-avatars').getPublicUrl(path).data.publicUrl;}
    const {error:updateError}=await supabase.from('profiles').update({display_name:name.trim(),plato_id:cleanId,avatar_url:avatarUrl,public_avatar_path:avatarPath}).eq('id',account.user.id);
    if(updateError){if(avatarPath&&avatarPath!==account.profile?.public_avatar_path)await supabase.storage.from('public-profile-avatars').remove([avatarPath]);setBusy(false);setMessage(updateError.code==='23505'?'این Plato ID قبلاً ثبت شده است.':'ذخیره اطلاعات انجام نشد؛ لطفاً دوباره تلاش کن.');return;}
    await account.refresh();setAvatar(null);setBusy(false);setMessage('تغییرات پروفایل با موفقیت ذخیره شد.');
  };
  if(!account.user)return <InnerPage account={account} title="پروفایل من" eyebrow="حساب کاربری" description="برای مشاهده و ویرایش پروفایل ابتدا وارد حساب شو."><a className="pl-primary-button" href="/login-register">ورود به حساب</a></InnerPage>;
  return <InnerPage account={account} title="پروفایل من" eyebrow="اطلاعات شخصی بازیکن" description="نام نمایشی، شناسه فعلی و تصویر عمومی پروفایل خودت را ویرایش کن.">
    <div className="pl-account-subnav"><a href="/account">نمای کلی حساب</a><a href="/account/profile" aria-current="page">پروفایل من</a><a href="/account/competitions">مسابقات من</a></div>
    <form className="pl-profile-form" onSubmit={save}>
      <div className="pl-profile-photo">{account.profile?.avatar_url?<img src={account.profile.avatar_url} alt="عکس فعلی پروفایل"/>:<div className="pl-account-avatar-placeholder">PL</div>}<label>تغییر عکس پروفایل<input type="file" accept="image/*" onChange={e=>setAvatar(e.target.files?.[0]??null)}/></label><small>فرمت تصویر، حداکثر ۵ مگابایت</small></div>
      <label>نام نمایشی<input value={name} onChange={e=>setName(e.target.value)} required maxLength={80}/></label>
      <label>Plato ID فعلی<input value={platoId} onChange={e=>setPlatoId(e.target.value)} required maxLength={80} dir="ltr" autoCapitalize="off" spellCheck={false}/></label>
      <label>ایمیل حساب<input value={account.user.email??''} readOnly dir="ltr"/></label>
      <p className="pl-profile-note">{account.user.email_confirmed_at?'ایمیل حساب تأیید شده است.':'ایمیل حساب هنوز تأیید نشده است.'} تغییر Plato ID در سوابق خصوصی حساب ثبت می‌شود.</p>
      <button className="pl-primary-button" type="submit" disabled={busy}>{busy?'در حال ذخیره…':'ذخیره تغییرات'}</button>
      {message&&<p className="pl-auth-message" role="status">{message}</p>}
    </form>
    <section className="pl-account-history"><h2>شناسه‌های قبلی</h2>{history.length?history.map(h=><div key={h.id}><strong dir="ltr">{h.previous_plato_id}</strong><small>{new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'medium',timeStyle:'short'}).format(new Date(h.changed_at))}</small></div>):<p>هنوز شناسه قبلی برای این حساب ثبت نشده است.</p>}</section>
  </InnerPage>;
}

function MyCompetitionsPage({account}:{account:AccountContext}) {
  const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let active=true;const load=async()=>{if(!supabase||!account.user){setRows([]);setLoading(false);return;}const {data,error:e}=await supabase.from('registrations').select('id,tournament_id,status,created_at,display_name,plato_id,is_reserve,reserve_position,registration_type').eq('player_id',account.user.id).order('created_at',{ascending:false});if(!active)return;if(e){setError('اطلاعات مسابقات بارگذاری نشد.');setLoading(false);return;}const ids=[...new Set((data??[]).map(r=>r.tournament_id))];let tournaments:any[]=[];if(ids.length){const result=await supabase.from('tournaments').select('id,title,game_type,status,starts_at').in('id',ids);tournaments=result.data??[];}if(active){setRows((data??[]).map(r=>({...r,tournament:tournaments.find(t=>t.id===r.tournament_id)})));setLoading(false);}};void load();return()=>{active=false;};},[account.user?.id]);
  return <InnerPage account={account} title="مسابقات من" eyebrow="سوابق رقابتی بازیکن" description="ثبت‌نام‌ها و وضعیت حضور تو در مسابقات PLATO LAND.">
    <div className="pl-account-subnav"><a href="/account">نمای کلی حساب</a><a href="/account/profile">پروفایل من</a><a href="/account/competitions" aria-current="page">مسابقات من</a></div>
    {!account.user?<article className="pl-preview-card"><p>برای مشاهده مسابقات خودت وارد حساب شو.</p><a href="/login-register">ورود به حساب</a></article>:loading?<article className="pl-preview-card">در حال بارگذاری مسابقات…</article>:error?<article className="pl-preview-card" role="alert">{error}</article>:rows.length?<div className="pl-my-competitions">{rows.map(r=><article className="pl-preview-card" key={r.id}><h2>{r.tournament?.title??'مسابقه'}</h2><p>بازی: {r.tournament?.game_type??'—'}</p><p>وضعیت ثبت‌نام: {({pending:'در انتظار بررسی',approved:'تأیید شده',registered:'ثبت‌نام نهایی',rejected:'رد شده',withdrawn:'انصراف داده'} as Record<string,string>)[r.status]??r.status}</p><p>Plato ID هنگام ثبت‌نام: {r.plato_id??account.profile?.plato_id??'—'}</p>{r.is_reserve&&<p>جایگاه ذخیره: {r.reserve_position??'ثبت نشده'}</p>}<small>تاریخ درخواست: {new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'medium'}).format(new Date(r.created_at))}</small></article>)}</div>:<article className="pl-preview-card"><h2>هنوز در مسابقه‌ای ثبت‌نام نکرده‌ای</h2><p>پس از ثبت‌نام در یک رقابت، وضعیت و اطلاعات آن در این بخش نمایش داده می‌شود.</p><a href="/competitions">مشاهده مسابقات</a></article>}
  </InnerPage>;
}

function AccountHistoryPage({account}:{account:AccountContext}) {
  const [rows,setRows]=useState<any[]>([]);
  useEffect(()=>{let active=true;if(supabase&&account.user)void supabase.from('profile_plato_id_history').select('id,previous_plato_id,changed_at').eq('player_id',account.user.id).order('changed_at',{ascending:false}).then(({data})=>{if(active)setRows(data??[]);});return()=>{active=false;};},[account.user?.id]);
  return <InnerPage account={account} title="تاریخچه حساب" eyebrow="سوابق هویتی" description="شناسه‌های قبلی حساب برای حفظ پیوستگی سوابق بازیکن نگهداری می‌شوند."><section className="pl-account-history">{rows.length?rows.map(r=><div key={r.id}><strong dir="ltr">{r.previous_plato_id}</strong><small>{new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'medium',timeStyle:'short'}).format(new Date(r.changed_at))}</small></div>):<p>تاریخچه‌ای برای نمایش وجود ندارد.</p>}</section></InnerPage>;
}

function AccountSettingsPage({account}:{account:AccountContext}) {
  return <InnerPage account={account} title="تنظیمات حساب" eyebrow="امنیت و دسترسی" description="اطلاعات پایه و وضعیت امنیتی حساب."><article className="pl-preview-card"><p>ایمیل: {account.user?.email??'—'}</p><p>وضعیت تأیید ایمیل: {account.user?.email_confirmed_at?'تأیید شده':'تأیید نشده'}</p><p>نقش در Staging: {account.role??'بازیکن'}</p><p>رمز عبور در این صفحه نمایش داده یا ذخیره نمی‌شود.</p></article></InnerPage>;
}

function NewsPage({account}:{account:AccountContext}) { return <InnerPage account={account} title="اخبار و اطلاعیه‌ها" eyebrow="تازه‌های PLATO LAND" description="خبرها و اطلاعیه‌های رسمی پلتفرم در این بخش گردآوری می‌شوند."><article className="pl-preview-card pl-empty-state"><h2>هنوز خبری برای نمایش وجود ندارد</h2><p>این یک وضعیت خالی در محیط Preview است؛ هیچ خبر ساختگی یا اطلاعیه عملیاتی نمایش داده نمی‌شود.</p></article></InnerPage>; }
function GuidePage({account}:{account:AccountContext}) { return <InnerPage account={account} title="راهنما" eyebrow="راهنمای استفاده" description="راهنمای آشنایی با مسابقات، مراحل شرکت و بخش‌های مختلف PLATO LAND."><div className="pl-guide-list"><article className="pl-preview-card"><h2>آشنایی با مسابقات</h2><p>اطلاعات هر رقابت، شرایط شرکت و مراحل آن در صفحه اختصاصی همان مسابقه ارائه می‌شود.</p></article><article className="pl-preview-card"><h2>ثبت‌نام و حساب کاربری</h2><p>فرایند واقعی ورود و ثبت‌نام در این محیط آزمایشی فعال نیست.</p></article><article className="pl-preview-card"><h2>قوانین و پشتیبانی</h2><p>قوانین هر مسابقه در صفحه مربوط به همان رقابت منتشر خواهد شد.</p></article></div></InnerPage>; }
function AboutPage({account}:{account:AccountContext}) { return <InnerPage account={account} title="درباره ما" eyebrow="درباره PLATO LAND" description="PLATO LAND بستری برای بازی، رقابت منصفانه و ثبت لحظه‌های قهرمانی."><article className="pl-preview-card"><h2>بازی، رقابت، قهرمانی</h2><p>این صفحه مستقل است و مطابق تصمیم طراحی، پیوند آن فقط در پایین صفحات قرار دارد و در منوی بالای سایت نمایش داده نمی‌شود.</p></article></InnerPage>; }

function LoginRegisterPage({account}:{account:AccountContext}) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const handleLogin=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase||busy)return;setBusy(true);setMessage('');const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(error){setMessage('ورود انجام نشد. ایمیل و رمز عبور را بررسی کن.');return;}setPassword('');setMessage('ورود موفق بود؛ از منوی «حساب من» وارد پروفایل و مسابقاتت شو.');};
  return <InnerPage account={account} title="ورود / ثبت‌نام" eyebrow="حساب کاربری" description="ورود آزمایشی به حساب‌های موجود در دیتابیس Staging فعال است. ثبت‌نام جدید تا تکمیل تنظیمات امنیتی و QA غیرفعال می‌ماند.">
    <section className="pl-auth-panel">{account.user?<div className="pl-auth-placeholder"><h2>قبلاً وارد حساب شده‌ای</h2><p>{account.user.email}</p><p>برای دسترسی به بخش‌های شخصی از گزینه «حساب من» در منوی بالای سایت استفاده کن.</p><a className="pl-primary-button" href="/account">رفتن به حساب من</a></div>:<form className="pl-auth-form" onSubmit={handleLogin}><h2>ورود به حساب آزمایشی</h2><label htmlFor="pl-login-email">آدرس ایمیل</label><input id="pl-login-email" type="email" autoComplete="username" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} required/><label htmlFor="pl-login-password">رمز عبور</label><input id="pl-login-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="pl-primary-button" type="submit" disabled={busy||!supabase}>{busy?'در حال ورود…':'ورود'}</button>{message&&<p className="pl-auth-message" role="status">{message}</p>}<p className="pl-auth-note">این فرم فقط به پروژه Staging متصل است؛ اطلاعات ورود به دیتابیس اصلی ارسال نمی‌شود.</p></form>}<div className="pl-auth-placeholder"><h2>ثبت‌نام غیرفعال</h2><p>فعلاً فقط ورود به حساب‌های آزمایشی موجود فعال است. ثبت‌نام جدید پس از تکمیل تنظیمات Auth و بررسی سیاست‌های امنیتی فعال خواهد شد.</p></div></section>
  </InnerPage>;
}

export default function PreviewApp() {
  const [user,setUser]=useState<SessionUser|null>(null);const [profile,setProfile]=useState<PlayerProfile|null>(null);const [role,setRole]=useState<string|null>(null);const [loading,setLoading]=useState(true);
  const refresh=async()=>{if(!supabase){setUser(null);setProfile(null);setRole(null);setLoading(false);return;}const {data}=await supabase.auth.getSession();const current=data.session?.user as SessionUser|undefined;setUser(current??null);if(!current){setProfile(null);setRole(null);setLoading(false);return;}const [{data:p},{data:r}]=await Promise.all([supabase.from('profiles').select('display_name,plato_id,avatar_url,public_avatar_path').eq('id',current.id).maybeSingle(),supabase.rpc('current_user_role')]);setProfile(p??null);setRole(r??'player');setLoading(false);};
  useEffect(()=>{if(!supabase){setLoading(false);return;}let active=true;const load=async(sessionUser?:SessionUser|null)=>{if(!active)return;const {data}=sessionUser===undefined?await supabase.auth.getSession():{data:{session:sessionUser?{user:sessionUser}:null}};const current=data.session?.user as SessionUser|undefined;if(!active)return;setUser(current??null);if(!current){setProfile(null);setRole(null);setLoading(false);return;}const [{data:p},{data:r}]=await Promise.all([supabase.from('profiles').select('display_name,plato_id,avatar_url,public_avatar_path').eq('id',current.id).maybeSingle(),supabase.rpc('current_user_role')]);if(!active)return;setProfile(p??null);setRole(r??'player');setLoading(false);};void load();const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{void load((session?.user as SessionUser)??null);});return()=>{active=false;listener.subscription.unsubscribe();};},[]);
  const account:AccountContext={user,profile,role,loading,refresh};
  const path=window.location.pathname.replace(/\/+$/,'')||'/';let page:React.ReactNode;
  if(path==='/')page=<HomePage account={account}/>;else if(path==='/competitions')page=<CompetitionsPage account={account}/>;else if(path==='/news')page=<NewsPage account={account}/>;else if(path==='/guide')page=<GuidePage account={account}/>;else if(path==='/about')page=<AboutPage account={account}/>;else if(path==='/login-register')page=<LoginRegisterPage account={account}/>;else if(path==='/account')page=<AccountHome account={account}/>;else if(path==='/account/profile')page=<ProfilePage account={account}/>;else if(path==='/account/competitions')page=<MyCompetitionsPage account={account}/>;else if(path==='/account/history')page=<AccountHistoryPage account={account}/>;else if(path==='/account/settings')page=<AccountSettingsPage account={account}/>;else page=<InnerPage account={account} title="صفحه پیدا نشد" eyebrow="۴۰۴" description="صفحه موردنظر پیدا نشد."><a className="pl-primary-button" href="/">بازگشت به صفحه اصلی</a></InnerPage>;
  return <div className="pl-preview" dir="rtl"><PreviewBanner/>{page}</div>;
}
