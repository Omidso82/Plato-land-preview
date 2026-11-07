import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import Series2PredictionReport from './Series2PredictionReport';

const BUCKET = 'series2-slides';
const POSTER_PATH = 'poster/series2-prize-poster';
// Temporarily hide the 18-slot editor without deleting its code or stored images.
const SHOW_SLIDE_EDITOR = false;
type SlideFile = { name: string; url: string; updated_at?: string };

export default function Series2SlidesManager() {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [signedIn,setSignedIn] = useState(false);
  const [checking,setChecking] = useState(true);
  const [owner,setOwner] = useState(false);
  const [files,setFiles] = useState<SlideFile[]>([]);
  const [poster,setPoster] = useState<SlideFile|null>(null);
  const [posterSelected,setPosterSelected] = useState<File|null>(null);
  const [posterBusy,setPosterBusy] = useState(false);
  const [selected,setSelected] = useState<Record<number,File>>({});
  const [busySlot,setBusySlot] = useState<number|null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');

  async function verifyOwner() {
    if (!supabase) { setMessage('اتصال به سرویس اصلی برقرار نیست.'); setChecking(false); return; }
    setChecking(true);
    const {data:{user}} = await supabase.auth.getUser();
    if (!user) { setSignedIn(false); setOwner(false); setChecking(false); return; }
    setSignedIn(true);
    const {data,error} = await supabase.from('user_roles').select('role').eq('user_id',user.id).maybeSingle();
    const allowed = !error && data?.role === 'owner';
    setOwner(allowed);
    setChecking(false);
    if (allowed) { if (SHOW_SLIDE_EDITOR) await loadSlides(); await loadPoster(); }
    else setMessage('این بخش فقط برای حساب مالک کل فعال است.');
  }

  async function loadSlides() {
    if (!supabase) return;
    const {data,error} = await supabase.storage.from(BUCKET).list('slides',{limit:60,sortBy:{column:'name',order:'asc'}});
    if (error) { setMessage('خواندن فهرست تصاویر ناموفق بود: '+error.message); return; }
    const rows = (data||[]).filter(x => /^(\d{2})(\.(jpe?g|png|webp))?$/i.test(x.name));
    setFiles(rows.map(x => ({name:x.name,url:supabase.storage.from(BUCKET).getPublicUrl('slides/'+x.name).data.publicUrl,updated_at:x.updated_at})));
  }

  async function loadPoster() {
    if (!supabase) return;
    const {data,error} = await supabase.storage.from(BUCKET).list('poster',{limit:10});
    if (error) { setMessage('خواندن پوستر ثابت ناموفق بود: '+error.message); return; }
    const item = (data||[]).find(x => x.name === 'series2-prize-poster');
    setPoster(item ? {
      name:item.name,
      url:supabase.storage.from(BUCKET).getPublicUrl(POSTER_PATH).data.publicUrl,
      updated_at:item.updated_at
    } : null);
  }

  useEffect(() => { void verifyOwner(); }, []);

  async function login(e:React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setMessage('');
    const {error} = await supabase.auth.signInWithPassword({email:email.trim(),password});
    if (error) setMessage('ورود ناموفق بود: '+error.message);
    else { setPassword(''); await verifyOwner(); }
    setBusy(false);
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
      const storage=supabase.storage.from(BUCKET);
      // Update the existing stable object directly; use upload only for the first poster.
      const {data:existing,error:listError}=await storage.list('poster',{limit:10});
      if(listError) throw new Error('بررسی پوستر فعلی ناموفق بود: '+listError.message);
      const exists=(existing||[]).some(item=>item.name==='series2-prize-poster');
      const result=exists
        ? await storage.update(POSTER_PATH,posterSelected,{contentType:posterSelected.type,cacheControl:'0'})
        : await storage.upload(POSTER_PATH,posterSelected,{upsert:false,contentType:posterSelected.type,cacheControl:'0'});
      if(result.error) throw new Error('ذخیره پوستر: '+result.error.message);
      const freshUrl=storage.getPublicUrl(POSTER_PATH).data.publicUrl;
      setPoster({name:'series2-prize-poster',url:freshUrl,updated_at:new Date().toISOString()});
      setPosterSelected(null);
      setMessage('پوستر جدید ذخیره شد. نسخه تازه برای نمایش عمومی آماده است.');
    } catch(e) { setMessage(e instanceof Error?e.message:'بارگذاری پوستر ناموفق بود.'); }
    finally { setPosterBusy(false); }
  }

  async function signOut() { await supabase?.auth.signOut(); setSignedIn(false); setOwner(false); setFiles([]); }

  if (checking) return <main dir="rtl" style={shell}><section style={panel}>در حال بررسی دسترسی مالک…</section></main>;
  if (!signedIn) return <main dir="rtl" style={shell}><section style={panel}>
    <h1 style={heading}>ورود مالک · مدیریت تصاویر سری دوم</h1>
    <p style={muted}>این مسیر عمومی نیست و فقط حساب مالک اجازه بارگذاری تصاویر را دارد.</p>
    <form onSubmit={login} style={{display:'grid',gap:12}}>
      <label style={muted}>ایمیل حساب مالک<input style={field} type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label style={muted}>رمز عبور<input style={field} type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button style={primary} disabled={busy}>{busy?'در حال ورود…':'ورود امن'}</button>
    </form>{message&&<p role="alert" style={muted}>{message}</p>}
  </section></main>;
  if (!owner) return <main dir="rtl" style={shell}><section style={panel}><h1 style={heading}>دسترسی غیرمجاز</h1><p style={muted}>این ابزار فقط در اختیار مالک کل است.</p><button style={primary} onClick={signOut}>خروج</button></section></main>;

  return <main dir="rtl" style={shell}><section style={panel}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <div><h1 style={heading}>پنل مدیریت موقت سری دوم</h1><p style={muted}>در این بخش می‌توانی تصویر صفحهٔ اول مسابقات را تغییر بدهی و گزارش پیش‌بینی قهرمان را ببینی.</p></div>
      <button style={secondary} onClick={signOut}>خروج از پنل</button>
    </div>
    <section style={{marginTop:20,padding:16,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <div><h2 style={{color:'#f6e8c5',fontSize:19,margin:'0 0 6px'}}>پوستر ثابت مسابقات</h2><p style={muted}>این تصویر مستقل از ۱۸ اسلاید است و همیشه زیر لوگوی PLATO LAND و بالای بخش‌های مسابقات نمایش داده می‌شود.</p></div>
        <span style={{color:poster?'#e4c77e':'#a9a08e',fontSize:12}}>{poster?'پوستر ثبت‌شده':'هنوز پوستری بارگذاری نشده'}</span>
      </div>
      {poster?<img src={poster.url+'?v='+(poster.updated_at||'current')} alt="پیش‌نمایش پوستر ثابت مسابقات" style={{display:'block',maxWidth:'100%',maxHeight:220,objectFit:'contain',margin:'12px auto',borderRadius:9,background:'#090a0c'}}/>:<div style={{minHeight:90,display:'grid',placeItems:'center',color:'#8e8778',background:'#090a0c',borderRadius:9,marginTop:12}}>پیش‌نمایش پوستر پس از بارگذاری نمایش داده می‌شود</div>}
      <label style={{...muted,display:'block',marginTop:12}}>انتخاب پوستر ثابت مسابقات (JPG، PNG یا WEBP)
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPosterSelected(e.target.files?.[0]||null)} style={{...field,padding:8,fontSize:12}}/>
      </label>
      {posterSelected&&<p style={{...muted,margin:'6px 0'}}>فایل انتخاب‌شده: {posterSelected.name}</p>}
      <button style={{...primary,width:'100%',marginTop:8}} disabled={posterBusy||!posterSelected} onClick={()=>void uploadPoster()}>
        {posterBusy?'در حال ذخیره…':poster?'جایگزینی پوستر ثابت':'ذخیره پوستر ثابت'}
      </button>
      <small style={{display:'block',color:'#a9a08e',marginTop:7}}>جایگاه ذخیره‌سازی مستقل؛ بدون تغییر در اسلایدهای ۱ تا ۱۸ · حداکثر ۱۰ مگابایت</small>
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
    )}
    <Series2PredictionReport />
    {message&&<p role="status" style={{...muted,marginTop:16}}>{message}</p>}
  </section></main>;
}

const shell:React.CSSProperties={minHeight:'100vh',background:'radial-gradient(ellipse at 50% 0%,#292216 0,#111214 48%,#090a0c 100%)',color:'#f4f0e8',padding:'28px 16px',fontFamily:'inherit'};
const panel:React.CSSProperties={maxWidth:1050,margin:'30px auto',padding:24,border:'1px solid #705b31',borderRadius:16,background:'#171819',boxShadow:'0 20px 70px #0008'};
const heading:React.CSSProperties={color:'#f6e8c5',fontSize:24,margin:'0 0 8px'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.9};
const field:React.CSSProperties={display:'block',width:'100%',marginTop:7,background:'#101113',border:'1px solid #6a5a37',borderRadius:8,color:'#fff',padding:12};
const primary:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'12px 18px',fontWeight:700,cursor:'pointer'};
const secondary:React.CSSProperties={background:'#252525',border:'1px solid #555',color:'#ddd',borderRadius:9,padding:'10px 14px',cursor:'pointer'};
