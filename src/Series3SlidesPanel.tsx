import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { isSeries3TeaserKey, series3TeaserUrl, uploadSeries3Teaser } from './series3TeaserClient';

const BUCKET = 'series3-slides';
const POSTER_PATH = 'poster/series3-main-poster';
type ImageItem = { url:string; updated_at?:string };

export function Series3SlidesPanel() {
  const [slides,setSlides]=useState<Record<number,ImageItem>>({});
  const [poster,setPoster]=useState<ImageItem|null>(null);
  const [selected,setSelected]=useState<Record<number,File>>({});
  const [posterSelected,setPosterSelected]=useState<File|null>(null);
  const [teaserSelected,setTeaserSelected]=useState<File|null>(null);
  const [teaserExists,setTeaserExists]=useState(false);
  const [teaserKey,setTeaserKey]=useState('');
  const [mediaMode,setMediaMode]=useState<'poster'|'video'>('poster');
  const [busySlot,setBusySlot]=useState<number|null>(null);
  const [posterBusy,setPosterBusy]=useState(false);
  const [teaserBusy,setTeaserBusy]=useState(false);
  const [modeBusy,setModeBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function refresh() {
    if(!supabase)return;
    const [slideResult,posterResult,settingsResult]=await Promise.all([
      supabase.storage.from(BUCKET).list('slides',{limit:60,sortBy:{column:'name',order:'asc'}}),
      supabase.storage.from(BUCKET).list('poster',{limit:10}),
      supabase.from('plato_land_series3_home_media_settings').select('media_mode,storage_path').eq('id',1).maybeSingle()
    ]);
    if(slideResult.error){setMessage('خواندن تصاویر سری سوم ناموفق بود: '+slideResult.error.message);return;}
    if(posterResult.error){setMessage('خواندن پوستر سری سوم ناموفق بود: '+posterResult.error.message);return;}
    if(settingsResult.error){setMessage('خواندن تنظیمات رسانه صفحه اول ناموفق بود: '+settingsResult.error.message);}
    else if(settingsResult.data?.media_mode==='video'||settingsResult.data?.media_mode==='poster')setMediaMode(settingsResult.data.media_mode);
    const next:Record<number,ImageItem>={};
    (slideResult.data||[]).forEach(item=>{
      const match=/^(0[1-9]|1[0-7])$/.exec(item.name);
      if(!match)return;
      const n=Number(match[1]);
      next[n]={url:supabase.storage.from(BUCKET).getPublicUrl('slides/'+item.name).data.publicUrl,updated_at:item.updated_at||item.created_at||''};
    });
    setSlides(next);
    const posterItem=(posterResult.data||[]).find(item=>item.name==='series3-main-poster');
    setPoster(posterItem?{url:supabase.storage.from(BUCKET).getPublicUrl(POSTER_PATH).data.publicUrl,updated_at:posterItem.updated_at||posterItem.created_at||''}:null);

    const storedKey=typeof settingsResult.data?.storage_path==='string'?settingsResult.data.storage_path:'';
    if(!settingsResult.error&&isSeries3TeaserKey(storedKey)){
      try{
        const response=await fetch(series3TeaserUrl(storedKey),{method:'HEAD',mode:'cors',cache:'no-store'});
        const size=Number(response.headers.get('Content-Length')||'0');
        const type=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
        const valid=response.ok&&size>0&&type==='video/mp4';
        setTeaserKey(valid?storedKey:'');
        setTeaserExists(valid);
        if(!valid)setMessage('مرجع تیزر در Supabase موجود است، اما فایل متناظر در R2 تأیید نشد.');
      }catch(e){
        setTeaserKey('');
        setTeaserExists(false);
        setMessage('بررسی فایل تیزر در R2 ناموفق بود: '+(e instanceof Error?e.message:'خطای شبکه'));
      }
    }else{
      setTeaserKey('');
      setTeaserExists(false);
    }
  }
  useEffect(()=>{void refresh();},[]);

  async function uploadSlide(n:number) {
    if(!supabase)return;
    const file=selected[n];
    if(!file){setMessage('ابتدا تصویر اسلاید '+n+' را انتخاب کن.');return;}
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10*1024*1024){setMessage('فرمت تصویر باید JPG، PNG یا WEBP و حجم آن حداکثر ۱۰ مگابایت باشد.');return;}
    setBusySlot(n);setMessage('در حال ذخیره تصویر اسلاید '+n+'…');
    try{
      const key=String(n).padStart(2,'0');
      const {error}=await supabase.storage.from(BUCKET).upload('slides/'+key,file,{upsert:true,contentType:file.type,cacheControl:'0'});
      if(error)throw error;
      setSelected(prev=>{const next={...prev};delete next[n];return next;});
      await refresh();setMessage('تصویر اسلاید '+n+' ذخیره شد.');
    }catch(e){setMessage('ذخیره اسلاید '+n+' ناموفق بود: '+(e instanceof Error?e.message:'خطای ناشناخته'));}
    finally{setBusySlot(null);}
  }
  async function uploadPoster() {
    if(!supabase||!posterSelected){setMessage('ابتدا پوستر سری سوم را انتخاب کن.');return;}
    if(!/^image\/(jpeg|png|webp)$/.test(posterSelected.type)||posterSelected.size>10*1024*1024){setMessage('فرمت پوستر باید JPG، PNG یا WEBP و حجم آن حداکثر ۱۰ مگابایت باشد.');return;}
    setPosterBusy(true);setMessage('در حال ذخیره پوستر سری سوم…');
    try{
      const storage=supabase.storage.from(BUCKET);
      const {data,error:listError}=await storage.list('poster',{limit:10});
      if(listError)throw listError;
      const exists=(data||[]).some(x=>x.name==='series3-main-poster');
      const result=exists?await storage.update(POSTER_PATH,posterSelected,{contentType:posterSelected.type,cacheControl:'0'}):await storage.upload(POSTER_PATH,posterSelected,{upsert:false,contentType:posterSelected.type,cacheControl:'0'});
      if(result.error)throw result.error;
      setPosterSelected(null);await refresh();setMessage('پوستر سری سوم ذخیره شد.');
    }catch(e){setMessage('ذخیره پوستر ناموفق بود: '+(e instanceof Error?e.message:'خطای ناشناخته'));}
    finally{setPosterBusy(false);}
  }
  async function uploadTeaser() {
    if(!supabase||!teaserSelected){setMessage('ابتدا فایل ویدیوی تیزر را انتخاب کن.');return;}
    if(teaserSelected.type!=='video/mp4'||!teaserSelected.name.toLowerCase().endsWith('.mp4')||teaserSelected.size===0||teaserSelected.size>100*1024*1024){setMessage('فقط فایل MP4 معتبر با حجم بیشتر از صفر و حداکثر ۱۰۰ مگابایت مجاز است.');return;}
    setTeaserBusy(true);setMessage('در حال بارگذاری و تأیید فایل تیزر در R2…');
    let r2Saved=false;
    try{
      const uploadedKey=await uploadSeries3Teaser(teaserSelected);
      r2Saved=true;
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error('نشست مالک معتبر نیست.');
      const {error:saveError}=await supabase.from('plato_land_series3_home_media_settings').upsert({
        id:1,
        media_mode:mediaMode,
        storage_path:uploadedKey,
        updated_at:new Date().toISOString(),
        updated_by:user.id
      },{onConflict:'id'});
      if(saveError)throw saveError;
      setTeaserKey(uploadedKey);
      setTeaserExists(true);
      setTeaserSelected(null);
      setMessage('تیزر در R2 ذخیره، با HEAD تأیید و مرجع آن در Supabase ثبت شد.');
    }catch(e){
      setMessage((r2Saved?'فایل در R2 ذخیره شده، اما ثبت مرجع آن در Supabase کامل نشد؛ موفقیت نهایی تأیید نمی‌شود: ':'بارگذاری تیزر ناموفق بود: ')+(e instanceof Error?e.message:'خطای ناشناخته'));
    }finally{setTeaserBusy(false);}
  }
  async function changeMediaMode(next:'poster'|'video') {
    if(!supabase)return;
    if(next==='video'&&(!teaserExists||!isSeries3TeaserKey(teaserKey))){setMessage('ابتدا ویدیوی تیزر را در R2 بارگذاری و تأیید کن.');return;}
    setModeBusy(true);setMessage('');
    try{
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error('نشست مالک معتبر نیست.');
      const update:{id:number;media_mode:'poster'|'video';updated_at:string;updated_by:string;storage_path?:string}={
        id:1,
        media_mode:next,
        updated_at:new Date().toISOString(),
        updated_by:user.id
      };
      if(next==='video')update.storage_path=teaserKey;
      const {error}=await supabase.from('plato_land_series3_home_media_settings').upsert(update,{onConflict:'id'});
      if(error)throw error;
      setMediaMode(next);setMessage(next==='video'?'نمایش ویدئوی تیزر در صفحه اول فعال شد.':'نمایش پوستر ثابت در صفحه اول فعال شد. ویدئو حفظ می‌شود.');
    }catch(e){setMessage('تغییر حالت رسانه ناموفق بود: '+(e instanceof Error?e.message:'تنظیم دیتابیس هنوز اجرا نشده یا دسترسی مالک تأیید نشد.'));}
    finally{setModeBusy(false);}
  }

  const card:React.CSSProperties={background:'#151515',border:'1px solid #66532e',borderRadius:12,padding:12,minWidth:0};
  const button:React.CSSProperties={background:'#c49b4b',color:'#17120a',border:0,borderRadius:9,padding:'10px 14px',fontWeight:700,cursor:'pointer',width:'100%'};
  return <section dir="rtl" style={{marginTop:22,padding:16,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)'}}>
    <details>
      <summary style={{color:'#f6e8c5',fontSize:20,fontWeight:700,cursor:'pointer',listStylePosition:'inside',padding:'2px 0'}}>مدیریت تصاویر و تیزر سری سوم</summary>
      <div style={{marginTop:14}}>
        <p style={{color:'#c8c0b0',fontSize:13,lineHeight:1.8,marginTop:0}}>این بخش فقط رسانه صفحه اول سری سوم را مدیریت می‌کند. پوستر ثابت و ویدیوی تیزر جداگانه نگهداری می‌شوند؛ ویدیوی قوانین مهم سری سوم مستقل و بدون تغییر باقی می‌ماند.</p>
        <div style={{...card,marginBottom:14}}>
          <h3 style={{color:'#f6e8c5',margin:'0 0 10px'}}>رسانه اصلی صفحه اول سری سوم</h3>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
            <button type="button" disabled={modeBusy||mediaMode==='poster'} onClick={()=>void changeMediaMode('poster')} style={{...button,width:'auto',flex:1,background:mediaMode==='poster'?'#e4c77e':'#302718'}}>نمایش پوستر ثابت</button>
            <button type="button" disabled={modeBusy||mediaMode==='video'||!teaserExists} onClick={()=>void changeMediaMode('video')} style={{...button,width:'auto',flex:1,background:mediaMode==='video'?'#e4c77e':'#302718'}}>نمایش ویدئوی تیزر</button>
          </div>
          <div style={{fontSize:12,color:'#c9c0ad',marginBottom:12}}>حالت فعلی: {mediaMode==='video'?'ویدئوی تیزر':'پوستر ثابت'}</div>
          <h4 style={{color:'#f1d99e',margin:'12px 0 8px'}}>پوستر ثابت</h4>
          {poster?<img src={poster.url+'?v='+encodeURIComponent(poster.updated_at||'')} alt="پوستر سری سوم" style={{display:'block',maxWidth:'100%',maxHeight:200,objectFit:'contain',margin:'0 auto 10px'}}/>:<p style={{color:'#a9a08e',fontSize:13}}>هنوز پوستری بارگذاری نشده است.</p>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPosterSelected(e.target.files?.[0]||null)} style={{width:'100%',color:'#ddd',fontSize:12,margin:'8px 0'}}/>
          <button style={button} disabled={!posterSelected||posterBusy} onClick={()=>void uploadPoster()}>{posterBusy?'در حال ذخیره…':poster?'جایگزینی پوستر':'بارگذاری پوستر'}</button>
          <div style={{borderTop:'1px solid #51452d',margin:'16px 0'}}/>
          <h4 style={{color:'#f1d99e',margin:'12px 0 8px'}}>ویدیوی تیزر صفحه اول (MP4 · حداکثر ۱۰۰ مگابایت)</h4>
          <div style={{fontSize:12,color:teaserExists?'#9ed6a3':'#b5a98e',marginBottom:8}}>{teaserExists?'فایل تیزر در فضای ذخیره‌سازی موجود است.':'هنوز فایل تیزری بارگذاری نشده است.'}</div>
          <input type="file" accept="video/mp4,.mp4" onChange={e=>setTeaserSelected(e.target.files?.[0]||null)} style={{width:'100%',color:'#ddd',fontSize:12,margin:'8px 0'}}/>
          {teaserSelected&&<p style={{fontSize:11,color:'#c8c0b0',overflowWrap:'anywhere'}}>{teaserSelected.name} · {(teaserSelected.size/1024/1024).toFixed(1)} MB</p>}
          <button style={button} disabled={!teaserSelected||teaserBusy} onClick={()=>void uploadTeaser()}>{teaserBusy?'در حال ذخیره…':teaserExists?'جایگزینی ویدیوی تیزر':'بارگذاری ویدیوی تیزر'}</button>
          <p style={{fontSize:11,color:'#a9a08e',lineHeight:1.8,marginBottom:0}}>برای نمایش خودکار در صفحه اول، فایل MP4 را بارگذاری و سپس حالت ویدئوی تیزر را فعال کن. با بازگشت به حالت پوستر، فایل ویدئو حذف نمی‌شود.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10}}>
          {Array.from({length:17},(_,i)=>i+1).map(n=>{
            const item=slides[n];
            return <div key={n} style={card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><strong style={{color:'#f1d99e'}}>تصویر {n.toLocaleString('fa-IR')}</strong><span style={{fontSize:11,color:item?'#9ed6a3':'#b5a98e'}}>{item?'ثبت‌شده':'خالی'}</span></div>
              {item?<img src={item.url+'?v='+encodeURIComponent(item.updated_at||'')} alt={'تصویر '+n+' سری سوم'} style={{width:'100%',height:115,objectFit:'contain',background:'#090a0c',borderRadius:7,marginBottom:8}}/>:<div style={{height:115,display:'grid',placeItems:'center',background:'#090a0c',borderRadius:7,color:'#817968',fontSize:12,marginBottom:8}}>تصویری ثبت نشده</div>}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];setSelected(prev=>{const next={...prev};if(file)next[n]=file;else delete next[n];return next;});}} style={{width:'100%',color:'#ddd',fontSize:11,marginBottom:7}}/>
              {selected[n]&&<p style={{fontSize:11,color:'#c8c0b0',overflowWrap:'anywhere'}}>{selected[n].name}</p>}
              <button style={button} disabled={!selected[n]||busySlot!==null} onClick={()=>void uploadSlide(n)}>{busySlot===n?'در حال ذخیره…':item?'جایگزینی تصویر':'ذخیره تصویر'}</button>
            </div>;
          })}
        </div>
        {message&&<p role="status" style={{color:'#f1d99e',fontSize:13,marginBottom:0}}>{message}</p>}
        <p style={{color:'#9c927f',fontSize:11,lineHeight:1.7,marginBottom:0}}>فرمت تصاویر: JPG / PNG / WEBP · حداکثر ۱۰ مگابایت · ویدیوی تیزر: MP4 · حداکثر ۱۰۰ مگابایت · فضای ذخیره‌سازی مستقل سری سوم.</p>
      </div>
    </details>
  </section>;
}
