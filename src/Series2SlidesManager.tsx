import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

const BUCKET = 'series2-slides';
type SlideFile = { name: string; url: string; updated_at?: string };

export default function Series2SlidesManager() {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [signedIn,setSignedIn] = useState(false);
  const [checking,setChecking] = useState(true);
  const [owner,setOwner] = useState(false);
  const [files,setFiles] = useState<SlideFile[]>([]);
  const [selected,setSelected] = useState<FileList|null>(null);
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
    if (allowed) await loadSlides();
    else setMessage('این بخش فقط برای حساب مالک کل فعال است.');
  }

  async function loadSlides() {
    if (!supabase) return;
    const {data,error} = await supabase.storage.from(BUCKET).list('slides',{limit:30,sortBy:{column:'name',order:'asc'}});
    if (error) { setMessage('خواندن فهرست تصاویر ناموفق بود: '+error.message); return; }
    const rows = (data||[]).filter(x => /^\d{2}\.(jpe?g|png|webp)$/i.test(x.name));
    setFiles(rows.map(x => ({name:x.name,url:supabase.storage.from(BUCKET).getPublicUrl('slides/'+x.name).data.publicUrl,updated_at:x.updated_at})));
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

  async function upload() {
    if (!supabase || !selected || selected.length !== 18) { setMessage('برای ثبت کامل، دقیقاً ۱۸ تصویر انتخاب کن.'); return; }
    const ordered = Array.from(selected).sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true}));
    const invalid = ordered.find(f=>!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size>10*1024*1024);
    if (invalid) { setMessage('فرمت تصاویر باید JPG، PNG یا WEBP و حجم هر تصویر حداکثر ۱۰ مگابایت باشد.'); return; }
    setBusy(true); setMessage('در حال بارگذاری تصاویر…');
    try {
      for (let i=0;i<ordered.length;i++) {
        const file=ordered[i];
        const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace('jpeg','jpg');
        const path='slides/'+String(i+1).padStart(2,'0')+'.'+ext;
        const {error}=await supabase.storage.from(BUCKET).upload(path,file,{upsert:true,contentType:file.type,cacheControl:'60'});
        if(error) throw new Error('اسلاید '+(i+1)+': '+error.message);
      }
      setSelected(null);
      const input=document.getElementById('series2-slide-files') as HTMLInputElement|null;
      if(input) input.value='';
      await loadSlides();
      setMessage('هر ۱۸ تصویر با موفقیت ذخیره شد. صفحه عمومی اکنون تصاویر جدید را نمایش می‌دهد.');
    } catch(e) { setMessage(e instanceof Error?e.message:'بارگذاری تصاویر ناموفق بود.'); }
    finally { setBusy(false); }
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
      <div><h1 style={heading}>مدیریت خصوصی اسلایدهای سری دوم</h1><p style={muted}>این صفحه فقط برای مالک است و در صفحه عمومی هیچ منو یا پیوندی به آن وجود ندارد.</p></div>
      <button style={secondary} onClick={signOut}>خروج از پنل</button>
    </div>
    <div style={{border:'1px solid #6b572e',borderRadius:12,padding:16,marginTop:18}}>
      <strong style={{color:'#f0d991'}}>بارگذاری مجموعه ۱۸ اسلاید</strong>
      <p style={muted}>۱۸ تصویر را با نام‌های مرتب‌شده انتخاب کن؛ ترتیب نام فایل‌ها مبنای اتصال به اسلایدهای ۰۱ تا ۱۸ است. هر تصویر حداکثر ۱۰ مگابایت.</p>
      <input id="series2-slide-files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setSelected(e.target.files)} style={{...field,padding:10}}/>
      <p style={muted}>{selected?selected.length+' فایل انتخاب شده':'هنوز فایلی انتخاب نشده است.'}</p>
      <button style={primary} disabled={busy||!selected||selected.length!==18} onClick={()=>void upload()}>{busy?'در حال انجام…':'ذخیره هر ۱۸ تصویر'}</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(125px,1fr))',gap:10,marginTop:20}}>
      {Array.from({length:18},(_,i)=>{const n=String(i+1).padStart(2,'0');const f=files.find(x=>x.name.startsWith(n+'.'));return <div key={n} style={{border:'1px solid #39352b',borderRadius:9,padding:8}}>
        <div style={{color:'#d9b65d',fontSize:12,marginBottom:6}}>اسلاید {n}</div>
        {f?<img src={f.url} alt={'اسلاید '+n} style={{width:'100%',height:110,objectFit:'contain',background:'#090a0c'}}/>:<div style={{height:110,display:'grid',placeItems:'center',color:'#8e8778',background:'#111214'}}>تصویر ثبت نشده</div>}
        <small style={{color:'#a9a08e'}}>{f?'بارگذاری شده':'در انتظار تصویر'}</small>
      </div>})}
    </div>
    {message&&<p role="status" style={{...muted,marginTop:16}}>{message}</p>}
  </section></main>;
}

const shell:React.CSSProperties={minHeight:'100vh',background:'radial-gradient(ellipse at 50% 0%,#292216 0,#111214 48%,#090a0c 100%)',color:'#f4f0e8',padding:'28px 16px',fontFamily:'inherit'};
const panel:React.CSSProperties={maxWidth:850,margin:'30px auto',padding:24,border:'1px solid #705b31',borderRadius:16,background:'#171819',boxShadow:'0 20px 70px #0008'};
const heading:React.CSSProperties={color:'#f6e8c5',fontSize:24,margin:'0 0 8px'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.9};
const field:React.CSSProperties={display:'block',width:'100%',marginTop:7,background:'#101113',border:'1px solid #6a5a37',borderRadius:8,color:'#fff',padding:12};
const primary:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'12px 18px',fontWeight:700,cursor:'pointer'};
const secondary:React.CSSProperties={background:'#252525',border:'1px solid #555',color:'#ddd',borderRadius:9,padding:'10px 14px',cursor:'pointer'};
