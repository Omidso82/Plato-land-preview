import React,{useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import {formatTehranJalali} from './predictionDateTime';

type Question={id:string;label:string;type?:'text'|'select'|'number';options?:string[];required?:boolean};
type Campaign={id:string;title:string;description:string;campaign_type:string;status:'published'|'closed';is_open:boolean;opens_at:string|null;closes_at:string|null;questions:Question[];prize_rules:any;public_config:any;};

const panel:React.CSSProperties={padding:18,border:'1px solid #6f572f',borderRadius:14,background:'#171819',color:'#f5e8c9'};
const field:React.CSSProperties={width:'100%',padding:11,background:'#0c0d0f',border:'1px solid #66532f',borderRadius:8,color:'#f7edda',boxSizing:'border-box'};
const muted:React.CSSProperties={color:'#c8bda7',lineHeight:1.9};
const button:React.CSSProperties={padding:'11px 15px',border:0,borderRadius:8,background:'#d8b45d',color:'#17130b',fontWeight:800,cursor:'pointer'};
const secondary:React.CSSProperties={padding:'10px 14px',border:'1px solid #806637',borderRadius:8,background:'#101112',color:'#f4e5c5',fontWeight:700,cursor:'pointer'};

export default function PublicPredictions(){
 const [rows,S]=useState<Campaign[]>([]),[loading,L]=useState(true),[error,E]=useState(''),[notice,N]=useState(''),[selectedId,Select]=useState(''),[values,V]=useState<Record<string,{plato_id:string;answers:Record<string,string>}>>({}),[busy,B]=useState(''),[now,setNow]=useState(()=>Date.now());
 useEffect(()=>{let live=true;(async()=>{if(!supabase){E('سرویس در دسترس نیست.');L(false);return;}const r=await supabase.from('plato_land_prediction_campaigns').select('id,title,description,campaign_type,status,is_open,opens_at,closes_at,questions,prize_rules,public_config').in('status',['published','closed']).order('created_at',{ascending:false});if(!live)return;if(r.error)E('دریافت پیش‌بینی‌ها ناموفق بود.');else S((r.data||[]) as Campaign[]);L(false)})();return()=>{live=false}},[]);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[]);
 const selected=useMemo(()=>rows.find(c=>c.id===selectedId)||null,[rows,selectedId]);
 function update(id:string,fn:(v:{plato_id:string;answers:Record<string,string>})=>{plato_id:string;answers:Record<string,string>}){V(p=>({...p,[id]:fn(p[id]||{plato_id:'',answers:{}})}))}
 function isOpen(c:Campaign){return c.status==='published'&&c.is_open&&(!c.opens_at||now>=Date.parse(c.opens_at))&&(!c.closes_at||now<Date.parse(c.closes_at));}
 function statusText(c:Campaign){if(c.status==='closed')return 'بسته‌شده';if(c.is_open&&c.opens_at&&now<Date.parse(c.opens_at))return 'به‌زودی فعال می‌شود';if(isOpen(c))return 'امکان شرکت فعال است';return 'امکان ثبت پیش‌بینی بسته است';}
 async function submit(c:Campaign){
  const v=values[c.id]||{plato_id:'',answers:{}};
  if(!v.plato_id.trim()){E('Plato ID را وارد کن.');return;}
  for(const q of c.questions||[]){if(q.required!==false&&!String(v.answers[q.id]||'').trim()){E('لطفاً به سؤال «'+q.label+'» پاسخ بده.');return;}}
  B(c.id);E('');N('');
  try{const answers=Object.fromEntries((c.questions||[]).map(q=>[q.id,v.answers[q.id]||'']));const result=await supabase!.functions.invoke('plato-land-predictions-submit',{body:{campaign_id:c.id,plato_id:v.plato_id,response:answers}});if(result.error)throw Error(result.data?.error||result.error.message||'ثبت پیش‌بینی ناموفق بود.');update(c.id,()=>({plato_id:'',answers:{}}));N('پیش‌بینی شما با موفقیت ثبت شد.');}
  catch(e:any){E(e.message||'ثبت پیش‌بینی انجام نشد.');}
  finally{B('');}
 }
 const list=rows.filter(c=>c.status==='published'||c.status==='closed');
 return <main dir="rtl" style={{minHeight:'65vh',background:'#0c0d0f',color:'#f5e8c9',padding:'clamp(14px,3vw,24px)',fontFamily:'inherit',border:'1px solid #554326',borderRadius:16}}>
  <div style={{maxWidth:900,margin:'auto'}}>
   <header style={{marginBottom:20}}>
    <div style={{color:'#d8b45d',fontSize:12,fontWeight:800}}>PLATO LAND · PREDICTION CENTER</div>
    <h1 style={{margin:'6px 0',fontSize:'clamp(24px,5vw,34px)'}}>پیش‌بینی‌های PLATO LAND</h1>
    <p style={muted}>هر پیش‌بینی صفحه و وضعیت مستقل خودش را دارد. پیش‌بینی‌های فعال را ثبت کن و موارد بسته‌شده را برای مشاهده جزئیات دنبال کن.</p>
   </header>
   {error&&<p role="alert" style={{color:'#ffaaa0'}}>{error}</p>}
   {notice&&<p role="status" style={{padding:12,border:'1px solid #55734c',borderRadius:8,color:'#c7e8b2'}}>{notice}</p>}
   {loading?<p style={muted}>در حال دریافت پیش‌بینی‌ها…</p>:list.length===0?<section style={panel}><strong>هنوز پیش‌بینی منتشرشده‌ای وجود ندارد.</strong><p style={muted}>به‌محض انتشار پیش‌بینی جدید، کارت آن در این بخش نمایش داده می‌شود.</p></section>:!selected?
    <section style={{display:'grid',gap:12}}>
     {list.map(c=><article key={c.id} style={{...panel,display:'grid',gap:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
       <span style={{fontSize:12,color:'#d8b45d'}}>{c.campaign_type==='champion'?'پیش‌بینی قهرمانی':c.campaign_type==='match_predictions'?'پیش‌بینی مسابقه':'پیش‌بینی ویژه'}</span>
       <span style={{fontSize:12,color:isOpen(c)?'#a8d49a':'#e1bd75'}}>{statusText(c)}</span>
      </div>
      <h2 style={{margin:'2px 0',fontSize:20}}>{c.title}</h2>
      {c.description&&<p style={{...muted,margin:0}}>{c.description}</p>}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',fontSize:12,color:'#c8bda7'}}>
       {c.opens_at&&<span>شروع: {formatTehranJalali(c.opens_at)} تهران</span>}
       {c.closes_at&&<span>پایان: {formatTehranJalali(c.closes_at)} تهران</span>}
      </div>
      <div><button type="button" style={button} onClick={()=>{Select(c.id);E('');N('');}}>{isOpen(c)?'مشاهده و شرکت در پیش‌بینی':'مشاهده جزئیات و وضعیت'} ←</button></div>
     </article>)}
    </section>
    :
    <section style={{display:'grid',gap:12}}>
     <button type="button" style={{...secondary,justifySelf:'start'}} onClick={()=>{Select('');E('');N('');}}>← بازگشت به فهرست پیش‌بینی‌ها</button>
     <article style={{...panel,display:'grid',gap:10}}>
      <div style={{fontSize:12,color:'#d8b45d'}}>{selected.campaign_type==='champion'?'پیش‌بینی قهرمانی':selected.campaign_type==='match_predictions'?'پیش‌بینی مسابقه':'پیش‌بینی ویژه'}</div>
      <h2 style={{margin:0,fontSize:23}}>{selected.title}</h2>
      {selected.description&&<p style={{...muted,margin:0}}>{selected.description}</p>}
      <p style={{color:isOpen(selected)?'#a8d49a':'#e1bd75',margin:'4px 0'}}>{statusText(selected)}</p>
      {selected.opens_at&&<p style={{margin:0}}>زمان شروع: {formatTehranJalali(selected.opens_at)} (به وقت تهران)</p>}
      {selected.closes_at&&<p style={{margin:0}}>مهلت پایان: {formatTehranJalali(selected.closes_at)} (به وقت تهران)</p>}
      {selected.prize_rules&&typeof selected.prize_rules.description==='string'&&selected.prize_rules.description.trim()&&<p style={{margin:0}}>جایزه: {selected.prize_rules.description}</p>}
      {isOpen(selected)?
       <form onSubmit={e=>{e.preventDefault();void submit(selected)}} style={{display:'grid',gap:12,marginTop:8}}>
        <label style={{display:'grid',gap:6}}>Plato ID<input dir="ltr" autoCapitalize="none" maxLength={80} required style={field} value={(values[selected.id]||{plato_id:'',answers:{}}).plato_id} onChange={e=>update(selected.id,x=>({...x,plato_id:e.target.value}))}/></label>
        {(selected.questions||[]).map(q=><label key={q.id} style={{display:'grid',gap:6}}>{q.label}{q.type==='select'?<select required={q.required!==false} style={field} value={(values[selected.id]?.answers[q.id])||''} onChange={e=>update(selected.id,x=>({...x,answers:{...x.answers,[q.id]:e.target.value}}))}><option value="">انتخاب کن</option>{(q.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>:<input required={q.required!==false} type={q.type==='number'?'number':'text'} style={field} value={(values[selected.id]?.answers[q.id])||''} onChange={e=>update(selected.id,x=>({...x,answers:{...x.answers,[q.id]:e.target.value}}))}/>}</label>)}
        <button type="submit" disabled={busy===selected.id} style={{...button,opacity:busy===selected.id ? 0.65 : 1}}>{busy===selected.id?'در حال ثبت…':'ثبت پیش‌بینی'}</button>
       </form>
       :<section style={{padding:13,border:'1px solid #51452f',borderRadius:9,background:'#101112'}}><strong>ثبت پیش‌بینی در حال حاضر بسته است.</strong><p style={muted}>جزئیات این پیش‌بینی در دسترس است. اگر نتیجه‌ای برای نمایش عمومی منتشر شود، در همین بخش قابل مشاهده خواهد بود.</p></section>}
     </article>
    </section>}
  </div>
 </main>;
}
