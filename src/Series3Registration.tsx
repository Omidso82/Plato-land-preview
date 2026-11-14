import React,{useEffect,useMemo,useState} from 'react';
import {Crown,ChevronLeft,ChevronRight,CheckCircle2} from 'lucide-react';
import {supabase} from './supabase';

type Slide={number:number,url:string,updated_at:string};
const TOTAL_RULE_SLIDES=17;
const fa=(n:number)=>n.toLocaleString('fa-IR');
const shell:React.CSSProperties={minHeight:'100vh',background:'radial-gradient(ellipse at top,#2a2112 0%,#101114 48%,#08090b 100%)',color:'#f4ead2',padding:'20px 14px 42px',fontFamily:'inherit'};
const panel:React.CSSProperties={maxWidth:720,margin:'0 auto',padding:16,border:'1px solid #715a31',borderRadius:16,background:'#151516',boxShadow:'0 16px 48px #0007'};
const gold:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:10,color:'#17130b',padding:'12px 18px',fontWeight:800,cursor:'pointer'};
const muted:React.CSSProperties={color:'#c6b99f',fontSize:13,lineHeight:1.9};
export default function Series3Registration(){
 const [slides,setSlides]=useState<Slide[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [step,setStep]=useState(1);
 const [accepted,setAccepted]=useState(false);
 const [platoId,setPlatoId]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [done,setDone]=useState(false);
 useEffect(()=>{
  let active=true;
  async function load(){
   if(!supabase){setLoadError('اتصال به سرویس ثبت‌نام در دسترس نیست.');setLoading(false);return;}
   const storage=supabase.storage.from('series3-slides');
   const {data,error}=await storage.list('slides',{limit:60,sortBy:{column:'name',order:'asc'}});
   if(!active)return;
   if(error){setLoadError('دریافت تصاویر قوانین ناموفق بود. لطفاً صفحه را دوباره بارگذاری کن.');setLoading(false);return;}
   const items=(data||[]).flatMap(item=>{
    const match=/^(0[1-9]|1[0-7])$/.exec(item.name);
    if(!match)return [];
    const number=Number(match[1]);
    return [{number,url:storage.getPublicUrl('slides/'+item.name).data.publicUrl+'?v='+encodeURIComponent(item.updated_at||item.created_at||''),updated_at:item.updated_at||item.created_at||''}];
   }).sort((a,b)=>a.number-b.number);
   setSlides(items);
   setLoading(false);
  }
  void load();
  return ()=>{active=false};
 },[]);
 const current=useMemo(()=>slides.find(x=>x.number===step),[slides,step]);
 const missing=TOTAL_RULE_SLIDES-slides.length;
 const validId=/^[A-Za-z0-9_]{2,30}$/.test(platoId.trim());
 async function submit(){
  if(!supabase||busy||!accepted||!validId||slides.length!==TOTAL_RULE_SLIDES)return;
  setBusy(true);setMessage('');
  const {error}=await supabase.from('plato_land_series3_registration_requests').insert({plato_id:platoId.trim(),rules_accepted:true});
  if(error){
   if(error.code==='23505')setMessage('این Plato ID قبلاً برای ثبت‌نام سری سوم استفاده شده است.');
   else setMessage('ثبت درخواست انجام نشد. لطفاً دوباره تلاش کن.');
  }else{setDone(true);setMessage('درخواست ثبت‌نام سری سوم با موفقیت ثبت شد.');}
  setBusy(false);
 }
 return <main dir="rtl" style={shell}>
  <div style={{maxWidth:720,margin:'0 auto'}}>
   <header style={{textAlign:'center',padding:'8px 8px 18px'}}>
    <Crown size={32} color="#d6b46d" strokeWidth={1.5}/>
    <div style={{fontSize:25,fontWeight:900,letterSpacing:2,marginTop:6}}>PLATO <span style={{color:'#d6b46d'}}>LAND</span></div>
    <div style={{fontSize:12,color:'#b7a27b',marginTop:5}}>بازی، رقابت، قهرمانی</div>
    <h1 style={{fontSize:22,margin:'18px 0 5px'}}>فرایند ثبت‌نام سری سوم</h1>
    <p style={{...muted,margin:0}}>تصاویر قوانین را به‌ترتیب مطالعه کن و در پایان ثبت‌نامت را تکمیل کن.</p>
   </header>
   <div style={{maxWidth:720,margin:'0 auto 12px',textAlign:'right'}}>
    <button type="button" onClick={()=>window.history.back()} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'9px 13px',border:'1px solid #8c6a34',borderRadius:9,background:'#201b12',color:'#f0d99f',fontSize:13,fontWeight:700,cursor:'pointer'}}>
     <ChevronRight size={17}/> بازگشت
    </button>
   </div>
   <section style={panel}>
    {loading?<p style={{...muted,textAlign:'center'}}>در حال دریافت تصاویر قوانین…</p>:loadError?<p role="alert" style={{...muted,color:'#f0aaaa'}}>{loadError}</p>:done?
      <div style={{textAlign:'center',padding:'28px 8px'}}>
       <CheckCircle2 size={48} color="#9ed6a3"/>
       <h2 style={{color:'#f3d995'}}>ثبت‌نام ثبت شد</h2>
       <p style={muted}>{message}</p>
       <p style={{...muted,direction:'ltr'}}>{platoId.trim()}</p>
      </div>
    :<>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:10}}>
       <strong style={{color:'#f0d99f'}}>قانون و تصویر {fa(step)} از ۱۷</strong>
       <span style={{fontSize:12,color:'#b7a27b'}}>{fa(Math.round(step/TOTAL_RULE_SLIDES*100))}٪</span>
      </div>
      <div style={{height:7,background:'#35302a',borderRadius:20,overflow:'hidden',marginBottom:14}}>
       <div style={{height:'100%',width:(step/TOTAL_RULE_SLIDES*100)+'%',background:'linear-gradient(90deg,#9f7836,#e6ca82)',transition:'width .2s'}}/>
      </div>
      {current?<img src={current.url} alt={'قانون تصویری '+step+' سری سوم'} style={{display:'block',width:'100%',maxHeight:'68vh',objectFit:'contain',background:'#090a0c',borderRadius:10}}/>:
       <div style={{minHeight:250,display:'grid',placeItems:'center',textAlign:'center',padding:20,border:'1px dashed #8b7040',borderRadius:10,color:'#c6b99f'}}>تصویر {fa(step)} هنوز بارگذاری نشده است.</div>}
      {step===TOTAL_RULE_SLIDES&&<div style={{marginTop:16,padding:14,border:'1px solid #8b7040',borderRadius:10,background:'#201b12'}}>
       <label style={{display:'flex',alignItems:'flex-start',gap:10,color:'#f2e6c9',fontSize:14,lineHeight:1.9}}>
        <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} style={{width:20,height:20,accentColor:'#d5b36c',flex:'0 0 auto',marginTop:3}}/>
        <span>تمامی قوانین و شرایط نمایش‌داده‌شده را مطالعه کردم و می‌پذیرم.</span>
       </label>
       <label style={{display:'block',marginTop:14,color:'#e8d8b5',fontSize:13}}>Plato ID
        <input value={platoId} onChange={e=>setPlatoId(e.target.value)} dir="ltr" autoCapitalize="none" autoCorrect="off" placeholder="Enter your Plato ID" maxLength={30} style={{display:'block',boxSizing:'border-box',width:'100%',marginTop:7,padding:13,borderRadius:9,border:'1px solid #8b7040',background:'#0d0e10',color:'#fff',fontSize:16}}/>
       </label>
       <p style={{...muted,fontSize:11,marginBottom:0}}>فقط حروف انگلیسی، اعداد و زیرخط؛ بین ۲ تا ۳۰ نویسه.</p>
      </div>}
      <div style={{display:'flex',justifyContent:'space-between',gap:10,marginTop:16}}>
       <button type="button" disabled={step===1||busy} onClick={()=>{setStep(s=>Math.max(1,s-1));setMessage('');}} style={{...gold,background:'#292720',border:'1px solid #6e6044',color:'#f2e6c9',opacity:step===1?.45:1}}><ChevronRight size={16} style={{verticalAlign:'middle'}}/> قبلی</button>
       {step<TOTAL_RULE_SLIDES?<button type="button" disabled={busy} onClick={()=>{setStep(s=>Math.min(TOTAL_RULE_SLIDES,s+1));setMessage('');}} style={gold}>بعدی <ChevronLeft size={16} style={{verticalAlign:'middle'}}/></button>:
        <button type="button" disabled={busy||!accepted||!validId||slides.length!==TOTAL_RULE_SLIDES} onClick={()=>void submit()} style={{...gold,opacity:busy||!accepted||!validId||slides.length!==TOTAL_RULE_SLIDES?.5:1}}>{busy?'در حال ثبت…':'تأیید و ثبت‌نام'}</button>}
      </div>
      {step===TOTAL_RULE_SLIDES&&missing>0&&<p role="status" style={{...muted,color:'#e7bd78'}}>برای فعال‌شدن ثبت‌نام، هنوز {fa(missing)} تصویر از ۱۷ تصویر قوانین باید بارگذاری شود.</p>}
      {message&&<p role="status" style={{...muted,color:'#f1d99e'}}>{message}</p>}
     </>}
   </section>
   <p style={{textAlign:'center',color:'#8f836d',fontSize:11,marginTop:18}}>PLATO LAND · SERIES 3</p>
  </div>
 </main>;
}
