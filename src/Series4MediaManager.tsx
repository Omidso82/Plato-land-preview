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

export default function Series4MediaManager(){
  const [slot,setSlot]=useState('poster');
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
      const {data,error}=await supabase.from('plato_land_series4_media').select('slot,object_key');
      if(cancelled)return;
      if(error)setError('دریافت فهرست رسانه‌ها ناموفق بود.');
      else setSaved(Object.fromEntries((data??[]).map(row=>[row.slot,row.object_key])));
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
        slot,object_key:uploaded.key,updated_at:new Date().toISOString(),updated_by:data.session.user.id,
      });
      if(saveError)throw new Error('فایل آپلود شد، اما ذخیره مرجع رسانه ناموفق بود.');
      setSaved(previous=>({...previous,[slot]:uploaded.key}));
      setPreview('');
      setMessage('رسانه ذخیره و تأیید شد.');
    }catch(error){
      setError(error instanceof Error?error.message:'عملیات رسانه ناموفق بود.');
    }finally{setBusy(false);}
  }

  return <details dir="rtl" style={{marginTop:14,padding:14,border:'1px solid #8c6a34',borderRadius:13,color:'#f2ead8'}}>
    <summary style={{cursor:'pointer',color:'#e4c77e'}}>تصاویر، تیزر و ویدیوی قوانین سری چهارم</summary>
    <div style={{display:'grid',gap:10,marginTop:12}}>
      <label>رسانه <select value={slot} disabled={busy} onChange={event=>{setSlot(event.target.value);setPreview('');setError('');setMessage('');}}>
        {slots.map(item=><option key={item.id} value={item.id}>{item.label}{saved[item.id]?' ✓':''}</option>)}
      </select></label>
      <label>بارگذاری فایل <input key={slot} type="file" accept={video?'video/mp4':'image/jpeg,image/png,image/webp'}
        disabled={busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void operate(file);}}/></label>
      <button type="button" disabled={busy||!saved[slot]} onClick={()=>void operate()}>پیش‌نمایش رسانه ذخیره‌شده</button>
      {busy&&<span role="status">در حال انجام…</span>}
      {message&&<span role="status">{message}</span>}
      {error&&<span role="alert">{error}</span>}
      {preview&&(video?<video src={preview} controls playsInline style={{maxWidth:'100%'}}/>:
        <img src={preview} alt={slots.find(item=>item.id===slot)?.label} style={{maxWidth:'100%'}}/>)}
    </div>
  </details>;
}
