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

function InnerPage({ title, eyebrow, description, children, account, accountHome = false }: { title: string; eyebrow?: string; description: string; children?: React.ReactNode; account: AccountContext; accountHome?: boolean }) {
  return <><Header account={account}/><main className="pl-inner-main"><section className={accountHome ? "pl-inner-intro pl-account-home-intro" : "pl-inner-intro"}><h1>{title}</h1>{!accountHome&&eyebrow&&<span>{eyebrow}</span>}<p>{description}</p></section>{children}</main><Footer/></>;
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
  return <InnerPage account={account} accountHome title="حساب کاربری من" eyebrow="فضای شخصی بازیکن" description="از این بخش می‌توانی اطلاعات پروفایل، مسابقات و سوابق حساب خودت را مدیریت و مشاهده کنی.">
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
  const [avatar,setAvatar]=useState<File|null>(null); const [avatarPreview,setAvatarPreview]=useState(''); const [avatarError,setAvatarError]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  useEffect(()=>{setName(account.profile?.display_name??'');setPlatoId(account.profile?.plato_id??'');},[account.profile?.display_name,account.profile?.plato_id]);
  useEffect(()=>()=>{if(avatarPreview)URL.revokeObjectURL(avatarPreview);},[avatarPreview]);
  const handleAvatarChange=(file:File|null,input:HTMLInputElement)=>{setMessage('');setAvatarError('');if(!file){setAvatar(null);setAvatarPreview('');return;}const extension=file.name.split('.').pop()?.toLowerCase()??'';const allowedExtensions=['jpg','jpeg','png','webp'];const allowedTypes=['image/jpeg','image/png','image/webp'];if(!allowedExtensions.includes(extension)||(file.type&&!allowedTypes.includes(file.type))){setAvatar(null);setAvatarPreview('');input.value='';setAvatarError('فرمت این فایل پشتیبانی نمی‌شود. لطفاً عکس را با فرمت JPG، PNG یا WebP انتخاب کن.');return;}if(file.size>2*1024*1024){setAvatar(null);setAvatarPreview('');input.value='';setAvatarError('حجم عکس بیشتر از ۲ مگابایت است؛ لطفاً عکسی با حجم حداکثر ۲ مگابایت انتخاب کن.');return;}setAvatar(file);setAvatarPreview(URL.createObjectURL(file));setMessage('عکس انتخاب شد. برای ثبت نهایی، دکمه «ذخیره تغییرات» را بزن.');};
  const save=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase||!account.user||busy)return;const cleanId=platoId.trim();if(!/^[A-Za-z0-9_-]{1,80}$/.test(cleanId)){setMessage('Plato ID فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.');return;}setBusy(true);setMessage('در حال ذخیره اطلاعات و بارگذاری عکس…');let uploadedPath:string|null=null;
    try{
      const {data:existing,error:lookupError}=await supabase.from('profiles').select('id').ilike('plato_id',cleanId).neq('id',account.user.id).limit(1);
      if(lookupError)throw new Error('بررسی یکتایی شناسه انجام نشد: '+lookupError.message);
      if(existing?.length)throw new Error('این Plato ID قبلاً استفاده شده است؛ شناسه دیگری انتخاب کن.');
      let avatarUrl=account.profile?.avatar_url??null;let avatarPath=account.profile?.public_avatar_path??null;
      if(avatar){const lowerName=avatar.name.toLowerCase();const contentType=avatar.type||(lowerName.endsWith('.png')?'image/png':lowerName.endsWith('.webp')?'image/webp':'image/jpeg');const path=account.user.id+'/'+Date.now()+'-'+avatar.name.replace(/[^a-zA-Z0-9._-]/g,'_');const {error:uploadError}=await supabase.storage.from('public-profile-avatars').upload(path,avatar,{upsert:false,contentType});if(uploadError){const reason=uploadError.message.toLowerCase().includes('row-level security')?'اجازه بارگذاری برای این حساب صادر نشده است.':uploadError.message.toLowerCase().includes('payload too large')?'حجم فایل از محدودیت فضای ذخیره‌سازی بیشتر است.':uploadError.message;throw new Error('بارگذاری عکس انجام نشد: '+reason);}uploadedPath=path;avatarPath=path;avatarUrl=supabase.storage.from('public-profile-avatars').getPublicUrl(path).data.publicUrl;}
      const {error:updateError}=await supabase.from('profiles').update({display_name:name.trim(),plato_id:cleanId,avatar_url:avatarUrl,public_avatar_path:avatarPath}).eq('id',account.user.id);
      if(updateError)throw new Error(updateError.code==='23505'?'این Plato ID قبلاً ثبت شده است.':'ذخیره پروفایل انجام نشد: '+updateError.message);
      await account.refresh();setAvatar(null);setAvatarPreview('');setMessage('تغییرات پروفایل و عکس با موفقیت ذخیره شد.');
    }catch(error:any){if(uploadedPath)await supabase.storage.from('public-profile-avatars').remove([uploadedPath]);setMessage(error?.message||'ذخیره تغییرات انجام نشد. لطفاً دوباره تلاش کن.');}
    finally{setBusy(false);}
  };
  if(!account.user)return <InnerPage account={account} title="پروفایل من" eyebrow="حساب کاربری" description="برای مشاهده و ویرایش پروفایل ابتدا وارد حساب شو."><a className="pl-back-link" href="/account">بازگشت به حساب من</a><a className="pl-primary-button" href="/login-register">ورود به حساب</a></InnerPage>;
  return <InnerPage account={account} title="پروفایل من" eyebrow="اطلاعات شخصی بازیکن" description="نام نمایشی، شناسه فعلی و تصویر عمومی پروفایل خودت را ویرایش کن.">
    <a className="pl-back-link" href="/account">بازگشت به حساب من</a>
    <form className="pl-profile-form" onSubmit={save}>
      <div className="pl-profile-photo">{avatarPreview||account.profile?.avatar_url?<img src={avatarPreview||account.profile?.avatar_url||''} alt={avatarPreview?'پیش‌نمایش عکس انتخاب‌شده':'عکس فعلی پروفایل'}/>:<div className="pl-account-avatar-placeholder">PL</div>}<label>تغییر عکس پروفایل<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-invalid={!!avatarError} aria-describedby={avatarError?'pl-avatar-error':'pl-avatar-help'} onChange={e=>handleAvatarChange(e.target.files?.[0]??null,e.currentTarget)}/></label>{avatarError&&<p id="pl-avatar-error" className="pl-avatar-inline-error" role="alert" aria-live="assertive">{avatarError}</p>}<small id="pl-avatar-help">فرمت‌های مجاز: JPG، PNG و WebP — حداکثر ۲ مگابایت</small>{avatar&&<small className="pl-selected-avatar">فایل انتخاب‌شده: {avatar.name}</small>}</div>
      <label>نام نمایشی<input value={name} onChange={e=>setName(e.target.value)} required maxLength={80}/></label>
      <label>Plato ID فعلی<input value={platoId} onChange={e=>setPlatoId(e.target.value)} required maxLength={80} dir="ltr" autoCapitalize="off" spellCheck={false}/></label>
      <label>ایمیل حساب<input value={account.user.email??''} readOnly dir="ltr"/></label>
      <p className="pl-profile-note">{account.user.email_confirmed_at?'ایمیل حساب تأیید شده است.':'ایمیل حساب هنوز تأیید نشده است.'} تغییر Plato ID در سوابق خصوصی حساب ثبت می‌شود.</p>
      <button className="pl-primary-button" type="submit" disabled={busy}>{busy?'در حال ذخیره…':'ذخیره تغییرات'}</button>
      {message&&<p className="pl-auth-message" role="status">{message}</p>}
    </form>
  </InnerPage>;
}

