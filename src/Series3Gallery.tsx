import React,{useEffect,useRef,useState} from 'react';
import {Crown,ArrowLeft,ChevronRight,Archive,PlayCircle,X} from 'lucide-react';
import {supabase} from './supabase';

export default function Series3Gallery(){
 const [poster,setPoster]=useState('');
 const [video,setVideo]=useState('');

 const [videoOpen,setVideoOpen]=useState(false);
 const [analyticsConsent,setAnalyticsConsent]=useState<'accepted'|'rejected'|'unset'>('unset');
 const analyticsSession=useRef('');
 const analyticsPlayed=useRef(false);
 const analyticsCompleted=useRef(false);
 const lastVideoTime=useRef(0);
 const pendingWatchSeconds=useRef(0);
 function analyticsIdentity(){
  let id=localStorage.getItem('plato_series3_video_visitor');
  if(!id){id=crypto.randomUUID();localStorage.setItem('plato_series3_video_visitor',id);}
  return id;
 }
 async function recordVideoEvent(event_type:'modal_open'|'play'|'progress'|'complete',watched_seconds=0){
  if(!supabase||analyticsConsent!=='accepted'||!analyticsSession.current)return;
  try{const {error}=await supabase.from('plato_land_series3_video_events').insert({visitor_id:analyticsIdentity(),session_id:analyticsSession.current,event_type,watched_seconds});if(error)console.warn('Series 3 video analytics event rejected',error.message);}
  catch(error){console.warn('Series 3 video analytics event failed',error);}
 }
 function acceptAnalytics(){localStorage.setItem('plato_series3_video_analytics_consent','accepted');setAnalyticsConsent('accepted');}
 function rejectAnalytics(){localStorage.setItem('plato_series3_video_analytics_consent','rejected');setAnalyticsConsent('rejected');}
 function openRulesVideo(){setVideoOpen(true);}
 function closeRulesVideo(){setVideoOpen(false);analyticsSession.current='';}

 useEffect(()=>{
  let active=true;
  async function load(){
   if(!supabase)return;
   const storage=supabase.storage.from('series3-slides');
   const {data,error}=await storage.list('poster',{limit:10});
   if(active&&!error){
    const item=(data||[]).find(x=>x.name==='series3-main-poster');
    if(item){const url=storage.getPublicUrl('poster/series3-main-poster').data.publicUrl;setPoster(url+'?v='+encodeURIComponent(item.updated_at||item.created_at||''));}
   }
   const {data:settings,error:settingsError}=await supabase.from('plato_land_series3_video_settings').select('storage_path,is_active').eq('id',1).maybeSingle();
   if(active&&!settingsError&&settings?.is_active&&settings.storage_path){
    const {data:objects,error:listError}=await supabase.storage.from('series3-video').list('rules',{limit:20});
    const file=(objects||[]).find(x=>x.name==='series3-important-rules.mp4');
    if(!listError&&file){const url=supabase.storage.from('series3-video').getPublicUrl(settings.storage_path).data.publicUrl;setVideo(url+'?v='+encodeURIComponent(file.updated_at||file.created_at||''));}
   }
  }
  void load();return()=>{active=false};
 },[]);

 useEffect(()=>{if(!videoOpen)return;
  if(analyticsConsent==='accepted'&&supabase){
   analyticsSession.current=crypto.randomUUID();analyticsPlayed.current=false;analyticsCompleted.current=false;
   lastVideoTime.current=0;pendingWatchSeconds.current=0;void recordVideoEvent('modal_open');
  }
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape')closeRulesVideo()};
  window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)
 },[videoOpen,analyticsConsent]);

 return <main dir="rtl" style={{minHeight:'100vh',background:'radial-gradient(ellipse at top,#2a2112 0%,#101114 48%,#08090b 100%)',color:'#f4ead2',padding:'24px 14px 48px',fontFamily:'inherit'}}>
  <div style={{maxWidth:920,margin:'0 auto'}}>
   <header style={{textAlign:'center',padding:'18px 8px 22px'}}><Crown size={34} color="#d6b46d" strokeWidth={1.5}/><div style={{fontSize:27,fontWeight:900,letterSpacing:2,marginTop:7}}>PLATO <span style={{color:'#d6b46d'}}>LAND</span></div><div style={{fontSize:12,color:'#b7a27b',marginTop:7}}>بازی، رقابت، قهرمانی</div></header>
   {poster&&<section style={{background:'#141416',border:'1px solid #715a31',borderRadius:16,padding:10,marginBottom:16}}><img src={poster} alt="پوستر اصلی سری سوم" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',borderRadius:10}}/></section>}
   <section style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'13px 16px',margin:'0 0 18px',border:'1px solid rgba(140,106,52,.65)',borderRadius:12,background:'linear-gradient(110deg,rgba(42,33,20,.88),rgba(20,20,22,.96))'}}>
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}><span style={{width:34,height:34,display:'grid',placeItems:'center',borderRadius:9,background:'rgba(214,180,109,.12)',flexShrink:0}}><Archive size={18} color="#d6b46d"/></span><div><div style={{fontSize:13,fontWeight:800,color:'#f0d99f'}}>آرشیو مسابقات سری دوم</div><div style={{fontSize:11,color:'#b7a27b',marginTop:3}}>مشاهده نتایج و سوابق دوره گذشته</div></div></div>
    <a href="/?page=series2-archive" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 13px',border:'1px solid #8c6a34',borderRadius:9,color:'#f0d99f',background:'#211b12',textDecoration:'none',fontSize:12,fontWeight:800,whiteSpace:'nowrap'}}>ورود به آرشیو <ChevronRight size={15}/></a>
   </section>
   <section style={{textAlign:'center',padding:'22px 14px',marginBottom:12,border:'1px solid #8c6a34',borderRadius:14,background:'linear-gradient(145deg,#2a2114,#141416)'}}>
    <a href="/series3-registration" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:9,padding:'12px 22px',borderRadius:10,background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',color:'#17130b',fontWeight:900,textDecoration:'none',fontSize:14}}>مشاهده قوانین و ثبت‌نام سری سوم <ArrowLeft size={17}/></a>
   </section>

   {video&&analyticsConsent==='unset'&&<section style={{margin:'0 0 18px',padding:13,border:'1px solid #66532f',borderRadius:11,background:'#171613',color:'#d8ceb9',fontSize:12,lineHeight:1.9}}>
    <div style={{fontWeight:800,color:'#f0d99f',marginBottom:4}}>آمار ناشناس تماشای ویدیو</div>
    برای شمارش تعداد بازدیدکنندگان منحصربه‌فرد و میزان تماشا، در صورت موافقت شما یک شناسه تصادفی در همین مرورگر ذخیره می‌شود. نام، Plato ID و اطلاعات تماس دریافت نمی‌شود.
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:9}}>
     <button type="button" onClick={acceptAnalytics} style={{padding:'8px 12px',border:0,borderRadius:8,background:'#c49b4b',color:'#17120a',fontWeight:800}}>موافقم</button>
     <button type="button" onClick={rejectAnalytics} style={{padding:'8px 12px',border:'1px solid #8c6a34',borderRadius:8,background:'#211b12',color:'#f0d99f'}}>موافق نیستم</button>
    </div>
   </section>}

   {video&&analyticsConsent!=='unset'&&<button type="button" onClick={()=>setAnalyticsConsent('unset')} style={{display:'block',margin:'0 auto 8px',background:'transparent',border:0,color:'#a99a7d',fontSize:10,textDecoration:'underline',cursor:'pointer'}}>تغییر انتخاب حریم خصوصی آمار ناشناس</button>}
   {video&&<button type="button" onClick={openRulesVideo} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px',marginBottom:18,border:'1px solid #b18b45',borderRadius:13,background:'linear-gradient(120deg,#2a2114,#151416)',color:'#f0d99f',fontSize:15,fontWeight:900,cursor:'pointer'}}><PlayCircle size={23}/> قوانین مهم سری سوم</button>}
   {videoOpen&&<div role="dialog" aria-modal="true" aria-label="قوانین مهم سری سوم" onClick={closeRulesVideo} style={{position:'fixed'},inset:0,zIndex:9999,background:'rgba(0,0,0,.88)',display:'grid',placeItems:'center',padding:14}}>
    <section onClick={e=>e.stopPropagation()} style={{width:'min(960px,100%)',background:'#111214',border:'1px solid #8c6a34',borderRadius:14,padding:12,boxShadow:'0 20px 80px #000'}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:10,color:'#f0d99f',fontWeight:800}}><span>قوانین مهم سری سوم</span><button type="button" aria-label="بستن ویدیو" onClick={closeRulesVideo} style={{background:'transparent'},border:0,color:'#f0d99f',cursor:'pointer'}}><X size={23}/></button></div>
     
     <video key={video} src={video} controls playsInline autoPlay
      onPlay={()=>{if(!analyticsPlayed.current){analyticsPlayed.current=true;void recordVideoEvent('play');}}}
      onTimeUpdate={e=>{
       const current=e.currentTarget.currentTime;const delta=current-lastVideoTime.current;
       if(delta>0&&delta<=2.5&&analyticsConsent==='accepted'){
        pendingWatchSeconds.current+=delta;
        if(pendingWatchSeconds.current>=10){const whole=Math.floor(pendingWatchSeconds.current/10)*10;pendingWatchSeconds.current-=whole;void recordVideoEvent('progress',whole);}
       }
       lastVideoTime.current=current;
      }}
      onEnded={()=>{
       if(!analyticsCompleted.current){analyticsCompleted.current=true;const remainder=Math.floor(pendingWatchSeconds.current);
        if(remainder>0)void recordVideoEvent('progress',remainder);void recordVideoEvent('complete');
       }
      }}
      style={{display:'block',width:'100%',maxHeight:'75vh',background:'#000',borderRadius:8}}/>
    </section>
   </div>}
   <footer style={{textAlign:'center',color:'#8f836d',fontSize:11,marginTop:28}}>PLATO LAND · Series 3</footer>
  </div>
 </main>;
}
