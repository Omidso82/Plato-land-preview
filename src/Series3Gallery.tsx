import React,{useEffect,useState} from 'react';
import {Crown,ArrowLeft,ChevronRight} from 'lucide-react';
import {supabase} from './supabase';

export default function Series3Gallery(){
 const [poster,setPoster]=useState('');
 useEffect(()=>{
  let active=true;
  async function loadPoster(){
   if(!supabase)return;
   const storage=supabase.storage.from('series3-slides');
   const {data,error}=await storage.list('poster',{limit:10});
   if(!active||error)return;
   const fixedPoster=(data||[]).find(item=>item.name==='series3-main-poster');
   if(fixedPoster){
    const url=storage.getPublicUrl('poster/series3-main-poster').data.publicUrl;
    const version=fixedPoster.updated_at||fixedPoster.created_at||'';
    setPoster(url+(version?'?v='+encodeURIComponent(version):''));
   }
  }
  void loadPoster();
  return ()=>{active=false};
 },[]);
 return <main dir="rtl" style={{minHeight:'100vh',background:'radial-gradient(ellipse at top,#2a2112 0%,#101114 48%,#08090b 100%)',color:'#f4ead2',padding:'24px 14px 48px',fontFamily:'inherit'}}>
  <div style={{maxWidth:920,margin:'0 auto'}}>
   <header style={{textAlign:'center',padding:'18px 8px 22px'}}>
    <Crown size={34} color="#d6b46d" strokeWidth={1.5}/>
    <div style={{fontSize:27,fontWeight:900,letterSpacing:2,marginTop:7}}>PLATO <span style={{color:'#d6b46d'}}>LAND</span></div>
    <div style={{fontSize:12,color:'#b7a27b',marginTop:7}}>بازی، رقابت، قهرمانی</div>
    <h1 style={{fontSize:24,margin:'18px 0 8px'}}>سری سوم مسابقات PLATO LAND</h1>
   </header>
   {poster&&<section style={{background:'#141416',border:'1px solid #715a31',borderRadius:16,padding:10,marginBottom:16}}>
    <img src={poster} alt="پوستر اصلی سری سوم" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',borderRadius:10}}/>
   </section>}
   <section style={{textAlign:'center',padding:'22px 14px',marginBottom:22,border:'1px solid #8c6a34',borderRadius:14,background:'linear-gradient(145deg,#2a2114,#141416)'}}>
    <a href="/series3-registration" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:9,padding:'12px 22px',borderRadius:10,background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',color:'#17130b',fontWeight:900,textDecoration:'none',fontSize:14}}>مشاهده قوانین و ثبت‌نام سری سوم <ArrowLeft size={17}/></a>
   </section>
   <div style={{maxWidth:920,margin:'0 auto 12px',textAlign:'center'}}>
    <button type="button" onClick={()=>window.history.back()} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,padding:'9px 16px',border:'1px solid #8c6a34',borderRadius:9,background:'#201b12',color:'#f0d99f',fontSize:13,fontWeight:700,cursor:'pointer'}}>
     <ChevronRight size={17}/> بازگشت
    </button>
   </div>
   <footer style={{textAlign:'center',color:'#8f836d',fontSize:11,marginTop:28}}>PLATO LAND · Series 3</footer>
  </div>
 </main>;
}