function MyCompetitionsPage({account}:{account:AccountContext}) {
  const [registrations,setRegistrations]=useState<any[]>([]);const [tournaments,setTournaments]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [selected,setSelected]=useState<'active'|'upcoming'|'completed'|null>(null);
  useEffect(()=>{let alive=true;const load=async()=>{if(!supabase||!account.user){setRegistrations([]);setTournaments([]);setLoading(false);return;}const [registrationResult,tournamentResult]=await Promise.all([supabase.from('registrations').select('id,tournament_id,status,created_at,display_name,plato_id,is_reserve,reserve_position,registration_type').eq('player_id',account.user.id).order('created_at',{ascending:false}),supabase.from('tournaments').select('id,title,game_type,status,starts_at,registration_open,capacity,description').in('status',['published','ongoing','completed']).order('starts_at',{ascending:true})]);if(!alive)return;if(registrationResult.error){setError('اطلاعات ثبت‌نام‌های حساب بارگذاری نشد: '+registrationResult.error.message);setLoading(false);return;}if(tournamentResult.error){setError('فهرست مسابقات بارگذاری نشد: '+tournamentResult.error.message);setLoading(false);return;}setRegistrations(registrationResult.data??[]);setTournaments(tournamentResult.data??[]);setLoading(false);};void load();return()=>{alive=false;};},[account.user?.id]);
  const registrationFor=(tournamentId:string)=>registrations.find(r=>r.tournament_id===tournamentId);
  const validRegistration=(tournamentId:string)=>registrations.find(r=>r.tournament_id===tournamentId&&!['rejected','withdrawn'].includes(r.status));
  const now=Date.now();
  const activeItems=tournaments.filter(t=>t.status==='ongoing'&&validRegistration(t.id));
  const completedItems=tournaments.filter(t=>t.status==='completed'&&validRegistration(t.id));
  const upcomingItems=tournaments.filter(t=>t.status==='published'&&(!t.starts_at||new Date(t.starts_at).getTime()>now));
  const registrationLabel=(r:any)=>!r?'هنوز ثبت‌نام نکرده‌ای':({pending:'در انتظار بررسی',approved:'ثبت‌نام تأیید شده',registered:'ثبت‌نام نهایی',rejected:'درخواست رد شده',withdrawn:'انصراف داده'} as Record<string,string>)[r.status]??r.status;
  const dateLabel=(value:string|null)=>value?new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'medium'}).format(new Date(value)):'تاریخ شروع اعلام نشده';
  const selectedItems=selected==='active'?activeItems:selected==='completed'?completedItems:upcomingItems;
  const categories=[{id:'active' as const,title:'مسابقات فعال',description:'مسابقاتی که در حال برگزاری هستند و در آن‌ها ثبت‌نام کرده‌ای.',count:activeItems.length},{id:'upcoming' as const,title:'مسابقات آینده',description:'رقابت‌های پیش‌رو؛ حتی اگر هنوز در آن‌ها ثبت‌نام نکرده باشی.',count:upcomingItems.length},{id:'completed' as const,title:'مسابقات تمام‌شده',description:'مسابقاتی که در آن‌ها شرکت داشتی و به پایان رسیده‌اند.',count:completedItems.length}];
  const registrationStatus=(r:any)=>r?<p>وضعیت ثبت‌نام: {registrationLabel(r)}</p>:<p>وضعیت ثبت‌نام: هنوز ثبت‌نام نکرده‌ای</p>;
  const renderTournament=(t:any)=>{const r=registrationFor(t.id);return <article className="pl-preview-card" key={t.id}><span className="pl-preview-chip">{t.status==='ongoing'?'در حال برگزاری':t.status==='completed'?'پایان‌یافته':'آینده'}</span><h2>{t.title}</h2><p>بازی: {t.game_type??'—'}</p>{registrationStatus(r)}{r&&<><p>Plato ID هنگام ثبت‌نام: {r.plato_id??account.profile?.plato_id??'—'}</p>{r.is_reserve&&<p>جایگاه ذخیره: {r.reserve_position??'ثبت نشده'}</p>}<small>تاریخ درخواست: {dateLabel(r.created_at)}</small></>}<p>تاریخ شروع: {dateLabel(t.starts_at)}</p><a className="pl-text-link" href="/competitions">مشاهده جزئیات مسابقه ←</a></article>;};
  return <InnerPage account={account} title="مسابقات من" eyebrow="" description="وضعیت حضور و رقابت‌های پیش‌روی خودت را مشاهده کن.">
    <a className="pl-back-link" href="/account">بازگشت به حساب من</a>
    {!account.user?<article className="pl-preview-card"><p>برای مشاهده مسابقات خودت وارد حساب شو.</p><a href="/login-register">ورود به حساب</a></article>:loading?<article className="pl-preview-card">در حال بارگذاری مسابقات…</article>:error?<article className="pl-preview-card" role="alert">{error}</article>:<>
      {!selected?<div className="pl-competition-category-grid">{categories.map(category=><button type="button" className="pl-preview-card pl-competition-category" key={category.id} onClick={()=>setSelected(category.id)}><span className="pl-preview-chip">{category.count} مسابقه</span><h2>{category.title}</h2><p>{category.description}</p><strong>مشاهده مسابقات ←</strong></button>)}</div>:<section className="pl-my-competitions"><button type="button" className="pl-back-link pl-category-back" onClick={()=>setSelected(null)}>بازگشت به دسته‌بندی‌ها</button><h2 className="pl-category-title">{categories.find(c=>c.id===selected)?.title}</h2>{selectedItems.length?<div className="pl-my-competitions">{selectedItems.map(renderTournament)}</div>:<article className="pl-preview-card"><p>{selected==='active'?'در حال حاضر مسابقه فعالی برای نمایش در حساب تو وجود ندارد.':selected==='upcoming'?'مسابقه آینده‌ای برای نمایش وجود ندارد.':'هنوز مسابقه پایان‌یافته‌ای در سوابق تو ثبت نشده است.'}</p></article>}</section>}
    </>}
  </InnerPage>;
}

