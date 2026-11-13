import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

const BUCKET = 'series3-slides';
const POSTER_PATH = 'poster/series3-main-poster';
type ImageItem = { url:string; updated_at?:string };

export function Series3SlidesPanel() {
  const [slides,setSlides]=useState<Record<number,ImageItem>>({});
  const [poster,setPoster]=useState<ImageItem|null>(null);
  const [selected,setSelected]=useState<Record<number,File>>({});
  const [posterSelected,setPosterSelected]=useState<File|null>(null);
  const [busySlot,setBusySlot]=useState<number|null>(null);
  const [posterBusy,setPosterBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function refresh() {
    if(!supabase)return;
    const storage=supabase.storage.from(BUCKET);
    const [slideResult,posterResult]=await Promise.all([
      storage.list('slides',{limit:60,sortBy:{column:'name',order:'asc'}}),
      storage.list('poster',{limit:10})
    ]);
    if(slideResult.error){setMessage('خواندن تصاویر سری سوم ناموفق بود: '+slideResult.error.message);return;}
    if(posterResult.error){setMessage('خواندن پوستر سری سوم ناموفق بود: '+posterResult.error.message);return;}
    const next:Record<number,ImageItem>={};
    (slideResult.data||[]).forEach(item=>{
      const match=/^(0[1-9]|1[0-8])$/.exec(item.name);
      if(!match)return;
      const n=Number(match[1]);
      next[n]={url:storage.getPublicUrl('slides/'+item.name).data.publicUrl,updated_at:item.updated_at||item.created_at||''};
    });
    setSlides(next);
    const posterItem=(posterResult.data||[]).find(item=>item.name==='series3-main-poster');
    setPoster(posterItem?{
      url:storage.getPublicUrl(POSTER_PATH).data.publicUrl,
      updated_at:posterItem.updated_at||posterItem.created_at||''
    }:null);
  }

  useEffect(()=>{void refresh();},[]);

  async function uploadSlide(n:number) {
    if(!supabase)return;
    const file=selected[n];
    if(!file){setMessage('ابتدا تصویر اسلاید '+n+' را انتخاب کن.');return;}
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10*1024*1024){
      setMessage('فرمت تصویر باید JPG، PNG یا WEBP و حجم آن حداکثر ۱۰ مگابایت باشد.');return;
    }
    setBusySlot(n);setMessage('در حال ذخیره تصویر اسلاید '+n+'…');
    try{
      const key=String(n).padStart(2,'0');
      const {error}=await supabase.storage.from(BUCKET).upload('slides/'+key,file,{
        upsert:true,contentType:file.type,cacheControl:'0'
      });
      if(error)throw error;
      setSelected(prev=>{const next={...prev};delete next[n];return next;});
      await refresh();
      setMessage('تصویر اسلاید '+n+' ذخیره شد.');
    }catch(e){setMessage('ذخیره اسلاید '+n+' ناموفق بود: '+(e instanceof Error?e.message:'خطای ناشناخته'));}
    finally{setBusySlot(null);}
  }

  async function uploadPoster() {
    if(!supabase||!posterSelected){setMessage('ابتدا پوستر سری سوم را انتخاب کن.');return;}
    if(!/^image\/(jpeg|png|webp)$/.test(posterSelected.type)||posterSelected.size>10*1024*1024){
      setMessage('فرمت پوستر باید JPG، PNG یا WEBP و حجم آن حداکثر ۱۰ مگابایت باشد.');return;
    }
    setPosterBusy(true);setMessage('در حال ذخیره پوستر سری سوم…');
    try{
      const storage=supabase.storage.from(BUCKET);
      const {data,error:listError}=await storage.list('poster',{limit:10});
      if(listError)throw listError;
      const exists=(data||[]).some(x=>x.name==='series3-main-poster');
      const result=exists
        ? await storage.update(POSTER_PATH,posterSelected,{contentType:posterSelected.type,cacheControl:'0'})
        : await storage.upload(POSTER_PATH,posterSelected,{upsert:false,contentType:posterSelected.type,cacheControl:'0'});
      if(result.error)throw result.error;
      setPosterSelected(null);
      await refresh();
      setMessage('پوستر سری سوم ذخیره شد.');
    }catch(e){setMessage('ذخیره پوستر ناموفق بود: '+(e instanceof Error?e.message:'خطای ناشناخته'));}
    finally{setPosterBusy(false);}
  }

  const card:React.CSSProperties={background:'#151515',border:'1px solid #66532e',borderRadius:12,padding:12,minWidth:0};
  const button:React.CSSProperties={background:'#c49b4b',color:'#17120a',border:0,borderRadius:9,padding:'10px 14px',fontWeight:700,cursor:'pointer',width:'100%'};

  return <section dir="rtl" style={{marginTop:22,padding:16,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)'}}>
    <h2 style={{color:'#f6e8c5',fontSize:20,margin:'0 0 6px'}}>مدیریت تصاویر سری سوم</h2>
    <p style={{color:'#c8c0b0',fontSize:13,lineHeight:1.8,marginTop:0}}>این بخش کاملاً مستقل از تصاویر سری دوم است. ۱۸ جایگاه تصویر و یک پوستر اصلی دارد؛ فقط مالک می‌تواند تصاویر را بارگذاری یا جایگزین کند.</p>
    <div style={{...card,marginBottom:14}}>
      <h3 style={{color:'#f6e8c5',margin:'0 0 10px'}}>پوستر اصلی سری سوم</h3>
      {poster?<img src={poster.url+'?v='+encodeURIComponent(poster.updated_at||'')} alt="پوستر سری سوم" style={{display:'block',maxWidth:'100%',maxHeight:200,objectFit:'contain',margin:'0 auto 10px'}}/>:<p style={{color:'#a9a08e',fontSize:13}}>هنوز پوستری بارگذاری نشده است.</p>}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPosterSelected(e.target.files?.[0]||null)} style={{width:'100%',color:'#ddd',fontSize:12,margin:'8px 0'}}/>
      <button style={button} disabled={!posterSelected||posterBusy} onClick={()=>void uploadPoster()}>{posterBusy?'در حال ذخیره…':poster?'جایگزینی پوستر':'بارگذاری پوستر'}</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10}}>
      {Array.from({length:18},(_,i)=>i+1).map(n=>{
        const item=slides[n];
        return <div key={n} style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <strong style={{color:'#f1d99e'}}>تصویر {n.toLocaleString('fa-IR')}</strong>
            <span style={{fontSize:11,color:item?'#9ed6a3':'#b5a98e'}}>{item?'ثبت‌شده':'خالی'}</span>
          </div>
          {item?<img src={item.url+'?v='+encodeURIComponent(item.updated_at||'')} alt={'تصویر '+n+' سری سوم'} style={{width:'100%',height:115,objectFit:'contain',background:'#090a0c',borderRadius:7,marginBottom:8}}/>:<div style={{height:115,display:'grid',placeItems:'center',background:'#090a0c',borderRadius:7,color:'#817968',fontSize:12,marginBottom:8}}>تصویری ثبت نشده</div>}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setSelected(prev=>({...prev,[n]:e.target.files?.[0]||undefined as any}))} style={{width:'100%',color:'#ddd',fontSize:11,marginBottom:7}}/>
          {selected[n]&&<p style={{fontSize:11,color:'#c8c0b0',overflowWrap:'anywhere'}}>{selected[n].name}</p>}
          <button style={button} disabled={!selected[n]||busySlot!==null} onClick={()=>void uploadSlide(n)}>{busySlot===n?'در حال ذخیره…':item?'جایگزینی تصویر':'ذخیره تصویر'}</button>
        </div>;
      })}
    </div>
    {message&&<p role="status" style={{color:'#f1d99e',fontSize:13,marginBottom:0}}>{message}</p>}
    <p style={{color:'#9c927f',fontSize:11,lineHeight:1.7,marginBottom:0}}>فرمت مجاز: JPG / PNG / WEBP · حداکثر حجم هر فایل: ۱۰ مگابایت · تصاویر در فضای ذخیره‌سازی مستقل سری سوم قرار می‌گیرند.</p>
  </section>;
}
