import React,{useEffect,useRef,useState} from 'react';
import {Crown,ArrowLeft,ChevronRight,Archive,PlayCircle,X,Volume2,VolumeX} from 'lucide-react';
import {supabase} from './supabase';
import TemporaryPageHeader from './TemporaryPageHeader';
import PublicSiteHeader from './PublicSiteHeader';
import {isSeries3RulesVideoKey,series3RulesVideoUrl} from './series3RulesVideoClient';
import {isSeries3TeaserKey,series3TeaserUrl} from './series3TeaserClient';
import {isSeries3PosterKey,series3PosterUrl} from './series3PosterClient';
import Series3PublicDashboard from './Series3PublicDashboard';
import {TournamentDirectoryEntry,type PublicTournamentEntry} from './PublicTournamentDirectory';

const backgammonArchiveEntries: readonly PublicTournamentEntry[] = [
 {id:'series1',title:'آرشیو مسابقات سری اول',game:'تخته‌نرد',state:'archive',href:'/series1-archive/'},
 {id:'series2',title:'آرشیو مسابقات سری دوم',game:'تخته‌نرد',state:'archive',href:'/?page=series2-archive'},
];

type PublicSeries3Status = {active: boolean; stages: {key: string; starts_at: string}[]};

export default function Series3Gallery({tournamentEntries = [], showTournamentEntry = false}:{
 tournamentEntries?: readonly PublicTournamentEntry[];
 showTournamentEntry?: boolean;
} = {}){
 const [bfArchived,setBfArchived]=useState<boolean|null>(null);
 useEffect(()=>{let alive=true;async function refresh(){try{const r=await fetch('https://dfrppbapaaydbjeflozw.supabase.co/functions/v1/plato-land-black-friday-registration',{cache:'no-store'});const d=await r.json();if(alive&&r.ok&&typeof d.archived==='boolean')setBfArchived(d.archived);}catch{}}void refresh();window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('focus',refresh)}},[]);
 const [series3StatusPending,setSeries3StatusPending]=useState(true);
 const [series3Status,setSeries3Status]=useState<PublicSeries3Status | null>(null);
 const [archiveStatus,setArchiveStatus]=useState({series3:false,series4:false});
 useEffect(()=>{
  let active=true;
  let request=0;
  async function readStatus(){
   const seq=++request;
   async function readActiveStatus(){
    try {
     const response=await supabase?.rpc('plato_temp_public_series3_active');
     if(!active||seq!==request)return;
     const data=response?.data;
     setSeries3Status(!response?.error && data && typeof data.active === 'boolean' && Array.isArray(data.stages) ? data : null);
    }catch{
     if(active&&seq===request)setSeries3Status(null);
    }finally{
     if(active&&seq===request)setSeries3StatusPending(false);
    }
   }
   void readActiveStatus();
   try {
    const response=await supabase?.rpc('plato_temp_public_archive_status');
    if(!active||seq!==request)return;
    setArchiveStatus({series3:response?.data?.series3===true,series4:response?.data?.series4===true});
   } catch {
    if(active&&seq===request)setArchiveStatus({series3:false,series4:false});
   }
  }
  void readStatus();
  window.addEventListener('focus',readStatus);
  return()=>{active=false;window.removeEventListener('focus',readStatus);};
 },[]);

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

 const entries: PublicTournamentEntry[] = [
  ...tournamentEntries.filter(entry=>entry.id!=='series4'||!archiveStatus.series4),
  ...backgammonArchiveEntries,
 ];
 if(bfArchived===true)entries.unshift({id:'black-friday',title:'تورنمنت حذفی بلک فرایدی',game:'تخته‌نرد',state:'archive',href:'/?page=black-friday',format:'تیمی · ۵ و ۶ آذر ۱۴۰۵'});
 if(archiveStatus.series3){
  entries.push({id:'series3',title:'آرشیو مسابقات سری سوم',game:'تخته‌نرد',state:'archive',href:'/series3/#series3-archive'});
 }else if(series3Status?.active){
  entries.unshift({id:'series3',title:'سری سوم تخته‌نرد',game:'تخته‌نرد',state:'active',href:'/series3/#series3-dashboard',format:'چندروزه · گروهی و حذفی',poster:poster||undefined});
 }
 if(archiveStatus.series4){
  entries.push({id:'series4',title:'آرشیو مسابقات سری چهارم',game:'تخته‌نرد',state:'archive',href:'/series4-archive/'});
 }

 const activeContent = <>
   {heroMode==='video'&&teaserVideo&&!heroVideoFailed?<section style={{position:'relative',marginBottom:16}}><video ref={teaserElement} key={teaserVideo} src={teaserVideo} crossOrigin="anonymous" autoPlay muted={teaserMuted} loop playsInline preload="auto" onCanPlay={()=>{if(teaserElement.current){teaserElement.current.muted=teaserMuted;void teaserElement.current.play().catch(()=>{});}}} onError={()=>setHeroVideoFailed(true)} aria-label="تیزر مسابقات سری سوم" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',background:'#08090b'}}/><button type="button" onClick={()=>{const nextMuted=!teaserMuted;setTeaserMuted(nextMuted);if(teaserElement.current){teaserElement.current.muted=nextMuted;if(!nextMuted){teaserElement.current.volume=1;void teaserElement.current.play().catch(()=>{});}}}} aria-label={teaserMuted?'فعال‌کردن صدای تیزر':'قطع صدای تیزر'} style={{position:'absolute',bottom:12,right:12,zIndex:2,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:6,border:0,borderRadius:6,background:'rgba(0,0,0,.28)',color:'#f4dfad',cursor:'pointer',boxShadow:'none'}}>{teaserMuted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button></section>:heroMode==='poster'&&poster?<section style={{background:'transparent',border:0,borderRadius:0,padding:0,marginBottom:16}}><img src={poster} alt="پوستر اصلی سری سوم" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',borderRadius:10}}/></section>:null}
   {bfArchived===false&&<section style={{margin:'0 0 18px',padding:16,border:'1px solid #b18b45',borderRadius:13,background:'linear-gradient(115deg,#322714,#141416)'}}><div style={{display:'flex',alignItems:'center',gap:10}}><Crown size={24} color="#d6b46d"/><strong style={{color:'#f0d99f',fontSize:17}}>تورنمنت بلک فرایدی</strong></div><p style={{fontSize:13,color:'#c8b58c',lineHeight:1.8}}>مسابقات حذفی تیمی تخته‌نرد · ۱۶ بازیکن · جایزه ۵۰ پیپ</p><a href="/?page=black-friday" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,padding:12,borderRadius:9,background:'linear-gradient(120deg,#b48b43,#e4c77e)',color:'#17130b',fontWeight:900,textDecoration:'none'}}>ورود به تورنمنت <ArrowLeft size={16}/></a></section>}
   {rulesVideo&&<button type="button" onClick={openRulesVideo} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px',marginBottom:18,border:'1px solid #b18b45',borderRadius:13,background:'linear-gradient(120deg,#2a2114,#151416)',color:'#f0d99f',fontSize:15,fontWeight:900,cursor:'pointer'}}><PlayCircle size={23}/> قوانین مهم سری سوم</button>}
   <section style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'15px 16px',margin:'0 0 18px',border:'1px solid #b18b45',borderRadius:13,background:'linear-gradient(115deg,rgba(50,39,20,.96),rgba(20,20,22,.98))'}}>
    <div style={{display:'flex',alignItems:'center',gap:11,minWidth:0}}><span style={{width:38,height:38,display:'grid',placeItems:'center',borderRadius:10,background:'rgba(214,180,109,.14)',flexShrink:0}}><Crown size={20} color="#d6b46d"/></span><div><div style={{fontSize:15,fontWeight:900,color:'#f0d99f'}}>پیش‌بینی‌های سری سوم</div><div style={{fontSize:11,color:'#c8b58c',marginTop:4}}></div></div></div>
    <a href="/predictions" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,padding:'10px 15px',border:'1px solid #b18b45',borderRadius:9,color:'#17130b',background:'linear-gradient(120deg,#b48b43,#e4c77e)',textDecoration:'none',fontSize:12,fontWeight:900,whiteSpace:'nowrap'}}>مشاهده پیش‌بینی‌ها <ArrowLeft size={15}/></a>
   </section>
   <Series3PublicDashboard archived={archiveStatus.series3} activeStatus={series3Status?.active} officialStages={series3Status?.stages}/>
 </>;
 return <main dir="rtl" style={{minHeight:'100vh',background:'radial-gradient(ellipse at top,#2a2112 0%,#101114 48%,#08090b 100%)',color:'#f4ead2',padding:'24px 14px 48px',fontFamily:'inherit'}}>
  <div style={{maxWidth:920,margin:'0 auto'}}>
   {showTournamentEntry ? <PublicSiteHeader current="tournaments"/> : <TemporaryPageHeader showBack={false}/>}
   {showTournamentEntry ? <TournamentDirectoryEntry entries={entries} activePending={series3StatusPending} activeContent={activeContent}/> : activeContent}
   {!showTournamentEntry &&
   <section id="temporary-archive" aria-label="آرشیو مسابقات">{bfArchived===true&&<p><a href="/?page=black-friday" style={{color:"#f0d99f"}}>آرشیو تورنمنت بلک فرایدی</a></p>}
   <p><a href="/series1-archive/" style={{color:'#f0d99f'}}>آرشیو مسابقات سری اول</a></p>
   {archiveStatus.series4 && <p><a href="/series4-archive/" style={{color:'#f0d99f'}}>آرشیو مسابقات سری چهارم</a></p>}
   <section style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',padding:'13px 16px',margin:'16px 0 0',border:'1px solid rgba(140,106,52,.65)',borderRadius:12,background:'linear-gradient(110deg,rgba(42,33,20,.88),rgba(20,20,22,.96))'}}>
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}><span style={{width:34,height:34,display:'grid',placeItems:'center',borderRadius:9,background:'rgba(214,180,109,.12)',flexShrink:0}}><Archive size={18} color="#d6b46d"/></span><div><div style={{fontSize:13,fontWeight:800,color:'#f0d99f'}}>آرشیو مسابقات سری دوم</div><div style={{fontSize:11,color:'#b7a27b',marginTop:3}}>مشاهده نتایج و سوابق دوره گذشته</div></div></div>
    <a href="/?page=series2-archive" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 13px',border:'1px solid #8c6a34',borderRadius:9,color:'#f0d99f',background:'#211b12',textDecoration:'none',fontSize:12,fontWeight:800,whiteSpace:'nowrap'}}>ورود به آرشیو <ChevronRight size={15}/></a>
   </section>
   </section>
   }
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