function AccountHistoryPage({account}:{account:AccountContext}) {
  const [rows,setRows]=useState<any[]>([]);
  useEffect(()=>{let active=true;if(supabase&&account.user)void supabase.from('profile_plato_id_history').select('id,previous_plato_id,changed_at').eq('player_id',account.user.id).order('changed_at',{ascending:false}).then(({data})=>{if(active)setRows(data??[]);});return()=>{active=false;};},[account.user?.id]);
  return <InnerPage account={account} title="تاریخچه حساب" eyebrow="" description="شناسه‌های قبلی حساب برای حفظ پیوستگی سوابق بازیکن نگهداری می‌شوند."><a className="pl-back-link" href="/account">بازگشت به حساب من</a><section className="pl-account-history">{rows.length?rows.map(r=><div key={r.id}><strong dir="ltr">{r.previous_plato_id}</strong><small>{new Intl.DateTimeFormat('fa-IR-u-ca-persian',{dateStyle:'medium',timeStyle:'short'}).format(new Date(r.changed_at))}</small></div>):<p>تاریخچه‌ای برای نمایش وجود ندارد.</p>}</section></InnerPage>;
}

function AccountSettingsPage({account}:{account:AccountContext}) {
  return <InnerPage account={account} title="تنظیمات حساب" eyebrow="امنیت و دسترسی" description="اطلاعات پایه و وضعیت امنیتی حساب."><a className="pl-back-link" href="/account">بازگشت به حساب من</a><article className="pl-preview-card"><p>ایمیل: {account.user?.email??'—'}</p><p>وضعیت تأیید ایمیل: {account.user?.email_confirmed_at?'تأیید شده':'تأیید نشده'}</p><p>نقش در Staging: {account.role??'بازیکن'}</p><p>رمز عبور در این صفحه نمایش داده یا ذخیره نمی‌شود.</p></article></InnerPage>;
}

