import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';
type Source={id:string;number:number;name:string};
type Player={id:string;plato_id:string};
type Preview={status:string;plato_id?:string;targets?:Source[]};
type Case={id:string;plato_id:string;reason:string;record_status:string;created_at:string;current_target_ids:string[];current_target_names?:string[];issued_target_names?:string[];events:{event_type:string;reason:string;occurred_at:string}[]};
async function rpc(operation:string,args:Record<string,unknown>={}):Promise<any>{
 if(!supabase)throw new Error('اتصال برقرار نیست');
 const {data,error}=await supabase.rpc('plato_land_suspension_admin',{operation,...args});
 if(error)throw new Error(error.message);return data;
}
export default function CentralSuspensionManager(){
 const [sources,S]=useState<Source[]>([]),[source,SS]=useState(''),[players,P]=useState<Player[]>([]),[player,SP]=useState(''),[reason,R]=useState(''),[preview,V]=useState<Preview|null>(null),[cases,C]=useState<Case[]>([]),[busy,B]=useState(false),[msg,M]=useState(''),[lift,L]=useState(''),[liftReason,LR]=useState(''),[offset,O]=useState(0),[requestId,I]=useState('');
 const refresh=async(n=0)=>{C(await rpc('cases',{case_offset:n}));O(n)};
 const run=async(fn:()=>Promise<void>)=>{B(true);M('');try{await fn()}catch(e){M(e instanceof Error?e.message:String(e))}finally{B(false)}};
 useEffect(()=>{void run(async()=>{S(await rpc('sources'));await refresh()})},[]);
 const field:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:12,background:'#151617',color:'#f6e8c5',border:'1px solid #705b31',borderRadius:8,fontSize:16};
 const button:React.CSSProperties={...field,cursor:'pointer',background:'#302313'};
 return <section dir="rtl" style={{display:'grid',gap:12,padding:16,border:'1px solid #b18b45',borderRadius:14,color:'#f6e8c5'}}>
 <h2>مدیریت محرومیت بازیکنان</h2><p>انصراف غیرمجاز پس از شروع رسمی؛ محرومیت از دو سری رسمی بعدی.</p>
 <label>سری مبدأ<select style={field} disabled={busy} value={source} onChange={e=>{const id=e.target.value;SS(id);SP('');P([]);V(null);if(id)void run(async()=>P(await rpc('players',{source_id:id})))}}><option value="">انتخاب سری</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
 <label>بازیکن<select style={field} disabled={busy} value={player} onChange={e=>{SP(e.target.value);V(null)}}><option value="">انتخاب Plato ID</option>{players.map(p=><option key={p.id} value={p.id}>{p.plato_id}</option>)}</select></label>
 <label>علت محرومیت<textarea style={field} disabled={busy} value={reason} onChange={e=>{R(e.target.value);V(null)}}/></label>
 <button style={button} disabled={busy||!source||!player||!reason.trim()} onClick={()=>void run(async()=>{V(await rpc('preview',{source_id:source,registration_id:player}));I(crypto.randomUUID())})}>بررسی و پیش‌نمایش محرومیت</button>
 {preview&&<div><p>{preview.status==='ready'?'بازیکن: '+preview.plato_id:'ثبت امکان‌پذیر نیست: '+preview.status}</p>{preview.targets?.map(t=><p key={t.id}>سری {t.number} — {t.name}</p>)}{preview.status==='ready'&&<button style={button} disabled={busy} onClick={()=>void run(async()=>{const result=await rpc('create',{source_id:source,registration_id:player,decision_reason:reason,confirmed:true,expected_targets:preview.targets?.map(t=>t.id),operation_id:requestId});if(result.status!=='active'){M('ثبت انجام نشد: '+result.status);V(null);return}V(null);R('');SP('');M('محرومیت ثبت شد');await refresh()})}>تأیید نهایی و ثبت محرومیت</button>}</div>}
 <h3>سوابق محرومیت</h3>{cases.length===0&&<p>پرونده‌ای در این صفحه وجود ندارد.</p>}{cases.map(c=><article key={c.id} style={{border:'1px solid #705b31',padding:12,borderRadius:8}}><strong dir="ltr">{c.plato_id}</strong><p>{c.record_status==='active'?'فعال':'رفع شده'} — {c.reason}</p><p>{c.record_status==='active'?'محروم از شرکت در:':'سری‌های محرومیت هنگام صدور:'}</p>{(c.record_status==='active'?c.current_target_names:c.issued_target_names)?.length ? (c.record_status==='active'?c.current_target_names:c.issued_target_names)?.map((name,i)=><p key={i} style={{color:'#e4c77e',margin:'4px 0'}}>{name}</p>):<p>اطلاعات سری‌ها در دسترس نیست</p>}<p>{new Date(c.created_at).toLocaleString('fa-IR')}</p>{c.events.map((e,i)=><p key={i}>{e.event_type} — {e.reason}</p>)}{c.record_status==='active'&&<button style={button} disabled={busy} onClick={()=>{L(c.id);LR('')}}>رفع محرومیت</button>}{lift===c.id&&<><textarea style={field} placeholder="علت رفع محرومیت" value={liftReason} disabled={busy} onChange={e=>LR(e.target.value)}/><button style={button} disabled={busy||!liftReason.trim()} onClick={()=>void run(async()=>{await rpc('lift',{case_id:c.id,decision_reason:liftReason});L('');await refresh(offset);M('محرومیت رفع شد')})}>تأیید رفع محرومیت</button></>}</article>)}
 <button style={button} disabled={busy||offset===0} onClick={()=>void run(()=>refresh(Math.max(0,offset-50)))}>صفحه قبل</button><button style={button} disabled={busy||cases.length<50} onClick={()=>void run(()=>refresh(offset+50))}>صفحه بعد</button>
 <p role="status">{busy?'در حال بررسی…':msg}</p></section>
}
