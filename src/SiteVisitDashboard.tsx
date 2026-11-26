import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';
type Report={total:number;today:number;yesterday:number;week:number;month:number;mobile:number;desktop:number;pages:{page_path:string;visits:number}[];daily:{day:string;visits:number}[]};
export default function SiteVisitDashboard(){
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{setBusy(true);setError('');try{if(!supabase)throw Error('اتصال برقرار نیست');const {data,error}=await supabase.rpc('plato_land_site_visit_report');if(error)throw error;setReport(data as Report)}catch{setError('دریافت آمار امکان‌پذیر نیست')}finally{setBusy(false)}};
 useEffect(()=>{void load()},[]);
 const fmt=(n:number)=>n.toLocaleString('fa-IR');
 return <section dir="rtl" style={{padding:16,color:'#f6e8c5',border:'1px solid #705b31',borderRadius:12}}><h2>آمار بازدید سایت</h2><button disabled={busy} onClick={()=>void load()}>به‌روزرسانی</button><p>آمار بازدید صفحات، بر اساس زمان ایران</p>{busy&&<p>در حال دریافت…</p>}{error&&<p role="alert">{error}</p>}{report&&<><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>{[['امروز',report.today],['دیروز',report.yesterday],['۷ روز اخیر',report.week],['۳۰ روز اخیر',report.month],['کل بازدیدها',report.total]].map(([label,n])=><div key={label} style={{padding:12,border:'1px solid #705b31',borderRadius:8}}>{label}<h3>{fmt(Number(n))}</h3></div>)}</div><h3>روند هفتگی</h3>{report.daily.map(d=><div key={d.day}><span>{d.day} — {fmt(d.visits)}</span><div style={{height:8,background:'#c5a059',width:(100*d.visits/Math.max(1,...report.daily.map(x=>x.visits)))+'%'}}/></div>)}<h3>پربازدیدترین صفحات</h3>{report.pages.map(p=><p key={p.page_path}><bdi>{p.page_path}</bdi> — {fmt(p.visits)}</p>)}</>}</section>
}