function NewsPage({account}:{account:AccountContext}) { return <InnerPage account={account} title="اخبار و اطلاعیه‌ها" eyebrow="تازه‌های PLATO LAND" description="خبرها و اطلاعیه‌های رسمی پلتفرم در این بخش گردآوری می‌شوند."><article className="pl-preview-card pl-empty-state"><h2>هنوز خبری برای نمایش وجود ندارد</h2><p>این یک وضعیت خالی در محیط Preview است؛ هیچ خبر ساختگی یا اطلاعیه عملیاتی نمایش داده نمی‌شود.</p></article></InnerPage>; }
function GuidePage({account}:{account:AccountContext}) { return <InnerPage account={account} title="راهنما" eyebrow="راهنمای استفاده" description="راهنمای آشنایی با مسابقات، مراحل شرکت و بخش‌های مختلف PLATO LAND."><div className="pl-guide-list"><article className="pl-preview-card"><h2>آشنایی با مسابقات</h2><p>اطلاعات هر رقابت، شرایط شرکت و مراحل آن در صفحه اختصاصی همان مسابقه ارائه می‌شود.</p></article><article className="pl-preview-card"><h2>ثبت‌نام و حساب کاربری</h2><p>فرایند واقعی ورود و ثبت‌نام در این محیط آزمایشی فعال نیست.</p></article><article className="pl-preview-card"><h2>قوانین و پشتیبانی</h2><p>قوانین هر مسابقه در صفحه مربوط به همان رقابت منتشر خواهد شد.</p></article></div></InnerPage>; }
function AboutPage({account}:{account:AccountContext}) { return <InnerPage account={account} title="درباره ما" eyebrow="درباره PLATO LAND" description="PLATO LAND بستری برای بازی، رقابت منصفانه و ثبت لحظه‌های قهرمانی."><article className="pl-preview-card"><h2>بازی، رقابت، قهرمانی</h2><p>این صفحه مستقل است و مطابق تصمیم طراحی، پیوند آن فقط در پایین صفحات قرار دارد و در منوی بالای سایت نمایش داده نمی‌شود.</p></article></InnerPage>; }

