import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';

const endpoint='https://plato-land-media-pages.pages.dev/api/series4-media';
const slots=[
  {id:'poster',label:'پوستر'},
  {id:'teaser',label:'تیزر'},
  {id:'rules',label:'ویدیوی قوانین'},
  ...Array.from({length:17},(_,i)=>({id:'slide-'+String(i+1).padStart(2,'0'),label:'اسلاید '+(i+1).toLocaleString('fa-IR')})),
];

function mediaUrl(slot:string,key?:string) {
  const url=new URL(endpoint);
  url.searchParams.set('asset',slot);
  if(key)url.searchParams.set('key',key);
  return url;
}

export default function Series4MediaManager({rulesOnly=false}:{rulesOnly?:boolean}){
  const [slot,setSlot]=useState(rulesOnly?'rules':'poster');
  const [file,setFile]=useState<File|null>(null);
  const [archived,setArchived]=useState<Record<string,boolean>>({});
  const [preferences,setPreferences]=useState({homepage_slot:'poster',rules_enabled:false});
  const [saved,setSaved]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [preview,setPreview]=useState('');
  const video=slot==='teaser'||slot==='rules';
  useEffect(()=>{
    if(!supabase)return;
    let cancelled=false;
    void (async()=>{
      const [{data,error},settings]=await Promise.all([
        supabase.from('plato_land_series4_media').select('slot,object_key,is_active'),
        supabase.from('plato_land_series4_media_preferences').select('homepage_slot,rules_enabled').single(),
      ]);
      if(cancelled)return;
      if(error)setError('دریافت فهرست رسانه‌ها ناموفق بود.');
      else {
        setSaved(Object.fromEntries((data??[]).map(row=>[row.slot,row.object_key])));
        setArchived(Object.fromEntries((data??[]).map(row=>[row.slot,!row.is_active])));
      }
      if(settings.data)setPreferences(settings.data);
    })();
    return()=>{cancelled=true;};
  },[]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);

  async function operate(file?:File) {
    if(!supabase||busy)return;
    setBusy(true);setError('');setMessage('');
    try{
      const {data,error}=await supabase.auth.getSession();
      if(error||!data.session)throw new Error('نشست مالک در دسترس نیست.');
      const headers={Authorization:'Bearer '+data.session.access_token};
      if(!file){
        const key=saved[slot];
        if(!key)return;
        const response=await fetch(mediaUrl(slot,key),{headers,cache:'no-store'});
        if(!response.ok)throw new Error('دریافت رسانه برای پیش‌نمایش ناموفق بود.');
        setPreview(URL.createObjectURL(await response.blob()));
        return;
      }
      const allowed=video?file.type==='video/mp4':/^image\/(jpeg|png|webp)$/.test(file.type);
      if(!allowed||file.size<=0||file.size>(video?100:10)*1024*1024)throw new Error('فرمت یا حجم فایل معتبر نیست.');
      const body=new FormData();body.set('file',file,file.name);
      const response=await fetch(mediaUrl(slot),{method:'POST',headers,body,cache:'no-store'});
      const uploaded=await response.json().catch(()=>null);
      const prefix='plato-land/backgammon/series-4/owner-media/'+slot+'/';
      if(!response.ok||uploaded?.asset!==slot||uploaded?.size!==file.size||
        typeof uploaded?.key!=='string'||!uploaded.key.startsWith(prefix)||
        !/^[a-f0-9-]{36}$/.test(uploaded.key.slice(prefix.length)))throw new Error('آپلود رسانه تأیید نشد.');
      const head=await fetch(mediaUrl(slot,uploaded.key),{method:'HEAD',headers,cache:'no-store'});
      if(!head.ok||Number(head.headers.get('content-length'))!==file.size||
        head.headers.get('content-type')?.split(';')[0]!==file.type)throw new Error('فایل آپلود شد، ولی بررسی رسانه موفق نبود.');
      const {error:saveError}=await supabase.from('plato_land_series4_media').upsert({
        slot,object_key:uploaded.key,is_active:true,updated_at:new Date().toISOString(),updated_by:data.session.user.id,
      });
      if(saveError)throw new Error('فایل آپلود شد، اما ذخیره مرجع رسانه ناموفق بود.');
      setSaved(previous=>({...previous,[slot]:uploaded.key}));
      setArchived(previous=>({...previous,[slot]:false}));
      setFile(null);
      setPreview('');
      setMessage('رسانه ذخیره و تأیید شد.');
    }catch(error){
      setError(error instanceof Error?error.message:'عملیات رسانه ناموفق بود.');
    }finally{setBusy(false);}
  }

  async function savePreferences(next:typeof preferences) {
    if(!supabase||busy)return;
    setBusy(true);setError('');setMessage('');
    try{
      const {data,error}=await supabase.from('plato_land_series4_media_preferences')
        .update(next).eq('singleton',true).select('homepage_slot,rules_enabled').single();
      if(error)throw error;
      setPreferences(data);
      setMessage('تنظیم رسانه ذخیره شد.');
    }catch{setError('ذخیره تنظیم رسانه ناموفق بود.');}
    finally{setBusy(false);}
  }

  async function toggleArchive() {
    if(!supabase||busy||!saved[slot])return;
    const removing=!archived[slot];
    if(removing&&!window.confirm('رسانه از انتخاب‌های فعال کنار گذاشته شود؟ فایل در بایگانی می‌ماند.'))return;
    setBusy(true);setError('');setMessage('');
    try{
      const {data:session,error:authError}=await supabase.auth.getSession();
      if(authError||!session.session)throw new Error();
      const {error}=await supabase.from('plato_land_series4_media').update({
        is_active:!removing,updated_at:new Date().toISOString(),updated_by:session.session.user.id,
      }).eq('slot',slot).eq('object_key',saved[slot]).select('slot').single();
      if(error)throw error;
      setArchived(previous=>({...previous,[slot]:removing}));
      setMessage(removing?'رسانه بایگانی شد.':'رسانه دوباره فعال شد.');
    }catch{setError('تغییر وضعیت رسانه ناموفق بود.');}
    finally{setBusy(false);}
  }

  return <details dir="rtl" style={{marginTop:14,padding:14,border:'1px solid #8c6a34',borderRadius:13,color:'#f2ead8'}}>
    <summary style={{cursor:'pointer',color:'#e4c77e'}}>{rulesOnly ? 'مدیریت ویدیوی قوانین سری چهارم' : 'مدیریت تصاویر و تیزر سری چهارم'}</summary>
    <div style={{display:'grid',gap:10,marginTop:12}}>
      {!rulesOnly&&<>
        <strong>رسانه ترجیحی صفحه اول</strong>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          <button type="button" disabled={busy||preferences.homepage_slot==='poster'} onClick={()=>void savePreferences({...preferences,homepage_slot:'poster'})}>پوستر ثابت</button>
          <button type="button" disabled={busy||!saved.teaser||archived.teaser||preferences.homepage_slot==='teaser'} onClick={()=>void savePreferences({...preferences,homepage_slot:'teaser'})}>ویدیوی تیزر</button>
        </div>
        <span>انتخاب فعلی: {preferences.homepage_slot==='poster'?'پوستر ثابت':'ویدیوی تیزر'}</span>
        <label>رسانه <select value={slot} disabled={busy} onChange={event=>{setSlot(event.target.value);setFile(null);setPreview('');setError('');setMessage('');}}>
          {slots.filter(item=>item.id!=='rules').map(item=><option key={item.id} value={item.id}>{item.label}{archived[item.id]?' · بایگانی':saved[item.id]?' ✓':''}</option>)}
        </select></label>
      </>}
      <label>انتخاب فایل <input key={slot} type="file" accept={video?'video/mp4':'image/jpeg,image/png,image/webp'}
        disabled={busy} onChange={event=>{setFile(event.target.files?.[0]??null);event.target.value='';}}/></label>
      {file&&<span><bdi>{file.name}</bdi> · {(file.size/1024/1024).toFixed(1)} MB</span>}
      <button type="button" disabled={busy||!file} onClick={()=>{if(file)void operate(file);}}>
        {saved[slot]?'جایگزینی فایل':'بارگذاری فایل'}
      </button>
      <button type="button" disabled={busy||!saved[slot]} onClick={()=>void operate()}>پیش‌نمایش رسانه ذخیره‌شده</button>
      {rulesOnly&&<button type="button" disabled={busy||(!preferences.rules_enabled&&(!saved.rules||archived.rules))}
        onClick={()=>void savePreferences({...preferences,rules_enabled:!preferences.rules_enabled})}>
        {preferences.rules_enabled?'غیرفعال‌کردن ویدیوی قوانین':'فعال‌کردن ویدیوی قوانین در تنظیمات سری'}
      </button>}
      {saved[slot]&&<><small style={{overflowWrap:'anywhere'}}>Cloudflare R2 · <bdi>{saved[slot]}</bdi></small>
        <button type="button" disabled={busy} onClick={()=>void toggleArchive()}>{archived[slot]?'بازگرداندن رسانه':'بایگانی رسانه'}</button></>}
      {busy&&<span role="status">در حال انجام…</span>}
      {message&&<span role="status">{message}</span>}
      {error&&<span role="alert">{error}</span>}
      {preview&&(video?<video src={preview} controls playsInline style={{maxWidth:'100%'}}/>:
        <img src={preview} alt={slots.find(item=>item.id===slot)?.label} style={{maxWidth:'100%'}}/>)}
    </div>
  </details>;
}
