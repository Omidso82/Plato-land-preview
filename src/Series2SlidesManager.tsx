import React, { Component, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { deleteR2Media } from './r2MediaDeleteClient';

const SERIES2_POSTER_API = 'https://plato-land-media-pages.pages.dev/api/series3-media?asset=series2-poster';
import Series2FinalistPredictionAdmin from './Series2FinalistPredictionAdmin';
import Series2ResultsManager from './Series2ResultsManager';
import PlatoIdScannerApp from './PlatoIdScannerApp';
import { Series3SlidesPanel } from './Series3SlidesPanel';
import { Series3VideoManager } from './Series3VideoManager';
import Series3RegistrationReport from './Series3RegistrationReport';
import Series3SeedingManager from './Series3SeedingManager';
import Series3TelegramManager from './Series3TelegramManager';
import PredictionCampaignManager from './PredictionCampaignManager';
import TemporaryPlayerBank from './TemporaryPlayerBank';

type ScannerAccess = { user_id:string; email:string; status:'pending'|'approved'|'suspended'; requested_at:string };

const BUCKET = 'series2-slides';
// Temporarily hide the 18-slot editor without deleting its code or stored images.
const SHOW_SLIDE_EDITOR = false;
type SlideFile = { name: string; url: string; updated_at?: string };

export default function Series2SlidesManager() {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [signedIn,setSignedIn] = useState(false);
  const [checking,setChecking] = useState(true);
  const [owner,setOwner] = useState(false);
  const [operators,setOperators] = useState<ScannerAccess[]>([]);
  const [signup,setSignup] = useState(false);
  const [files,setFiles] = useState<SlideFile[]>([]);
  const [poster,setPoster] = useState<SlideFile|null>(null);
  const [posterSelected,setPosterSelected] = useState<File|null>(null);
  const [posterBusy,setPosterBusy] = useState(false);
  const [posterDeleteConfirm,setPosterDeleteConfirm] = useState(false);
  const [posterDeleteBusy,setPosterDeleteBusy] = useState(false);
  const [selected,setSelected] = useState<Record<number,File>>({});
  const [busySlot,setBusySlot] = useState<number|null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [scannerOpen,setScannerOpen] = useState(false);
  const [managerPage,setManagerPage] = useState<'home'|'series3'|'series2'|'predictions'|'players'>('home');

  async function verifyOwner() {
    if (!supabase) { setMessage('اتصال به سرویس اصلی برقرار نیست.'); setChecking(false); return; }
    setChecking(true);
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) { setSignedIn(false); setOwner(false); setChecking(false); return; }
    setSignedIn(true);
    const {data:role,error:roleError} = await supabase.rpc('current_user_role');
    const allowed = !roleError && (role === 'owner' || role === 'مالک کل');
    setOwner(allowed);
    if (allowed) {
      const {data:rows,error:rowsError}=await supabase.from('plato_id_scanner_access')
        .select('user_id,email,status,requested_at').order('requested_at',{ascending:false});
      if(rowsError) setMessage('خواندن فهرست اپراتورها ناموفق بود: '+rowsError.message);
      else setOperators((rows||[]) as ScannerAccess[]);
      if (SHOW_SLIDE_EDITOR) await loadSlides();
      await loadPoster();
    } else {
      let {data:access,error:accessError}=await supabase.from('plato_id_scanner_access')
        .select('user_id,email,status,requested_at').eq('user_id',user.id).maybeSingle();
      if(accessError) setMessage('بررسی دسترسی اسکنر ناموفق بود: '+accessError.message);
      else if(!access) {
        const created=await supabase.from('plato_id_scanner_access')
          .insert({user_id:user.id,email:user.email||''})
          .select('user_id,email,status,requested_at').single();
        if(created.error) setMessage('ثبت درخواست اپراتوری ناموفق بود: '+created.error.message);
        else access=created.data as ScannerAccess;
      }
    }
    setChecking(false);
  }

  async function loadSlides() {
    if (!supabase) return;
    const {data,error} = await supabase.storage.from(BUCKET).list('slides',{limit:60,sortBy:{column:'name',order:'asc'}});
    if (error) { setMessage('خواندن فهرست تصاویر ناموفق بود: '+error.message); return; }
    const rows = (data||[]).filter(x => /^(\d{2})(\.(jpe?g|png|webp))?$/i.test(x.name));
    setFiles(rows.map(x => ({name:x.name,url:supabase.storage.from(BUCKET).getPublicUrl('slides/'+x.name).data.publicUrl,updated_at:x.updated_at})));
  }

  async function loadPoster() {
    const response=await fetch(SERIES2_POSTER_API,{method:'HEAD',credentials:'omit',mode:'cors',cache:'no-store'});
    if(response.status===404){setPoster(null);return;}
    if(!response.ok){setMessage('بررسی پوستر ثابت در Cloudflare R2 ناموفق بود: HTTP '+response.status);return;}
    const size=Number(response.headers.get('Content-Length')||'0');
    const type=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
    if(size<=0||!['image/jpeg','image/png','image/webp'].includes(type)){setMessage('مشخصات فایل پوستر در R2 معتبر نیست.');return;}
    setPoster({name:'main-poster',url:SERIES2_POSTER_API,updated_at:response.headers.get('ETag')||'r2'});
  }

  useEffect(() => { void verifyOwner(); }, []);

  async function login(e:React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setMessage('');
    const result = signup
      ? await supabase.auth.signUp({email:email.trim(),password})
      : await supabase.auth.signInWithPassword({email:email.trim(),password});
    if (result.error) setMessage((signup?'ثبت‌نام':'ورود')+' ناموفق بود: '+result.error.message);
    else if (signup && !result.data.session?.user) {
      setMessage('ثبت‌نام انجام شد. ایمیل تأیید را باز کن؛ سپس از همین صفحه وارد شو تا درخواست اپراتوری ثبت شود.');
      setSignup(false);
    } else {
      setPassword('');
      await verifyOwner();
      if(signup) setMessage('حساب ساخته شد و درخواست دسترسی برای تأیید مالک ثبت شد.');
    }
    setBusy(false);
  }

  async function changeOperatorStatus(row:ScannerAccess,next:ScannerAccess['status']) {
    if(!supabase||!owner)return;
    setBusy(true);setMessage('');
    try {
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error('نشست مالک معتبر نیست.');
      const {error}=await supabase.from('plato_id_scanner_access')
        .update({status:next,reviewed_by:user.id,reviewed_at:new Date().toISOString()})
        .eq('user_id',row.user_id);
      if(error)throw error;
      setMessage('وضعیت اپراتور به‌روزرسانی شد.');
      await verifyOwner();
    } catch(e) { setMessage('تغییر دسترسی انجام نشد: '+(e instanceof Error?e.message:'خطای ناشناخته')); }
    finally {setBusy(false);}
  }

  async function uploadSlide(number:number) {
    const file=selected[number];
    if (!supabase || !file) { setMessage('ابتدا تصویر همین اسلاید را انتخاب کن.'); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size>10*1024*1024) {
      setMessage('فرمت تصویر باید JPG، PNG یا WEBP و حجم آن حداکثر ۱۰ مگابایت باشد.');
      return;
    }
    setBusySlot(number); setMessage('در حال ذخیره تصویر اسلاید '+number+'…');
    try {
      const key=String(number).padStart(2,'0');
      // Every slide has one stable storage key, independent of file name, extension or picker order.
      const {error}=await supabase.storage.from(BUCKET).upload('slides/'+key,file,{
        upsert:true,contentType:file.type,cacheControl:'0'
      });
      if(error) throw new Error('اسلاید '+number+': '+error.message);
      // Remove legacy numbered files from the previous bulk uploader so they cannot override this slot.
      const {data:legacy}=await supabase.storage.from(BUCKET).list('slides',{limit:60});
      const old=(legacy||[]).filter(x=>new RegExp('^'+key+'\\.(jpe?g|png|webp)$','i').test(x.name)).map(x=>'slides/'+x.name);
      if(old.length) {
        const {error:removeError}=await supabase.storage.from(BUCKET).remove(old);
        if(removeError) throw new Error('تصویر ذخیره شد، اما پاک‌سازی نسخه قدیمی اسلاید '+number+' ناموفق بود: '+removeError.message);
      }
      setSelected(prev=>{const next={...prev};delete next[number];return next;});
      await loadSlides();
      setMessage('تصویر اسلاید '+number+' با موفقیت ذخیره شد.');
    } catch(e) { setMessage(e instanceof Error?e.message:'بارگذاری تصویر ناموفق بود.'); }
    finally { setBusySlot(null); }
  }

  async function uploadPoster() {
    if (!supabase || !posterSelected) { setMessage('ابتدا تصویر پوستر ثابت را انتخاب کن.'); return; }
    if (!/^image\/(jpeg|png|webp)$/.test(posterSelected.type) || posterSelected.size>10*1024*1024) {
      setMessage('فرمت پوستر باید JPG، PNG یا WEBP و حجم آن حداکثر ۱۰ مگابایت باشد.');
      return;
    }
    setPosterBusy(true); setMessage('در حال ذخیره تصویر صفحهٔ اول مسابقات…');
    try {
      const {data,error:sessionError}=await supabase.auth.getSession();
      if(sessionError)throw sessionError;
      const token=data.session?.access_token;
      if(!token)throw new Error('نشست معتبر مالک پیدا نشد.');
      const form=new FormData();form.set('file',posterSelected,posterSelected.name);
      const uploaded=await fetch(SERIES2_POSTER_API,{method:'POST',headers:{Authorization:'Bearer '+token},body:form,credentials:'omit',mode:'cors',cache:'no-store'});
      const result=await uploaded.json().catch(()=>({}));
      if(!uploaded.ok)throw new Error(result.error||'ذخیره پوستر در Cloudflare R2 ناموفق بود.');
      if(result.asset!=='series2-poster'||result.size!==posterSelected.size||result.key!=='plato-land/backgammon/series-2/posters/main-poster')throw new Error('پاسخ ذخیره‌سازی با مسیر ثابت پوستر سری دوم مطابقت ندارد.');
      const checked=await fetch(SERIES2_POSTER_API,{method:'HEAD',credentials:'omit',mode:'cors',cache:'no-store'});
      if(!checked.ok)throw new Error('آپلود انجام شد، اما بررسی فایل در R2 ناموفق بود.');
      const storedSize=Number(checked.headers.get('Content-Length')||'0');
      const storedType=(checked.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
      if(storedSize!==posterSelected.size||storedType!==posterSelected.type)throw new Error('تأیید حجم یا نوع فایل در R2 ناموفق بود.');
      setPoster({name:'main-poster',url:SERIES2_POSTER_API,updated_at:checked.headers.get('ETag')||new Date().toISOString()});
      setPosterSelected(null);
      setMessage('پوستر در Cloudflare R2 ذخیره و با HEAD تأیید شد؛ آماده نمایش عمومی است.');
    } catch(e) { setMessage(e instanceof Error?e.message:'بارگذاری پوستر ناموفق بود.'); }
    finally { setPosterBusy(false); }
  }

  async function deletePoster() {
    if (!supabase || !owner) return;
    setPosterDeleteBusy(true); setMessage('در حال حذف پوستر از Cloudflare R2…');
    try {
      const {data,error}=await supabase.auth.getSession();
      if(error)throw error;
      const token=data.session?.access_token;
      if(!token)throw new Error('نشست معتبر مالک پیدا نشد.');
      const result=await deleteR2Media('series2-poster',token);
      await loadPoster();
      setPosterDeleteConfirm(false);
      setMessage(result.alreadyMissing
        ? 'فایل از قبل در R2 وجود نداشت؛ پنل به‌روزرسانی شد.'
        : 'پوستر از Cloudflare R2 حذف و نبودن آن با بررسی سرور تأیید شد.');
    } catch(e) {
      setMessage('حذف پوستر کامل نشد: '+(e instanceof Error?e.message:'خطای ناشناخته'));
    } finally { setPosterDeleteBusy(false); }
  }

  async function signOut() { await supabase?.auth.signOut(); setSignedIn(false); setOwner(false); setOperators([]); setFiles([]); setMessage(''); }

  if (checking) return <main dir="rtl" style={shell}><section style={panel}>در حال بررسی دسترسی مالک…</section></main>;
  if (!signedIn) return <main dir="rtl" style={shell}><section style={panel}>    <h1 style={heading}>ورود به پنل موقت سری دوم</h1>
    <p style={muted}>مالک با حساب فعلی وارد می‌شود؛ اپراتور جدید می‌تواند از همین صفحه درخواست دسترسی ثبت کند.</p>
    <form onSubmit={login} style={{display:'grid',gap:12}}>
      <label style={muted}>ایمیل حساب مالک<input style={field} type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label style={muted}>رمز عبور<input style={field} type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button style={primary} disabled={busy}>{busy?'لطفاً صبر کن…':signup?'ساخت حساب اپراتور':'ورود امن'}</button>
    </form><button type="button" style={secondary} onClick={()=>{setSignup(!signup);setMessage('')}}>{signup?'بازگشت به ورود':'ثبت‌نام اپراتور جدید'}</button>{message&&<p role="alert" style={muted}>{message}</p>}
  </section></main>;
  if (!owner) return <PlatoIdScannerApp embedded />;

  return <main dir="rtl" style={shell}><section style={panel}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <div><h1 style={heading}>پنل مدیریت موقت PLATO LAND</h1><p style={muted}>بخش موردنظر را انتخاب کن تا ابزارهای هر سری جداگانه نمایش داده شوند.</p></div>
      <button style={secondary} onClick={signOut}>خروج از پنل</button>
    </div>
    {managerPage==='home'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:14,marginTop:18}}>
      <button type="button" onClick={()=>setManagerPage('series3')} style={{textAlign:'right',padding:20,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#2b2113,#121315)',color:'#f6e8c5',cursor:'pointer'}}>
        <strong style={{display:'block',fontSize:20,marginBottom:8}}>مدیریت سری سوم تخته‌نرد</strong>
        <span style={{fontSize:13,lineHeight:1.9,color:'#c9c0ad'}}>مدیریت پوستر و ۱۷ قانون تصویری، به‌همراه گزارش ثبت‌نام‌کنندگان و Plato IDها</span>
      </button>
      <button type="button" onClick={()=>setManagerPage('predictions')} style={{textAlign:'right',padding:20,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#302313,#121315)',color:'#f6e8c5',cursor:'pointer'}}>
        <strong style={{display:'block',fontSize:20,marginBottom:8}}>مدیریت پیش‌بینی‌ها</strong>
        <span style={{fontSize:13,lineHeight:1.9,color:'#c9c0ad'}}>ساخت پیش‌بینی‌های مستقل، تنظیم جایزه و مهلت، انتشار و کنترل باز یا بسته بودن</span>
      </button>
      <button type="button" onClick={()=>setManagerPage('series2')} style={{textAlign:'right',padding:20,border:'1px solid #705b31',borderRadius:14,background:'#151617',color:'#f6e8c5',cursor:'pointer'}}>
        <strong style={{display:'block',fontSize:20,marginBottom:8}}>مدیریت سری دوم و ابزارهای دیگر</strong>
        <span style={{fontSize:13,lineHeight:1.9,color:'#c9c0ad'}}>پوستر سری دوم، نتایج، پیش‌بینی‌ها، دسترسی اپراتورها و اسکنر Plato ID</span>
      </button>
      <button type="button" onClick={()=>setManagerPage('players')} style={{textAlign:'right',padding:20,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#302313,#121315)',color:'#f6e8c5',cursor:'pointer'}}>
        <strong style={{display:'block',fontSize:20,marginBottom:8}}>بانک دائمی بازیکنان</strong>
        <span style={{fontSize:13,lineHeight:1.9,color:'#c9c0ad'}}>جست‌وجوی Plato ID و مشاهده سابقه ثبت‌نام، برد، باخت و حریفان در سری دوم و سوم</span>
      </button>
    </div>}
    {managerPage==='players'&&<>
      <button type="button" style={secondary} onClick={()=>setManagerPage('home')}>← بازگشت به انتخاب بخش‌ها</button>
      <TemporaryPlayerBank />
    </>}
    {managerPage==='predictions'&&<>
      <button type="button" style={secondary} onClick={()=>setManagerPage('home')}>← بازگشت به انتخاب بخش‌ها</button>
      <PredictionCampaignManager />
    </>}
    {managerPage==='series3'&&<>
      <button type="button" style={secondary} onClick={()=>setManagerPage('home')}>← بازگشت به انتخاب بخش‌ها</button>
      <h2 style={{...heading,marginTop:18}}>مدیریت سری سوم مسابقات تخته‌نرد</h2>
      <Series3SectionBoundary title="مدیریت تصاویر و تیزر سری سوم"><Series3SlidesPanel /></Series3SectionBoundary>
      <Series3SectionBoundary title="مدیریت ویدیوی قوانین سری سوم"><Series3VideoManager /></Series3SectionBoundary>
      <Series3SectionBoundary title="گزارش ثبت‌نام سری سوم"><Series3RegistrationReport /></Series3SectionBoundary>
      <Series3SectionBoundary title="سیدبندی و نتایج سری سوم"><Series3SeedingManager /></Series3SectionBoundary>
      <Series3SectionBoundary title="گزارش‌ها و مدیریت تلگرام سری سوم"><Series3TelegramManager /></Series3SectionBoundary>
    </>}
    {managerPage==='series2'&&<>
      <button type="button" style={secondary} onClick={()=>setManagerPage('home')}>← بازگشت به انتخاب بخش‌ها</button>
      <section style={{marginTop:20,padding:16,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div><h2 style={{color:'#f6e8c5',fontSize:19,margin:'0 0 6px'}}>پوستر ثابت مسابقات</h2><p style={muted}>این تصویر مستقل از ۱۸ اسلاید است و در Cloudflare R2 ذخیره می‌شود.</p></div>
        <span style={{color:poster?'#e4c77e':'#a9a08e',fontSize:12}}>{poster?'پوستر ثبت‌شده':'هنوز پوستری بارگذاری نشده'}</span>
      </div>
      {poster?<img src={poster.url} alt="پیش‌نمایش پوستر ثابت مسابقات" style={{display:'block',maxWidth:'100%',maxHeight:220,objectFit:'contain',margin:'12px auto',borderRadius:9,background:'#090a0c'}}/>:<div style={{minHeight:90,display:'grid',placeItems:'center',color:'#8e8778',background:'#090a0c',borderRadius:9,marginTop:12}}>پیش‌نمایش پوستر پس از بارگذاری نمایش داده می‌شود</div>}
      <label style={{...muted,display:'block',marginTop:12}}>انتخاب پوستر ثابت مسابقات (JPG، PNG یا WEBP)
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPosterSelected(e.target.files?.[0]||null)} style={{...field,padding:8,fontSize:12}}/>
      </label>
      {posterSelected&&<p style={{...muted,margin:'6px 0'}}>فایل انتخاب‌شده: {posterSelected.name}</p>}
      <button style={{...primary,width:'100%',marginTop:8}} disabled={posterBusy||!posterSelected} onClick={()=>void uploadPoster()}>
        {posterBusy?'در حال ذخیره…':poster?'جایگزینی پوستر ثابت':'ذخیره پوستر ثابت'}
      </button>
      <small style={{display:'block',color:'#a9a08e',marginTop:7}}>Cloudflare R2 · حداکثر ۱۰ مگابایت</small>
      {poster&&<div style={{display:'grid',gap:8,marginTop:8}}>
        {!posterDeleteConfirm
          ? <button type="button" style={{...secondary,width:'100%',borderColor:'#8d4540',color:'#ffb2a8'}} disabled={posterDeleteBusy||posterBusy} onClick={()=>setPosterDeleteConfirm(true)}>حذف پوستر از R2</button>
          : <div style={{padding:10,border:'1px solid #8d4540',borderRadius:9,background:'#1b1111'}}>
              <p style={{...muted,margin:'0 0 8px',color:'#ffb2a8'}}>این کار فایل اصلی پوستر را برای همیشه از Cloudflare R2 حذف می‌کند. ادامه می‌دهی؟</p>
              <div style={{display:'flex',gap:8}}>
                <button type="button" style={{...secondary,flex:1}} disabled={posterDeleteBusy} onClick={()=>setPosterDeleteConfirm(false)}>انصراف</button>
                <button type="button" style={{...primary,flex:1,background:'#9f3932',borderColor:'#c45c52',color:'#fff'}} disabled={posterDeleteBusy} onClick={()=>void deletePoster()}>{posterDeleteBusy?'در حال حذف…':'تأیید حذف دائمی'}</button>
              </div>
            </div>}
      </div>}
{poster&&<div dir="rtl" style={{fontSize:11,lineHeight:1.9,color:'#a9c7a5',overflowWrap:'anywhere',background:'#10140f',border:'1px solid #344a34',borderRadius:8,padding:9,marginTop:9}}><strong>محل ذخیره:</strong> Cloudflare R2<br/><strong>Bucket:</strong> <code dir="ltr">plato-land</code><br/><strong>Object Key:</strong><br/><code dir="ltr">plato-land/backgammon/series-2/posters/main-poster</code></div>}
    </section>
    <section style={{marginTop:20,padding:16,border:'1px solid #705b31',borderRadius:12,background:'#111214'}}>
      <h2 style={{color:'#f6e8c5',fontSize:19,margin:'0 0 8px'}}>مدیریت دسترسی اپراتورها</h2>
      <p style={muted}>درخواست‌های ثبت‌شده را تأیید یا تعلیق کن. این مدیریت فقط در اختیار مالک است.</p>
      {operators.length===0?<p style={muted}>هنوز درخواست اپراتوری ثبت نشده است.</p>:operators.map(row=><div key={row.user_id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',padding:'10px 0',borderTop:'1px solid #38332a'}}>
        <div><strong style={{color:'#eee',overflowWrap:'anywhere'}}>{row.email}</strong><div style={muted}>وضعیت: {row.status==='pending'?'در انتظار':row.status==='approved'?'فعال':'تعلیق‌شده'} · {new Date(row.requested_at).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'})}</div></div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {row.status!=='approved'&&<button style={primary} disabled={busy} onClick={()=>void changeOperatorStatus(row,'approved')}>تأیید</button>}
          {row.status!=='suspended'&&<button style={secondary} disabled={busy} onClick={()=>void changeOperatorStatus(row,'suspended')}>تعلیق</button>}
          {row.status==='suspended'&&<button style={secondary} disabled={busy} onClick={()=>void changeOperatorStatus(row,'pending')}>بازگشت به انتظار</button>}
        </div>
      </div>)}
    </section>
    <section style={{marginTop:20,padding:16,border:'1px solid #b18b45',borderRadius:12,background:'#111214'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div><h2 style={{color:'#f6e8c5',fontSize:19,margin:'0 0 6px'}}>اسکنر تصاویر Plato ID</h2><p style={muted}>بارگذاری تصاویر، استخراج شناسه‌ها و بازبینی دستی نتایج</p></div>
        <button type="button" style={primary} onClick={()=>setScannerOpen(v=>!v)}>{scannerOpen?'بستن اسکنر':'ورود به اسکنر Plato ID'}</button>
      </div>
      {scannerOpen&&<div style={{marginTop:14}}><PlatoIdScannerApp ownerMode embedded /></div>}
    </section>
    {SHOW_SLIDE_EDITOR && (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:20}}>
      {Array.from({length:18},(_,i)=>{
        const number=i+1,key=String(number).padStart(2,'0');
        const f=files.find(x=>x.name===key)||files.find(x=>x.name.toLowerCase().startsWith(key+'.'));
        return <div key={key} style={{border:'1px solid #51452d',borderRadius:12,padding:12,background:'#111214'}}>
          <div style={{color:'#d9b65d',fontWeight:700,marginBottom:8}}>اسلاید {number}</div>
          {f?<img src={f.url+'?v='+(f.updated_at||'current')} alt={'اسلاید '+number} style={{width:'100%',height:145,objectFit:'contain',background:'#090a0c',borderRadius:8}}/>:<div style={{height:145,display:'grid',placeItems:'center',color:'#8e8778',background:'#090a0c',borderRadius:8}}>تصویر ثبت نشده</div>}
          <label style={{...muted,display:'block',marginTop:10}}>انتخاب تصویر مخصوص اسلاید {number}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)setSelected(prev=>({...prev,[number]:file}));}} style={{...field,padding:8,fontSize:12}}/>
          </label>
          {selected[number]&&<p style={{...muted,margin:'6px 0'}}>انتخاب‌شده: {selected[number].name}</p>}
          <button style={{...primary,width:'100%',marginTop:8}} disabled={busySlot!==null||!selected[number]} onClick={()=>void uploadSlide(number)}>
            {busySlot===number?'در حال ذخیره…':f?'جایگزینی تصویر اسلاید '+number:'ذخیره تصویر اسلاید '+number}
          </button>
          <small style={{display:'block',color:'#a9a08e',marginTop:7}}>{f?'تصویر در سایت ثبت شده':'در انتظار بارگذاری'} · حداکثر ۱۰ مگابایت</small>
        </div>;
      })}
    </div>
    )}    <Series2ResultsManager />
    <Series2FinalistPredictionAdmin />
    {message&&<p role="status" style={{...muted,marginTop:16}}>{message}</p>}
    </>}
  </section></main>;
}

type Series3SectionBoundaryProps = { title: string; children: React.ReactNode };
type Series3SectionBoundaryState = { error: Error | null };

// Keep one failing Series 3 tool from unmounting the entire temporary admin panel.
class Series3SectionBoundary extends Component<Series3SectionBoundaryProps, Series3SectionBoundaryState> {
  state: Series3SectionBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): Series3SectionBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PLATO LAND][Series 3 admin section]', this.props.title, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <section dir="rtl" role="alert" style={{ marginTop: 18, padding: 16, border: '1px solid #9b5148', borderRadius: 12, background: '#211314', color: '#ffe0dc' }}>
          <strong style={{ display: 'block', marginBottom: 8 }}>{this.props.title} با خطا مواجه شد؛ سایر بخش‌های پنل فعال می‌مانند.</strong>
          <p style={{ fontSize: 12, lineHeight: 1.8, overflowWrap: 'anywhere', margin: '0 0 10px' }}>{this.state.error.name}: {this.state.error.message || 'بدون توضیح خطا'}</p>
          <button type="button" onClick={() => this.setState({ error: null })} style={{ padding: '9px 13px', border: '1px solid #b18b45', borderRadius: 8, background: '#302313', color: '#f6e8c5', fontWeight: 700 }}>تلاش دوباره برای بارگذاری این بخش</button>
        </section>
      );
    }
    return this.props.children;
  }
}

const shell:React.CSSProperties={minHeight:'100vh',background:'radial-gradient(ellipse at 50% 0%,#292216 0,#111214 48%,#090a0c 100%)',color:'#f4f0e8',padding:'28px 16px',fontFamily:'inherit'};
const panel:React.CSSProperties={maxWidth:1050,margin:'30px auto',padding:24,border:'1px solid #705b31',borderRadius:16,background:'#171819',boxShadow:'0 20px 70px #0008'};
const heading:React.CSSProperties={color:'#f6e8c5',fontSize:24,margin:'0 0 8px'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.9};
const field:React.CSSProperties={display:'block',width:'100%',marginTop:7,background:'#101113',border:'1px solid #6a5a37',borderRadius:8,color:'#fff',padding:12};
const primary:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'12px 18px',fontWeight:700,cursor:'pointer'};
const secondary:React.CSSProperties={background:'#252525',border:'1px solid #555',color:'#ddd',borderRadius:9,padding:'10px 14px',cursor:'pointer'};