function LoginRegisterPage({account}:{account:AccountContext}) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>{if(account.user){window.location.replace('/');}},[account.user?.id]);
  const handleLogin=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase||busy)return;setBusy(true);setMessage('');const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(error){setMessage('ورود انجام نشد. ایمیل و رمز عبور را بررسی کن.');return;}setPassword('');window.location.replace('/');};
  if(account.loading)return <InnerPage account={account} title="ورود / ثبت‌نام" eyebrow="حساب کاربری" description="در حال بررسی وضعیت ورود…"><article className="pl-preview-card"><h2>در حال بررسی نشست حساب</h2></article></InnerPage>;
  if(account.user)return <InnerPage account={account} title="ورود / ثبت‌نام" eyebrow="حساب کاربری" description="ورود شما تأیید شد؛ در حال انتقال به صفحه اصلی…"><article className="pl-preview-card"><h2>در حال انتقال به صفحه اصلی PLATO LAND…</h2></article></InnerPage>;
  return <InnerPage account={account} title="ورود / ثبت‌نام" eyebrow="حساب کاربری" description="ورود آزمایشی به حساب‌های موجود در دیتابیس Staging فعال است. ثبت‌نام جدید تا تکمیل تنظیمات امنیتی و QA غیرفعال می‌ماند.">
    <section className="pl-auth-panel"><form className="pl-auth-form" onSubmit={handleLogin}><h2>ورود به حساب آزمایشی</h2><label htmlFor="pl-login-email">آدرس ایمیل</label><input id="pl-login-email" type="email" autoComplete="username" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} required/><label htmlFor="pl-login-password">رمز عبور</label><input id="pl-login-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="pl-primary-button" type="submit" disabled={busy||!supabase}>{busy?'در حال ورود…':'ورود'}</button>{message&&<p className="pl-auth-message" role="status">{message}</p>}<p className="pl-auth-note">این فرم فقط به پروژه Staging متصل است؛ اطلاعات ورود به دیتابیس اصلی ارسال نمی‌شود.</p></form><div className="pl-auth-placeholder"><h2>ثبت‌نام غیرفعال</h2><p>فعلاً فقط ورود به حساب‌های آزمایشی موجود فعال است. ثبت‌نام جدید پس از تکمیل تنظیمات امنیتی و QA غیرفعال خواهد ماند.</p></div></section>
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
