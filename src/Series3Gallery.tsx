import React,{useEffect,useRef,useState} from 'react';
import {Crown,ArrowLeft,ChevronRight,Archive,PlayCircle,X,Volume2,VolumeX} from 'lucide-react';
import {supabase} from './supabase';
import TemporaryPageHeader from './TemporaryPageHeader';
import {isSeries3RulesVideoKey,series3RulesVideoUrl} from './series3RulesVideoClient';
import {isSeries3TeaserKey,series3TeaserUrl} from './series3TeaserClient';
import {isSeries3PosterKey,series3PosterUrl} from './series3PosterClient';
import Series3PublicDashboard from './Series3PublicDashboard';

export default function Series3Gallery(){
 const [poster,setPoster]=useState('');
 const [rulesVideo,setRulesVideo]=useState('');
 const [teaserVideo,setTeaserVideo]=useState('');
 const [heroMode,setHeroMode]=useState<'poster'|'video'|null>(null);
 const [videoOpen,setVideoOpen]=useState(false);
 const [heroVideoFailed,setHeroVideoFailed]=useState(false);
 const [teaserMuted,setTeaserMuted]=useState(true);
 const teaserElement=useRef<HTMLVideoElement|null>(null);
 async function recordVideoOpen(){
  if(!supabase)return;
  try{
   // Fresh one-time values for this click only; no persistent visitor identity is created.
   const {error}=await supabase.from('plato_land_series3_video_events').insert({
    visitor_id:crypto.randomUUID(),session_id:crypto.randomUUID(),event_type:'modal_open',watched_seconds:0
   });
   if(error)console.warn('Series 3 video open count was not recorded',error.message);
  }catch(error){console.warn('Series 3 video open count failed',error);}
 }
 function openRulesVideo(){setVideoOpen(true);void recordVideoOpen();}
 function closeRulesVideo(){setVideoOpen(false);}

 useEffect(()=>{
  let active=true;
  async function load(){
   if(!supabase)return;
   const {data:homeSettings,error:homeSettingsError}=await supabase.from('plato_land_series3_home_media_settings').select('media_mode,storage_path,poster_storage_path').eq('id',1).maybeSingle();
   if(!active)return;
   if(homeSettingsError||!homeSettings||!['poster','video'].includes(homeSettings.media_mode)){
    setHeroMode(null);
   }else if(homeSettings.media_mode==='video'&&homeSettings.storage_path){
    // Lock the page to video mode before loading any video asset.
    // The exact immutable R2 key is read from Supabase; there is no Storage fallback.
    setHeroMode('video');
    const teaserKey=typeof homeSettings.storage_path==='string'?homeSettings.storage_path:'';
    if(isSeries3TeaserKey(teaserKey)){
     try{
      const url=series3TeaserUrl(teaserKey);
      const response=await fetch(url,{method:'HEAD',mode:'cors',cache:'no-store'});
      const size=Number(response.headers.get('Content-Length')||'0');
      const type=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
      if(active&&response.ok&&size>0&&type==='video/mp4')setTeaserVideo(url);
     }catch(error){console.warn('Series 3 teaser is not available from R2.',error);}
    }
   }else if(homeSettings.media_mode==='poster'){
    // Only load the poster after the admin has explicitly selected poster mode.
    setHeroMode('poster');
    const posterKey=typeof homeSettings.poster_storage_path==='string'?homeSettings.poster_storage_path:'';
    if(isSeries3PosterKey(posterKey)){
     try{
      const url=series3PosterUrl();
      const response=await fetch(url,{method:'HEAD',mode:'cors',cache:'no-store'});
      const size=Number(response.headers.get('Content-Length')||'0');
      const type=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
      if(active&&response.ok&&size>0&&['image/jpeg','image/png','image/webp'].includes(type))setPoster(url+'&v='+encodeURIComponent(String(size)));
     }catch(error){console.warn('Series 3 poster is not available from R2.',error);}
    }else if(!posterKey){
     // Transitional legacy read only: keep the current Supabase poster visible until an R2 upload is verified and referenced.
     const imageStorage=supabase.storage.from('series3-slides');
     const {data:posterItems,error:posterError}=await imageStorage.list('poster',{limit:10});
     if(active&&!posterError){
      const item=(posterItems||[]).find(x=>x.name==='series3-main-poster');
      if(item){const url=imageStorage.getPublicUrl('poster/series3-main-poster').data.publicUrl;setPoster(url+'?v='+encodeURIComponent(item.updated_at||item.created_at||''));}
     }
    }
   }
    const {data:settings,error:settingsError}=await supabase.from('plato_land_series3_video_settings').select('storage_path,is_active').eq('id',1).maybeSingle();
   if(active&&!settingsError&&settings?.is_active&&typeof settings.storage_path==='string'&&isSeries3RulesVideoKey(settings.storage_path)){
    try{
     const url=series3RulesVideoUrl(settings.storage_path);
     const response=await fetch(url,{method:'HEAD',mode:'cors',cache:'no-store'});
     const size=Number(response.headers.get('Content-Length')||'0');
     const type=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
     if(active&&response.ok&&size>0&&type==='video/mp4')setRulesVideo(url);
    }catch(error){console.warn('Series 3 rules video is not available from R2 yet.',error);}
   }
  }
  void load();return()=>{active=false};
 },[]);

 useEffect(()=>{if(!videoOpen)return;
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape')closeRulesVideo()};
  window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)
 },[videoOpen]);

 return <main dir="rtl" style={{minHeight:'100vh',background:'radial-gradient(ellipse at top,#2a2112 0%,#101114 48%,#08090b 100%)',color:'#f4ead2',padding:'24px 14px 48px',fontFamily:'inherit'}}>
  <div style={{maxWidth:920,margin:'0 auto'}}>
   <TemporaryPageHeader showBack={false}/>
   {heroMode==='video'&&teaserVideo&&!heroVideoFailed?<section style={{position:'relative',marginBottom:16}}><video ref={teaserElement} key={teaserVideo} src={teaserVideo} crossOrigin="anonymous" autoPlay muted={teaserMuted} loop playsInline preload="auto" onCanPlay={()=>{if(teaserElement.current){teaserElement.current.muted=teaserMuted;void teaserElement.current.play().catch(()=>{});}}} onError={()=>setHeroVideoFailed(true)} aria-label="تیزر مسابقات سری سوم" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',background:'#08090b'}}/><button type="button" onClick={()=>{const nextMuted=!teaserMuted;setTeaserMuted(nextMuted);if(teaserElement.current){teaserElement.current.muted=nextMuted;if(!nextMuted){teaserElement.current.volume=1;void teaserElement.current.play().catch(()=>{});}}}} aria-label={teaserMuted?'فعال‌کردن صدای تیزر':'قطع صدای تیزر'} style={{position:'absolute',bottom:12,right:12,zIndex:2,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:6,border:0,borderRadius:6,background:'rgba(0,0,0,.28)',color:'#f4dfad',cursor:'pointer',boxShadow:'none'}}>{teaserMuted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button></section>:heroMode==='poster'&&poster?<section style={{background:'#141416',border:'1px solid #715a31',borderRadius:16,padding:10,marginBottom:16}}><img src={poster} alt="پوستر اصلی سری سوم" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',borderRadius:10}}/></section>:null}
   {rulesVideo&&<button type="button" onClick={openRulesVideo} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px',marginBottom:18,border:'1px solid #b18b45',borderRadius:13,background:'linear-gradient(120deg,#2a2114,#151416)',color:'#f0d99f',fontSize:15,fontWeight:900,cursor:'pointer'}}><PlayCircle size={23}/> قوانین مهم سری سوم</button>}
   <section style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'15px 16px',margin:'0 0 18px',border:'1px solid #b18b45',borderRadius:13,background:'linear-gradient(115deg,rgba(50,39,20,.96),rgba(20,20,22,.98))'}}>
    <div style={{display:'flex',alignItems:'center',gap:11,minWidth:0}}><span style={{width:38,height:38,display:'grid',placeItems:'center',borderRadius:10,background:'rgba(214,180,109,.14)',flexShrink:0}}><Crown size={20} color="#d6b46d"/></span><div><div style={{fontSize:15,fontWeight:900,color:'#f0d99f'}}>پیش‌بینی‌های سری سوم</div><div style={{fontSize:11,color:'#c8b58c',marginTop:4}}></div></div></div>
    <a href="/predictions" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px 15px',border:'1px solid #b18b45',borderRadius:9,color:'#17130b',background:'linear-gradient(120deg,#b48b43,#e4c77e)',textDecoration:'none',fontSize:12,fontWeight:900,whiteSpace:'nowrap'}}>مشاهده پیش‌بینی‌ها <ArrowLeft size={15}/></a>
   </section>
   <Series3PublicDashboard />
   <section style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'13px 16px',margin:'16px 0 0',border:'1px solid rgba(140,106,52,.65)',borderRadius:12,background:'linear-gradient(110deg,rgba(42,33,20,.88),rgba(20,20,22,.96))'}}>
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}><span style={{width:34,height:34,display:'grid',placeItems:'center',borderRadius:9,background:'rgba(214,180,109,.12)',flexShrink:0}}><Archive size={18} color="#d6b46d"/></span><div><div style={{fontSize:13,fontWeight:800,color:'#f0d99f'}}>آرشیو مسابقات سری دوم</div><div style={{fontSize:11,color:'#b7a27b',marginTop:3}}>مشاهده نتایج و سوابق دوره گذشته</div></div></div>
    <a href="/?page=series2-archive" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 13px',border:'1px solid #8c6a34',borderRadius:9,color:'#f0d99f',background:'#211b12',textDecoration:'none',fontSize:12,fontWeight:800,whiteSpace:'nowrap'}}>ورود به آرشیو <ChevronRight size={15}/></a>
   </section>
   {videoOpen&&<div role="dialog" aria-modal="true" aria-label="قوانین مهم سری سوم" onClick={closeRulesVideo} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,.88)',display:'grid',placeItems:'center',padding:14}}>
    <section onClick={e=>e.stopPropagation()} style={{width:'min(960px,100%)',background:'#111214',border:'1px solid #8c6a34',borderRadius:14,padding:12,boxShadow:'0 20px 80px #000'}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:10,color:'#f0d99f',fontWeight:800}}><span>قوانین مهم سری سوم</span><button type="button" aria-label="بستن ویدیو" onClick={closeRulesVideo} style={{background:'transparent',border:0,color:'#f0d99f',cursor:'pointer'}}><X size={23}/></button></div>
     <video key={rulesVideo} src={rulesVideo} crossOrigin="anonymous" controls playsInline autoPlay style={{display:'block',width:'100%',maxHeight:'75vh',background:'#000',borderRadius:8}}/>
    </section>
   </div>}
   <footer style={{textAlign:'center',color:'#8f836d',fontSize:11,marginTop:28}}>PLATO LAND · Series 3</footer>
  </div>
 </main>;
}
