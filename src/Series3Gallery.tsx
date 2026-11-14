import React,{useEffect,useState} from 'react';
import {Crown,Sparkles,ArrowLeft} from 'lucide-react';
import {supabase} from './supabase';

type GalleryItem={number:number,url:string,updated_at:string};
export default function Series3Gallery(){
 const [slides,setSlides]=useState<GalleryItem[]>([]);
 const [poster,setPoster]=useState('');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  async function load(){
   if(!supabase){setError('اتصال به سرویس تصاویر در دسترس نیست.');setLoading(false);return;}
   const storage=supabase.storage.from('series3-slides');
   const [s,p]=await Promise.all([storage.list('slides',{limit:60,sortBy:{column:'name',order:'asc'}}),storage.list('poster',{limit:10})]);
   if(!active)return;
   if(s.error||p.error){setError('بارگذاری تصاویر سری سوم انجام نشد.');setLoading(false);return;}
   const rows=(s.data||[]).flatMap(item=>{
    const m=/^(0[1-9]|1[0-8])$/.exec(item.name);
    if(!m)return [];
    const n=Number(m[1]);
    return [{number:n,url:storage.getPublicUrl('slides/'+item.name).data.publicUrl,updated_at:item.updated_at||item.created_at||''}];
   }).sort((a,b)=>a.number-b.number);
   setSlides(rows);
   const main=(p.data||[]).find(x=>x.name==='series3-main-poster');
   setPoster(main?storage.getPublicUrl('poster/series3-main-poster').data.publicUrl+'?v='+encodeURIComponent(main.updated_at||main.created_at||''):'');
   setLoading(false);
  }
  void load();
  return ()=>{active=false};
 },[]);
 return <main dir="rtl" style={{minHeight:'100vh',background:'radial-gradient(ellipse at top,#2a2112 0%,#101114 48%,#08090b 100%)',color:'#f4ead2',padding:'24px 14px 48px',fontFamily:'inherit'}}>
  <div style={{maxWidth:920,margin:'0 auto'}}>
   <header style={{textAlign:'center',padding:'18px 8px 22px'}}>
    <Crown size={34} color="#d6b46d" strokeWidth={1.5}/>
    <div style={{fontSize:27,fontWeight:900,letterSpacing:2,marginTop:7}}>PLATO <span style={{color:'#d6b46d'}}>LAND</span></div>
    <div style={{fontSize:12,color:'#b7a27b',marginTop:7}}>بازی، رقابت، قهرمانی</div>
    <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center',margin:'18px auto',maxWidth:240,color:'#b58c49'}}><i style={{height:1,background:'#8c6a34',flex:1}}/><Sparkles size={13}/><i style={{height:1,background:'#8c6a34',flex:1}}/></div>
    <h1 style={{fontSize:24,margin:'0 0 8px'}}>سری سوم مسابقات PLATO LAND</h1>
    <p style={{color:'#c6b99f',fontSize:13,margin:0}}>گالری تصاویر و اطلاع‌رسانی تصویری</p>
   </header>
   {poster&&<section style={{background:'#141416',border:'1px solid #715a31',borderRadius:16,padding:10,marginBottom:16}}><img src={poster} alt="پوستر اصلی سری سوم" style={{width:'100%',maxHeight:420,objectFit:'contain',display:'block',borderRadius:10}}/></section>}
   <section style={{textAlign:'center',padding:'18px 14px',marginBottom:22,border:'1px solid #8c6a34',borderRadius:14,background:'linear-gradient(145deg,#2a2114,#141416)'}}>
    <h2 style={{fontSize:19,color:'#f0d99f',margin:'0 0 7px'}}>آماده‌ای وارد رقابت شوی؟</h2>
    <p style={{fontSize:13,color:'#c6b99f',lineHeight:1.9,margin:'0 0 13px'}}>برای مشاهده مرحله‌به‌مرحله قوانین و تکمیل ثبت‌نام سری سوم، از اینجا وارد فرایند ثبت‌نام شو.</p>
    <a href="/series3-registration" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:9,padding:'12px 22px',borderRadius:10,background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',color:'#17130b',fontWeight:900,textDecoration:'none',fontSize:14}}>مشاهده قوانین و ثبت‌نام سری سوم <ArrowLeft size={17}/></a>
   </section>
   {loading?<p style={{textAlign:'center',color:'#c6b99f'}}>در حال دریافت تصاویر…</p>:error?<p role="alert" style={{textAlign:'center',color:'#e5a5a5'}}>{error}</p>:slides.length===0?<section style={{textAlign:'center',padding:28,border:'1px dashed #715a31',borderRadius:14,color:'#b9ad96'}}>تصاویر سری سوم هنوز بارگذاری نشده‌اند. به‌زودی اطلاعات تصویری این رویداد در همین صفحه قرار می‌گیرد.</section>:
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:12}}>
     {slides.map(item=><figure key={item.number} style={{margin:0,padding:8,background:'#141416',border:'1px solid #4f4128',borderRadius:12}}>
      <img src={item.url+'?v='+encodeURIComponent(item.updated_at)} alt={'تصویر '+item.number+' سری سوم'} loading="lazy" style={{width:'100%',height:230,objectFit:'contain',background:'#08090b',borderRadius:7,display:'block'}}/>
      <figcaption style={{fontSize:12,color:'#cbb98f',padding:'8px 3px 3px'}}>تصویر {item.number.toLocaleString('fa-IR')}</figcaption>
     </figure>)}
    </section>}
   <footer style={{textAlign:'center',color:'#8f836d',fontSize:11,marginTop:28}}>PLATO LAND · Series 3</footer>
  </div>
 </main>;
}
